import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { createSquareOrderPaymentLink, retrieveSquareOrder } from "./squareClient";
import { stateTaxInfo } from "@shared/salesTax";
import { getStorefrontProducts, dedupeByName } from "./storefrontProducts";
import { syncStorefrontToSquare, squareConfigured } from "./squareCatalogSync";
import { sendEmail, buildOrderReceiptEmail, buildShippingNotificationEmail } from "./email";
import { trackingUrlFor } from "@shared/shipping";
import { resolvePublicSiteUrl } from "@shared/site";
import { ensureCatalogData } from "./ensureCatalogData";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireOwner, toPublicUser } from "./auth";
import { registerPocketBoosterRoutes } from "./pocketBooster";
import { registerLiquidityRoutes } from "./liquidityRouter";
import { PROGRAM_PATHWAY, PROGRAM_STAGES } from "@shared/programStages";
import { checkCustomization, customizationErrorMessage, isDefaultLogoCustomizable, apparelSizesFor, scentsFor, FULL_LOGO_CATALOG_OPTION } from "@shared/customization";
import { updateOrderFulfillmentSchema, insertMediaLinkSchema, mediaUploadFieldsSchema, insertReviewSchema, updateProfileSchema, type Review, type User } from "@shared/schema";
import {
  DISCOUNT_CODES,
  FREQUENT_SHOPPER_MIN_ORDERS,
  parseDiscountCode,
} from "@shared/discounts";
import {
  BUNDLE_CONFIG,
  bundleOrderNote,
  bundleUpchargeCents,
  isPremiumLighterProduct,
  isValidBundleId,
} from "@shared/bundlePricing";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

// Where uploaded media files (singing clips, audio projects) live on disk.
// In dev this is a local folder; on Railway set MEDIA_DIR to a mounted volume
// path (e.g. /data/media) so uploads survive redeploys. Created on boot if
// missing. Files are served read-only at /media-files via express.static,
// which supports HTTP range requests (needed for video/audio seeking).
export const MEDIA_DIR =
  process.env.MEDIA_DIR || path.resolve(process.cwd(), "uploads", "media");
try {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
} catch (err) {
  console.error("Failed to create MEDIA_DIR:", err);
}
// In production, uploads MUST land on a mounted persistent volume (e.g.
// Railway: MEDIA_DIR=/data/media) or they'll silently vanish on the next
// redeploy. Warn loudly if it's unset so a misconfig is obvious in the logs.
if (process.env.NODE_ENV === "production" && !process.env.MEDIA_DIR) {
  console.warn(
    "[media] MEDIA_DIR is not set in production — uploaded files will be LOST on redeploy. Point MEDIA_DIR at a mounted volume.",
  );
}

// Server-controlled allowlist of accepted media types mapped to the ONLY
// extension we'll store them under. We never trust the uploader's filename or
// rely on the (spoofable) browser mime alone for the stored name: forcing a
// safe extension from this map means a file can only ever be served as a known
// video/audio type — never as .html/.svg/.js on our own origin (which would be
// a same-origin script-hosting / stored-XSS vector).
const ALLOWED_MEDIA_TYPES = new Map<string, string>([
  ["video/mp4", ".mp4"],
  ["video/quicktime", ".mov"],
  ["video/webm", ".webm"],
  ["video/x-matroska", ".mkv"],
  ["video/mpeg", ".mpeg"],
  ["video/3gpp", ".3gp"],
  ["audio/mpeg", ".mp3"],
  ["audio/mp3", ".mp3"],
  ["audio/mp4", ".m4a"],
  ["audio/x-m4a", ".m4a"],
  ["audio/aac", ".aac"],
  ["audio/wav", ".wav"],
  ["audio/x-wav", ".wav"],
  ["audio/wave", ".wav"],
  ["audio/webm", ".weba"],
  ["audio/ogg", ".ogg"],
  ["audio/flac", ".flac"],
  ["audio/x-flac", ".flac"],
]);

// Profile pictures live under MEDIA_DIR/avatars (same persistent volume as
// media uploads on Railway) and are served at /media-files/avatars/<file>.
// Same stored-extension policy as media: the extension comes from a server
// MIME allowlist, never from the uploader's filename.
const AVATAR_DIR = path.join(MEDIA_DIR, "avatars");
try {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
} catch (err) {
  console.error("Failed to create AVATAR_DIR:", err);
}
const ALLOWED_AVATAR_TYPES = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
    filename: (_req, file, cb) => {
      const ext = ALLOWED_AVATAR_TYPES.get(file.mimetype) || ".bin";
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_AVATAR_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Please upload a JPG, PNG, WebP, or GIF image."));
    }
  },
});

// Delete a previously stored avatar file, but only if it actually points into
// our avatars folder (never let a crafted URL delete arbitrary files).
function removeAvatarFile(avatarUrl: string | null | undefined) {
  if (!avatarUrl || !avatarUrl.startsWith("/media-files/avatars/")) return;
  const fileName = path.basename(avatarUrl);
  fs.unlink(path.join(AVATAR_DIR, fileName), () => {});
}

