/** Khomplete Khemistri Apparel Air Spectrum mesh sneaker SKU. */
export const AIR_SPECTRUM_PRODUCT_ID = "prod_kkairspectrum";
export const AIR_SPECTRUM_PRICE_ID = "price_kkairspectrum";
export const AIR_SPECTRUM_NAME = "Khomplete Khemistri Apparel Air Spectrum";

export function isAirSpectrumProduct(
  priceId?: string | null,
  title?: string | null,
): boolean {
  if (priceId === AIR_SPECTRUM_PRICE_ID) return true;
  if (!title) return false;
  return title.trim().toLowerCase().includes("air spectrum");
}
