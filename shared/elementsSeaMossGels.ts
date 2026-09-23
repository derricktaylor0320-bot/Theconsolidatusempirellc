/** Khomplete Khemistri Elements — holistic sea moss gel line (16 oz jars). */

export const SEA_MOSS_GEL_PRICE_CENTS = 4500;

/** Fallback jar image for blends without a dedicated product photo yet. */
export const SEA_MOSS_GEL_IMAGE = "/assets/kk_elements_sea_moss_gel.jpg";

export const SEA_MOSS_GEL_HERITAGE_TAGLINE =
  "Heritage Meets Science In Every Jar";

export const SEA_MOSS_GEL_CRAFT_NOTE =
  "Wildcrafted | Organic | No Preservatives | Small-Batch Crafted";

export const SEA_MOSS_GEL_HOLISTIC_NOTE =
  "Each Khomplete Khemistri Elements sea moss gel is a holistic wellness blend — crafted with intention to serve a deeper purpose in supporting your health, not merely as a supplement but as nourishment for body, mind, and vitality.";

export interface SeaMossGelSku {
  id: string;
  productId: string;
  priceId: string;
  name: string;
  /** Short benefit line for catalog cards. */
  benefit: string;
  /** Full apothecary tagline from the jar label. */
  tagline: string;
  imageUrl: string;
  sortOrder: string;
}

export const SEA_MOSS_GEL_IMAGES = {
  original: "/attached_assets/sea-moss-gels/original.jpg",
  healthyHeart: "/attached_assets/sea-moss-gels/healthy-heart.jpg",
  cellDefender: "/attached_assets/sea-moss-gels/cell-defender.jpg",
  ironGoddess: "/attached_assets/sea-moss-gels/iron-goddess.jpg",
  immuneBooster: "/attached_assets/sea-moss-gels/immune-booster.jpg",
  fultonGregoryDetox: "/attached_assets/sea-moss-gels/fulton-gregory-detox.jpg",
  peacefulMoon: "/attached_assets/sea-moss-gels/peaceful-moon-womens.jpg",
} as const;

export const SEA_MOSS_GELS: readonly SeaMossGelSku[] = [
  {
    id: "original",
    productId: "prod_kkelemsseamossgeloriginal",
    priceId: "price_kkelemsseamossgeloriginal",
    name: "Original Sea Moss Gel",
    benefit: "Healthy energy levels and mineral support.",
    tagline:
      "Delicious Superfood Formula Handcrafted in a Traditional Herbal Apothecary for Healthy Energy Levels & Mineral Support",
    imageUrl: SEA_MOSS_GEL_IMAGES.original,
    sortOrder: "117",
  },
  {
    id: "healthy-heart",
    productId: "prod_kkelemsseamossgelheart",
    priceId: "price_kkelemsseamossgelheart",
    name: "Healthy Heart Sea Moss Gel",
    benefit: "Supports heart health, circulation, and energy.",
    tagline:
      "Delicious Superfood Formula Handcrafted In a Traditional Herbal Apothecary for Improved Heart Health",
    imageUrl: SEA_MOSS_GEL_IMAGES.healthyHeart,
    sortOrder: "118",
  },
  {
    id: "cell-defender",
    productId: "prod_kkelemsseamossgelcell",
    priceId: "price_kkelemsseamossgelcell",
    name: "Cell Defender Sea Moss Gel",
    benefit: "Promotes cellular wellness and long-term vitality.",
    tagline:
      "Delicious Superfood Formula Handcrafted in a Traditional Herbal Apothecary for Whole-Body Defense, Cellular Wellness & Long-Term Vitality",
    imageUrl: SEA_MOSS_GEL_IMAGES.cellDefender,
    sortOrder: "119",
  },
  {
    id: "iron-goddess",
    productId: "prod_kkelemsseamossgeliron",
    priceId: "price_kkelemsseamossgeliron",
    name: "Iron Goddess Sea Moss Gel",
    benefit: "Non-heme iron supplement for body support.",
    tagline:
      "Delicious Superfood Formula Handcrafted in a Traditional Herbal Apothecary for Non-Heme Iron Support & Whole-Body Mineral Nourishment",
    imageUrl: SEA_MOSS_GEL_IMAGES.ironGoddess,
    sortOrder: "120",
  },
  {
    id: "immune-booster",
    productId: "prod_kkelemsseamossgelimmune",
    priceId: "price_kkelemsseamossgelimmune",
    name: "Immune Booster Sea Moss Gel",
    benefit: "Improves respiratory function and helps clear mucus.",
    tagline:
      "Delicious Superfood Formula Handcrafted In a Traditional Herbal Apothecary for Improved Immune Defense & Allergy Support",
    imageUrl: SEA_MOSS_GEL_IMAGES.immuneBooster,
    sortOrder: "121",
  },
  {
    id: "fulton-gregory-detox",
    productId: "prod_kkelemsseamossgeldetox",
    priceId: "price_kkelemsseamossgeldetox",
    name: "Fulton Gregory Detox Sea Moss Gel",
    benefit: "Aids in cleansing, clarity, and revitalizing during fasting and detoxing.",
    tagline:
      "Delicious Superfood Formula Handcrafted in a Traditional Herbal Apothecary for Cleansing, Clarity & Revitalization During Fasting and Detoxing",
    imageUrl: SEA_MOSS_GEL_IMAGES.fultonGregoryDetox,
    sortOrder: "122",
  },
  {
    id: "peaceful-moon-cycle",
    productId: "prod_kkelemsseamossgelmoon",
    priceId: "price_kkelemsseamossgelmoon",
    name: "Peaceful Moon Cycle Women's Sea Moss Gel",
    benefit: "Supports women's hormonal balance, mood wellness, and menstrual comfort.",
    tagline:
      "Delicious Superfood Formula Handcrafted in a Traditional Herbal Apothecary for Hormone Harmony, Womb Wellness & Menstrual Comfort",
    imageUrl: SEA_MOSS_GEL_IMAGES.peacefulMoon,
    sortOrder: "123",
  },
] as const;

/** Legacy Amazon flavor-picker SKU — retired in favor of the holistic line. */
export const LEGACY_SEA_MOSS_GEL_NAME = "Sea Moss Gel";
export const LEGACY_SEA_MOSS_GEL_PRODUCT_ID = "prod_kkelemsseamossgel";
export const LEGACY_SEA_MOSS_GEL_PRICE_ID = "price_kkelemsseamossgel";

export function seaMossGelDescription(gel: SeaMossGelSku): string {
  return `Khomplete Khemistri Elements ${gel.name} — a 16 oz wildcrafted Irish sea moss gel. ${gel.benefit} ${SEA_MOSS_GEL_HERITAGE_TAGLINE}. ${SEA_MOSS_GEL_CRAFT_NOTE}. Add to smoothies, tea, or recipes as part of your daily wellness ritual.`;
}

export function isSeaMossGelProduct(
  priceId?: string | null,
  title?: string | null,
): boolean {
  if (priceId && SEA_MOSS_GELS.some((g) => g.priceId === priceId)) return true;
  if (title && SEA_MOSS_GELS.some((g) => g.name === title)) return true;
  return false;
}

export function seaMossGelByPriceId(
  priceId?: string | null,
): SeaMossGelSku | undefined {
  if (!priceId) return undefined;
  return SEA_MOSS_GELS.find((g) => g.priceId === priceId);
}

export function seaMossGelByTitle(
  title?: string | null,
): SeaMossGelSku | undefined {
  if (!title) return undefined;
  return SEA_MOSS_GELS.find((g) => g.name === title);
}
