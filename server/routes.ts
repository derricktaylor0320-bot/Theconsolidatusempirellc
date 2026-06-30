import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { stripeStorage } from "./stripeStorage";
import { getStripePublishableKey, getUncachableStripeClient } from "./stripeClient";
import { createSquarePaymentLink, createSquareOrderPaymentLink, retrieveSquareOrder } from "./squareClient";
import { getStorefrontProducts, dedupeByName } from "./storefrontProducts";
import { syncStorefrontToSquare, squareConfigured } from "./squareCatalogSync";
import { sendEmail, buildOrderReceiptEmail, buildShippingNotificationEmail } from "./email";
import { trackingUrlFor } from "@shared/shipping";
import { ensureCatalogData } from "./ensureCatalogData";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireOwner } from "./auth";
import { checkCustomization, customizationErrorMessage, isDefaultLogoCustomizable, apparelSizesFor, scentsFor, FULL_LOGO_CATALOG_OPTION } from "@shared/customization";
import { updateOrderFulfillmentSchema, insertMediaLinkSchema, mediaUploadFieldsSchema } from "@shared/schema";
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

// All products to seed in Stripe (for both test and live modes)
const ALL_PRODUCTS = [
  // APPAREL
  {
    name: 'Short Sleeve T-Shirt',
    description: 'Standard weight cotton/blend tee. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo.',
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '1', imageUrl: '/assets/generated_images/t-shirt_khomplete_khemistri_text.png' }
  },
  {
    name: 'Long Sleeve T-Shirt',
    description: 'Standard weight cotton/blend tee. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo.',
    price: 3500,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '2', imageUrl: '/assets/generated_images/long_sleeve_khomplete_khemistri.png' }
  },
  {
    name: 'Pullover Hoodie',
    description: 'Mid to Heavyweight cotton/fleece hooded sweatshirt. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo.',
    price: 5000,
    metadata: { category: 'Hoodies', productType: 'apparel', sortOrder: '3', fulfillment: 'Amazon', cost: '41.99', imageUrl: '/assets/generated_images/hoodie_khomplete_khemistri_text.png' }
  },
  {
    name: 'Full-Zip Hoodie',
    description: 'Mid to Heavyweight cotton/fleece full-zip hooded sweatshirt. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo.',
    price: 6000,
    metadata: { category: 'Hoodies', productType: 'apparel', sortOrder: '4', fulfillment: 'Amazon', cost: '41.99', imageUrl: '/assets/generated_images/full-zip_hoodie_branded.png' }
  },
  {
    name: 'Jacket/Coat',
    description: 'Lightweight jacket (e.g., Windbreaker, Coach Jacket) or Fleece Jacket. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo.',
    price: 7500,
    metadata: { category: 'Outerwear', productType: 'apparel', sortOrder: '5', fulfillment: 'Amazon', imageUrl: '/assets/generated_images/jacket_khomplete_khemistri_back.png' }
  },
  {
    name: 'Khomplete Khemistri Windbreaker Jacket',
    description: 'Custom waterproof windbreaker jacket with Khomplete Khemistri branding. Available for Men & Women. Polyester fabric with good breathability, hood with drawstring, two zip up side pockets. Available in 5 colors: Navy, Khaki, Gray, Green, and Black. Perfect for any occasion.',
    price: 6000,
    metadata: { category: 'Apparel', productType: 'apparel', sortOrder: '6', sku: 'KK-JACKET-001', amazonLink: 'https://a.co/d/9Xuj17C', cost: '37.98', imageUrl: '/assets/jacket_front.jpg', fulfillment: 'Amazon', colors: 'Navy, Khaki, Gray, Green, Black', gender: 'Unisex' }
  },
  {
    name: 'Khemistri Branded Jeans',
    description: 'Premium ripped black jeans featuring the Khomplete Khemistri Apparel logo on back pocket. Customize with any logo from our collection. Distressed style with premium fit.',
    price: 6500,
    metadata: { category: 'Bottoms', productType: 'apparel', sortOrder: '7', imageUrl: '/assets/1764769995894_1764820127590.jpg' }
  },
  {
    name: 'Personalized Custom Logo Sweatpants',
    description: 'Custom sweatpants for Men and Women personalized with your choice of Khomplete Khemistri logo (Apparel, Accessories Eagle Badge, or 5 Swords Crest). Premium 100% polyester, soft and comfortable with drawstring waist. SELECT YOUR COLOR AND LOGO at checkout! Available in 23 colors: Black, White, Navy, Gray, Brown, Gold, Blue, Green, Pink, Purple, Red, Orange, Yellow, Olive, Coral, Cyan, Tan, and more. Sizes: S to 5XL.',
    price: 4500,
    metadata: { category: 'Bottoms', productType: 'apparel', sortOrder: '8', imageUrl: '/attached_assets/copilot_image_1765114167490_1765212687857.jpeg', gender: 'Unisex', fulfillment: 'Amazon', amazonLink: 'https://a.co/d/byG0BnU', cost: '9.99', colors: 'Black, White, Navy, Gray, Brown, Gold, Blue, Green, Pink, Purple, Red, Orange, Yellow, Olive, Coral, Cyan, Tan', logoOptions: 'Apparel Logo, Accessories Eagle Badge, 5 Swords Crest' }
  },
  {
    name: 'Embroidered Designer Jeans',
    description: 'Luxury embroidered jeans with gold Khomplete Khemistri crest design. Available in Navy Blue and Black. Premium quality with ornate embroidery detail.',
    price: 8500,
    metadata: { category: 'Bottoms', productType: 'apparel', sortOrder: '9', imageUrl: '/assets/1764766300817_1764820163450.jpg' }
  },
  {
    name: 'Khemistri Sweatshirt Set',
    description: 'Premium matching sweatshirt and pants set featuring the Khomplete Khemistri 5 Swords logo. Front chest and large back logo. Available in Black with gold/blue accents.',
    price: 9500,
    metadata: { category: 'Sets', productType: 'apparel', sortOrder: '10', imageUrl: '/assets/1764769222300_1764820190430.jpg' }
  },
  {
    name: 'Chemistry Socks',
    description: 'Premium branded socks featuring chemistry beakers and the Khomplete Khemistri Apparel logo. Available in Black/Gold and White/Black.',
    price: 1800,
    metadata: { category: 'Socks', productType: 'apparel', sortOrder: '11', imageUrl: '/assets/1764583920002_1764810614373.jpg' }
  },
  {
    name: 'Personalized Custom Logo Clogs',
    description: 'Luxury personalized clogs with your choice of Khomplete Khemistri logo (Apparel, Accessories Eagle Badge, or 5 Swords Crest). Premium EVA material, lightweight and comfortable with honeycomb air holes for breathability. Ergonomic design with adjustable heel strap. SELECT YOUR COLOR AND LOGO at checkout! Available colors: Brown, Black, White, Navy, Gray, Pink, Red, and more. Sizes: 4W/2M to 14W/12M.',
    price: 5000,
    metadata: { category: 'Footwear', productType: 'apparel', sortOrder: '12', imageUrl: '/attached_assets/custom_clogs_accessories_logo.jpg', gender: 'Unisex', fulfillment: 'Amazon', amazonLink: 'https://a.co/d/2Ih6Mhh', cost: '28.99', colors: 'Brown, Black, White, Navy, Gray, Pink, Red', logoOptions: 'Apparel Logo, Accessories Eagle Badge, 5 Swords Crest' }
  },
  {
    name: 'Branded Logo Fitted Hat',
    description: 'Premium structured fitted baseball cap with embroidered Khomplete Khemistri branding on the front. 100% acrylic, hand-wash only. SELECT YOUR COLOR AND LOGO at checkout — choose the Apparel Logo, Accessories Eagle Badge, or 5 Swords Crest.',
    price: 4000,
    metadata: { category: 'Headwear', productType: 'apparel', hidden: 'true', sortOrder: '13', imageUrl: '/assets/generated_images/fitted_hat_branded.png', gender: 'Unisex', fulfillment: 'Amazon', amazonLink: 'https://a.co/d/0iMR1uMI', cost: '24.99', colors: 'Black, Navy, Gray, Khaki, Red', logoOptions: 'Apparel Logo, Accessories Eagle Badge, 5 Swords Crest' }
  },
  // FEMININE COLLECTION
  {
    name: 'Branded Crop Top',
    description: 'Trendy cropped t-shirt with Khomplete Khemistri Apparel logo on front chest. Short modern streetwear fit. Perfect for workouts or casual style.',
    price: 2800,
    metadata: { category: 'Tops', productType: 'apparel', sortOrder: '15', imageUrl: '/assets/generated_images/black_crop_top_with_logo.png', gender: 'Women' }
  },
  {
    name: 'Personalized Women\'s Crop Top',
    description: 'Custom crew neck short sleeve crop top personalized with Khomplete Khemistri Apparel logo. Soft ribbed fabric (95% Polyester, 5% Spandex), stretchy and breathable. Perfect for workouts, yoga, or casual wear. Available in 27 colors: Apricot, Beige, Black, Brown, Burgundy, Chocolate, Coffee, Coral Red, Dark Green, Gray, Green, Klein Blue, Light Blue, Magenta, Navy Blue, Olive Green, Orange, Pink, Purple, Red, Silver Grey, Turquoise, Violet, White, Wine Red, Yellow, and Iced Plum. Sizes: S, M, L, XL, 2XL, 3XL.',
    price: 2800,
    metadata: { category: 'Tops', productType: 'apparel', sortOrder: '15b', imageUrl: '/assets/generated_images/women\'s_branded_crop_top.png', gender: 'Women', fulfillment: 'Amazon', amazonLink: 'https://a.co/d/1TzA4VZ', cost: '9.99', colors: 'Apricot, Beige, Black, Brown, Burgundy, Chocolate, Coffee, Coral Red, Dark Green, Gray, Green, Klein Blue, Light Blue, Magenta, Navy Blue, Olive Green, Orange, Pink, Purple, Red, Silver Grey, Turquoise, Violet, White, Wine Red, Yellow, Iced Plum' }
  },
  {
    name: 'Fitted Tank Top',
    description: 'Slim fit racerback tank top with Khomplete Khemistri Apparel logo. Athletic style, perfect for fitness or layering. Available in White with black/gold logo.',
    price: 2500,
    metadata: { category: 'Tops', productType: 'apparel', sortOrder: '16', imageUrl: '/assets/generated_images/white_fitted_tank_top.png', gender: 'Women' }
  },
  {
    name: "Women's Fitted V-Neck Tee",
    description: 'Soft fitted v-neck t-shirt with Khomplete Khemistri Apparel logo on front chest. Slim feminine cut. Available in Pink with gold logo.',
    price: 2800,
    metadata: { category: 'Tops', productType: 'apparel', sortOrder: '17', imageUrl: "/assets/generated_images/pink_women's_fitted_tee.png", gender: 'Women' }
  },
  {
    name: 'Khemistri Leggings',
    description: 'High-waisted yoga leggings with Khomplete Khemistri Apparel logo on hip. Sleek black fabric with gold logo accent. Perfect for workouts or athleisure style.',
    price: 4000,
    metadata: { category: 'Bottoms', productType: 'apparel', sortOrder: '18', imageUrl: '/assets/generated_images/black_branded_leggings.png', gender: 'Women' }
  },
  // WOMEN'S GRAPHIC TEES — fixed graphic design ($30, size-only, no logo picker)
  {
    name: 'Watercolor Phoenix Tee',
    description: "Soft heather gray women's tee featuring a pastel watercolor phoenix rising from an alchemy flask inside a crest, with KHOMPLETE KHEMISTRI APPAREL lettering in dreamy purple, teal, and pink tones. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '40', imageUrl: '/assets/kk_womens_tee_watercolor_phoenix.jpg', gender: 'Women', customize: 'none' }
  },
  {
    name: 'Rose Gold Phoenix Tee',
    description: "Heather gray women's tee with an elegant rose-gold line-art phoenix rising from a flask inside a shield crest, finished with KHOMPLETE KHEMISTRI APPAREL script. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '41', imageUrl: '/assets/kk_womens_tee_rose_gold_phoenix.jpg', gender: 'Women', customize: 'none' }
  },
  {
    name: 'Molecular Heart Tee',
    description: "Heather gray women's tee featuring a rose-gold honeycomb molecular heart formed from chemistry bonds, with KHOMPLETE KHEMISTRI APPAREL lettering. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '42', imageUrl: '/assets/kk_womens_tee_molecular_heart.jpg', gender: 'Women', customize: 'none' }
  },
  {
    name: "Alchemist's Triangle Tee",
    description: "Heather gray women's tee with a silver and rose-gold inverted-triangle alchemy emblem and floating molecules, finished with KHOMPLETE KHEMISTRI APPAREL. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '43', imageUrl: "/assets/kk_womens_tee_alchemists_triangle.jpg", gender: 'Women', customize: 'none' }
  },
  {
    name: 'Lady of Khemistri Tee',
    description: "Heather gray women's tee featuring a rose-gold profile of a woman within a molecular shield crest, with KHOMPLETE KHEMISTRI APPAREL lettering. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '44', imageUrl: '/assets/kk_womens_tee_lady_of_khemistri.jpg', gender: 'Women', customize: 'none' }
  },
  {
    name: 'Celestial Constellations Tee',
    description: "Heather gray women's tee with a gold crescent moon, constellations, and a molecule motif, finished with KHOMPLETE KHEMISTRI APPAREL. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '45', imageUrl: '/assets/kk_womens_tee_celestial_constellations.jpg', gender: 'Women', customize: 'none' }
  },
  {
    name: 'Geometric Helix Shield Tee',
    description: "Heather gray women's tee featuring a silver DNA-helix diamond crest framing KHOMPLETE KHEMISTRI APPAREL, with bold geometric lettering below. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '46', imageUrl: '/assets/kk_womens_tee_geometric_helix_shield.jpg', gender: 'Women', customize: 'none' }
  },
  {
    name: 'Floral Alchemy Tee',
    description: "Soft cream women's tee featuring a rose-gold floral alchemy flask within a teardrop frame surrounded by blossoms, with FLORAL ALCHEMY · KHOMPLETE KHEMISTRI APPAREL lettering. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '47', imageUrl: '/assets/kk_womens_tee_floral_alchemy.jpg', gender: 'Women', customize: 'none' }
  },
  {
    name: 'Rainbow Phoenix Tee',
    description: "Heather gray women's tee featuring a vibrant rainbow phoenix rising from a flask inside a crest, encircled by KHOMPLETE KHEMISTRI APPAREL and chemistry molecules. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '48', imageUrl: '/assets/kk_womens_tee_rainbow_phoenix.jpg', gender: 'Women', customize: 'none' }
  },
  // FOUNDERS "3" TRIDENT CREST TEES (unisex) — signature emblem of the three founding partners ($30, size-only)
  {
    name: 'Founders "3" Crest Tee — Navy',
    description: "Navy unisex tee featuring the Khomplete Khemistri founders' crest: a chrome-blue and gold trident forming a “3,” engraved with the three founding partners D. Taylor, C. Oliver, and J. Young Jr., encircled by KHOMPLETE KHEMISTRI APPAREL EST. 2020. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '49', imageUrl: '/assets/kk_founders_tee_navy.jpg', gender: 'Unisex', customize: 'none' }
  },
  {
    name: 'Founders "3" Crest Tee — Black & Gold',
    description: "Black unisex tee featuring the Khomplete Khemistri founders' crest: a gold and silver trident forming a “3,” engraved with the three founding partners D. Taylor, C. Oliver, and J. Young Jr., encircled by KHOMPLETE KHEMISTRI APPAREL EST. 2020. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '50', imageUrl: '/assets/kk_founders_tee_black_gold.jpg', gender: 'Unisex', customize: 'none' }
  },
  {
    name: 'Founders "3" Crest Tee — Black & Silver',
    description: "Black unisex tee featuring the Khomplete Khemistri founders' crest: a polished silver trident forming a “3,” engraved with the three founding partners D. Taylor, C. Oliver, and J. Young Jr., encircled by KHOMPLETE KHEMISTRI APPAREL EST. 2020. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '51', imageUrl: '/assets/kk_founders_tee_black_silver.jpg', gender: 'Unisex', customize: 'none' }
  },
  {
    name: 'Founders "3" Crest Tee — Burgundy',
    description: "Burgundy unisex tee featuring the Khomplete Khemistri founders' crest: a gold trident forming a “3,” engraved with the three founding partners D. Taylor, C. Oliver, and J. Young Jr., encircled by KHOMPLETE KHEMISTRI APPAREL EST. 2020. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '52', imageUrl: '/assets/kk_founders_tee_burgundy.jpg', gender: 'Unisex', customize: 'none' }
  },
  {
    name: 'Founders "3" Crest Tee — Espresso Brown',
    description: "Espresso brown unisex tee featuring the Khomplete Khemistri founders' crest: a gold trident forming a “3,” engraved with the three founding partners D. Taylor, C. Oliver, and J. Young Jr., encircled by KHOMPLETE KHEMISTRI APPAREL EST. 2020. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '53', imageUrl: '/assets/kk_founders_tee_brown.jpg', gender: 'Unisex', customize: 'none' }
  },
  {
    name: 'The Number Three Tee — Black',
    description: "Black unisex tee with a striking gold “3” above KHOMPLETE KHEMISTRI APPAREL. The number three represents harmony, balance, and complete alignment — bringing together your mind, body, and spirit to create something powerful. It symbolizes growth and expansion, reminding you that your creativity, expression, and inner strength are naturally manifesting into reality. You are fully supported in building exactly what you envision. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '54', imageUrl: '/assets/kk_founders_tee_three_meaning_black.jpg', gender: 'Unisex', customize: 'none' }
  },
  {
    name: 'The Number Three Tee — White',
    description: "White unisex tee with a gold-and-silver “3” above KHOMPLETE KHEMISTRI APPAREL. The number three represents harmony, balance, and complete alignment — bringing together your mind, body, and spirit to create something powerful. It symbolizes growth and expansion, reminding you that your creativity, expression, and inner strength are naturally manifesting into reality. You are fully supported in building exactly what you envision. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '55', imageUrl: '/assets/kk_founders_tee_three_meaning_white.jpg', gender: 'Unisex', customize: 'none' }
  },
  {
    name: 'The Number Three Tee — Silver',
    description: "White unisex tee with a polished silver “3” above KHOMPLETE KHEMISTRI APPAREL. The number three represents harmony, balance, and complete alignment — bringing together your mind, body, and spirit to create something powerful. It symbolizes growth and expansion, reminding you that your creativity, expression, and inner strength are naturally manifesting into reality. You are fully supported in building exactly what you envision. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '56', imageUrl: '/assets/kk_founders_tee_three_meaning_silver.jpg', gender: 'Unisex', customize: 'none' }
  },
  {
    name: 'The Number Three Infinity Tee — Cream',
    description: "Cream unisex tee showcasing the Khomplete Khemistri infinity “3” crest in three metallic finishes — gold-and-black, silver-and-gold, and silver-and-black — beneath KHOMPLETE KHEMISTRI and above APPAREL & ACCESSORIES. The number three represents harmony, balance, and complete alignment — bringing together your mind, body, and spirit to create something powerful. It symbolizes growth and expansion, reminding you that your creativity, expression, and inner strength are naturally manifesting into reality. You are fully supported in building exactly what you envision. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '68', imageUrl: '/assets/kk_founders_tee_three_infinity.jpg', gender: 'Unisex', customize: 'none' }
  },
  {
    name: 'Forging the Future Tee — Charcoal',
    description: "Charcoal heather unisex tee with an all-over front print of the Khomplete Khemistri alchemy lab — glowing flasks, gears, and the master chemist forging garments — beneath KHOMPLETE KHEMISTRI APPAREL AND ACCESSORIES. EST 2020, LAUNCHED IN 2023, FORGING THE FUTURE OF FABRIC. Select your size at checkout.",
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '69', imageUrl: '/assets/kk_forging_future_tee_charcoal.jpg', gender: 'Unisex', customize: 'none' }
  },
  {
    name: 'Forging the Future Hoodie — Green',
    description: "Forest-green unisex pullover hoodie with an all-over print of the Khomplete Khemistri steampunk alchemy lab wrapping the hood, body, and sleeves — glowing copper pipes, flasks, and the master chemist forging garments — with KHOMPLETE KHEMISTRI APPAREL & ACCESSORIES. EST 2020, LAUNCHED IN 2023, FORGING THE FUTURE OF FABRIC. Select your size at checkout.",
    price: 6000,
    metadata: { category: 'Hoodies', productType: 'apparel', sortOrder: '70', imageUrl: '/assets/kk_forging_future_hoodie_green.jpg', gender: 'Unisex', customize: 'none' }
  },
  {
    name: 'Personalized Polo Shirt',
    description: "Personalized embroidered polo shirt on soft, breathable pique knit with a classic three-button collar. CHOOSE YOUR LOGO, COLOR, AND SIZE at checkout \u2014 pick any logo from our full Branded Logo Collection. Available in 15 colors and sizes XS through 6XL.",
    price: 4500,
    metadata: { category: 'Polos', productType: 'apparel', sortOrder: '71', gender: 'Unisex', imageUrl: '/assets/kk_polo_trident_three.jpg', colors: 'Black, Green, Bright Green, Grey, Lake Blue, Light Blue, Navy Blue, Orange, Pink, Purple, Red, Rose Red, Royal Blue, Wine Red, Yellow' }
  },
  // SLEEPWEAR & LOUNGEWEAR
  {
    name: "Personalized Custom Logo Slippers",
    description: "Cozy plush bedroom slippers with your choice of Khomplete Khemistri logo (Apparel, Accessories Eagle Badge, or 5 Swords Crest). Soft fuzzy faux fur lining for warmth and comfort. SELECT YOUR COLOR AND LOGO at checkout! Available colors: Black, Gray, White, and more. Unisex sizes for Men and Women.",
    price: 2500,
    metadata: { category: 'Sleepwear', productType: 'apparel', sortOrder: '25', imageUrl: '/attached_assets/custom_slippers_logo.jpg', gender: 'Unisex', fulfillment: 'Amazon', logoOptions: 'Apparel Logo, Accessories Eagle Badge, 5 Swords Crest', colors: 'Black, Gray, White' }
  },
  {
    name: "Women's Satin Pajama Set",
    description: "Luxurious satin pajama set with Khomplete Khemistri Apparel logo on chest pocket. Button-up top with matching pants. Choose your favorite logo design. Available in Black with gold logo. Sizes: S, M, L, XL.",
    price: 4500,
    metadata: { category: 'Sleepwear', productType: 'apparel', sortOrder: '26', imageUrl: "/assets/generated_images/women's_black_satin_pajamas.png", gender: 'Women', fulfillment: 'Amazon' }
  },
  {
    name: "Men's Cotton Pajama Set",
    description: "Premium cotton pajama set with Khomplete Khemistri Apparel logo on chest. Button-up top with matching pants. Choose your favorite logo design. Available in Black with gold logo. Sizes: M, L, XL, 2XL.",
    price: 4500,
    metadata: { category: 'Sleepwear', productType: 'apparel', sortOrder: '28', imageUrl: "/assets/generated_images/men's_black_cotton_pajamas.png", gender: 'Men', fulfillment: 'Amazon' }
  },
  // INTIMATES
  {
    name: "Men's Logo Boxer Briefs",
    description: "Premium personalized boxer briefs with Khomplete Khemistri Apparel logo on waistband. Black cotton blend with gold logo on elastic band. Comfortable everyday wear. Sizes: S, M, L, XL, 2XL.",
    price: 2200,
    metadata: { category: 'Intimates', productType: 'apparel', sortOrder: '38', imageUrl: "/assets/generated_images/men's_black_logo_boxers.png", gender: 'Men', fulfillment: 'Amazon/Etsy' }
  },
  {
    name: "Women's Logo Panties",
    description: "Personalized bikini panties with Khomplete Khemistri Apparel logo. Black with lace trim and gold shield crest design. Comfortable and stylish. Sizes: XS, S, M, L, XL.",
    price: 1800,
    metadata: { category: 'Intimates', productType: 'apparel', sortOrder: '39', imageUrl: "/assets/generated_images/women's_black_logo_panties.png", gender: 'Women', fulfillment: 'Amazon/Etsy' }
  },
  // WINTER APPAREL - MEN'S (seasonal: hidden in spring/summer, see ensureCatalogData)
  {
    name: "Men's Logo Beanie",
    description: "Black ribbed knit beanie with leather patch featuring Khomplete Khemistri Apparel logo. Gold embroidered shield crest on premium leather patch. Warm cuffed design. One size fits most.",
    price: 1200,
    metadata: { category: 'Winter', productType: 'apparel', hidden: 'true', sortOrder: '29', imageUrl: "/assets/generated_images/men's_beanie_with_logo_patch.png", gender: 'Men', fulfillment: 'Amazon' }
  },
  {
    name: "Men's Logo Scarf",
    description: "Black knit winter scarf with Khomplete Khemistri Apparel logo embroidered on end. Gold shield crest design. Warm acrylic material. Perfect for cold weather.",
    price: 1800,
    metadata: { category: 'Winter', productType: 'apparel', hidden: 'true', sortOrder: '30', imageUrl: "/assets/generated_images/men's_black_logo_scarf.png", gender: 'Men', fulfillment: 'Amazon' }
  },
  {
    name: "Men's Logo Gloves",
    description: "Black touchscreen compatible winter gloves with Khomplete Khemistri Apparel logo on back of hand. Gold embroidered shield design. Warm knit material. Sizes: M, L, XL.",
    price: 1500,
    metadata: { category: 'Winter', productType: 'apparel', hidden: 'true', sortOrder: '31', imageUrl: "/assets/generated_images/men's_black_logo_gloves.png", gender: 'Men', fulfillment: 'Amazon' }
  },
  {
    name: "Men's Winter Bundle",
    description: "Complete men's winter set with matching beanie, scarf, and gloves featuring the K.K.A (Khomplete Khemistri Apparel) logo with gold embroidery. Available in Gray, Red, and Beige. Perfect gift set.",
    price: 6000,
    metadata: { category: 'Winter', productType: 'apparel', hidden: 'true', sortOrder: '32', imageUrl: "/attached_assets/Screenshot_20251214_071010_Etsy_1765714465398.jpg", gender: 'Men', fulfillment: 'Etsy', bundle: 'true' }
  },
  // WINTER APPAREL - WOMEN'S (seasonal: hidden in spring/summer, see ensureCatalogData)
  {
    name: "Women's Logo Beanie",
    description: "Pink ribbed knit beanie with Khomplete Khemistri Apparel logo embroidered on front. Gold shield crest design. Soft cuffed style. One size fits most.",
    price: 1200,
    metadata: { category: 'Winter', productType: 'apparel', hidden: 'true', sortOrder: '33', imageUrl: "/assets/generated_images/women's_pink_logo_beanie.png", gender: 'Women', fulfillment: 'Amazon' }
  },
  {
    name: "Women's Logo Earmuffs",
    description: "Pink fuzzy earmuffs with Khomplete Khemistri Apparel logo on side. Plush faux fur ear warmers with gold embroidered shield design. Adjustable headband. One size fits most.",
    price: 1500,
    metadata: { category: 'Winter', productType: 'apparel', hidden: 'true', sortOrder: '34', imageUrl: "/assets/generated_images/women's_pink_logo_earmuffs.png", gender: 'Women', fulfillment: 'Amazon' }
  },
  {
    name: "Women's Logo Scarf",
    description: "Pink knit winter scarf with Khomplete Khemistri Apparel logo embroidered on end. Gold shield crest design. Soft and warm. Perfect for cold weather.",
    price: 1800,
    metadata: { category: 'Winter', productType: 'apparel', hidden: 'true', sortOrder: '35', imageUrl: "/assets/generated_images/women's_pink_logo_scarf.png", gender: 'Women', fulfillment: 'Amazon' }
  },
  {
    name: "Women's Logo Gloves",
    description: "Pink touchscreen compatible winter gloves with Khomplete Khemistri Apparel logo on back of hand. Gold embroidered shield design. Soft knit material. Sizes: S, M, L.",
    price: 1500,
    metadata: { category: 'Winter', productType: 'apparel', hidden: 'true', sortOrder: '36', imageUrl: "/assets/generated_images/women's_pink_logo_gloves.png", gender: 'Women', fulfillment: 'Amazon' }
  },
  {
    name: "Women's Winter Bundle",
    description: "Complete women's winter set with matching beanie, scarf, and gloves featuring the K.K.A (Khomplete Khemistri Apparel) logo with gold embroidery. Available in Gray, Red, and Beige. Perfect gift set.",
    price: 6000,
    metadata: { category: 'Winter', productType: 'apparel', hidden: 'true', sortOrder: '37', imageUrl: "/attached_assets/Screenshot_20251214_071010_Etsy_1765714465398.jpg", gender: 'Women', fulfillment: 'Etsy', bundle: 'true' }
  },
  // KIDS COLLECTION
  {
    name: 'Toddler T-Shirt',
    description: 'Kids t-shirt with Khomplete Khemistri Apparel logo on front. Black cotton with gold shield crest logo. Perfect for your little one to match the family. Sizes: 2T, 3T, 4T.',
    price: 2000,
    metadata: { category: 'Kids', productType: 'apparel', sortOrder: '21', imageUrl: '/assets/generated_images/black_toddler_t-shirt_branded.png', gender: 'Kids' }
  },
  // KIDS GRAPHIC TEE COLLECTION ($20, fixed design, size-only)
  {
    name: 'Little Astronomer Kids Tee — Charcoal',
    description: "Charcoal kids' tee featuring a little astronomer gazing through a telescope at a glowing solar system, with colorful A-B-C-D-E learning blocks and the Khomplete Khemistri Apparel crest. Inspires curiosity and a love of learning. Select your size at checkout.",
    price: 2000,
    metadata: { category: 'Kids', productType: 'apparel', sortOrder: '57', imageUrl: '/assets/kk_kids_tee_astronomer_charcoal.jpg', gender: 'Kids', customize: 'none', sizes: '2T, 3T, 4T, Youth XS, Youth S, Youth M, Youth L, Youth XL' }
  },
  {
    name: 'Young Stargazer Kids Tee — Brown',
    description: "Rich brown kids' tee with a young stargazer and telescope beneath golden constellations, plus playful alphabet blocks and the Khomplete Khemistri Apparel crest. Select your size at checkout.",
    price: 2000,
    metadata: { category: 'Kids', productType: 'apparel', sortOrder: '58', imageUrl: '/assets/kk_kids_tee_stargazer_brown.jpg', gender: 'Kids', customize: 'none', sizes: '2T, 3T, 4T, Youth XS, Youth S, Youth M, Youth L, Youth XL' }
  },
  {
    name: 'Little Explorer Kids Tee — Orange',
    description: "Bright orange kids' tee featuring a little explorer with a globe, map, and compass at sunrise, plus colorful learning blocks and the Khomplete Khemistri Apparel crest. Select your size at checkout.",
    price: 2000,
    metadata: { category: 'Kids', productType: 'apparel', sortOrder: '59', imageUrl: '/assets/kk_kids_tee_explorer_orange.jpg', gender: 'Kids', customize: 'none', sizes: '2T, 3T, 4T, Youth XS, Youth S, Youth M, Youth L, Youth XL' }
  },
  {
    name: 'Nature Explorers Kids Tee — Green',
    description: "Green kids' tee showing three young explorers planting, reading, and holding a globe in a sunny forest, with alphabet blocks and the Khomplete Khemistri Apparel crest. Select your size at checkout.",
    price: 2000,
    metadata: { category: 'Kids', productType: 'apparel', sortOrder: '60', imageUrl: '/assets/kk_kids_tee_nature_green.jpg', gender: 'Kids', customize: 'none', sizes: '2T, 3T, 4T, Youth XS, Youth S, Youth M, Youth L, Youth XL' }
  },
  {
    name: 'ABC Apple & Books Kids Tee — Red',
    description: "Red kids' tee with a classic apple-on-books design, sparkles, and colorful A-B-C learning blocks, finished with the Khomplete Khemistri Apparel crest. A perfect back-to-school look. Select your size at checkout.",
    price: 2000,
    metadata: { category: 'Kids', productType: 'apparel', sortOrder: '61', imageUrl: '/assets/kk_kids_tee_apple_books_red.jpg', gender: 'Kids', customize: 'none', sizes: '2T, 3T, 4T, Youth XS, Youth S, Youth M, Youth L, Youth XL' }
  },
  {
    name: 'Future Dreamers Kids Tee — Yellow',
    description: "Sunny yellow kids' tee celebrating big dreams — a future teacher, doctor, and businessman — with colorful learning blocks and the Khomplete Khemistri Apparel crest. Select your size at checkout.",
    price: 2000,
    metadata: { category: 'Kids', productType: 'apparel', sortOrder: '62', imageUrl: '/assets/kk_kids_tee_dreamers_yellow.jpg', gender: 'Kids', customize: 'none', sizes: '2T, 3T, 4T, Youth XS, Youth S, Youth M, Youth L, Youth XL' }
  },
  {
    name: 'Community Heroes Kids Tee — Royal Blue',
    description: "Royal blue kids' tee featuring a friendly community police officer with a family in a safe neighborhood, plus alphabet blocks and the Khomplete Khemistri Apparel crest. Select your size at checkout.",
    price: 2000,
    metadata: { category: 'Kids', productType: 'apparel', sortOrder: '63', imageUrl: '/assets/kk_kids_tee_heroes_blue.jpg', gender: 'Kids', customize: 'none', sizes: '2T, 3T, 4T, Youth XS, Youth S, Youth M, Youth L, Youth XL' }
  },
  {
    name: 'ABC Apple & Books Kids Tee — Pink',
    description: "Pink kids' tee with a dreamy apples-and-books design, sparkling stars, and colorful learning blocks, finished with the Khomplete Khemistri Apparel crest. Select your size at checkout.",
    price: 2000,
    metadata: { category: 'Kids', productType: 'apparel', sortOrder: '64', imageUrl: '/assets/kk_kids_tee_apple_books_pink.jpg', gender: 'Kids', customize: 'none', sizes: '2T, 3T, 4T, Youth XS, Youth S, Youth M, Youth L, Youth XL' }
  },
  {
    name: 'ABC Apple & Books Kids Tee — White',
    description: "Clean white kids' tee with a bright apples-on-books design, sparkles, and colorful A-B-C blocks, plus the Khomplete Khemistri Apparel crest. Select your size at checkout.",
    price: 2000,
    metadata: { category: 'Kids', productType: 'apparel', sortOrder: '65', imageUrl: '/assets/kk_kids_tee_apple_books_white.jpg', gender: 'Kids', customize: 'none', sizes: '2T, 3T, 4T, Youth XS, Youth S, Youth M, Youth L, Youth XL' }
  },
  {
    name: 'ABC Apple & Books Kids Tee — Black & Gold',
    description: "Black kids' tee with a striking golden apple-on-books design, gold sparkles, and matching learning blocks, finished with the Khomplete Khemistri Apparel crest. Select your size at checkout.",
    price: 2000,
    metadata: { category: 'Kids', productType: 'apparel', sortOrder: '66', imageUrl: '/assets/kk_kids_tee_apple_books_black.jpg', gender: 'Kids', customize: 'none', sizes: '2T, 3T, 4T, Youth XS, Youth S, Youth M, Youth L, Youth XL' }
  },
  {
    name: 'Rocket & Jet Kids Tee — Red',
    description: "Red kids' tee blasting off with a cartoon rocket and fighter jet among the stars, topped with the Khomplete Khemistri Apparel crest. Built for little dreamers who reach for the sky. Select your size at checkout.",
    price: 2000,
    metadata: { category: 'Kids', productType: 'apparel', sortOrder: '67', imageUrl: '/assets/kk_kids_tee_rocket_jet_red.jpg', gender: 'Kids', customize: 'none', sizes: '2T, 3T, 4T, Youth XS, Youth S, Youth M, Youth L, Youth XL' }
  },
  // FOOTWEAR COLLECTION
  {
    name: 'Classic White High-Tops',
    description: 'Premium white canvas high-top sneakers featuring the Khomplete Khemistri Apparel circular logo. "Established in 2020" printed on sole. Clean white design with black logo accent.',
    price: 7500,
    metadata: { category: 'Footwear', productType: 'apparel', sortOrder: '12', imageUrl: '/assets/1764780937475_1764822351469.jpg' }
  },
  {
    name: 'Black & Gold High-Tops',
    description: 'Premium black canvas high-top sneakers featuring the Khomplete Khemistri 5 Swords crest in blue and gold. "Established in 2020" on sole. Luxury streetwear design.',
    price: 7500,
    metadata: { category: 'Footwear', productType: 'apparel', sortOrder: '13', imageUrl: '/assets/1764676690790_1764822373703.jpg' }
  },
  {
    name: 'Khomplete Khemistri Sneakers \u2014 Grey/Silver',
    description: "Premium Khomplete Khemistri athletic sneakers in a cool grey colorway with a lace-anchored Khomplete Khemistri Apparel crest badge in polished silver. Breathable mesh upper, cushioned air sole, and a clean unisex fit. Unisex US sizing \u2014 select your size at checkout (women: size up about 1.5 from your US women's size).",
    price: 7000,
    metadata: { category: 'Footwear', productType: 'apparel', sortOrder: '14', gender: 'Unisex', sizes: 'US 5, US 6, US 7, US 8, US 9, US 10, US 11, US 12, US 13', imageUrl: '/assets/kk_sneaker_grey.jpg' }
  },
  {
    name: 'Khomplete Khemistri Sneakers \u2014 Sand/Gold',
    description: "Premium Khomplete Khemistri athletic sneakers in a warm sand/tan colorway with a lace-anchored Khomplete Khemistri Apparel crest badge in gold. Breathable mesh upper, cushioned air sole, and a clean unisex fit. Unisex US sizing \u2014 select your size at checkout (women: size up about 1.5 from your US women's size).",
    price: 7000,
    metadata: { category: 'Footwear', productType: 'apparel', sortOrder: '14', gender: 'Unisex', sizes: 'US 5, US 6, US 7, US 8, US 9, US 10, US 11, US 12, US 13', imageUrl: '/assets/kk_sneaker_sand.jpg' }
  },
  {
    name: 'Khomplete Khemistri Sneakers \u2014 Black/Red',
    description: "Premium Khomplete Khemistri athletic sneakers in a black colorway with red accents and a lace-anchored Khomplete Khemistri Apparel crest badge in red. Breathable mesh upper, cushioned air sole, and a clean unisex fit. Unisex US sizing \u2014 select your size at checkout (women: size up about 1.5 from your US women's size).",
    price: 7000,
    metadata: { category: 'Footwear', productType: 'apparel', sortOrder: '14', gender: 'Unisex', sizes: 'US 5, US 6, US 7, US 8, US 9, US 10, US 11, US 12, US 13', imageUrl: '/assets/kk_sneaker_black.jpg' }
  },
  {
    name: 'Khomplete Khemistri Sneakers \u2014 White/Silver',
    description: "Premium Khomplete Khemistri athletic sneakers in a clean white colorway with a lace-anchored Khomplete Khemistri Apparel crest badge in polished silver. Breathable mesh upper, cushioned air sole, and a clean unisex fit. Unisex US sizing \u2014 select your size at checkout (women: size up about 1.5 from your US women's size).",
    price: 7000,
    metadata: { category: 'Footwear', productType: 'apparel', sortOrder: '14', gender: 'Unisex', sizes: 'US 5, US 6, US 7, US 8, US 9, US 10, US 11, US 12, US 13', imageUrl: '/assets/kk_sneaker_white.jpg' }
  },
  // ACCESSORIES
  {
    name: '40 Oz Branded Tumbler',
    description: 'Premium 40 oz insulated stainless steel tumbler with handle and your choice of Khomplete Khemistri logo. Keeps drinks cold or hot for hours. Available in a wide range of colors — tell us your preferred color at checkout.',
    price: 3000,
    metadata: { category: 'Drinkware', productType: 'accessory', colors: 'Multiple colors available — specify your color choice at checkout', imageUrl: '/assets/tumbler_40oz_personalized.jpg', logoOptions: 'Apparel Logo, Accessories Eagle Badge, 5 Swords Crest', amazonLink: 'https://a.co/d/03kljFGN', cost: '20', fulfillment: 'Amazon' }
  },
  {
    name: 'Coffee Mug',
    description: 'Personalized 11 oz ceramic coffee mug with your choice of Khomplete Khemistri logo. Microwave and dishwasher safe. Available in multiple colors — perfect for your morning brew.',
    price: 1500,
    metadata: { category: 'Drinkware', productType: 'accessory', imageUrl: '/assets/coffee_mug_personalized.jpg', handleColors: 'Black, Blue, Red, Green, Yellow/Gold', amazonLink: 'https://a.co/d/08wcx6Bh', fulfillment: 'Amazon' }
  },
  {
    name: 'Custom iPhone Case',
    description: 'Personalized iPhone case featuring your choice of Khomplete Khemistri brand logo. Durable protective case with a sleek finish. Select your iPhone model (iPhone 7 through iPhone 17 Pro Max) and the branded logo you want printed on your case at checkout.',
    price: 3000,
    metadata: { category: 'Phone Cases', productType: 'accessory', imageUrl: '/assets/generated_images/iphone_branded_case.png', caseType: 'iphone', ebayLink: 'https://ebay.io/m/5yRG9J', fulfillment: 'eBay' }
  },
  {
    name: 'Custom Samsung Case',
    description: 'Personalized Samsung Galaxy case featuring your choice of Khomplete Khemistri brand logo. Durable protective case with a sleek finish. Select your Samsung model (all Galaxy S series and A series) and the branded logo you want printed on your case at checkout.',
    price: 3000,
    metadata: { category: 'Phone Cases', productType: 'accessory', imageUrl: '/assets/generated_images/samsung_branded_case.png', caseType: 'samsung', ebayLink: 'https://ebay.io/m/gQPk0T', fulfillment: 'eBay' }
  },
  {
    name: 'Executive Umbrella',
    description: 'Premium branded umbrella featuring the Khomplete Khemistri eagle design',
    price: 4500,
    metadata: { category: 'Lifestyle', productType: 'accessory', imageUrl: '/assets/1764674028102_1764809055176.jpg' }
  },
  {
    name: 'Signature Scent Candle',
    description: 'Premium scented candle with Khomplete Khemistri Accessories branding',
    price: 1500,
    metadata: { category: 'Home', productType: 'accessory', scented: 'true', imageUrl: '/assets/scented_candles_branded.png' }
  },
  {
    name: 'Whipped Body Butters',
    description: 'Luxurious Khomplete Khemistri whipped body butter in a 4 oz jar. Rich, fast-absorbing moisture that leaves skin soft and smooth. $12 per jar.',
    price: 1200,
    metadata: { category: 'Body Care', productType: 'accessory', customize: 'none', scented: 'true', imageUrl: '/assets/whipped_body_butters_branded.png' }
  },
  {
    name: 'Branded Tote Bag',
    description: 'Spacious canvas tote bag with Khomplete Khemistri Apparel logo. Natural cream canvas with black and gold logo. Perfect for shopping, gym, or everyday use.',
    price: 2200,
    metadata: { category: 'Bags', productType: 'accessory', imageUrl: '/attached_assets/copilot_image_1765114167490_1765212687857.jpeg', gender: 'Unisex' }
  },
  {
    name: 'Cosmetic Bag',
    description: 'Stylish makeup pouch with Khomplete Khemistri Accessories logo. Black faux leather with gold zipper. Perfect travel size for cosmetics and toiletries.',
    price: 1800,
    metadata: { category: 'Bags', productType: 'accessory', imageUrl: '/assets/generated_images/black_branded_cosmetic_bag.png', gender: 'Women' }
  },
  {
    name: 'Personalized Drawstring Backpack',
    description: 'Personalized drawstring backpack with your choice of any Khomplete Khemistri logo from our full catalog. Lightweight cinch-top bag, perfect for the gym, school, or everyday carry. SELECT YOUR COLOR AND LOGO at checkout! Available in 5 colors: Black, Orange, Royal Blue, Pink, and White.',
    price: 1200,
    metadata: { category: 'Bags', productType: 'accessory', imageUrl: '/assets/kk_drawstring_backpack.png', gender: 'Unisex', colors: 'Black, Orange, Royal Blue, Pink, White' }
  },
  {
    name: 'Personalized Coffee Cup Sleeve',
    description: 'Personalized reusable neoprene coffee cup sleeve with your choice of any Khomplete Khemistri logo from our full catalog. Insulated to keep hot drinks hot and cold drinks cold while keeping your hands comfortable. Universal fit for 22-24 oz cups. SELECT YOUR COLOR AND LOGO at checkout! Available in 34 colors: White, Black, Navy Blue, Royal Blue, Pink, Deep Sky Blue, Red, Blush Pink, Maroon, Sage, Candy, Pastel, Lavender, Baby Blue, Light Grey, Charcoal, Teal, Blackish Green, Peach Yellow, Coral, Violet, Rose Red, Orange, Magenta, Bright Gold, Kelly Green, Grass Green, Turquoise, Robin Egg Blue, Aquamarine, Light Teal, Mint Green, Mint, and Hot Pink.',
    price: 1500,
    metadata: { category: 'Drinkware', productType: 'accessory', imageUrl: '/assets/kk_coffee_sleeve.png', gender: 'Unisex', colors: 'White, Black, Navy Blue, Royal Blue, Pink, Deep Sky Blue, Red, Blush Pink, Maroon, Sage, Candy, Pastel, Lavender, Baby Blue, Light Grey, Charcoal, Teal, Blackish Green, Peach Yellow, Coral, Violet, Rose Red, Orange, Magenta, Bright Gold, Kelly Green, Grass Green, Turquoise, Robin Egg Blue, Aquamarine, Light Teal, Mint Green, Mint, Hot Pink' }
  },
  {
    name: 'Logo Keychain',
    description: 'Gold metal keychain with Khomplete Khemistri shield and swords crest charm. Black and gold enamel design. A stylish accessory for your keys.',
    price: 1200,
    metadata: { category: 'Accessories', productType: 'accessory', imageUrl: '/assets/generated_images/gold_logo_keychain.png', gender: 'Unisex' }
  },
  {
    name: 'Custom Logo Watch',
    description: 'Luxury unisex wristwatch with your choice of Khomplete Khemistri logo from our extensive catalog (Apparel Logo, Accessories Eagle Badge, 5 Swords Crest, and more). Premium metal case and band. SELECT YOUR COLOR AND LOGO at checkout! Available in Gold, Black, and Silver. A stunning statement piece for any occasion.',
    price: 5000,
    metadata: { category: 'Accessories', productType: 'accessory', imageUrl: '/attached_assets/kka_gold_watch.jpg', gender: 'Unisex', colors: 'Gold, Black, Silver', logoOptions: 'Apparel Logo, Accessories Eagle Badge, 5 Swords Crest, and more from catalog' }
  },
  // SLEEPWEAR & LOUNGEWEAR — Satin Robe (flat $40, all sizes; shows on the Bedding & Intimates page)
  {
    name: 'Khomplete Khemistri Elements Satin Robe',
    description: 'Luxurious satin robe featuring the Khomplete Khemistri Elements emblem embroidered in gold, finished with elegant gold piping, a self-tie belt, and side pockets. Smooth, lightweight satin in a relaxed unisex fit. One flat price for every size, XS to 6XL. SELECT YOUR COLOR AND SIZE at checkout! Available in 41 colors.',
    price: 4000,
    metadata: { category: 'Sleepwear', productType: 'accessory', sortOrder: '24', imageUrl: '/assets/satin_robe_kk_elements.png', gender: 'Unisex', sizes: 'XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL, 6XL', colors: 'Black, White, Ivory, Champagne, Gold, Silver, Grey Silver, Navy, Royal, Sky Blue, Turquoise, Teal, Aqua, Mint, Eucalyptus, Sage Green, Olive, Emerald Green, Green, Lime, Yellow, Lemon Yellow, Antique Gold, Copper, Burnt Orange, Orange, Coral, Red, Wine, Hot Pink, Blush, Light Pink, Dusty Rose, Mauve, Lavender, Dusty Plum, Plum, Purple, Dark Purple, Brown, Dark Brown' }
  },
  // BEDDING - one Comforter Set and one Sheet Set, each with selectable sizes.
  {
    name: 'Khomplete Khemistri Accessories Comforter Set',
    description: 'Luxury velvet comforter set featuring the Khomplete Khemistri Accessories eagle badge and "Sleep and Dream in Luxury" embroidered in gold. Rich chocolate brown. Includes comforter and matching pillow shams. Select your size at checkout: Twin, Full, Queen, or King.',
    price: 9900,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '50', imageUrl: '/assets/kk_comforter_set.png', fulfillment: 'Amazon', sizes: 'Twin, Full, Queen, King' }
  },
  {
    name: 'Khomplete Khemistri Accessories Sheet Set',
    description: 'Premium satin sheet set featuring the Khomplete Khemistri Accessories eagle badge and "Sleep and Dream in Luxury" embroidered in gold. Elegant chocolate brown. Includes fitted sheet, flat sheet, and matching pillowcases. Select your size at checkout: Twin, Full, Queen, or King.',
    price: 8000,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '51', imageUrl: '/assets/kk_sheet_set.png', fulfillment: 'Amazon', sizes: 'Twin, Full, Queen, King' }
  },
  {
    name: 'Khomplete Khemistri Accessories Pillowcase Set',
    description: 'Luxury branded pillowcase set — pack of 2. Featuring the Khomplete Khemistri Accessories eagle badge and "Sleep and Dream in Luxury" embroidered in gold on rich chocolate brown. Select your size at checkout: Twin, Full, Queen, or King.',
    price: 2500,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '52', imageUrl: '/assets/kk_pillowcase_set.png', fulfillment: 'Amazon', sizes: 'Twin, Full, Queen, King' }
  },
  {
    name: 'Khomplete Khemistri Accessories Body Pillow',
    description: 'Luxury branded body pillow featuring the Khomplete Khemistri Accessories eagle badge and "Sleep and Dream in Luxury" embroidered in gold on rich chocolate brown. Generous 60" x 20" size for full-body comfort.',
    price: 3600,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '53', imageUrl: '/assets/kk_body_pillow.png', fulfillment: 'Amazon', customize: 'none' }
  },
  // VINTAGE BALTIMORE
  {
    name: 'Cherry Hill Tribute Tee',
    description: "Cherry Hill, Baltimore, MD. A tribute to one of Baltimore's first planned African American communities. From its mid-20th-century post-war housing boom to its proud, resilient present, Cherry Hill's story runs deep in South Baltimore. Wear your community pride. Black tee.",
    price: 3000,
    metadata: { category: 'Baltimore Pride', productType: 'vintage', sortOrder: '60', imageUrl: '/attached_assets/1781657754385_1781663129062.png' }
  },
  {
    name: 'Fort McHenry Tee',
    description: "Fort McHenry — Baltimore, Maryland. War of 1812.\n\nFort McHenry was built between 1798 and 1803 to defend Baltimore from naval invasion. During the War of 1812, on September 13-14, 1814, the British navy bombarded the fort for 25 hours. Despite the intense attack, the fort's garrison held their ground and the American flag continued to fly, inspiring Francis Scott Key to write \"The Star-Spangled Banner.\" Now a national monument and historic shrine. Royal blue tee.",
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', sortOrder: '61', imageUrl: '/attached_assets/Screenshot_20260616_215848_Gallery_1781663170048.jpg' }
  },
  {
    name: "Celebrate Baltimore's Museums Tee",
    description: "Celebrate Baltimore's Museums. A tribute to the city's cultural treasures — The Walters Art Museum, the B&O Railroad Museum, the Reginald F. Lewis Museum and more. The back honors prominent Baltimore museums: the National Great Blacks In Wax Museum, American Visionary Art Museum, Maryland Center for History and Culture, National Aquarium, Maryland Science Center, Fort McHenry National Monument, Port Discovery Children's Museum, and the James E. Lewis Museum of Art. Heather gray tee.",
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', sortOrder: '62', imageUrl: '/attached_assets/1781660600583_1781663395049.jpg' }
  },
  {
    name: 'USS Constellation Tee',
    description: "USS Constellation — The Historic Warship. Baltimore, Maryland. Since 1854.\n\nDesigned and built in 1854, USS Constellation is a legend of the U.S. Navy — the last all-sail sloop-of-war ever constructed by the Navy. Commissioned in August 1854, she embodies American maritime heritage, serving for over a century. Now docked at Baltimore's Inner Harbor, she is a National Historic Landmark. Navy tee.",
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', sortOrder: '63', imageUrl: '/attached_assets/1781660105777_1781663431031.jpg' }
  },
  {
    name: 'National Great Blacks in Wax Museum Tee',
    description: "The National Great Blacks In Wax Museum — North Avenue, Baltimore. Founded as America's first wax museum dedicated solely to the study and celebration of African American history. Opened on East North Avenue in Baltimore, Maryland, the museum stands as a testament to the rich legal, cultural, and historical contributions of Black people across America. Purple tee.",
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', sortOrder: '64', imageUrl: '/attached_assets/1781660024391_1781663431048.jpg' }
  },
  {
    name: "Murry's Tee",
    description: "Murry's — Your Neighborhood Food Store! A nostalgic tribute to the beloved Baltimore grocery institution, complete with the classic retro chef logo. Soft black tee.",
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', sortOrder: '65', imageUrl: '/attached_assets/1781659209780_1781663431055.jpg' }
  },
  {
    name: 'Stop-N-Save Tee',
    description: "A History of Stop-N-Save. Established in 1952 by entrepreneur Henry Barksdale, Stop-N-Save was a pioneering Black-owned supermarket chain and cornerstone of the Baltimore community. More than a store, it provided employment, accessible groceries, and vital support for generations of residents in historic neighborhoods. Key locations included Harford Road (the original store), Mondawmin, and Greenmount Avenue. A Baltimore legacy of resilience and service. Est. 1952. Black tee.",
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', sortOrder: '66', imageUrl: '/attached_assets/1781658935332_1781663431066.jpg' }
  },
  {
    name: 'Super Pride Markets Tee',
    description: "Super Pride Markets: A Baltimore Landmark. Established in 1948 by civil rights leader and visionary businessman Henry G. Parks Jr., Super Pride Markets became a pillar of the Baltimore community. This prominent Black-owned supermarket chain provided essential services, fresh groceries, and hundreds of jobs to generations in the 20th century. Super Pride stood as a symbol of economic empowerment, community resilience, and opportunity in the heart of Baltimore. Gold tee.",
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', sortOrder: '67', imageUrl: '/attached_assets/1781658663211_1781663431071.jpg' }
  },
  {
    name: 'Union Bus Terminal Tee',
    description: "Baltimore Greyhound-Trailways Union Bus Terminal. Howard & Fayette St. Est. 1941, Baltimore, MD. A tribute to the Art Deco landmark that served as a bustling hub for regional travel. The back traces its history — 1941 construction, the 1940s-1980s operational heyday, the 1987 closure of the original Art Deco terminal, and the move to the current facility on Haines Street. Black tee.",
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', sortOrder: '68', imageUrl: '/attached_assets/1781658177886_1781663431075.jpg' }
  },
  {
    name: 'B&O Railroad Tribute Tee',
    description: "Baltimore & Ohio Railroad — The Birthplace of American Railroading. Baltimore, Maryland. Founded 1827.\n\nThe B&O was the first common carrier railroad in the U.S., founded in Baltimore to compete with New York's Erie Canal. The first stone for the line was laid on July 4, 1828, connecting Baltimore to the Ohio River. Mount Clare Station, built in 1830, is the oldest passenger rail terminal in the United States. It fueled Baltimore's growth, linking the East Coast with the expanding American West — linking 13 great states with the nation. Denim blue tee.",
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', sortOrder: '69', imageUrl: '/attached_assets/1781657385584_1781663431078.png' }
  },
  // POETRY ON A PLAQUE
  {
    name: 'Four Seasons of Poetic Verses - Wooden Plaque',
    description: 'A poem for every month of the year, covering all four seasons. Beautifully displayed on a premium wooden plaque.',
    price: 4000,
    metadata: { category: 'seasons', productType: 'poetry', format: 'plaque', imageUrl: '/attached_assets/poetry_plaques_showcase.jpg' }
  },
  {
    name: 'Four Seasons of Poetic Verses - Glass Frame',
    description: 'A poem for every month of the year, covering all four seasons. Elegantly presented in a silver glass frame.',
    price: 3000,
    metadata: { category: 'seasons', productType: 'poetry', format: 'glass', imageUrl: '/attached_assets/glass_frame_showcase.jpg' }
  },
  {
    name: 'Mental Health - Wooden Plaque',
    description: 'Poetry addressing mental wellness, self-care, and healing journeys. Displayed on a premium wooden plaque.',
    price: 4000,
    metadata: { category: 'mental-health', productType: 'poetry', format: 'plaque', imageUrl: '/attached_assets/poetry_plaques_showcase.jpg' }
  },
  {
    name: 'Mental Health - Glass Frame',
    description: 'Poetry addressing mental wellness, self-care, and healing journeys. Elegantly framed in silver glass.',
    price: 3000,
    metadata: { category: 'mental-health', productType: 'poetry', format: 'glass', imageUrl: '/attached_assets/glass_frame_showcase.jpg' }
  },
  {
    name: 'Enchanted Love - Wooden Plaque',
    description: 'Romantic poetry that captures the essence of love and devotion. Mounted on a premium wooden plaque.',
    price: 4000,
    metadata: { category: 'love', productType: 'poetry', format: 'plaque', imageUrl: '/attached_assets/poetry_plaques_showcase.jpg' }
  },
  {
    name: 'Enchanted Love - Glass Frame',
    description: 'Romantic poetry that captures the essence of love and devotion. Beautifully displayed in a silver glass frame.',
    price: 3000,
    metadata: { category: 'love', productType: 'poetry', format: 'glass', imageUrl: '/attached_assets/glass_frame_showcase.jpg' }
  },
  {
    name: 'Inspired Motivations - Wooden Plaque',
    description: 'Uplifting and encouraging poetry to inspire your daily journey. Presented on a premium wooden plaque.',
    price: 4000,
    metadata: { category: 'inspiration', productType: 'poetry', format: 'plaque', imageUrl: '/attached_assets/poetry_plaques_showcase.jpg' }
  },
  {
    name: 'Inspired Motivations - Glass Frame',
    description: 'Uplifting and encouraging poetry to inspire your daily journey. Elegantly framed in silver glass.',
    price: 3000,
    metadata: { category: 'inspiration', productType: 'poetry', format: 'glass', imageUrl: '/attached_assets/glass_frame_showcase.jpg' }
  },
  {
    name: 'The Landscapes of Lost - Wooden Plaque',
    description: 'Heartfelt poetry for those dealing with grief and loss. A comforting tribute on premium wood.',
    price: 4000,
    metadata: { category: 'grief', productType: 'poetry', format: 'plaque', imageUrl: '/attached_assets/poetry_plaques_showcase.jpg' }
  },
  {
    name: 'The Landscapes of Lost - Glass Frame',
    description: 'Heartfelt poetry for those dealing with grief and loss. A comforting tribute in elegant glass.',
    price: 3000,
    metadata: { category: 'grief', productType: 'poetry', format: 'glass', imageUrl: '/attached_assets/glass_frame_showcase.jpg' }
  },
  {
    name: 'Where Spirit Meets Verse - Wooden Plaque',
    description: 'Spiritual poetry exploring faith, hope, and divine connection. Displayed on premium wood.',
    price: 4000,
    metadata: { category: 'spiritual', productType: 'poetry', format: 'plaque', imageUrl: '/attached_assets/poetry_plaques_showcase.jpg' }
  },
  {
    name: 'Where Spirit Meets Verse - Glass Frame',
    description: 'Spiritual poetry exploring faith, hope, and divine connection. Elegantly framed in silver glass.',
    price: 3000,
    metadata: { category: 'spiritual', productType: 'poetry', format: 'glass', imageUrl: '/attached_assets/glass_frame_showcase.jpg' }
  },
];

