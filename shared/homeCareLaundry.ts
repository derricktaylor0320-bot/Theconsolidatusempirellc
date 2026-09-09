/** TCE Home Care & Laundry Collection — partner + direct-checkout SKUs. */

export const LAUNDRY_SAUCE_REFERRAL_URL =
  "https://laundrysauce.com/?referral_code=NYXBJk2YFbvVnMBly";

export const LAUNDRY_DETERGENT_SHEETS_VARIANT_GROUP = "Laundry Detergent Sheets";
export const LAUNDRY_DETERGENT_SHEETS_IMAGE =
  "/assets/kk_elements_laundry_detergent_sheets.jpg";
export const LAUNDRY_DETERGENT_SHEETS_AMAZON_LINK = "https://a.co/d/0igKXrSW";
export const LAUNDRY_DETERGENT_SHEETS_SCENT_OPTIONS =
  "Fresh Scent, Fragrance Free, Lavender, Peppermint, Spring Scent, Sweet Petals";

export const ECO_LAUNDRY_SHEETS_VARIANT_GROUP = "Eco Laundry Sheets";

/** Clean People 32-load box artwork (correct count label for the starter pack). */
export const ECO_LAUNDRY_SHEETS_32_IMAGE =
  "/assets/kk_eco_laundry_sheets_32_loads.jpg";
/** Existing catalog photo showing the 96-load Clean People box. */
export const ECO_LAUNDRY_SHEETS_96_IMAGE =
  "/assets/kk_elements_laundry_detergent_sheets.jpg";
export const LAUNDRY_SAUCE_PODS_IMAGE = "/assets/kk_laundry_sauce_pods.jpg";
export const MACHINE_CLEANER_TABLETS_IMAGE =
  "/assets/kk_washing_machine_cleaner_tablets.jpg";

export const ECO_LAUNDRY_SHEETS_PACKS = [
  {
    count: 32,
    productId: "prod_kk_ecolaundrysheets",
    priceId: "price_kk_ecolaundrysheets",
    priceCents: 1800,
    imageUrl: ECO_LAUNDRY_SHEETS_32_IMAGE,
  },
  {
    count: 64,
    productId: "prod_kk_ecolaundrysheets64",
    priceId: "price_kk_ecolaundrysheets64",
    priceCents: 3200,
    imageUrl: ECO_LAUNDRY_SHEETS_32_IMAGE,
  },
  {
    count: 96,
    productId: "prod_kk_ecolaundrysheets96",
    priceId: "price_kk_ecolaundrysheets96",
    priceCents: 4500,
    imageUrl: ECO_LAUNDRY_SHEETS_96_IMAGE,
  },
] as const;

export type EcoLaundrySheetsPack = (typeof ECO_LAUNDRY_SHEETS_PACKS)[number];

export const ECO_LAUNDRY_SHEETS_PRODUCT_ID = ECO_LAUNDRY_SHEETS_PACKS[0].productId;
export const ECO_LAUNDRY_SHEETS_PRICE_ID = ECO_LAUNDRY_SHEETS_PACKS[0].priceId;
export const ECO_LAUNDRY_SHEETS_PRICE_CENTS = ECO_LAUNDRY_SHEETS_PACKS[0].priceCents;

export const LAUNDRY_DETERGENT_SHEETS_PACKS = [
  {
    count: 32,
    productId: "prod_kkelemslaundry32",
    priceId: "price_kkelemslaundry32",
    priceCents: 1800,
    costCents: 1279,
    profitMargin: "5.21",
  },
  {
    count: 96,
    productId: "prod_kkelemslaundry96",
    priceId: "price_kkelemslaundry96",
    priceCents: 5000,
    costCents: 3300,
    profitMargin: "17.00",
  },
  {
    count: 192,
    productId: "prod_kkelemslaundry192",
    priceId: "price_kkelemslaundry192",
    priceCents: 7049,
    costCents: 5549,
    profitMargin: "15.00",
  },
] as const;

export type LaundryDetergentSheetsPack = (typeof LAUNDRY_DETERGENT_SHEETS_PACKS)[number];

export const LAUNDRY_DETERGENT_SHEETS_PRODUCT_ID =
  LAUNDRY_DETERGENT_SHEETS_PACKS[0].productId;
export const LAUNDRY_DETERGENT_SHEETS_PRICE_ID =
  LAUNDRY_DETERGENT_SHEETS_PACKS[0].priceId;
export const LAUNDRY_DETERGENT_SHEETS_PRICE_CENTS =
  LAUNDRY_DETERGENT_SHEETS_PACKS[0].priceCents;

export const MACHINE_CLEANER_TABLETS_PRODUCT_ID = "prod_kk_machinecleaner";
export const MACHINE_CLEANER_TABLETS_PRICE_ID = "price_kk_machinecleaner";
export const MACHINE_CLEANER_TABLETS_PRICE_CENTS = 1999;

export const LAUNDRY_SAUCE_STARTING_PRICE_DOLLARS = 37;

export function ecoLaundrySheetsPackLabel(count: number): string {
  return `${count} Count`;
}

export function ecoLaundrySheetsDescription(count: number): string {
  return `Dissolvable, eco-conscious detergent sheets designed for standard and HE washers. Eliminates plastic heavy bottles, fights tough stains, and delivers zero waste. ${count}-count pack. Free shipping included.`;
}

export function laundryDetergentSheetsPackLabel(count: number): string {
  return `${count} Count`;
}

export function laundryDetergentSheetsName(count: number): string {
  return `${laundryDetergentSheetsPackLabel(count)} Laundry Detergent Sheets`;
}

export function laundryDetergentSheetsDescription(count: number): string {
  return `The Clean People Laundry Detergent Sheets — ultra-concentrated, plant-derived laundry soap in recyclable paper packaging. Hypoallergenic, vegan, and effective on stains and odors. Works in all washing machines including HE. ${count}-count pack. SELECT YOUR SCENT at checkout. Amazon-fulfilled. Available in 6 scents: Fresh Scent, Fragrance Free, Lavender, Peppermint, Spring Scent, and Sweet Petals.`;
}

/** Storefront image for an eco laundry sheets pack size. */
export function ecoLaundrySheetsImageUrl(count: number): string {
  if (count === 96) return ECO_LAUNDRY_SHEETS_96_IMAGE;
  return ECO_LAUNDRY_SHEETS_32_IMAGE;
}
