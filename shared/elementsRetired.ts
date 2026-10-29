/**
 * Retired Khomplete Khemistri Elements body-care SKUs that must not appear on the
 * storefront. Cocoa & Shea Butter was replaced by Avocado Oil 3-in-1 body wash;
 * any matching lotion listing is retired as well.
 */

export const COCOA_SHEA_BUTTER_LINE_NAME = "Cocoa & Shea Butter";

/** Product names deactivated in ensureCatalogData and hidden from listings. */
export const RETIRED_COCOA_SHEA_PRODUCT_NAMES = [
  COCOA_SHEA_BUTTER_LINE_NAME,
  "Cocoa & Shea Butter Lotion",
  "Cocoa and Shea Butter",
  "Cocoa and Shea Butter Lotion",
] as const;

/** Legacy Stripe / synthetic catalog ids for the retired 3-in-1 wash. */
export const RETIRED_COCOA_SHEA_PRODUCT_IDS = [
  "prod_kkelemsbodywashcocoashea",
] as const;

export const RETIRED_COCOA_SHEA_PRICE_IDS = [
  "price_kkelemsbodywashcocoashea",
] as const;

/** Scents that must never appear on butter-lotion or bundle pickers. */
export const RETIRED_COCOA_SHEA_LOTION_SCENTS = [
  COCOA_SHEA_BUTTER_LINE_NAME,
  "Cocoa and Shea Butter",
] as const;

export function isRetiredCocoaSheaStorefrontProduct(title?: string | null): boolean {
  if (!title) return false;
  const trimmed = title.trim();
  const lower = trimmed.toLowerCase();
  if (
    RETIRED_COCOA_SHEA_PRODUCT_NAMES.some((name) => name.toLowerCase() === lower)
  ) {
    return true;
  }
  return /^cocoa\s*(?:&|and)\s*shea\s*butter(\s+lotion)?$/i.test(trimmed);
}

export function filterRetiredCocoaSheaScents(scents: readonly string[]): string[] {
  const blocked = new Set(
    RETIRED_COCOA_SHEA_LOTION_SCENTS.map((s) => s.toLowerCase()),
  );
  return scents
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !blocked.has(s.toLowerCase()));
}
