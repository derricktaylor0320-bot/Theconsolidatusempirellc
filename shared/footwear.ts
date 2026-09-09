/** Customizable footwear — sizes, disclaimers, and product identifiers. */

export const FOOTWEAR_CUSTOMIZABLE_META = "true";

/** Men's US sizes 4–14 (whole sizes). */
export const MENS_FOOTWEAR_SIZES = [
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
] as const;

/** Women's US sizes 5.5–15.5 (half sizes). */
export const WOMENS_FOOTWEAR_SIZES = [
  "5.5",
  "6",
  "6.5",
  "7",
  "7.5",
  "8",
  "8.5",
  "9",
  "9.5",
  "10",
  "10.5",
  "11",
  "11.5",
  "12",
  "12.5",
  "13",
  "13.5",
  "14",
  "14.5",
  "15",
  "15.5",
] as const;

export type FootwearGender = "Men" | "Women";

export const FOOTWEAR_GENDERS: FootwearGender[] = ["Men", "Women"];

export function footwearSizesForGender(gender: FootwearGender): readonly string[] {
  return gender === "Men" ? MENS_FOOTWEAR_SIZES : WOMENS_FOOTWEAR_SIZES;
}

/** Encoded size sent to checkout, e.g. "Men's 10" or "Women's 8.5". */
export function encodeFootwearSize(gender: FootwearGender, size: string): string {
  return `${gender}'s ${size}`;
}

export function parseFootwearSize(
  encoded: string,
): { gender: FootwearGender; size: string } | null {
  const trimmed = encoded.trim();
  for (const gender of FOOTWEAR_GENDERS) {
    const prefix = `${gender}'s `;
    if (trimmed.startsWith(prefix)) {
      const size = trimmed.slice(prefix.length).trim();
      if (footwearSizesForGender(gender).includes(size)) {
        return { gender, size };
      }
    }
  }
  return null;
}

export function isFootwearCustomizable(metadata: unknown): boolean {
  const m = metadata as Record<string, unknown> | null | undefined;
  if (!m) return false;
  if (String(m.footwearCustomizable || "").toLowerCase() === FOOTWEAR_CUSTOMIZABLE_META) {
    return true;
  }
  return String(m.category || "").toLowerCase() === "footwear";
}

export const FOOTWEAR_CUSTOMIZATION_DISCLAIMER =
  "All shoes and sneakers are fully customizable. You may upload your own logo or design to inspire your pair — however, you must still select one of our Khomplete Khemistri brand logos below to complete your order.";

export const FOOTWEAR_LEAD_TIME_NOTE =
  "Custom footwear is made to order. Please allow 7–14 days for customization after your order is completed before your pair ships.";

// ——— Product identifiers ———

export const AIR_NITROGEN_PRODUCT_ID = "prod_kkairnitrogen";
export const AIR_NITROGEN_PRICE_ID = "price_kkairnitrogen";
export const AIR_NITROGEN_NAME = "Khomplete Khemistri Apparel Air Nitrogen";

export const CREST_1_LOW_PRODUCT_ID = "prod_kkcrest1low";
export const CREST_1_LOW_PRICE_ID = "price_kkcrest1low";
export const CREST_1_LOW_NAME = "K. K. A. Signature Crest-1 Low";

export const CREST_2_HIGH_PRODUCT_ID = "prod_kkcrest2high";
export const CREST_2_HIGH_PRICE_ID = "price_kkcrest2high";
export const CREST_2_HIGH_NAME = "Signature Crest - 2 High";

export const MONARCH_VANGUARD_PRODUCT_ID = "prod_kkmonarchvanguard";
export const MONARCH_VANGUARD_PRICE_ID = "price_kkmonarchvanguard";
export const MONARCH_VANGUARD_NAME = "KKA Monarch Vanguard";
export const MONARCH_VANGUARD_PRICE_CENTS = 8500;

export const SOVEREIGN_RUNNER_PRODUCT_ID = "prod_kksovereignrunner";
export const SOVEREIGN_RUNNER_PRICE_ID = "price_kksovereignrunner";
export const SOVEREIGN_RUNNER_NAME = "KKA Sovereign Runner";
export const SOVEREIGN_RUNNER_PRICE_CENTS = 7500;

