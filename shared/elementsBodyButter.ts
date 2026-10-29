export type BodyButterScentCategory =
  | "The Initial 3"
  | "Men's & Unisex"
  | "Sweet, Gourmand & Provocative";

/** Storefront product line name (4 oz triple-whipped body butter jars). */
export const BODY_BUTTER_LINE_NAME = "3-in-1 Triple Butter Base Formula";

/** Scent picker heading on the product page. */
export const BODY_BUTTER_SCENT_SECTION_NAME = "Our Exotic Body Butter Scents";

export const BODY_BUTTER_TRIPLE_FORMULA_BLURB =
  "Premium all-natural 3-in-1 triple butter base — cocoa butter, shea butter, and mango butter — with a touch of vitamin E oil and sweet almond oil for a healthy glow.";

/** Legacy catalog names kept for order history and DB migration matching. */
export const BODY_BUTTER_LEGACY_NAME = "Whipped Body Butters";
export const BODY_BUTTER_LEGACY_LINE_NAME = "Our Exotic Body Butter Scents";

export const BODY_BUTTER_SCENT_CATEGORY_ORDER: readonly BodyButterScentCategory[] = [
  "The Initial 3",
  "Men's & Unisex",
  "Sweet, Gourmand & Provocative",
];

export interface BodyButterScent {
  name: string;
  notes: string;
  category: BodyButterScentCategory;
}

/** Canonical whipped body butter scent lineup (18 scents). */
export const BODY_BUTTER_SCENTS: readonly BodyButterScent[] = [
  {
    name: "Forbidden Taste",
    notes: "Rich Plum, Dark Berry & Vanilla Bourbon",
    category: "The Initial 3",
  },
  {
    name: "Too Tempting",
    notes: "Strawberry, Cream & Warm Cocoa",
    category: "The Initial 3",
  },
  {
    name: "Pure Havoc",
    notes: "Peppered Cedar, Mahogany & Amber",
    category: "The Initial 3",
  },
  {
    name: "Midnight Habit",
    notes: "Cashmere, Black Amber & Teakwood",
    category: "Men's & Unisex",
  },
  {
    name: "Sinfull Seduction",
    notes: "Black Cherry, Vanilla Bean & Sandalwood",
    category: "Men's & Unisex",
  },
  {
    name: "Dark Chemistry",
    notes: "Oakmoss, Leather & Sweet Grape",
    category: "Men's & Unisex",
  },
  {
    name: "Uncensored",
    notes: "Wild Jasmine, Bergamot & White Musk",
    category: "Men's & Unisex",
  },
  {
    name: "Wicked Touch",
    notes: "Smoked Bourbon, Tonka & Vanilla",
    category: "Men's & Unisex",
  },
  {
    name: "Raw Attraction",
    notes: "Sandalwood, Cardamom & Warm Amber",
    category: "Men's & Unisex",
  },
  {
    name: "After Dark",
    notes: "Eucalyptus, Lavender & Driftwood",
    category: "Men's & Unisex",
  },
  {
    name: "Lethal Charm",
    notes: "Blood Orange, Fig & Dark Chocolate",
    category: "Sweet, Gourmand & Provocative",
  },
  {
    name: "Sweet Addiction",
    notes: "Salted Caramel, Vanilla & Roasted Almond",
    category: "Sweet, Gourmand & Provocative",
  },
  {
    name: "Velvet Desire",
    notes: "Cashmere, Jasmine & Pink Pepper",
    category: "Sweet, Gourmand & Provocative",
  },
  {
    name: "Guilty Pleasure",
    notes: "Brown Sugar, Pecan & Warm Milk",
    category: "Sweet, Gourmand & Provocative",
  },
  {
    name: "Dangerous Craving",
    notes: "Juicy Peach, Honey & Cream",
    category: "Sweet, Gourmand & Provocative",
  },
  {
    name: "Delicious Lava",
    notes: "Spiced Cinnamon, Hot Cocoa & Warm Vanilla",
    category: "Sweet, Gourmand & Provocative",
  },
  {
    name: "Delicious Vulva",
    notes: "Sweet Strawberry, Whipped Cream & Exotic Jasmine",
    category: "Sweet, Gourmand & Provocative",
  },
  {
    name: "PHATT",
    notes: "Warm Amber, Spiced Vanilla & Soft Musk — Pretty Hot And Tempting To Touch",
    category: "Sweet, Gourmand & Provocative",
  },
] as const;

export const BODY_BUTTER_SCENT_NAMES = BODY_BUTTER_SCENTS.map((scent) => scent.name);

/** Comma-separated list for Stripe `scentOptions` metadata. */
export const BODY_BUTTER_SCENT_OPTIONS = BODY_BUTTER_SCENT_NAMES.join(", ");

export function bodyButterScentNotes(name: string): string | undefined {
  return BODY_BUTTER_SCENTS.find((scent) => scent.name === name)?.notes;
}

/** Group the full scent lineup by category for storefront display. */
export function bodyButterScentsByCategory(): Readonly<
  Record<BodyButterScentCategory, readonly BodyButterScent[]>
> {
  const grouped = Object.fromEntries(
    BODY_BUTTER_SCENT_CATEGORY_ORDER.map((category) => [category, [] as BodyButterScent[]]),
  ) as Record<BodyButterScentCategory, BodyButterScent[]>;

  for (const scent of BODY_BUTTER_SCENTS) {
    grouped[scent.category].push(scent);
  }

  return grouped;
}

/** Category heading for the scent guide; the first trio has no separate label. */
export function bodyButterScentCategoryLabel(
  category: BodyButterScentCategory,
): string | null {
  if (category === "The Initial 3") return null;
  return category;
}

export function isBodyButterProductTitle(title?: string | null): boolean {
  if (!title) return false;
  const normalized = title.trim().toLowerCase();
  return (
    normalized === BODY_BUTTER_LINE_NAME.toLowerCase() ||
    normalized === BODY_BUTTER_LEGACY_NAME.toLowerCase() ||
    normalized === BODY_BUTTER_LEGACY_LINE_NAME.toLowerCase() ||
    /(?:our exotic|whipped|triple butter base)/i.test(title)
  );
}

/** Single triple-whipped body butter jar (4 oz). */
export const BODY_BUTTER_UNIT_PRICE_CENTS = 2000;

export const BODY_BUTTER_PRICE_ID = "price_kkbodybutter";

export function isElementsBodyButterProduct(
  priceId?: string | null,
  title?: string | null,
): boolean {
  if (priceId === BODY_BUTTER_PRICE_ID) return true;
  return isBodyButterProductTitle(title);
}

/** Total in cents: $20 per jar. */
export function bodyButterTotalCents(quantity: unknown): number {
  const qty = Math.max(1, Math.min(99, Math.round(Number(quantity) || 1)));
  return qty * BODY_BUTTER_UNIT_PRICE_CENTS;
}

export function bodyButterTotalDollars(quantity: unknown): number {
  return bodyButterTotalCents(quantity) / 100;
}

export function bodyButterUnitPriceDollars(): number {
  return BODY_BUTTER_UNIT_PRICE_CENTS / 100;
}

export function bodyButterPricingLabel(): string {
  return "$20 each";
}
