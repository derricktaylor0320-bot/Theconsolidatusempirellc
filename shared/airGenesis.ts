/** Drop 1 Air Genesis sneaker — single storefront SKU replacing the old colorways. */
export const AIR_GENESIS_PRODUCT_ID = "prod_kkairgenesis";
export const AIR_GENESIS_PRICE_ID = "price_kkairgenesis";
export const AIR_GENESIS_NAME = "Khomplete Khemistri Apparel Air Genesis";

export function isAirGenesisProduct(
  priceId?: string | null,
  title?: string | null,
): boolean {
  if (priceId === AIR_GENESIS_PRICE_ID) return true;
  if (!title) return false;
  return title.trim().toLowerCase().includes("air genesis");
}
