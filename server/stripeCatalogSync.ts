import type Stripe from "stripe";
import {
  buildBluevineCatalogRows,
  type BluevineCatalogRow,
} from "@shared/bluevineCatalog";
import { getUncachableStripeClient, stripeConfigured } from "./stripeClient";
import { getStorefrontProductsDetailed } from "./storefrontProducts";

/** Metadata key that marks Products this sync owns in the live Stripe account. */
export const TCE_PRODUCT_META_KEY = "tce_product_id";
export const TCE_SOURCE_META = "tce_storefront";

export interface StripeCatalogSyncResult {
  created: number;
  updated: number;
  priceRotated: number;
  archived: number;
  skipped: number;
  total: number;
  pruned: boolean;
  /** Live Stripe Product ids keyed by storefront SKU. */
  mappings: Array<{ sku: string; stripeProductId: string; stripePriceId: string }>;
}

function lookupKeyForSku(sku: string): string {
  // Stripe lookup_keys: up to 200 chars, unique per active price.
  return `tce_${sku}`.slice(0, 200);
}

async function listSyncedProducts(
  stripe: Stripe,
): Promise<Map<string, Stripe.Product>> {
  const map = new Map<string, Stripe.Product>();
  for await (const product of stripe.products.list({ limit: 100, active: true })) {
    const sku = product.metadata?.[TCE_PRODUCT_META_KEY];
    if (sku) map.set(sku, product);
  }
  // Also scan inactive so we can reactivate / update without duplicating.
  for await (const product of stripe.products.list({ limit: 100, active: false })) {
    const sku = product.metadata?.[TCE_PRODUCT_META_KEY];
    if (sku && !map.has(sku)) map.set(sku, product);
  }
  return map;
}

async function findActivePriceForProduct(
  stripe: Stripe,
  productId: string,
  lookupKey: string,
): Promise<Stripe.Price | null> {
  const byLookup = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  if (byLookup.data[0]) return byLookup.data[0];

  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 10,
  });
  return prices.data[0] ?? null;
}

function rowAmountCents(row: BluevineCatalogRow): number {
  return Math.round(parseFloat(row.unitPriceDollars) * 100);
}

/**
 * One-way mirror: storefront sellable catalog → live Stripe Products/Prices.
 * Idempotent. Only mutates Products tagged with tce_product_id metadata, so
 * hand-made Stripe objects (and Bluevine-only drafts) are left alone.
 *
 * Bluevine Sales → Items still needs a one-time (or periodic) entry from the
 * CSV export — Bluevine does not expose an Items write API. Syncing Stripe
 * keeps the linked payment account's Product catalog aligned for invoices /
 * Payment Links created through Stripe.
 */
export async function syncStorefrontToStripe(): Promise<StripeCatalogSyncResult> {
  if (!stripeConfigured()) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY).");
  }

  const stripe = await getUncachableStripeClient();
  const { products, source } = await getStorefrontProductsDetailed();
  const rows = buildBluevineCatalogRows(products);
  const existing = await listSyncedProducts(stripe);

  let created = 0;
  let updated = 0;
  let priceRotated = 0;
  let skipped = 0;
  const mappings: StripeCatalogSyncResult["mappings"] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    // Keep coming-soon SKUs in the Bluevine CSV, but do not push them live yet.
    if (row.status === "coming_soon") {
      skipped++;
      continue;
    }

    seen.add(row.sku);
    const amountCents = rowAmountCents(row);
    const lookupKey = lookupKeyForSku(row.sku);
    const metadata: Stripe.MetadataParam = {
      source: TCE_SOURCE_META,
      [TCE_PRODUCT_META_KEY]: row.sku,
      product_type: row.productType,
      category: row.category,
      priority_group: row.priorityGroup,
      status: row.status,
    };

    let product = existing.get(row.sku) ?? null;
    if (!product) {
      product = await stripe.products.create({
        name: row.name,
        description: row.description || undefined,
        active: row.status === "active",
        metadata,
      });
      created++;
    } else {
      const needsUpdate =
        product.name !== row.name ||
        (product.description || "") !== (row.description || "") ||
        product.active !== (row.status === "active") ||
        product.metadata?.[TCE_PRODUCT_META_KEY] !== row.sku;

      if (needsUpdate) {
        product = await stripe.products.update(product.id, {
          name: row.name,
          description: row.description || "",
          active: row.status === "active",
          metadata,
        });
        updated++;
      }
    }

    let price = await findActivePriceForProduct(stripe, product.id, lookupKey);
    if (!price || price.unit_amount !== amountCents || price.currency !== "usd") {
      if (price?.active) {
        await stripe.prices.update(price.id, { active: false });
      }
      price = await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: amountCents,
        lookup_key: lookupKey,
        transfer_lookup_key: true,
        metadata: {
          source: TCE_SOURCE_META,
          [TCE_PRODUCT_META_KEY]: row.sku,
        },
      });
      priceRotated++;
    }

    mappings.push({
      sku: row.sku,
      stripeProductId: product.id,
      stripePriceId: price.id,
    });
  }

  let archived = 0;
  const canPrune = source === "db" && products.length > 0;
  if (canPrune) {
    for (const [sku, product] of Array.from(existing.entries())) {
      if (seen.has(sku)) continue;
      if (!product.active) continue;
      await stripe.products.update(product.id, { active: false });
      archived++;
    }
  }

  return {
    created,
    updated,
    priceRotated,
    archived,
    skipped,
    total: rows.length,
    pruned: canPrune,
    mappings,
  };
}
