import { stripeStorage } from "./stripeStorage";
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
  variantGroup: string | null;
  variantLabel: string | null;
  price: string | null;
  priceId: string | null;
}

// Collapses products that share a (case-insensitive) name down to a single
// entry, preferring the one with a real price, then lowest sortOrder/price.
// The catalog can hold duplicate rows from past imports; the storefront only
// ever shows one per name, and the Square mirror must do the same.
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

// Where the product list came from. `db` is the authoritative catalog tables;
// `unavailable` means the DB read failed or returned nothing. Destructive
// reconciliation (e.g. the Square mirror pruning removed items) must ONLY trust
// `db` so a transient DB hiccup can never wipe the Square catalog.
export type StorefrontSource = "db" | "unavailable";

export interface StorefrontProductsResult {
  products: StorefrontProduct[];
  source: StorefrontSource;
}

// Builds the full, deduped list of products the storefront sells, and reports
// which source produced it. Reads from the catalog tables in the app's own
// database, hiding products flagged `hidden`. There is no Stripe account
// involved; payments run through Square.
export async function getStorefrontProductsDetailed(): Promise<StorefrontProductsResult> {
  let rows: any[] = [];
  try {
    rows = await stripeStorage.listProductsWithPrices();
  } catch (err) {
    console.error('Failed to read products from the catalog database:', err);
  }

  if (!rows || rows.length === 0) {
    return { products: [], source: "unavailable" };
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
        variantGroup: metadata.variantGroup || null,
        variantLabel: metadata.variantLabel || null,
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

  return { products: dedupeByName(Array.from(productsMap.values())), source: "db" as StorefrontSource };
}

// Builds the full, deduped list of products the storefront sells. Single source
// of truth shared by the `/api/products` route and the Square mirror.
export async function getStorefrontProducts(): Promise<StorefrontProduct[]> {
  return (await getStorefrontProductsDetailed()).products;
}