export const CLASSIC_LEATHER_FOUNDATION_PRODUCT_ID = "prod_kkclassicleatherfoundation";
export const CLASSIC_LEATHER_FOUNDATION_PRICE_ID = "price_kkclassicleatherfoundation";
export const CLASSIC_LEATHER_FOUNDATION_NAME = "KKA Classic Leather Foundation";
export const CLASSIC_LEATHER_FOUNDATION_PRICE_CENTS = 5599;

export const TUNDRA_CHUKKA_PRODUCT_ID = "prod_kktundrachukka";
export const TUNDRA_CHUKKA_PRICE_ID = "price_kktundrachukka";
export const TUNDRA_CHUKKA_NAME = "KKA Tundra Chukka";
export const TUNDRA_CHUKKA_PRICE_CENTS = 7500;

export const TUNDRA_FUR_CHUKKA_PRODUCT_ID = "prod_kktundrafurchukka";
export const TUNDRA_FUR_CHUKKA_PRICE_ID = "price_kktundrafurchukka";
export const TUNDRA_FUR_CHUKKA_NAME = "KKA Tundra Fur Chukka Boot";
export const TUNDRA_FUR_CHUKKA_PRICE_CENTS = 7500;

export const CANVAS_ESSENTIAL_LOWS_PRODUCT_ID = "prod_kkcanvasessentiallows";
export const CANVAS_ESSENTIAL_LOWS_PRICE_ID = "price_kkcanvasessentiallows";
export const CANVAS_ESSENTIAL_LOWS_NAME = "KKA Canvas Essential Lows";
export const CANVAS_ESSENTIAL_LOWS_PRICE_CENTS = 4799;

export const CANVAS_ESSENTIAL_HIGHS_PRODUCT_ID = "prod_kkcanvasessentialhighs";
export const CANVAS_ESSENTIAL_HIGHS_PRICE_ID = "price_kkcanvasessentialhighs";
export const CANVAS_ESSENTIAL_HIGHS_NAME = "KKA Canvas Essential Highs";
export const CANVAS_ESSENTIAL_HIGHS_PRICE_CENTS = 4799;

export const CLASSIC_WHITE_HIGH_TOPS_PRODUCT_ID = "prod_kkclassicwhitehightops";
export const CLASSIC_WHITE_HIGH_TOPS_PRICE_ID = "price_kkclassicwhitehightops";
export const CLASSIC_WHITE_HIGH_TOPS_NAME = "Classic White High-Tops";
export const CLASSIC_WHITE_HIGH_TOPS_PRICE_CENTS = 7500;

export const BLACK_GOLD_HIGH_TOPS_PRODUCT_ID = "prod_kkblackgoldhightops";
export const BLACK_GOLD_HIGH_TOPS_PRICE_ID = "price_kkblackgoldhightops";
export const BLACK_GOLD_HIGH_TOPS_NAME = "Black & Gold High-Tops";
export const BLACK_GOLD_HIGH_TOPS_PRICE_CENTS = 7500;

export const FOOTWEAR_PRICE_CENTS = 7500;

export function isAirNitrogenProduct(
  priceId?: string | null,
  title?: string | null,
): boolean {
  if (priceId === AIR_NITROGEN_PRICE_ID) return true;
  if (!title) return false;
  return title.trim().toLowerCase().includes("air nitrogen");
}

export function isCrest1LowProduct(
  priceId?: string | null,
  title?: string | null,
): boolean {
  if (priceId === CREST_1_LOW_PRICE_ID) return true;
  if (!title) return false;
  return /crest[\s-]*1.*low/i.test(title);
}

export function isCrest2HighProduct(
  priceId?: string | null,
  title?: string | null,
): boolean {
  if (priceId === CREST_2_HIGH_PRICE_ID) return true;
  if (!title) return false;
  return /crest[\s-]*2.*high/i.test(title);
}

export function isMonarchVanguardProduct(
  priceId?: string | null,
  title?: string | null,
): boolean {
  if (priceId === MONARCH_VANGUARD_PRICE_ID) return true;
  if (!title) return false;
  return /monarch\s*vanguard/i.test(title);
}

export function isSovereignRunnerProduct(
  priceId?: string | null,
  title?: string | null,
): boolean {
  if (priceId === SOVEREIGN_RUNNER_PRICE_ID) return true;
  if (!title) return false;
  return /sovereign\s*runner/i.test(title);
}
