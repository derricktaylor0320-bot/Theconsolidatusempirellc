// Store discount codes applied at checkout via "Apply Discount Code".
// Eligibility is always enforced server-side — never trust the client alone.
//
// Discount10% — one-time 10% off after a customer uploads photo(s) with a
//   product review. Encourages photo reviews; redeemed on the next purchase.
// Discount15% — ongoing 15% off once a customer has completed purchases on
//   three separate visits (three paid orders). Each checkout visit counts as
//   one purchase regardless of how many items were in the cart.

export const DISCOUNT_CODES = {
  PHOTO_REVIEW: "Discount10%",
  FREQUENT_SHOPPER: "Discount15%",
} as const;

export type DiscountCode =
  (typeof DISCOUNT_CODES)[keyof typeof DISCOUNT_CODES];

export interface DiscountDefinition {
  code: DiscountCode;
  percent: number;
  label: string;
}

export const DISCOUNT_DEFINITIONS: Record<DiscountCode, DiscountDefinition> = {
  [DISCOUNT_CODES.PHOTO_REVIEW]: {
    code: DISCOUNT_CODES.PHOTO_REVIEW,
    percent: 10,
    label: "Photo Review — 10% off",
  },
  [DISCOUNT_CODES.FREQUENT_SHOPPER]: {
    code: DISCOUNT_CODES.FREQUENT_SHOPPER,
    percent: 15,
    label: "Frequent Shopper — 15% off",
  },
};

/** Normalize a typed code (trim; preserve the DiscountNN% casing customers see). */
export function normalizeDiscountCode(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim();
}

/** Returns the definition when the string is a known code; otherwise null. */
export function parseDiscountCode(raw: unknown): DiscountDefinition | null {
  const code = normalizeDiscountCode(raw);
  if (!code) return null;
  // Case-insensitive match so "discount10%" still works.
  const match = (Object.values(DISCOUNT_DEFINITIONS) as DiscountDefinition[]).find(
    (d) => d.code.toLowerCase() === code.toLowerCase(),
  );
  return match || null;
}

/** Minimum number of completed purchase visits to unlock Discount15%. */
export const FREQUENT_SHOPPER_MIN_ORDERS = 3;
