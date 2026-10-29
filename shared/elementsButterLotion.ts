/**
 * Scented butter lotion — lighter daily moisturizer alongside triple-whipped body butter.
 * Scents match our 3-in-1 body washes (excluding Men's Energizing Scent).
 */

export const BUTTER_LOTION_LINE_NAME = "Scented Butter Lotion";

export const BUTTER_LOTION_UNIT_PRICE_CENTS = 1200;

/** Matches Cocoa Mango, Island Tranquility, and Avocado Oil 3-in-1 washes. */
export const BUTTER_LOTION_WASH_MATCHED_SCENTS = [
  "Cocoa Mango",
  "Island Tranquility",
  "100% Avocado Oil",
] as const;

export const BUTTER_LOTION_SCENT_NAMES = [...BUTTER_LOTION_WASH_MATCHED_SCENTS] as const;

export type ButterLotionScent = (typeof BUTTER_LOTION_SCENT_NAMES)[number];

/** Comma-separated list for Stripe `scentOptions` metadata. */
export const BUTTER_LOTION_SCENT_OPTIONS = BUTTER_LOTION_SCENT_NAMES.join(", ");

export const BUTTER_LOTION_PRICE_ID = "price_kkbutterlotion";
export const BUTTER_LOTION_PRODUCT_ID = "prod_kkbutterlotion";

export function butterLotionUnitPriceDollars(): number {
  return BUTTER_LOTION_UNIT_PRICE_CENTS / 100;
}

export function butterLotionPricingLabel(): string {
  return `$${butterLotionUnitPriceDollars().toFixed(0)} each`;
}

export function isButterLotionScent(value: unknown): value is ButterLotionScent {
  return (
    typeof value === "string" &&
    (BUTTER_LOTION_SCENT_NAMES as readonly string[]).includes(value)
  );
}

/** Suggested lotion scent when a matching 3-in-1 wash is chosen in a bundle. */
export function butterLotionScentForWash(wash: string): string | undefined {
  const normalized = wash.trim();
  if (normalized === "Cocoa Mango") return "Cocoa Mango";
  if (normalized === "Island Tranquility") return "Island Tranquility";
  if (normalized === "Avocado Oil") return "100% Avocado Oil";
  return undefined;
}

export function isElementsButterLotionProduct(
  priceId?: string | null,
  title?: string | null,
): boolean {
  if (priceId === BUTTER_LOTION_PRICE_ID) return true;
  if (!title) return false;
  return /scented butter lotion/i.test(title.trim());
}
