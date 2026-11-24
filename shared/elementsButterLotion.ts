/**
 * Scented butter lotion — lighter daily moisturizer alongside triple-whipped body butter.
 * Wash-matched scents pair with our 3-in-1 body washes; the full collection adds
 * everyday scent profiles in 4 oz jars.
 */

export const BUTTER_LOTION_LINE_NAME = "Scented Butter Lotion";

/** Everyday butter lotion jar (4 oz) — reduced from $12 to $10. */
export const BUTTER_LOTION_UNIT_PRICE_CENTS = 1000;

export const BUTTER_LOTION_IMAGE =
  "/assets/kk_butter_lotion_scent_collection.jpg";
export const BUTTER_LOTION_MATCHING_SETS_IMAGE =
  "/assets/kk_3in1_wash_lotion_matching_sets.jpg";

export interface ButterLotionScentInfo {
  name: string;
  /** Fragrance notes shown under the scent name. */
  notes: string;
  /** Optional jar tagline (Refresh · Hydrate · Escape). */
  tagline?: string;
  /** True when this scent pairs with a 3-in-1 wash. */
  washMatched?: boolean;
}

/**
 * Wash-matched butter lotion scents (pairs with 3-in-1 body wash, shampoo & conditioner).
 * Men's Energizing is included so all four wash bottles have a matching lotion.
 */
export const BUTTER_LOTION_WASH_MATCHED_SCENTS = [
  "Cocoa Mango",
  "Island Tranquility",
  "100% Avocado Oil",
  "Men's Energizing Scent",
] as const;

/** Full butter lotion scent lineup (wash-matched + everyday collection). */
export const BUTTER_LOTION_SCENTS: readonly ButterLotionScentInfo[] = [
  {
    name: "Island Tranquility",
    notes: "Grapefruit & Lemongrass",
    tagline: "Refresh · Hydrate · Escape",
    washMatched: true,
  },
  {
    name: "Cocoa Mango",
    notes: "Coconut & Mango",
    tagline: "Soften · Smooth · Indulge",
    washMatched: true,
  },
  {
    name: "100% Avocado Oil",
    notes: "100% Avocado Oil",
    tagline: "Nourish · Soften · Glow",
    washMatched: true,
  },
  {
    name: "Men's Energizing Scent",
    notes: "Energizing Men's fragrance",
    tagline: "Fuel · Protect · Stay Ready",
    washMatched: true,
  },
  {
    name: "Apple Pear",
    notes: "Crisp apple & ripe pear",
    tagline: "Crisp · Fresh · Uplift",
  },
  {
    name: "Vanilla Sugar Bliss",
    notes: "Vanilla orchid & sugar",
    tagline: "Sweet · Warm · Comforting",
  },
  {
    name: "Ocean Breeze",
    notes: "Clean marine air & seashell freshness",
    tagline: "Clean · Breezy · Renew",
  },
  {
    name: "Aloe Vera",
    notes: "Cooling aloe",
    tagline: "Soothe · Calm · Restore",
  },
  {
    name: "Citrus",
    notes: "Bright orange & lime",
    tagline: "Bright · Energize · Revitalize",
  },
  {
    name: "Rain Water",
    notes: "Pure water & fresh leaves",
    tagline: "Pure · Clean · Refreshing",
  },
  {
    name: "Eucalyptus Tranquility",
    notes: "Eucalyptus leaves",
    tagline: "Clarify · Breathe · Relax",
  },
  {
    name: "Lavender and Camomile",
    notes: "Lavender & chamomile",
    tagline: "Relax · Balance · Unwind",
  },
  {
    name: "Cucumber Mint Bliss",
    notes: "Cucumber & mint",
    tagline: "Cool · Hydrate · Refresh",
  },
  {
    name: "Whispering Rose",
    notes: "Soft pink rose",
    tagline: "Elegant · Soft · Timeless",
  },
] as const;

export const BUTTER_LOTION_SCENT_NAMES = BUTTER_LOTION_SCENTS.map(
  (scent) => scent.name,
);

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

export function butterLotionWasPriceDollars(): number {
  return 12;
}

export function butterLotionScentNotes(name: string): string | undefined {
  return BUTTER_LOTION_SCENTS.find((scent) => scent.name === name)?.notes;
}

export function butterLotionScentTagline(name: string): string | undefined {
  return BUTTER_LOTION_SCENTS.find((scent) => scent.name === name)?.tagline;
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
  if (normalized === "Men's Energizing Scent") return "Men's Energizing Scent";
  return undefined;
}

export function isElementsButterLotionProduct(
  priceId?: string | null,
  title?: string | null,
): boolean {
  if (priceId === BUTTER_LOTION_PRICE_ID) return true;
  if (!title) return false;
  return /^\s*scented butter lotion\s*$/i.test(title.trim());
}
