/**
 * Canonical storefront image paths for bedding and body butter, plus legacy
 * brown artwork paths retired when the catalog switched to royal blue / silver.
 */
import {
  ECO_LAUNDRY_SHEETS_32_IMAGE,
  ECO_LAUNDRY_SHEETS_96_IMAGE,
  MACHINE_CLEANER_TABLETS_IMAGE,
} from "./homeCareLaundry";
import { SEA_MOSS_GELS } from "./elementsSeaMossGels";
export const BEDDING_COMFORTER_IMAGE = "/assets/kk_bedding_set_blue_silver.jpeg";
export const BEDDING_SHEET_IMAGE = "/assets/kk_bedding_set_blue_silver.jpeg";
export const BEDDING_PILLOWCASE_IMAGE = "/assets/kk_pillowcase_set_blue_silver.jpeg";
export const BEDDING_BODY_PILLOW_IMAGE = "/assets/kk_body_pillow_blue_silver.jpeg";
export const BODY_BUTTER_JAR_CLOSED_IMAGE = "/assets/kk_triple_butter_jar_closed.jpg";
export const BODY_BUTTER_JAR_OPEN_IMAGE = "/assets/kk_triple_butter_jar_open.jpg";
/** Primary storefront thumbnail for the body butter line. */
export const BODY_BUTTER_IMAGE = BODY_BUTTER_JAR_CLOSED_IMAGE;
/** Default bundle / duo hero when no specific wash is selected. */
export const BODY_WASH_DEFAULT_IMAGE =
  "/assets/kk_elements_body_wash_island_tranquility.png";
export const BODY_WASH_ISLAND_TRANQUILITY_IMAGE = BODY_WASH_DEFAULT_IMAGE;
export const BODY_WASH_COCOA_MANGO_IMAGE =
  "/assets/kk_elements_body_wash_cocoa_mango.png";
export const BODY_WASH_AVOCADO_IMAGE =
  "/assets/kk_elements_body_wash_avocado_oil.png";
export const BODY_WASH_MENS_ENERGIZING_IMAGE =
  "/assets/kk_elements_body_wash_mens_energizing.png";
/** Retired SKU artwork (Cocoa & Shea wash replaced by Avocado Oil). */
export const BODY_WASH_COCOA_SHEA_IMAGE = BODY_WASH_AVOCADO_IMAGE;

/** Legacy body-wash paths still stored on older Stripe metadata rows. */
export const LEGACY_BODY_WASH_IMAGE_PATHS: Record<string, string> = {
  "/assets/kk_elements_body_wash_avocado.jpg": BODY_WASH_AVOCADO_IMAGE,
  "/assets/kk_elements_body_wash_mens_energizing.jpg":
    BODY_WASH_MENS_ENERGIZING_IMAGE,
  "/assets/kk_elements_body_wash_cocoa_shea.png": BODY_WASH_AVOCADO_IMAGE,
};

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
  {
    pattern: /(?:our exotic|whipped|triple butter base)/i,
    imageUrl: BODY_BUTTER_IMAGE,
  },
  { pattern: /(?:core\s*4|elements care basket)/i, imageUrl: BODY_WASH_DEFAULT_IMAGE },
  { pattern: /elements (duo|trio|quad)/i, imageUrl: BODY_WASH_DEFAULT_IMAGE },
  { pattern: /scented butter lotion/i, imageUrl: BODY_WASH_COCOA_MANGO_IMAGE },
  { pattern: /cocoa\s*&\s*shea\s*butter/i, imageUrl: BODY_WASH_COCOA_SHEA_IMAGE },
  { pattern: /100%\s*avocado\s*oil|avocado\s*oil/i, imageUrl: BODY_WASH_AVOCADO_IMAGE },
  {
    pattern: /men'?s\s*(?:moisturizing\s*)?energizing\s*scent|complete\s*chemistry.*energizing/i,
    imageUrl: BODY_WASH_MENS_ENERGIZING_IMAGE,
  },
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
  ...SEA_MOSS_GELS.map((gel) => ({
    pattern: new RegExp(gel.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    imageUrl: gel.imageUrl,
  })),
];

function isBlueSilverArtwork(path: string): boolean {
  return (
    path.includes("_blue_silver") ||
    path.includes("kk_triple_butter_jar")
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
    const legacyBodyWash = LEGACY_BODY_WASH_IMAGE_PATHS[trimmed];
    if (legacyBodyWash) return legacyBodyWash;
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
