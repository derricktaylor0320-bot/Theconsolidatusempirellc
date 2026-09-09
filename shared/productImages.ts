/**
 * Canonical storefront image paths for bedding and body butter, plus legacy
 * brown artwork paths retired when the catalog switched to royal blue / silver.
 */
import {
  ECO_LAUNDRY_SHEETS_32_IMAGE,
  ECO_LAUNDRY_SHEETS_96_IMAGE,
  MACHINE_CLEANER_TABLETS_IMAGE,
} from "./homeCareLaundry";
export const BEDDING_COMFORTER_IMAGE = "/assets/kk_bedding_set_blue_silver.jpeg";
export const BEDDING_SHEET_IMAGE = "/assets/kk_bedding_set_blue_silver.jpeg";
export const BEDDING_PILLOWCASE_IMAGE = "/assets/kk_pillowcase_set_blue_silver.jpeg";
export const BEDDING_BODY_PILLOW_IMAGE = "/assets/kk_body_pillow_blue_silver.jpeg";
export const BODY_BUTTER_IMAGE = "/assets/whipped_body_butters_branded.png";
export const BODY_WASH_COCOA_SHEA_IMAGE =
  "/assets/kk_elements_body_wash_cocoa_shea.png";
export const BODY_WASH_ISLAND_TRANQUILITY_IMAGE =
  "/assets/kk_elements_body_wash_island_tranquility.png";
export const BODY_WASH_COCOA_MANGO_IMAGE =
  "/assets/kk_elements_body_wash_cocoa_mango.png";

/** Retired chocolate-brown bedding paths (still present on some prod snapshots). */
export const LEGACY_BROWN_BEDDING_IMAGE_PATHS: Record<string, string> = {
  "/assets/kk_comforter_set.png": BEDDING_COMFORTER_IMAGE,
  "/assets/kk_sheet_set.png": BEDDING_SHEET_IMAGE,
  "/assets/kk_pillowcase_set.png": BEDDING_PILLOWCASE_IMAGE,
  "/assets/kk_body_pillow.png": BEDDING_BODY_PILLOW_IMAGE,
};

export const HIS_HERS_WATCH_IMAGE = "/assets/kk_his_hers_watch_set.jpg";
export const BEARD_GROOMING_SET_IMAGE = "/assets/kk_beard_grooming_set.jpg";
export const LUXURY_SPA_BASKET_IMAGE = "/assets/scented_candles_branded.png";
export const MONARCH_VANGUARD_IMAGE = "/assets/kk_monarch_vanguard.jpg";
export const SOVEREIGN_RUNNER_IMAGE = "/assets/kk_sovereign_runner.jpg";

/** Retired gold watch image paths (replaced by silver His & Hers artwork). */
export const LEGACY_WATCH_IMAGE_PATHS: Record<string, string> = {
  "/assets/kka_gold_watch.jpg": HIS_HERS_WATCH_IMAGE,
  "/attached_assets/kka_gold_watch.jpg": HIS_HERS_WATCH_IMAGE,
};

const TITLE_IMAGE_OVERRIDES: Array<{ pattern: RegExp; imageUrl: string }> = [
  { pattern: /comforter set/i, imageUrl: BEDDING_COMFORTER_IMAGE },
  { pattern: /sheet set/i, imageUrl: BEDDING_SHEET_IMAGE },
  { pattern: /pillowcase set/i, imageUrl: BEDDING_PILLOWCASE_IMAGE },
  { pattern: /body pillow/i, imageUrl: BEDDING_BODY_PILLOW_IMAGE },
  { pattern: /(?:our exotic|whipped) body butter/i, imageUrl: BODY_BUTTER_IMAGE },
  { pattern: /elements care basket/i, imageUrl: BODY_WASH_COCOA_SHEA_IMAGE },
  { pattern: /elements duo/i, imageUrl: BODY_WASH_COCOA_SHEA_IMAGE },
  { pattern: /cocoa\s*&\s*shea\s*butter/i, imageUrl: BODY_WASH_COCOA_SHEA_IMAGE },
  { pattern: /island\s*tranquility/i, imageUrl: BODY_WASH_ISLAND_TRANQUILITY_IMAGE },
  { pattern: /cocoa\s*mango|coco\s*mango/i, imageUrl: BODY_WASH_COCOA_MANGO_IMAGE },
  { pattern: /his & hers watch/i, imageUrl: HIS_HERS_WATCH_IMAGE },
  { pattern: /full beard grooming set/i, imageUrl: BEARD_GROOMING_SET_IMAGE },
  { pattern: /luxury spa gift basket|aqua elegante.*spa/i, imageUrl: LUXURY_SPA_BASKET_IMAGE },
  { pattern: /monarch\s*vanguard/i, imageUrl: MONARCH_VANGUARD_IMAGE },
  { pattern: /sovereign\s*runner/i, imageUrl: SOVEREIGN_RUNNER_IMAGE },
  { pattern: /96 count eco laundry sheets/i, imageUrl: ECO_LAUNDRY_SHEETS_96_IMAGE },
  { pattern: /eco laundry sheets/i, imageUrl: ECO_LAUNDRY_SHEETS_32_IMAGE },
  {
    pattern: /washing machine tablets|machine cleaner tablets/i,
    imageUrl: MACHINE_CLEANER_TABLETS_IMAGE,
  },
];

function isBlueSilverArtwork(path: string): boolean {
  return (
    path.includes("_blue_silver") ||
    path.includes("whipped_body_butters_branded")
  );
}

/**
 * Resolve the image URL the storefront should display. Rewrites retired brown
 * bedding paths and fills in canonical blue artwork when metadata is missing
 * but the product title is a known bedding / body butter SKU.
 */
export function resolveStorefrontImageUrl(
  imageUrl: string | null | undefined,
  productTitle?: string | null,
): string {
  const trimmed = (imageUrl || "").trim();
  if (trimmed) {
    const legacyBedding = LEGACY_BROWN_BEDDING_IMAGE_PATHS[trimmed];
    if (legacyBedding) return legacyBedding;
    const legacyWatch = LEGACY_WATCH_IMAGE_PATHS[trimmed];
    if (legacyWatch) return legacyWatch;
    if (isBlueSilverArtwork(trimmed)) return trimmed;
  }

  const title = (productTitle || "").trim();
  if (title) {
    for (const { pattern, imageUrl: override } of TITLE_IMAGE_OVERRIDES) {
      if (pattern.test(title)) return override;
    }
  }

  return trimmed;
}
