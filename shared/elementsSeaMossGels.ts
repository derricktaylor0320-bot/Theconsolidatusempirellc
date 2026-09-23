/** Khomplete Khemistri Elements — holistic sea moss gel line (16 oz jars). */

export const SEA_MOSS_GEL_PRICE_CENTS = 4500;

export const SEA_MOSS_GEL_IMAGE = "/assets/kk_elements_sea_moss_gel.jpg";

export const SEA_MOSS_GEL_HOLISTIC_NOTE =
  "Each Khomplete Khemistri Elements sea moss gel is a holistic wellness blend — crafted with intention to serve a deeper purpose in supporting your health, not merely as a supplement but as nourishment for body, mind, and vitality.";

export interface SeaMossGelSku {
  id: string;
  productId: string;
  priceId: string;
  name: string;
  /** Primary wellness benefit shown on the storefront. */
  benefit: string;
  sortOrder: string;
}

export const SEA_MOSS_GELS: readonly SeaMossGelSku[] = [
  {
    id: "original",
    productId: "prod_kkelemsseamossgeloriginal",
    priceId: "price_kkelemsseamossgeloriginal",
    name: "Original Sea Moss Gel",
    benefit:
      "Handcrafted in a traditional herbal apothecary for healthy energy levels and mineral support.",
    sortOrder: "117",
  },
  {
    id: "healthy-heart",
    productId: "prod_kkelemsseamossgelheart",
    priceId: "price_kkelemsseamossgelheart",
    name: "Healthy Heart Sea Moss Gel",
    benefit: "Supports heart health, circulation, and energy.",
    sortOrder: "118",
  },
  {
    id: "cell-defender",
    productId: "prod_kkelemsseamossgelcell",
    priceId: "price_kkelemsseamossgelcell",
    name: "Cell Defender Sea Moss Gel",
    benefit: "Promotes cellular wellness and long-term vitality.",
    sortOrder: "119",
  },
  {
    id: "iron-goddess",
    productId: "prod_kkelemsseamossgeliron",
    priceId: "price_kkelemsseamossgeliron",
    name: "Iron Goddess Sea Moss Gel",
    benefit: "Non-heme iron supplement for body support.",
    sortOrder: "120",
  },
  {
    id: "immune-booster",
    productId: "prod_kkelemsseamossgelimmune",
    priceId: "price_kkelemsseamossgelimmune",
    name: "Immune Booster Sea Moss Gel",
    benefit: "Improves respiratory function and helps clear mucus.",
    sortOrder: "121",
  },
  {
    id: "fulton-gregory-detox",
    productId: "prod_kkelemsseamossgeldetox",
    priceId: "price_kkelemsseamossgeldetox",
    name: "Fulton Gregory Detox Sea Moss Gel",
    benefit:
      "Aids in cleansing, clarity, and revitalizing during fasting and detoxing.",
    sortOrder: "122",
  },
  {
    id: "peaceful-moon-cycle",
    productId: "prod_kkelemsseamossgelmoon",
    priceId: "price_kkelemsseamossgelmoon",
    name: "Peaceful Moon Cycle Women's Sea Moss Gel",
    benefit:
      "Supports women's hormonal balance, mood wellness, and menstrual comfort.",
    sortOrder: "123",
  },
] as const;

/** Legacy Amazon flavor-picker SKU — retired in favor of the holistic line. */
export const LEGACY_SEA_MOSS_GEL_NAME = "Sea Moss Gel";

export function seaMossGelDescription(gel: SeaMossGelSku): string {
  if (gel.id === "original") {
    return `Khomplete Khemistri Elements ${gel.name} — a 16 oz wildcrafted Irish sea moss gel, ${gel.benefit.charAt(0).toLowerCase()}${gel.benefit.slice(1)} Stir into smoothies, tea, or recipes for everyday mineral-rich nourishment.`;
  }
  return `Khomplete Khemistri Elements ${gel.name} — a holistic 16 oz wildcrafted Irish sea moss gel crafted with intention to support your health on a deeper level. ${gel.benefit} ${SEA_MOSS_GEL_HOLISTIC_NOTE} Add to smoothies, tea, or recipes as part of your daily wellness ritual.`;
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