// Helper function to seed all products in Stripe
async function seedProducts() {
  try {
    const stripe = await getUncachableStripeClient();
    
    // Fetch ALL existing products with pagination
    const allExistingProducts: any[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;
    
    while (hasMore) {
      const params: any = { limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;
      
      const response = await stripe.products.list(params);
      allExistingProducts.push(...response.data);
      hasMore = response.has_more;
      if (response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id;
      }
    }
    
    console.log(`Found ${allExistingProducts.length} existing products in Stripe`);

    // Group every copy of a name so per-product updates target the SAME
    // deterministic keeper the dedup below selects. Picking the first match
    // (allExistingProducts.find) could land on an archived/duplicate copy after
    // cleanup, so metadata/price edits would silently apply to a hidden record.
    const existingByName = new Map<string, any[]>();
    for (const p of allExistingProducts) {
      const arr = existingByName.get(p.name) ?? [];
      arr.push(p);
      existingByName.set(p.name, arr);
    }

    // Choose the keeper among copies of a name, mirroring the dedup ranking
    // (highest priority first): (a) active; (b) has an active price; (c) matches
    // canonical productType; (d) matches canonical price; (e) carries sortOrder
    // metadata; (f) lowest id (stable tie-break). Prices are looked up only when
    // a name actually has more than one copy.
    const pickKeeper = async (
      copies: any[],
      canonical: { price: number; metadata: Record<string, any> },
    ): Promise<any> => {
      if (copies.length === 1) return copies[0];
      const activePriceByCopy = new Map<string, number | null>();
      for (const c of copies) {
        const prices = await stripe.prices.list({ product: c.id, active: true, limit: 1 });
        activePriceByCopy.set(c.id, prices.data[0]?.unit_amount ?? null);
      }
      const scoreOf = (c: any): number[] => {
        const price = activePriceByCopy.get(c.id);
        return [
          c.active ? 1 : 0,
          price != null ? 1 : 0,
          c.metadata?.productType === canonical.metadata.productType ? 1 : 0,
          price != null && price === canonical.price ? 1 : 0,
          c.metadata?.sortOrder ? 1 : 0,
        ];
      };
      return [...copies].sort((a, b) => {
        const sa = scoreOf(a), sb = scoreOf(b);
        for (let i = 0; i < sa.length; i++) {
          if (sa[i] !== sb[i]) return sb[i] - sa[i];
        }
        return a.id < b.id ? -1 : 1;
      })[0];
    };

    for (const productDef of ALL_PRODUCTS) {
      const copies = existingByName.get(productDef.name) ?? [];
      const existingProduct = copies.length ? await pickKeeper(copies, productDef) : undefined;
      
      if (!existingProduct) {
        console.log(`Creating product: ${productDef.name}...`);
        
        const product = await stripe.products.create({
          name: productDef.name,
          description: productDef.description,
          metadata: productDef.metadata as unknown as Record<string, string>,
          images: [],
        });
        
        await stripe.prices.create({
          product: product.id,
          unit_amount: productDef.price,
          currency: 'usd',
        });
        
        console.log(`Created: ${productDef.name} at $${(productDef.price / 100).toFixed(2)}`);
      } else {
        // Update existing product when the description OR any desired metadata
        // field drifts from Stripe (not just imageUrl). Comparing only imageUrl
        // meant edits like a changed `sizes` list never reached Stripe, so the
        // incremental sync kept overwriting the DB with the stale value. Only the
        // desired keys are compared so a stable catalog triggers no needless
        // Stripe writes on boot.
        const want = productDef.metadata as unknown as Record<string, string>;
        const have = (existingProduct.metadata ?? {}) as Record<string, string>;
        const metaChanged = Object.keys(want).some(
          (k) => String(have[k] ?? "") !== String(want[k] ?? ""),
        );
        const descChanged =
          (existingProduct.description ?? "") !== (productDef.description ?? "");
        if (metaChanged || descChanged) {
          console.log(`Updating metadata for: ${productDef.name}...`);
          await stripe.products.update(existingProduct.id, {
            description: productDef.description,
            metadata: want,
          });
          console.log(`Updated: ${productDef.name}`);
        }
        
        // Check if price needs to be updated
        const prices = await stripe.prices.list({ product: existingProduct.id, active: true, limit: 1 });
        if (prices.data.length > 0) {
          const currentPrice = prices.data[0];
          if (currentPrice.unit_amount !== productDef.price) {
            console.log(`Updating price for: ${productDef.name} from $${(currentPrice.unit_amount! / 100).toFixed(2)} to $${(productDef.price / 100).toFixed(2)}...`);
            // Archive old price and create new one
            await stripe.prices.update(currentPrice.id, { active: false });
            await stripe.prices.create({
              product: existingProduct.id,
              unit_amount: productDef.price,
              currency: 'usd',
            });
            console.log(`Price updated for: ${productDef.name}`);
          }
        }
      }
    }
    
    // Deactivate products that are no longer in ALL_PRODUCTS
    const productNames = ALL_PRODUCTS.map(p => p.name);
    for (const existingProduct of allExistingProducts) {
      if (!productNames.includes(existingProduct.name) && existingProduct.active) {
        console.log(`Deactivating removed product: ${existingProduct.name}...`);
        await stripe.products.update(existingProduct.id, { active: false });
        console.log(`Deactivated: ${existingProduct.name}`);
      }
    }

    // Collapse ALL duplicate products in Stripe so each name stays active only
    // once. Past reseeds created ~45 products a second time (same name, different
    // ids, both active). Making Stripe — the source of truth — tidy lets the sync
    // set active=false in the DB so the storefront's name-dedupe is no longer
    // load-bearing. Archiving is non-destructive (orders store product names +
    // amounts, not price/product ids) and reversible.
    //
    // Keeper selection is deterministic and mirrors ensureCatalogData so dev
    // (Stripe) and prod (DB snapshot) converge on the SAME keeper. Most pairs
    // are identical; a few differ and must keep the correct copy, driven by the
    // canonical ALL_PRODUCTS price/productType: e.g. the Winter Bundles keep the
    // $60 copy (not the cheaper stale one) and Chemistry Socks keeps the apparel
    // copy. Ranking, highest priority first: (a) has an active price; (b) matches
    // canonical productType; (c) matches canonical price; (d) carries sortOrder
    // metadata; (e) lowest id (stable tie-break).
    const activeByName = new Map<string, any[]>();
    for (const p of allExistingProducts) {
      if (!p.active) continue;
      const arr = activeByName.get(p.name) ?? [];
      arr.push(p);
      activeByName.set(p.name, arr);
    }
    const canonicalByName = new Map(ALL_PRODUCTS.map(p => [p.name, p]));
    for (const [name, copies] of Array.from(activeByName.entries())) {
      if (copies.length < 2) continue;
      const canonical = canonicalByName.get(name);

      // Look up each copy's active price once.
      const activePriceByCopy = new Map<string, number | null>();
      for (const c of copies) {
        const prices = await stripe.prices.list({ product: c.id, active: true, limit: 1 });
        activePriceByCopy.set(c.id, prices.data[0]?.unit_amount ?? null);
      }

      const scoreOf = (c: any): number[] => {
        const price = activePriceByCopy.get(c.id);
        return [
          price != null ? 1 : 0,
          canonical && c.metadata?.productType === canonical.metadata.productType ? 1 : 0,
          canonical && price != null && price === canonical.price ? 1 : 0,
          c.metadata?.sortOrder ? 1 : 0,
        ];
      };

      const keeper = [...copies].sort((a, b) => {
        const sa = scoreOf(a), sb = scoreOf(b);
        for (let i = 0; i < sa.length; i++) {
          if (sa[i] !== sb[i]) return sb[i] - sa[i];
        }
        return a.id < b.id ? -1 : 1;
      })[0];

      for (const c of copies) {
        if (c.id === keeper.id) continue;
        console.log(`Archiving duplicate "${name}": ${c.id}...`);
        const dupPrices = await stripe.prices.list({ product: c.id, active: true, limit: 100 });
        for (const pr of dupPrices.data) {
          await stripe.prices.update(pr.id, { active: false });
        }
        await stripe.products.update(c.id, { active: false });
        console.log(`Archived duplicate "${name}": ${c.id} (kept ${keeper.id})`);
      }
    }

    // Self-heal: a product that belongs in the catalog (ALL_PRODUCTS) must
    // always have exactly ONE active copy. A past partial/crashed run could
    // archive EVERY copy of a name, which silently removes the item from the
    // store (this happened to "Kids Sippy Cup"). For any catalog name that has
    // copies in Stripe but none active, revive the canonical keeper (lowest id —
    // matches the dedup tie-break), ensure it carries an active price, and clear
    // any stray active price left on its other inactive copies. Names with no
    // copies at all are handled by the create branch above.
    const allByName = new Map<string, any[]>();
    for (const p of allExistingProducts) {
      const arr = allByName.get(p.name) ?? [];
      arr.push(p);
      allByName.set(p.name, arr);
    }
    for (const productDef of ALL_PRODUCTS) {
      const copies = allByName.get(productDef.name) ?? [];
      if (copies.length === 0) continue;
      if (copies.some(c => c.active)) continue;

      const revive = [...copies].sort((a, b) => (a.id < b.id ? -1 : 1))[0];
      console.warn(`Reactivating catalog product left with no active copy: "${productDef.name}" (${revive.id})`);
      await stripe.products.update(revive.id, { active: true });

      const activePrices = await stripe.prices.list({ product: revive.id, active: true, limit: 1 });
      if (activePrices.data.length === 0) {
        await stripe.prices.create({
          product: revive.id,
          unit_amount: productDef.price,
          currency: 'usd',
        });
      }

      for (const c of copies) {
        if (c.id === revive.id) continue;
        const strayPrices = await stripe.prices.list({ product: c.id, active: true, limit: 100 });
        for (const pr of strayPrices.data) {
          await stripe.prices.update(pr.id, { active: false });
        }
      }
    }

    // Clean up leftover active prices on INACTIVE products. Deactivating a
    // product in Stripe (the "no longer in ALL_PRODUCTS" step above, or
    // historical removals like the Duvet sets, Matte Black Mug, older High-Top
    // Sneakers) does NOT archive its PRICE objects. An inactive product is never
    // shown in the storefront, so these stray prices are harmless, but they make
    // the Stripe catalog / synced DB confusing to audit and could surface in
    // price-level reports. Re-fetch products fresh so this reflects all the
    // (de)activation above, then archive every active price on an inactive
    // product. Generic + idempotent: covers retired, deduped, and pre-existing
    // inactive products in one pass.
    const finalProducts: any[] = [];
    {
      let more = true;
      let after: string | undefined;
      while (more) {
        const params: any = { limit: 100 };
        if (after) params.starting_after = after;
        const response = await stripe.products.list(params);
        finalProducts.push(...response.data);
        more = response.has_more;
        if (response.data.length > 0) {
          after = response.data[response.data.length - 1].id;
        }
      }
    }
    for (const product of finalProducts) {
      if (product.active) continue;
      const leftoverPrices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
      for (const pr of leftoverPrices.data) {
        console.log(`Archiving leftover price on inactive product "${product.name}": ${pr.id}...`);
        await stripe.prices.update(pr.id, { active: false });
      }
    }

    console.log('Product seeding complete!');
  } catch (error) {
    console.error('Error seeding products:', error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Shared hub authentication (session + passport local strategy)
  setupAuth(app);

  // Seed products in the background (non-blocking), then ensure the catalog
  // facts (tumbler price/logo, Coffee Mug) hold in whatever DB this server is
  // connected to — dev now, Railway prod on deploy. Running ensureCatalogData
  // after seedProducts keeps startup convergence deterministic (seedProducts
  // creates the dev Stripe mug first, so the guarded synthetic insert is a no-op
  // in dev and only fires on the production snapshot).
  seedProducts()
    .catch(err => console.error('Product seeding failed:', err))
    .finally(() => {
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

  // Get Stripe publishable key for frontend
  app.get("/api/stripe/config", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      res.status(500).json({ error: "Failed to get Stripe config" });
    }
  });

  // Get all products from Stripe (with fallback to direct Stripe API)
  app.get("/api/products", async (req, res) => {
    try {
      res.json(await getStorefrontProducts());
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get products by type (apparel or accessory) with fallback
  app.get("/api/products/type/:type", async (req, res) => {
    try {
      const { type } = req.params;
      
      // First try database
      let rows: any[] = [];
      try {
        rows = await stripeStorage.getProductsWithPricesByType(type);
      } catch (dbError) {
        console.log('Database query failed, falling back to Stripe API');
      }
      
      // If database has no products, fetch directly from Stripe
      if (!rows || rows.length === 0) {
        console.log(`No ${type} products in database, fetching from Stripe API...`);
        const stripe = await getUncachableStripeClient();
        const stripeProducts = await stripe.products.list({ active: true, limit: 100 });
        
        const products = [];
        for (const product of stripeProducts.data) {
          const metadata = product.metadata || {};
          if (metadata.productType !== type) continue;
          if (metadata.hidden === 'true') continue;
          
          const prices = await stripe.prices.list({ product: product.id, active: true, limit: 1 });
          const price = prices.data[0];
          
          products.push({
            id: product.id,
            title: product.name,
            description: product.description || '',
            category: metadata.category || 'General',
            imageUrl: metadata.imageUrl || (product.images?.[0] || ''),
            productType: metadata.productType || 'general',
            sortOrder: parseInt(metadata.sortOrder || '99'),
            gender: metadata.gender || null,
            logoOptions: metadata.logoOptions || (isDefaultLogoCustomizable(metadata) ? FULL_LOGO_CATALOG_OPTION : null),
            colors: metadata.colors || null,
            soldOutColors: metadata.soldOutColors || null,
            handleColors: metadata.handleColors || null,
            caseType: metadata.caseType || null,
            sizes: metadata.sizes || null,
            apparelSizes: apparelSizesFor(metadata, product.name).join(', ') || null,
            scents: scentsFor(metadata).join(', ') || null,
            price: price ? (price.unit_amount! / 100).toFixed(2) : '0.00',
            priceId: price?.id || null,
          });
        }
        
        const deduped = dedupeByName(products);
        deduped.sort((a, b) => a.sortOrder - b.sortOrder);
        return res.json(deduped);
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

  // Create checkout session (Square-hosted checkout)
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { priceId, productName, productDescription, selectedLogo } = req.body;

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
      const { url } = await createSquarePaymentLink({
        name: (priceRow.product_name as string) || productName || "Order",
        amountCents,
        description: productDescription || (priceRow.product_description as string) || undefined,
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

      // Server-authoritative pricing: compute the total here, never trust the client.
      // Base garment prices (USD) must mirror the LogoCustomizer options.
      const GARMENT_BASE_PRICES: Record<string, number> = {
        "short-sleeve": 30,
        "long-sleeve": 35,
        "pullover-hoodie": 50,
        "full-zip-hoodie": 60,
        "jacket": 75,
        "jeans": 65,
        "sweatpants": 55,
        "tumbler-40oz": 30,
      };

      const basePrice = GARMENT_BASE_PRICES[garmentId];
      if (!basePrice) {
        return res.status(400).json({ error: "Invalid garment selection" });
      }

      // Some items (e.g. the tumbler) carry a single laser-etched logo only —
      // the dual-placement surcharge must never apply to them.
      const SINGLE_PLACEMENT_GARMENTS = new Set(["tumbler-40oz"]);
      const placementCount = SINGLE_PLACEMENT_GARMENTS.has(garmentId)
        ? 1
        : (Array.isArray(placements) ? placements.length : 1);
      const totalDollars = basePrice + (placementCount > 1 ? 10 : 0);
      const amountCents = totalDollars * 100;

      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      // See note in /api/create-checkout: Square appends the order id on the
      // redirect, and the success page verifies + records it. Nothing persisted here.
      const { url } = await createSquarePaymentLink({
        name: `Custom ${garmentType || "Garment"} - Logo #${logoId}`,
        amountCents,
        description: `Logo: ${logoName} | Placement: ${placementDescription}`,
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

      if (items.length > 100) {
        return res.status(400).json({ error: "Too many items in your cart." });
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

        const amountCents = Number(priceRow.unit_amount) + (check.upchargeCents || 0);
        if (!amountCents || amountCents <= 0) {
          return res.status(400).json({ error: "Invalid product price." });
        }

        lineItems.push({
          name: (priceRow.product_name as string) || "Item",
          quantity,
          amountCents,
          note: logoNote,
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
        redirectUrl: `${baseUrl}/checkout/success`,
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
