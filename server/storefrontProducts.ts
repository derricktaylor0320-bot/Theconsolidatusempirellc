import { stripeStorage } from "./stripeStorage";
import { getUncachableStripeClient } from "./stripeClient";
import {
  isDefaultLogoCustomizable,
  apparelSizesFor,
  scentsFor,
  FULL_LOGO_CATALOG_OPTION,
} from "@shared/customization";

// A single storefront product as the React app consumes it. Prices are dollar
// strings (e.g. "30.00"); `priceId` is the Stripe price the checkout uses.
export interface StorefrontProduct {
  id: string;
  title: string;
  description: string | null;
  category: string;
  imageUrl: string;
  productType: string;
  sortOrder?: number;
  soldOut: boolean;
  gender: string | null;
  logoOptions: string | null;
  colors: string | null;
  soldOutColors: string | null;
  handleColors: string | null;
  caseType: string | null;
  sizes: string | null;
  apparelSizes: string | null;
  scents: string | null;
  price: string | null;
  priceId: string | null;
}

// Collapses products that share a (case-insensitive) name down to a single
// entry, preferring the one with a real price, then lowest sortOrder/price.
// Stripe can hold duplicate products from past reseeds; the storefront only ever
// shows one per name, and the Square mirror must do the same.
export function dedupeByName<T extends {
  title: string;
  priceId?: string | null;
  sortOrder?: number;
  price?: string | null;
  id?: string;
}>(items: T[]): T[] {
  const better = (a: T, b: T): boolean => {
    const ap = a.priceId ? 0 : 1, bp = b.priceId ? 0 : 1;
    if (ap !== bp) return ap < bp;
    const as = typeof a.sortOrder === 'number' ? a.sortOrder : 99;
    const bs = typeof b.sortOrder === 'number' ? b.sortOrder : 99;
    if (as !== bs) return as < bs;
    const apr = a.price != null ? parseFloat(a.price) : Infinity;
    const bpr = b.price != null ? parseFloat(b.price) : Infinity;
    if (apr !== bpr) return apr < bpr;
    return (a.id ?? '') < (b.id ?? '');
  };
  const byName = new Map<string, T>();
  for (const item of items) {
    const key = item.title.trim().toLowerCase();
    const existing = byName.get(key);
    if (!existing || better(item, existing)) {
      byName.set(key, item);
    }
  }
  return Array.from(byName.values());
}

// Where the product list came from. `db` is the authoritative Stripe-synced
// tables; `stripe-fallback` is the emergency live-Stripe path used only when the
// DB read fails or is empty. Destructive reconciliation (e.g. the Square mirror
// pruning removed items) must ONLY trust `db`.
export type StorefrontSource = "db" | "stripe-fallback";

export interface StorefrontProductsResult {
  products: StorefrontProduct[];
  source: StorefrontSource;
}

// Builds the full, deduped list of products the storefront sells, and reports
// which source produced it. DB-first (Stripe-synced tables), falling back to the
// live Stripe API, hiding products flagged `hidden`.
export async function getStorefrontProductsDetailed(): Promise<StorefrontProductsResult> {
  let rows: any[] = [];
  try {
    rows = await stripeStorage.listProductsWithPrices();
  } catch {
    // Fall through to the Stripe API below.
  }

  if (!rows || rows.length === 0) {
    const stripe = await getUncachableStripeClient();

    // Paginate fully so the fallback returns the whole catalog, not just the
    // first 100. (Still treated as non-authoritative for pruning.)
    const stripeProducts: any[] = [];
    let startingAfter: string | undefined;
    do {
      const page = await stripe.products.list({
        active: true,
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      stripeProducts.push(...page.data);
      startingAfter = page.has_more ? page.data[page.data.length - 1]?.id : undefined;
    } while (startingAfter);

    const products: StorefrontProduct[] = [];
    for (const product of stripeProducts) {
      const prices = await stripe.prices.list({ product: product.id, active: true, limit: 1 });
      const price = prices.data[0];
      const metadata = (product.metadata || {}) as any;
      if (metadata.hidden === 'true') continue;

      products.push({
        id: product.id,
        title: product.name,
        description: product.description || '',
        category: metadata.category || 'General',
        imageUrl: metadata.imageUrl || (product.images?.[0] || ''),
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
        apparelSizes: apparelSizesFor(metadata, product.name).join(', ') || null,
        scents: scentsFor(metadata).join(', ') || null,
        price: price ? (price.unit_amount! / 100).toFixed(2) : '0.00',
        priceId: price?.id || null,
      });
    }

    return { products: dedupeByName(products), source: "stripe-fallback" };
  }

  const productsMap = new Map<string, StorefrontProduct>();
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

    const product = productsMap.get(row.product_id)!;
    if (row.price_id && !product.priceId) {
      product.price = (row.unit_amount as any) ? ((row.unit_amount as number) / 100).toFixed(2) : '0.00';
      product.priceId = row.price_id;
    }
  }

  return { products: dedupeByName(Array.from(productsMap.values())), source: "db" };
}

// Builds the full, deduped list of products the storefront sells. Single source
// of truth shared by the `/api/products` route and the Square mirror.
export async function getStorefrontProducts(): Promise<StorefrontProduct[]> {
  return (await getStorefrontProductsDetailed()).products;
}
