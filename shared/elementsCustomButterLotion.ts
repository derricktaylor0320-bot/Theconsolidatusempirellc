/**
 * Khomplete Khemistri Custom Butter Lotion Line — confidence-in-a-jar scents
 * in 4 oz jars. Separate from everyday Scented Butter Lotion; stays at $12.
 */

export const CUSTOM_BUTTER_LOTION_LINE_NAME = "Custom Butter Lotion";

export const CUSTOM_BUTTER_LOTION_UNIT_PRICE_CENTS = 1200;

export const CUSTOM_BUTTER_LOTION_IMAGE =
  "/assets/kk_custom_butter_lotion_line.jpg";

export const CUSTOM_BUTTER_LOTION_TAGLINE = "Confidence in a Jar";

export const CUSTOM_BUTTER_LOTION_BLURB =
  "Scents that speak confidence that lasts. A butter for every vibe — more than a scent, it's a mood, it's a lifestyle.";

export interface CustomButterLotionScent {
  name: string;
  notes: string;
  keywords: string;
}

/** Eight custom scent variants (4 oz jars). */
export const CUSTOM_BUTTER_LOTION_SCENTS: readonly CustomButterLotionScent[] = [
  {
    name: "Delicious Vulva",
    notes: "Sweet Fruit Candy & Fruit Carnival",
    keywords: "Playful · Sweet · Irresistible",
  },
  {
    name: "Velvet Desire",
    notes: "Vanilla Musk & White Musk",
    keywords: "Sultry · Elegant · Timeless",
  },
  {
    name: "Sinful Seduction",
    notes: "Coconut, Vanilla & Passion Fruit",
    keywords: "Passionate · Bold · Alluring",
  },
  {
    name: "Sovereign Wood",
    notes: "Sandalwood Sanctuary & Old Wood Warmth",
    keywords: "Strong · Refined · Command",
  },
  {
    name: "Dark Chemistry",
    notes: "Coffee & Sweet Tobacco",
    keywords: "Mysterious · Addictive · Bold",
  },
  {
    name: "Next Morning",
    notes: "Forest Pine, Orange Blossom & Amber",
    keywords: "Fresh · Clean · Revive",
  },
  {
    name: "Khomplete Khemistri",
    notes: "Cucumber Melon & Watermelon",
    keywords: "Clean · Crisp · Uplifting",
  },
  {
    name: "Pure Havoc",
    notes: "Cherry & Watermelon Notes",
    keywords: "Bold · Juicy · Exciting",
  },
] as const;

export const CUSTOM_BUTTER_LOTION_SCENT_NAMES = CUSTOM_BUTTER_LOTION_SCENTS.map(
  (scent) => scent.name,
);

export type CustomButterLotionScentName =
  (typeof CUSTOM_BUTTER_LOTION_SCENT_NAMES)[number];

export const CUSTOM_BUTTER_LOTION_SCENT_OPTIONS =
  CUSTOM_BUTTER_LOTION_SCENT_NAMES.join(", ");

export const CUSTOM_BUTTER_LOTION_PRODUCT_ID = "prod_kkcustombutterlotion";
export const CUSTOM_BUTTER_LOTION_PRICE_ID = "price_kkcustombutterlotion";

export function customButterLotionUnitPriceDollars(): number {
  return CUSTOM_BUTTER_LOTION_UNIT_PRICE_CENTS / 100;
}

export function customButterLotionPricingLabel(): string {
  return `$${customButterLotionUnitPriceDollars().toFixed(0)} each`;
}

export function customButterLotionScentNotes(name: string): string | undefined {
  return CUSTOM_BUTTER_LOTION_SCENTS.find((scent) => scent.name === name)?.notes;
}

export function customButterLotionScentKeywords(
  name: string,
): string | undefined {
  return CUSTOM_BUTTER_LOTION_SCENTS.find((scent) => scent.name === name)
    ?.keywords;
}

export function isCustomButterLotionScent(
  value: unknown,
): value is CustomButterLotionScentName {
  return (
    typeof value === "string" &&
    (CUSTOM_BUTTER_LOTION_SCENT_NAMES as readonly string[]).includes(value)
  );
}

export function isElementsCustomButterLotionProduct(
  priceId?: string | null,
  title?: string | null,
): boolean {
  if (priceId === CUSTOM_BUTTER_LOTION_PRICE_ID) return true;
  if (!title) return false;
  return /^\s*custom butter lotion\s*$/i.test(title.trim());
}