// Review product photos — same image allowlist as avatars, stored separately
// so they aren't mixed with profile pictures.
const REVIEW_PHOTO_DIR = path.join(MEDIA_DIR, "review-photos");
try {
  fs.mkdirSync(REVIEW_PHOTO_DIR, { recursive: true });
} catch (err) {
  console.error("Failed to create REVIEW_PHOTO_DIR:", err);
}
const reviewPhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, REVIEW_PHOTO_DIR),
    filename: (_req, file, cb) => {
      const ext = ALLOWED_AVATAR_TYPES.get(file.mimetype) || ".bin";
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_AVATAR_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Please upload a JPG, PNG, WebP, or GIF image."));
    }
  },
});

function isOwnedReviewPhotoUrl(url: unknown): url is string {
  return (
    typeof url === "string" &&
    url.startsWith("/media-files/review-photos/") &&
    !url.includes("..")
  );
}

const mediaUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, MEDIA_DIR),
    filename: (_req, file, cb) => {
      // Extension comes from our allowlist, NOT the user's originalname.
      const ext = ALLOWED_MEDIA_TYPES.get(file.mimetype) || ".bin";
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB per file
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MEDIA_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Unsupported file type. Please upload a common video (MP4, MOV, WebM) or audio (MP3, M4A, WAV) file.",
        ),
      );
    }
  },
});


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Shared hub authentication (session + passport local strategy)
  setupAuth(app);

  // Pocket Booster — subscription tiers, cushion autopilot, Pay-to-Learn rewards
  registerPocketBoosterRoutes(app);

  // P2P Liquidity Loop — bridge investor capital into Pocket Booster vault + yield
  registerLiquidityRoutes(app);

  // Empire Pathway — S1–S8 Financial Roadway program stage definitions
  app.get("/api/program-stages", (_req, res) => {
    res.json({
      pathway: PROGRAM_PATHWAY,
      stages: PROGRAM_STAGES,
    });
  });

  // Ensure the catalog facts (product rows, prices, metadata) hold in whatever
  // DB this server is connected to — dev now, Railway prod on deploy. This is
  // the authoritative source of the storefront's product list; there is no
  // Stripe account involved anymore.
  ensureCatalogData()
    .catch(err => console.error('ensureCatalogData failed:', err))
    .finally(() => {
      // Mirror the storefront catalog into Square's Item Library so the
      // owner sees every website product in Square. Non-blocking and fully
      // guarded: skipped when Square isn't configured, and failures never
      // affect startup. Idempotent, so re-running on each boot is safe.
      // Production-only: dev and prod share one Square account but can hold
      // different product sets, so letting both auto-sync would ping-pong
      // (each boot deleting the other's items). Production is the authority;
      // dev can still sync on demand via /api/admin/square/sync-catalog.
      if (squareConfigured() && process.env.NODE_ENV === 'production') {
        syncStorefrontToSquare()
          .then(r =>
            console.log(
              `Square catalog sync: ${r.created} created, ${r.updated} updated, ${r.archived} removed${r.pruned ? '' : ' (prune skipped)'} (${r.total} products).`,
            ),
          )
          .catch(err =>
            console.error('Square catalog sync failed:', err?.message || err),
          );
      }
    });
  
  // Serve uploaded media files (read-only). express.static honors HTTP range
  // requests, so video/audio scrubbing works. Registered before the SPA/vite
  // catch-all so /media-files/* resolves to real files.
  app.use(
    "/media-files",
    express.static(MEDIA_DIR, {
      setHeaders: (res) => {
        // Defense-in-depth: stop browsers from MIME-sniffing a stored file into
        // something executable on our origin.
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    }),
  );

  // --- Media gallery API ----------------------------------------------------
  // Public: list every media item (grouped by collection on the client).
  app.get("/api/media", async (_req, res) => {
    try {
      const items = await storage.getAllMediaItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ error: "Failed to load media" });
    }
  });

  // Owner-only: add an externally hosted clip via its link (YouTube, Vimeo,
  // SoundCloud, or a direct media URL).
  app.post("/api/media", requireOwner, async (req, res) => {
    const parsed = insertMediaLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.errors[0]?.message || "Invalid input" });
    }
    try {
      const item = await storage.createMediaItem({
        title: parsed.data.title,
        collection: parsed.data.collection,
        mediaType: parsed.data.mediaType,
        sourceType: "link",
        url: parsed.data.url,
        description: parsed.data.description ?? null,
      });
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating media link:", error);
      res.status(500).json({ error: "Failed to add media" });
    }
  });

  // Owner-only: upload a video or audio file straight to the site.
  app.post(
    "/api/media/upload",
    requireOwner,
    (req, res, next) => {
      mediaUpload.single("file")(req, res, (err: any) => {
        if (err) {
          const message =
            err.code === "LIMIT_FILE_SIZE"
              ? "File is too large (max 500 MB)."
              : err.message || "Upload failed";
          return res.status(400).json({ error: message });
        }
        next();
      });
    },
    async (req, res) => {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file was uploaded" });
      }

      const fields = mediaUploadFieldsSchema.safeParse(req.body);
      if (!fields.success) {
        // Clean up the orphaned upload if the metadata is invalid.
        fs.unlink(path.join(MEDIA_DIR, file.filename), () => {});
        return res
          .status(400)
          .json({ error: fields.error.errors[0]?.message || "Invalid input" });
      }

      try {
        const mediaType = file.mimetype.startsWith("audio/")
          ? "audio"
          : "video";
        const item = await storage.createMediaItem({
          title: fields.data.title,
          collection: fields.data.collection,
          mediaType,
          sourceType: "upload",
          url: `/media-files/${file.filename}`,
          fileName: file.filename,
          description: fields.data.description ?? null,
        });
        res.status(201).json(item);
      } catch (error) {
        fs.unlink(path.join(MEDIA_DIR, file.filename), () => {});
        console.error("Error saving uploaded media:", error);
        res.status(500).json({ error: "Failed to save upload" });
      }
    },
  );

  // Owner-only: delete a media item (and its file, if it was an upload).
  app.delete("/api/media/:id", requireOwner, async (req, res) => {
    try {
      const deleted = await storage.deleteMediaItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Media not found" });
      }
      if (deleted.sourceType === "upload" && deleted.fileName) {
        fs.unlink(path.join(MEDIA_DIR, deleted.fileName), () => {});
      }
      res.json({ ok: true });
    } catch (error) {
      console.error("Error deleting media:", error);
      res.status(500).json({ error: "Failed to delete media" });
    }
  });

  // --- Profile API -----------------------------------------------------------
  // Signed-in users can set the name + location shown next to their reviews.
  app.patch("/api/auth/profile", requireAuth, async (req, res) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.errors[0]?.message || "Invalid input" });
    }
    try {
      const user = req.user as User;
      const updated = await storage.updateUserProfile(user.id, {
        // Empty string clears the field; undefined leaves it untouched.
        displayName:
          parsed.data.displayName === undefined
            ? undefined
            : parsed.data.displayName || null,
        location:
          parsed.data.location === undefined
            ? undefined
            : parsed.data.location || null,
      });
      if (!updated) return res.status(404).json({ error: "User not found" });
      res.json(toPublicUser(updated));
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Signed-in users: upload a profile picture (shown on their reviews).
  app.post(
    "/api/auth/profile/avatar",
    requireAuth,
    (req, res, next) => {
      avatarUpload.single("avatar")(req, res, (err: any) => {
        if (err) {
          const message =
            err.code === "LIMIT_FILE_SIZE"
              ? "Image is too large (max 5 MB)."
              : err.message || "Upload failed";
          return res.status(400).json({ error: message });
        }
        next();
      });
    },
    async (req, res) => {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No image was uploaded" });
      }
      try {
        const user = req.user as User;
        const previousAvatar = user.avatarUrl;
        const updated = await storage.updateUserAvatar(
          user.id,
          `/media-files/avatars/${file.filename}`,
        );
        if (!updated) {
          fs.unlink(path.join(AVATAR_DIR, file.filename), () => {});
          return res.status(404).json({ error: "User not found" });
        }
        // Clean up the replaced photo so the volume doesn't fill with orphans.
        removeAvatarFile(previousAvatar);
        res.json(toPublicUser(updated));
      } catch (error) {
        fs.unlink(path.join(AVATAR_DIR, file.filename), () => {});
        console.error("Error saving avatar:", error);
        res.status(500).json({ error: "Failed to save profile picture" });
      }
    },
  );

  // Signed-in users: remove their profile picture.
  app.delete("/api/auth/profile/avatar", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const previousAvatar = user.avatarUrl;
      const updated = await storage.updateUserAvatar(user.id, null);
      if (!updated) return res.status(404).json({ error: "User not found" });
      removeAvatarFile(previousAvatar);
      res.json(toPublicUser(updated));
    } catch (error) {
      console.error("Error removing avatar:", error);
      res.status(500).json({ error: "Failed to remove profile picture" });
    }
  });

  // --- Product reviews API ---------------------------------------------------
  // Public API responses never include reviewer user ids.
  const toPublicReview = <T extends Review>({ userId: _userId, ...rest }: T) =>
    rest;

  // Public: reviews for one product (by product name, the stable identity).
  app.get("/api/reviews", async (req, res) => {
    const productName = String(req.query.product || "").trim();
    if (!productName) {
      return res.status(400).json({ error: "product query param is required" });
    }
    try {
      const rows = await storage.getReviewsForProduct(productName);
      res.json(rows.map(toPublicReview));
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to load reviews" });
    }
  });

  // Public: most recent reviews across all products (homepage panel).
  app.get("/api/reviews/recent", async (req, res) => {
    const requested = parseInt(String(req.query.limit || ""), 10);
    const limit = Math.min(12, Math.max(1, Number.isFinite(requested) ? requested : 6));
    try {
      const rows = await storage.getRecentReviews(limit);
      res.json(rows.map(toPublicReview));
    } catch (error) {
      console.error("Error fetching recent reviews:", error);
      res.status(500).json({ error: "Failed to load reviews" });
    }
  });

  // Signed-in customers: upload a product photo for a review (up to 3 per
  // review, enforced on the review submit). Returns a site-hosted URL.
  app.post(
    "/api/reviews/photos",
    requireAuth,
    (req, res, next) => {
      reviewPhotoUpload.single("photo")(req, res, (err: any) => {
        if (err) {
          const message =
            err.code === "LIMIT_FILE_SIZE"
              ? "Image is too large (max 5 MB)."
              : err.message || "Upload failed";
          return res.status(400).json({ error: message });
        }
        next();
      });
    },
    async (req, res) => {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No image was uploaded" });
      }
      res.status(201).json({ url: `/media-files/review-photos/${file.filename}` });
    },
  );

  // Signed-in customers: post (or update) their review of a product. The
  // reviewer identity and the "Verified Purchase" flag are derived here from
  // the session and recorded paid orders — never trusted from the client.
  app.post("/api/reviews", requireAuth, async (req, res) => {
    const parsed = insertReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.errors[0]?.message || "Invalid input" });
    }

    try {
      // Only accept reviews for products that actually exist in the storefront.
      const catalog = await getStorefrontProducts();
      const product = (catalog as any[]).find(
        (p) => p.title === parsed.data.productName,
      );
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const user = req.user as User;
      const reviewerName =
        (user.displayName || "").trim() || user.email.split("@")[0];
      const verified = await storage.hasUserPurchasedProduct(
        user.email,
        parsed.data.productName,
      );

      const photoUrls = (parsed.data.photoUrls || [])
        .filter(isOwnedReviewPhotoUrl)
        .slice(0, 3);
      const location = parsed.data.location?.trim() || null;

      const review = await storage.upsertReview({
        productName: parsed.data.productName,
        userId: user.id,
        reviewerName,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        verified,
        location,
        photoUrls,
      });

      // Keep the profile location in sync when the shopper shares a US state
      // on their review — it also shows next to older reviews.
      if (location) {
        try {
          await storage.updateUserProfile(user.id, { location });
        } catch {
          // Non-fatal: the review itself already stored the location.
        }
      }

      res.status(201).json({
        ...toPublicReview(review),
        photoDiscountEarned: photoUrls.length > 0,
        photoDiscountCode: photoUrls.length > 0 ? DISCOUNT_CODES.PHOTO_REVIEW : null,
      });
    } catch (error) {
      console.error("Error saving review:", error);
      res.status(500).json({ error: "Failed to save review" });
    }
  });

  // Author can remove their own review; the store owner (OWNER_EMAILS) can
  // moderate any review. Note the owner check here is strict — no "any
  // signed-in user" fallback, so a missing allowlist never lets strangers
  // delete other people's reviews.
  app.delete("/api/reviews/:id", requireAuth, async (req, res) => {
    try {
      const review = await storage.getReviewById(req.params.id);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      const user = req.user as User;
      const ownerAllowlist = (process.env.OWNER_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const isAuthor = review.userId === user.id;
      const isOwner = ownerAllowlist.includes(user.email.toLowerCase());
      if (!isAuthor && !isOwner) {
        return res.status(403).json({ error: "Not authorized" });
      }
      await storage.deleteReview(review.id);
      res.json({ ok: true });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ error: "Failed to delete review" });
    }
  });

  // Signed-in shoppers: which discount codes they're currently eligible for.
  app.get("/api/discounts/eligibility", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const paidOrders = await storage.countPaidOrdersByEmail(user.email);
      const photoReviewAvailable = await storage.hasUnusedPhotoReviewDiscount(user.id);
      const frequentShopper = paidOrders >= FREQUENT_SHOPPER_MIN_ORDERS;
      res.json({
        paidOrders,
        frequentShopperMinOrders: FREQUENT_SHOPPER_MIN_ORDERS,
        codes: {
          [DISCOUNT_CODES.PHOTO_REVIEW]: {
            eligible: photoReviewAvailable,
            percent: 10,
            description:
              "Upload photos with a product review to unlock 10% off your next purchase.",
          },
          [DISCOUNT_CODES.FREQUENT_SHOPPER]: {
            eligible: frequentShopper,
            percent: 15,
            description:
              "Complete purchases on three separate visits to unlock 15% off.",
          },
        },
      });
    } catch (error) {
      console.error("Error checking discount eligibility:", error);
      res.status(500).json({ error: "Failed to check discount eligibility" });
    }
  });

  // Get all products from the store's own catalog
  app.get("/api/products", async (req, res) => {
    try {
      res.json(await getStorefrontProducts());
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Lighter accessory bundle config + pricing rules (client can also import
  // @shared/bundlePricing directly; this endpoint exists for non-TS clients).
  app.get("/api/bundles", (_req, res) => {
    res.json(BUNDLE_CONFIG);
  });

  // Get products by type (e.g. apparel, accessory, elements)
  app.get("/api/products/type/:type", async (req, res) => {
    try {
      const { type } = req.params;

      let rows: any[] = [];
      try {
        rows = await stripeStorage.getProductsWithPricesByType(type);
      } catch (dbError) {
        console.error('Database query failed for products by type:', dbError);
      }

      if (!rows || rows.length === 0) {
        return res.json([]);
      }

      const productsMap = new Map();
      for (const row of rows) {
        if (((row.product_metadata || {}) as any).hidden === 'true') continue;
        if (!productsMap.has(row.product_id)) {
          const metadata = (row.product_metadata || {}) as any;
          const images = (row.product_images || []) as any[];
          
          productsMap.set(row.product_id, {
            id: row.product_id,
            title: row.product_name,
            description: row.product_description,
            category: metadata.category || 'General',
            imageUrl: metadata.imageUrl || (images.length > 0 ? images[0] : ''),
            productType: metadata.productType || 'general',
            sortOrder: parseInt(metadata.sortOrder || '99'),
            soldOut: metadata.soldOut === 'true',
            gender: metadata.gender || null,
            logoOptions: metadata.logoOptions || (isDefaultLogoCustomizable(metadata) ? FULL_LOGO_CATALOG_OPTION : null),
            colors: metadata.colors || null,
            soldOutColors: metadata.soldOutColors || null,
            handleColors: metadata.handleColors || null,
            caseType: metadata.caseType || null,
            sizes: metadata.sizes || null,
            apparelSizes: apparelSizesFor(metadata, row.product_name).join(', ') || null,
            scents: scentsFor(metadata).join(', ') || null,
            variantGroup: metadata.variantGroup || null,
            variantLabel: metadata.variantLabel || null,
            price: null,
            priceId: null,
          });
        }
        
        const product = productsMap.get(row.product_id);
        if (row.price_id && !product.priceId) {
          product.price = (row.unit_amount as any) ? ((row.unit_amount as number) / 100).toFixed(2) : '0.00';
          product.priceId = row.price_id;
        }
      }

      const products = dedupeByName(Array.from(productsMap.values())).sort((a: any, b: any) => a.sortOrder - b.sortOrder);
      res.json(products);
    } catch (error) {
      console.error('Error fetching products by type:', error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Resolves the buyer's ship-to state (collected on OUR site before checkout,
  // since Square only asks for the address on its own hosted page — too late to
  // add tax) into a Square order-level percentage tax. The rate comes from the
  // shared state table — server-authoritative, never a client-sent amount.
  // Returns { error } when the state is missing/unknown; tax is undefined for
  // the five no-sales-tax states.
  function orderTaxForState(
    shipToState: unknown,
  ):
    | { error: string; tax?: undefined }
    | { error?: undefined; tax?: { name: string; percentage: string } } {
    const info = stateTaxInfo(shipToState);
    if (!info) {
      return { error: "Please select the state your order ships to so we can calculate sales tax." };
    }
    if (info.ratePercent <= 0) return {};
    return {
      tax: {
        name: `${info.name} Sales Tax`,
        percentage: String(info.ratePercent),
      },
    };
  }

  // Create checkout session (Square-hosted checkout)
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { priceId, productName, selectedLogo } = req.body;

      const taxResult = orderTaxForState(req.body?.shipToState);
      if (taxResult.error) {
        return res.status(400).json({ error: taxResult.error });
      }

      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      // Server-authoritative pricing: never trust an amount from the client.
      // The price comes from our synced product data in the database.
      const priceRow: any = await stripeStorage.getPriceWithProduct(priceId);
      if (!priceRow || priceRow.unit_amount == null) {
        return res.status(404).json({ error: "Product price not found" });
      }

      // Server-authoritative customization enforcement: custom-branded products
      // (logo options, handle colors, or phone-case models) require a valid
      // choice — including a real logo — before checkout, enforced here and not
      // just in the UI so this endpoint can't be used to bypass the customizer.
      const productMetadata = (priceRow.product_metadata || {}) as any;
      // Server-authoritative stock: a sold-out item can never be purchased,
      // even via a crafted request that bypasses the disabled UI.
      if (productMetadata.soldOut === 'true') {
        return res.status(400).json({
          error: `"${(priceRow.product_name as string) || productName || "This item"}" is sold out.`,
        });
      }
      const check = checkCustomization(productMetadata, selectedLogo, req.body?.selectedColor, req.body?.selectedSize, priceRow.product_name, req.body?.selectedScent);
      if (check.required && !check.ok) {
        return res.status(400).json({
          error: customizationErrorMessage(
            check.kind,
            (priceRow.product_name as string) || productName || "your order",
          ),
        });
      }

      const amountCents = Number(priceRow.unit_amount) + (check.upchargeCents || 0);
      if (!amountCents || amountCents <= 0) {
        return res.status(400).json({ error: "Invalid product price" });
      }

      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      // Square creates the order behind the payment link and, on a completed
      // checkout, redirects the buyer back to redirectUrl with the Square
      // `orderId` appended as a query param. The success page uses that id to
      // verify payment and record the order — so we never persist anything here.
      const { url } = await createSquareOrderPaymentLink({
        lineItems: [
          {
            name: (priceRow.product_name as string) || productName || "Order",
            quantity: 1,
            amountCents,
            note: check.note,
          },
        ],
        tax: taxResult.tax,
        redirectUrl: `${baseUrl}/checkout/success`,
      });

      res.json({ url });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
  });

  // Create custom checkout session for logo customization (Square-hosted checkout)
  app.post("/api/create-custom-checkout", async (req, res) => {
    try {
      const { logoId, logoName, garmentType, garmentId, placements, placementDescription } = req.body;

      if (!logoId || !garmentId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const taxResult = orderTaxForState(req.body?.shipToState);
      if (taxResult.error) {
        return res.status(400).json({ error: taxResult.error });
      }

      // Server-authoritative pricing: compute the total here, never trust the client.
      // Base garment prices (USD) must mirror the LogoCustomizer options.
      const GARMENT_BASE_PRICES: Record<string, number> = {
        "short-sleeve": 30,
        "long-sleeve": 35,
        "pullover-hoodie": 50,
        "full-zip-hoodie": 60,
        "mens-jacket": 60,
        "jacket": 60,
        "jeans": 57.48,
        "shorts": 25,
        "bikini": 25,
        // Amazon-fulfilled tumblers: retail includes the delivery fee (free
        // shipping for the customer). Must mirror the LogoCustomizer options.
        "tumbler-20oz": 34.99,
        "tumbler-30oz": 39.99,
        "tumbler-40oz": 45,
      };

      const basePrice = GARMENT_BASE_PRICES[garmentId];
      if (!basePrice) {
        return res.status(400).json({ error: "Invalid garment selection" });
      }

      // Some items (e.g. the tumblers) carry a single laser-etched logo only —
      // the dual-placement surcharge must never apply to them.
      const SINGLE_PLACEMENT_GARMENTS = new Set(["tumbler-20oz", "tumbler-30oz", "tumbler-40oz"]);
      const placementCount = SINGLE_PLACEMENT_GARMENTS.has(garmentId)
        ? 1
        : (Array.isArray(placements) ? placements.length : 1);
      const totalDollars = basePrice + (placementCount > 1 ? 10 : 0);
      const amountCents = Math.round(totalDollars * 100);

      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      // See note in /api/create-checkout: Square appends the order id on the
      // redirect, and the success page verifies + records it. Nothing persisted here.
      const { url } = await createSquareOrderPaymentLink({
        lineItems: [
          {
            name: `Custom ${garmentType || "Garment"} - Logo #${logoId}`,
            quantity: 1,
            amountCents,
            note: `Logo: ${logoName} | Placement: ${placementDescription}`.slice(0, 500),
          },
        ],
        tax: taxResult.tax,
        redirectUrl: `${baseUrl}/checkout/success`,
      });

      res.json({ url });
    } catch (error: any) {
      console.error('Error creating custom checkout session:', error);
      res.status(500).json({ error: error.message || "Failed to create custom checkout session" });
    }
  });

  // Create checkout session for an entire cart (one Square order, many items)
  app.post("/api/create-cart-checkout", async (req, res) => {
    try {
      const { items } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Your cart is empty." });
      }

      const taxResult = orderTaxForState(req.body?.shipToState);
      if (taxResult.error) {
        return res.status(400).json({ error: taxResult.error });
      }

      if (items.length > 100) {
        return res.status(400).json({ error: "Too many items in your cart." });
      }

      // Optional discount code (Discount10% / Discount15%). Eligibility is
      // always checked server-side against the signed-in account.
      let appliedDiscount:
        | { name: string; percentage: string; code: string; userId: string }
        | undefined;
      const requestedCode = parseDiscountCode(req.body?.discountCode);
      if (req.body?.discountCode && !requestedCode) {
        return res.status(400).json({
          error: "That discount code isn't recognized. Try Discount10% or Discount15%.",
        });
      }
      if (requestedCode) {
        const user = req.user as User | undefined;
        if (!user) {
          return res.status(401).json({
            error: "Please sign in to apply a discount code.",
          });
        }
        if (requestedCode.code === DISCOUNT_CODES.PHOTO_REVIEW) {
          const eligible = await storage.hasUnusedPhotoReviewDiscount(user.id);
          if (!eligible) {
            return res.status(400).json({
              error:
                "Discount10% is for customers who uploaded photos with a review and haven't used the code yet.",
            });
          }
        } else if (requestedCode.code === DISCOUNT_CODES.FREQUENT_SHOPPER) {
          const paidOrders = await storage.countPaidOrdersByEmail(user.email);
          if (paidOrders < FREQUENT_SHOPPER_MIN_ORDERS) {
            return res.status(400).json({
              error: `Discount15% unlocks after ${FREQUENT_SHOPPER_MIN_ORDERS} completed purchase visits. You currently have ${paidOrders}.`,
            });
          }
        }
        appliedDiscount = {
          name: requestedCode.code,
          percentage: String(requestedCode.percent),
          code: requestedCode.code,
          userId: user.id,
        };
      }

      const lineItems: { name: string; quantity: number; amountCents: number; note?: string }[] = [];

      for (const item of items) {
        const priceId = item?.priceId;
        if (!priceId) {
          return res.status(400).json({ error: "Each item must include a priceId." });
        }

        let quantity = Number(item?.quantity) || 1;
        quantity = Math.max(1, Math.min(99, Math.round(quantity)));

        // Server-authoritative pricing: the amount always comes from the DB,
        // never from the client.
        const priceRow: any = await stripeStorage.getPriceWithProduct(priceId);
        if (!priceRow || priceRow.unit_amount == null) {
          return res.status(404).json({ error: "One of your items is no longer available." });
        }

        // Server-authoritative customization enforcement for custom-branded
        // products (handle color, phone model, or plain logo option). The chosen
        // model/color AND the logo are validated here — never trust the UI alone.
        const productMetadata = (priceRow.product_metadata || {}) as any;
        // Server-authoritative stock: never let a sold-out item through checkout,
        // even if the client UI was bypassed.
        if (productMetadata.soldOut === 'true') {
          return res.status(400).json({
            error: `"${priceRow.product_name || "One of your items"}" is sold out.`,
          });
        }
        const check = checkCustomization(productMetadata, item?.selectedLogo, item?.selectedColor, item?.selectedSize, priceRow.product_name, item?.selectedScent);
        if (check.required && !check.ok) {
          return res.status(400).json({
            error: customizationErrorMessage(check.kind, priceRow.product_name),
          });
        }
        const logoNote: string | undefined = check.note;

        // Optional lighter accessory bundle upcharge (server-authoritative).
        // Only Premium Lighter lines may carry a bundleId from bundle_config.
        let bundleCents = 0;
        let bundleNote: string | undefined;
        const requestedBundleId = item?.bundleId;
        if (requestedBundleId) {
          if (!isValidBundleId(requestedBundleId)) {
            return res.status(400).json({
              error: "That accessory bundle is not available.",
            });
          }
          if (
            !isPremiumLighterProduct(
              priceId,
              (priceRow.product_name as string) || "",
            )
          ) {
            return res.status(400).json({
              error: "Accessory bundles can only be added to a Premium Lighter.",
            });
          }
          bundleCents = bundleUpchargeCents(requestedBundleId);
          bundleNote = bundleOrderNote(requestedBundleId);
        }

        const amountCents =
          Number(priceRow.unit_amount) +
          (check.upchargeCents || 0) +
          bundleCents;
        if (!amountCents || amountCents <= 0) {
          return res.status(400).json({ error: "Invalid product price." });
        }

        const noteParts = [logoNote, bundleNote].filter(Boolean);
        lineItems.push({
          name: (priceRow.product_name as string) || "Item",
          quantity,
          amountCents,
          note: noteParts.length ? noteParts.join(" | ") : undefined,
        });
      }

      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      // We do NOT persist an order here. Square creates the order behind the
      // payment link and, on a completed checkout, redirects back with the
      // Square `orderId` appended to redirectUrl. The success page uses that id
      // to verify payment and record the order — so abandoned/cancelled
      // checkouts never create a phantom order.
      const { url } = await createSquareOrderPaymentLink({
        lineItems,
        tax: taxResult.tax,
        discount: appliedDiscount
          ? { name: appliedDiscount.name, percentage: appliedDiscount.percentage }
          : undefined,
        redirectUrl: appliedDiscount
          ? `${baseUrl}/checkout/success?discount=${encodeURIComponent(appliedDiscount.code)}`
          : `${baseUrl}/checkout/success`,
      });

      res.json({ url });
    } catch (error: any) {
      console.error('Error creating cart checkout:', error);
      res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
  });

  // Confirm a checkout when the buyer returns to the success page. We look the
  // order up in Square (the source of truth), verify it was actually paid, and
  // only then record it and return the purchased items for the receipt. A bare
  // redirect is never enough to mark something paid.
  app.post("/api/orders/confirm", async (req, res) => {
    try {
      const ref =
        typeof req.body?.ref === "string" ? req.body.ref.trim() : "";
      if (!ref) {
        return res.status(400).json({ error: "Missing order reference." });
      }

      // Already recorded (e.g. the buyer refreshed) — return what we have.
      const existing = await storage.getOrderBySquareId(ref);
      if (existing && existing.status === "paid") {
        return res.json(existing);
      }

      const squareOrder = await retrieveSquareOrder(ref);
      if (!squareOrder) {
        return res.status(404).json({ error: "Order not found." });
      }

      if (!squareOrder.isPaid) {
        // Payment not (yet) confirmed by Square. Show the items but make it
        // clear this isn't a recorded sale, and never persist it.
        return res.json({
          status: "pending",
          squareOrderId: squareOrder.orderId,
          items: squareOrder.items,
          totalCents: squareOrder.totalCents,
        });
      }

      const recorded = await storage.recordPaidOrder({
        squareOrderId: squareOrder.orderId,
        items: squareOrder.items,
        totalCents: squareOrder.totalCents,
        customerEmail: squareOrder.buyerEmail,
        customerName: squareOrder.buyerName,
        shippingAddress: squareOrder.shippingAddress,
      });

      // Redeem one-time photo-review discount after payment is confirmed.
      const discountCode = parseDiscountCode(req.body?.discountCode);
      const user = req.user as User | undefined;
      if (
        user &&
        discountCode?.code === DISCOUNT_CODES.PHOTO_REVIEW &&
        (await storage.hasUnusedPhotoReviewDiscount(user.id))
      ) {
        try {
          await storage.recordDiscountRedemption({
            userId: user.id,
            code: discountCode.code,
            squareOrderId: squareOrder.orderId,
          });
        } catch (redeemError) {
          console.error("Failed to record discount redemption:", redeemError);
        }
      }

      // Send the buyer an itemized receipt. This runs only on the first
      // confirmation (a refresh hits the early "already paid" return above), so
      // we don't spam the buyer. Best-effort: never fail the request if the
      // email can't be sent — the order is already recorded.
      if (squareOrder.buyerEmail) {
        try {
          const receipt = buildOrderReceiptEmail({
            items: squareOrder.items,
            totalCents: squareOrder.totalCents,
            orderRef: squareOrder.orderId,
          });
          await sendEmail({
            to: squareOrder.buyerEmail,
            subject: receipt.subject,
            html: receipt.html,
            text: receipt.text,
          });
        } catch (emailError) {
          console.error("Failed to send order receipt email:", emailError);
        }
      } else {
        console.warn(
          `[orders] No buyer email found for Square order ${squareOrder.orderId}; skipping receipt email.`,
        );
      }

      res.json(recorded);
    } catch (error: any) {
      console.error("Error confirming order:", error);
      res.status(500).json({ error: "Failed to confirm order." });
    }
  });

  // Email subscription endpoint
  const subscribeSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    source: z.string().optional(),
  });

  app.post("/api/subscribe", async (req, res) => {
    try {
      const result = subscribeSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }
      
      const { email, source } = result.data;
      
      // Check if already subscribed
      const existing = await storage.getSubscriberByEmail(email);
      if (existing) {
        return res.status(200).json({ message: "You're already subscribed! We'll keep you updated." });
      }
      
      // Add new subscriber
      const subscriber = await storage.addSubscriber({ email, source: source || null });
      
      if (subscriber) {
        res.status(201).json({ message: "Thank you for subscribing! You'll receive updates on new products and features." });
      } else {
        res.status(200).json({ message: "You're already subscribed! We'll keep you updated." });
      }
    } catch (error: any) {
      console.error('Error adding subscriber:', error);
      
      // If table doesn't exist, try to create it and retry
      if (error.message && error.message.includes('does not exist')) {
        try {
          const { ensureTablesExist } = await import('./db');
          await ensureTablesExist();
          
          // Retry adding subscriber
          const { email, source } = subscribeSchema.parse(req.body);
          const subscriber = await storage.addSubscriber({ email, source: source || null });
          if (subscriber) {
            return res.status(201).json({ message: "Thank you for subscribing! You'll receive updates on new products and features." });
          }
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
      
      res.status(500).json({ error: "Failed to subscribe. Please try again." });
    }
  });

  // Protected: list every recorded order (newest first) for the owner.
  app.get("/api/orders", requireOwner, async (req, res) => {
    try {
      const parseIntParam = (value: unknown, fallback: number, max: number) => {
        const parsed = Number.parseInt(String(value), 10);
        if (Number.isNaN(parsed) || parsed < 0) return fallback;
        return Math.min(parsed, max);
      };

      const limit = parseIntParam(req.query.limit, 25, 100);
      const offset = parseIntParam(req.query.offset, 0, Number.MAX_SAFE_INTEGER);

      const { orders, total } = await storage.getAllOrders({ limit, offset });
      res.json({ orders, total, limit, offset });
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Protected: mirror every storefront product into the owner's Square Item
  // Library (one-way: website -> Square). Idempotent and safe to re-run; only
  // touches items this sync created (SKU prefix KKWEB-), never the owner's
  // hand-made Square items. Owner-gated since it writes to the live Square
  // account.
  app.post("/api/admin/square/sync-catalog", requireOwner, async (req, res) => {
    try {
      if (!squareConfigured()) {
        return res.status(400).json({
          error: "Square is not configured (SQUARE_ACCESS_TOKEN / SQUARE_LOCATION_ID).",
        });
      }
      const result = await syncStorefrontToSquare();
      res.json(result);
    } catch (error: any) {
      console.error('Square catalog sync failed:', error);
      res.status(500).json({ error: error?.message || "Square catalog sync failed" });
    }
  });

  // Protected: update an order's fulfillment status (e.g. mark shipped) for the
  // owner. Owner-gated (OWNER_EMAILS allowlist) since this exposes/uses customer
  // contact details and triggers the shipping-notification email.
  app.patch("/api/orders/:id/fulfillment", requireOwner, async (req, res) => {
    try {
      const parsed = updateOrderFulfillmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid fulfillment status" });
      }

      const result = await storage.updateOrderFulfillment(
        req.params.id,
        parsed.data.fulfillmentStatus,
        {
          carrier: parsed.data.carrier,
          trackingNumber: parsed.data.trackingNumber,
        },
      );
      if (!result) {
        return res.status(404).json({ error: "Order not found" });
      }
      const { order, transitionedToFulfilled } = result;

      // Build a direct "leave a review" link for the shipping email: point at
      // the product page of the first item in the order (falls back to the
      // site root when the product can't be resolved anymore).
      const publicBaseUrl = resolvePublicSiteUrl() || "";
      let reviewUrl: string | undefined;
      if (publicBaseUrl) {
        reviewUrl = publicBaseUrl;
        try {
          const catalog = await getStorefrontProducts();
          const firstItem = order.items[0];
          const match =
            firstItem &&
            (catalog as any[]).find((p) => p.title === firstItem.name);
          if (match?.priceId) {
            reviewUrl = `${publicBaseUrl}/product/${match.priceId}`;
          }
        } catch {
          // keep the site-root fallback
        }
      }

      // Notify the customer their order shipped. Best-effort: never fail the
      // request if the email can't be sent. The storage layer guarantees
      // transitionedToFulfilled is true for only one request per
      // unfulfilled -> fulfilled change, so the customer is emailed once.
      let shippingEmailSent = false;
      if (transitionedToFulfilled && order.customerEmail) {
        try {
          const trackingUrl = trackingUrlFor(order.carrier, order.trackingNumber);
          const shipped = buildShippingNotificationEmail({
            items: order.items.map((it) => ({
              name: it.name,
              quantity: it.quantity,
            })),
            orderRef: order.squareOrderId ?? undefined,
            carrier: order.carrier,
            trackingNumber: order.trackingNumber,
            trackingUrl,
            reviewUrl,
          });
          shippingEmailSent = await sendEmail({
            to: order.customerEmail,
            subject: shipped.subject,
            html: shipped.html,
            text: shipped.text,
          });
        } catch (emailError) {
          console.error("Failed to send shipping notification email:", emailError);
        }
      }

      res.json({ ...order, shippingEmailSent });
    } catch (error: any) {
      console.error('Error updating order fulfillment:', error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Get all subscribers (for admin use)
  app.get("/api/subscribers", async (req, res) => {
    try {
      const subscribers = await storage.getAllSubscribers();
      res.json(subscribers);
    } catch (error: any) {
      console.error('Error fetching subscribers:', error);
      res.status(500).json({ error: "Failed to fetch subscribers" });
    }
  });

  return httpServer;
}
