// Server-authoritative validation of a customer's customization choice for
// custom-branded products. Shared so every checkout endpoint enforces the same
// rules (the UI is never the only gate).
//
// A product is "customized" when its metadata carries one of:
//  - caseType: "iphone" | "samsung" (phone cases). The client sends selectedLogo
//    as "<phone model> \u2014 <logo name>".
//  - logoOptions: comma list of plain text logo choices. selectedLogo is the
//    exact chosen option.
//  - handleColors: legacy comma list of handle colors (retired Coffee Mug).
//    Kept so old orders/carts with that shape still validate.
//
// For caseType (and legacy handleColors), the trailing "<logo name>" must be a
// real logo from the shared catalog allowlist — this prevents model/color-only
// or arbitrary-text submissions that bypass the "pick a model AND a logo" rule.

import { PHONE_MODELS_BY_TYPE } from "./phoneModels";
import { LOGO_ALT_SET } from "./logoNames";
import {
  elementsCareBasketOrderNote,
  isCareBasketBodyOil,
  isCareBasketButterScent,
  isCareBasketDeodorant,
  isCareBasketWash,
  isElementsCareBasketMetadata,
  isElementsCareBasketProduct,
  parseElementsCareBasketSelection,
} from "./elementsCareBasket";
import {
  elementsDuoOrderNote,
  isElementsDuoMetadata,
  isElementsDuoProduct,
  isElementsDuoWash,
  parseElementsDuoSelection,
} from "./elementsDuo";
import {
  formatFootwearPlacementNote,
  isFootwearCustomizable,
  normalizeFootwearPlacements,
  parseFootwearSize,
} from "./footwear";

// Em dash used by the client to join the choice (color/model) and the logo name.
const DELIM = " \u2014 ";

// Sentinel placed in a product's `logoOptions` (in the API response) to mean
// "offer the entire branded logo catalog." Every purchasable product is logo
// customizable by default; the pickers render the full catalog from
// logoCatalog, so the actual string value here is only a truthy flag.
export const FULL_LOGO_CATALOG_OPTION = "__FULL_LOGO_CATALOG__";

// One print location is included in the garment price. Selecting two or more
// locations adds one flat multiple-placement fee.
export const MULTIPLE_PLACEMENT_SURCHARGE_CENTS = 300;

export function placementSurchargeCents(placementCount: unknown): number {
  return typeof placementCount === "number" &&
    Number.isFinite(placementCount) &&
    placementCount > 1
    ? MULTIPLE_PLACEMENT_SURCHARGE_CENTS
    : 0;
}

export function placementSurchargeDollars(placementCount: unknown): number {
  return placementSurchargeCents(placementCount) / 100;
}

// Product types that are NOT logo-customizable (a brand logo doesn't physically
// apply to them). The poetry plaques / glass frames are art pieces.
const NON_LOGO_PRODUCT_TYPES = new Set(["poetry", "vintage"]);

// True when a product should present the full logo catalog picker by default.
// This is every purchasable product EXCEPT: those with their own specialized
// customizer (handle colors, phone-case models, or sizes) and non-logo product
// types (e.g. poetry plaques/frames). Shared so the storefront UI and the
// server-side checkout enforcement agree on which products require a logo.
export function isDefaultLogoCustomizable(metadata: any): boolean {
  const m = metadata || {};
  // Customizable footwear requires a brand logo even though it has its own size run.
  if (isFootwearCustomizable(m)) return true;
  if (m.handleColors || m.caseType || m.sizes) return false;
  // Scented goods (candles, body butters) let the customer pick a scent instead
  // of a brand logo, so they don't get the logo picker.
  if (String(m.scented || "").toLowerCase() === "true") return false;
  // Explicit opt-out for products that carry their own branding and aren't
  // logo-customizable (e.g. scented/consumable goods like Whipped Body Butters).
  if (String(m.customize || "").toLowerCase() === "none") return false;
  if (NON_LOGO_PRODUCT_TYPES.has(String(m.productType || "").toLowerCase())) {
    return false;
  }
  return true;
}

export type CustomizationKind =
  | "handleColor"
  | "phoneModel"
  | "logoOption"
  | "size"
  | "footwear"
  | "color"
  | "colorSoldOut"
  | "scent"
  | "duo"
  | "careBasket"
  | "none";

export interface CustomizationCheck {
  required: boolean;
  kind: CustomizationKind;
  ok: boolean;
  /** The normalized note to attach to the order line item when ok. */
  note?: string;
  /**
   * Extra cents to add to the base unit price for this choice (e.g. an
   * extended apparel size surcharge). Always applied server-side; the UI total
   * mirrors it for display only.
   */
  upchargeCents?: number;
}

// The standard wearable-apparel size run, smallest to largest. Apparel that is
// logo-customizable also offers a size; this is layered ON TOP of the logo
// (unlike bedding's size-only `sizes` metadata).
export const APPAREL_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
] as const;

// Extended-size surcharge in cents. Standard sizes (XS–XL) carry no surcharge.
const SIZE_UPCHARGE_CENTS: Record<string, number> = {
  "2XL": 300,
  "3XL": 500,
  "4XL": 500,
  "5XL": 500,
  "6XL": 500,
};

/** Surcharge (in cents) for an apparel size. 0 for standard sizes. */
export function sizeUpchargeCents(size: unknown): number {
  const s = typeof size === "string" ? size.trim() : "";
  return SIZE_UPCHARGE_CENTS[s] || 0;
}

/** Surcharge (in dollars) for an apparel size — for client-side display. */
export function sizeUpchargeDollars(size: unknown): number {
  return sizeUpchargeCents(size) / 100;
}

// Apparel that should NOT get a wearable-size selector even though it is
// productType "apparel": footwear, headwear, winter one-size items, socks, and
// kids/toddler sizing all use their own size systems (or are one-size).
const SIZE_EXCLUDED_CATEGORIES = new Set([
  "footwear",
  "headwear",
  "winter",
  "socks",
  "kids",
]);
const SIZE_EXCLUDED_NAME_RX =
  /\b(slipper|clog|sneaker|high[\s-]?top|flip[\s-]?flop|sock|glove|beanie|scarf|ear[\s-]?muff|mitten|bundle|toddler)s?\b/i;

// The wearable sizes a product is offered in. Derived from existing product
// facts (productType / category / name) — NOT from stored metadata — so it
// behaves identically in dev (live Stripe) and prod (frozen snapshot) with no
// catalog edits. Returns [] for anything that isn't sized wearable clothing.
export function apparelSizesFor(
  metadata: any,
  productName?: unknown,
): readonly string[] {
  const m = metadata || {};
  if (String(m.productType || "").toLowerCase() !== "apparel") return [];
  // Items with their own specialized customizer aren't plain garments.
  if (m.handleColors || m.caseType) return [];
  const category = String(m.category || "").toLowerCase();
  if (SIZE_EXCLUDED_CATEGORIES.has(category)) return [];
  const name = typeof productName === "string" ? productName : "";
  if (SIZE_EXCLUDED_NAME_RX.test(name)) return [];
  // Optional per-product size run (e.g. Amazon women's jackets that only go
  // through 3XL). Distinct from bedding's size-only `sizes` metadata — this
  // still layers on top of logo + color customization.
  const custom = String(m.apparelSizes || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (custom.length > 0) return custom;
  return APPAREL_SIZES;
}

// Scent options for scented/consumable goods (candles, body butters). A product
// opts in with metadata `scented: 'true'`; the canonical list lives here so dev
// and the frozen prod snapshot stay identical with only a one-line metadata flag.
export const SCENTS = [
  "Oatmeal Milk & Honey",
  "Lavender",
  "Strawberries & Cream",
  "Lemongrass",
  "Georgia Peach",
  "Watermelon",
  "Cedarwood & Vanilla",
  "Cool Water",
  "Mahogany Teakwood",
  "Cashmere & Silk",
  "Citrus Splash",
  "Nagchampa",
  "Tropical Paradise",
  "Mix and Match",
] as const;

export function isScented(metadata: any): boolean {
  return String((metadata || {}).scented || "").toLowerCase() === "true";
}

// The scents a product is offered in — the full list when it's a scented good,
// otherwise none. Mirrors apparelSizesFor: derived from a metadata flag so there
// is no per-product list duplication between dev and the frozen prod snapshot.
export function scentsFor(metadata: any): string[] {
  if (!isScented(metadata)) return [];
  // A scented product may override the global list with its own comma-separated
  // `scentOptions` (e.g. Body Oil's fragrance lineup) so its choices don't leak
  // into the candle / body-butter pickers.
  const custom = String((metadata || {}).scentOptions || "").trim();
  if (custom) {
    return custom
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [...SCENTS];
}

function splitList(value: unknown): string[] {
  return value
    ? String(value)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
}

// Validates "<choice> \u2014 <logo name>" where choice is in `validChoices` and
// the logo name is a real catalog logo.
function isValidChoiceWithLogo(
  selectedLogo: string,
  validChoices: string[],
): boolean {
  const idx = selectedLogo.indexOf(DELIM);
  if (idx <= 0) return false;
  const choice = selectedLogo.slice(0, idx).trim();
  const logoName = selectedLogo.slice(idx + DELIM.length).trim();
  if (!validChoices.includes(choice)) return false;
  return LOGO_ALT_SET.has(logoName);
}

// The colors a product is offered in, and the subset currently out of stock.
export function colorList(metadata: any): string[] {
  return splitList((metadata || {}).colors);
}
export function soldOutColorList(metadata: any): string[] {
  return splitList((metadata || {}).soldOutColors);
}

// Validates the logo/handle/model/size choice. Color is layered on top of this
// by checkCustomization.
function checkLogoChoice(
  metadata: any,
  selectedLogo: unknown,
): CustomizationCheck {
  const meta = metadata || {};
  const sel = typeof selectedLogo === "string" ? selectedLogo : "";

  const handleColors = splitList(meta.handleColors);
  if (handleColors.length > 0) {
    const ok = isValidChoiceWithLogo(
      sel,
      handleColors.map((c) => `${c} handle`),
    );
    return { required: true, kind: "handleColor", ok, note: ok ? sel : undefined };
  }

  const caseType = meta.caseType ? String(meta.caseType) : "";
  const phoneModels = caseType ? PHONE_MODELS_BY_TYPE[caseType] || [] : [];
  if (phoneModels.length > 0) {
    const ok = isValidChoiceWithLogo(sel, phoneModels);
    return { required: true, kind: "phoneModel", ok, note: ok ? sel : undefined };
  }

  const sizes = splitList(meta.sizes);
  if (sizes.length > 0) {
    // Bedding (and any size-only product) requires the shopper to pick a size.
    // The client sends the chosen size as the selection string.
    const ok = !!sel && sizes.includes(sel);
    return { required: true, kind: "size", ok, note: ok ? `Size: ${sel}` : undefined };
  }

  const logoOptions = splitList(meta.logoOptions);
  if (logoOptions.length > 0) {
    // These products present the full visual logo catalog picker, so the
    // customer's choice must be a real catalog logo `alt` name validated against
    // the shared allowlist. Legacy plain-text labels (e.g. "Apparel Logo") are
    // not accepted — they can't be mapped to an actual logo at fulfillment.
    const ok = !!sel && LOGO_ALT_SET.has(sel);
    return {
      required: true,
      kind: "logoOption",
      ok,
      note: ok ? `Logo: ${sel}` : undefined,
    };
  }

  // Default: every other purchasable product is logo-customizable from the full
  // branded logo catalog. The customer must pick a real catalog logo, captured
  // as the order note so fulfillment knows which logo to apply.
  if (isDefaultLogoCustomizable(meta)) {
    const ok = !!sel && LOGO_ALT_SET.has(sel);
    return {
      required: true,
      kind: "logoOption",
      ok,
      note: ok ? `Logo: ${sel}` : undefined,
    };
  }

  return { required: false, kind: "none", ok: true };
}

// Full customization check: the logo/handle/model/size choice PLUS, for products
// offered in multiple colors, a required in-stock color. The chosen color is
// appended to the order note so fulfillment knows which color to make.
function isOwnedCustomDesignUrl(url: unknown): boolean {
  return (
    typeof url === "string" &&
    url.startsWith("/media-files/custom-designs/") &&
    !url.includes("..")
  );
}

export function checkCustomization(
  metadata: any,
  selectedLogo: unknown,
  selectedColor?: unknown,
  selectedSize?: unknown,
  productName?: unknown,
  selectedScent?: unknown,
  customDesignUrl?: unknown,
  selectedPlacements?: unknown,
): CustomizationCheck {
  const meta = metadata || {};
  const footwear = isFootwearCustomizable(meta);
  const base = footwear
    ? checkLogoChoice({ ...meta, sizes: undefined }, selectedLogo)
    : checkLogoChoice(meta, selectedLogo);

  // Report a missing/invalid logo first so the shopper fixes one thing at a time.
  if (base.required && !base.ok) return base;

  const notes: string[] = base.note ? [base.note] : [];
  let upchargeCents = 0;

  // Custom footwear: gender + US size (Men's 4–14, Women's 5.5–15.5).
  const footwearRequired = footwear;
  if (footwearRequired) {
    const encoded =
      typeof selectedSize === "string" ? selectedSize.trim() : "";
    const parsed = parseFootwearSize(encoded);
    if (!parsed) {
      return { required: true, kind: "footwear", ok: false };
    }
    const placements = normalizeFootwearPlacements(selectedPlacements);
    if (!placements) {
      return { required: true, kind: "footwear", ok: false };
    }
    notes.push(`Size: ${encoded}`);
    notes.push(formatFootwearPlacementNote(placements));
    upchargeCents += placementSurchargeCents(placements.length);
    if (isOwnedCustomDesignUrl(customDesignUrl)) {
      notes.push(`Custom design: ${customDesignUrl}`);
    }
  }

  // Logo-customizable apparel (shirts, etc.): optional uploaded artwork.
  if (
    !footwearRequired &&
    isDefaultLogoCustomizable(meta) &&
    isOwnedCustomDesignUrl(customDesignUrl)
  ) {
    notes.push(`Custom design: ${customDesignUrl}`);
  }

  // Wearable apparel size (XS–6XL) — layered ON TOP of the logo (separate from
  // bedding's size-only `sizes` metadata). Required for sized garments.
  const apparelSizes = footwearRequired ? [] : apparelSizesFor(meta, productName);
  const sizeRequired = apparelSizes.length > 0;
  if (sizeRequired) {
    const size = typeof selectedSize === "string" ? selectedSize.trim() : "";
    if (!size || !apparelSizes.includes(size)) {
      return { required: true, kind: "size", ok: false };
    }
    notes.push(`Size: ${size}`);
    upchargeCents += sizeUpchargeCents(size);
  }

  // A color choice only matters when there are 2+ real options. A single value
  // (often free-text like "specify at checkout") is not a pickable variant.
  const colors = colorList(meta);
  const colorRequired = colors.length >= 2;
  if (colorRequired) {
    const color = typeof selectedColor === "string" ? selectedColor.trim() : "";
    if (!color || !colors.includes(color)) {
      return { required: true, kind: "color", ok: false };
    }
    if (soldOutColorList(meta).includes(color)) {
      return { required: true, kind: "colorSoldOut", ok: false };
    }
    notes.push(`Color: ${color}`);
  }

  // Elements Care Basket: wash + butter + deodorant + 2 body oils in selectedScent.
  const careBasketRequired =
    isElementsCareBasketMetadata(meta) ||
    isElementsCareBasketProduct(
      undefined,
      typeof productName === "string" ? productName : undefined,
    );
  if (careBasketRequired) {
    const parsed = parseElementsCareBasketSelection(selectedScent);
    if (
      !parsed ||
      !isCareBasketWash(parsed.wash) ||
      !isCareBasketButterScent(parsed.butterScent) ||
      !isCareBasketDeodorant(parsed.deodorant) ||
      !isCareBasketBodyOil(parsed.bodyOil1) ||
      !isCareBasketBodyOil(parsed.bodyOil2)
    ) {
      return { required: true, kind: "careBasket", ok: false };
    }
    notes.push(elementsCareBasketOrderNote(parsed));
  }

  // Elements Duo: one 3-in-1 wash + one body-butter scent, packed into
  // selectedScent as "Wash — Butter". Skip the single-scent check below.
  const duoRequired =
    !careBasketRequired &&
    (isElementsDuoMetadata(meta) ||
      isElementsDuoProduct(undefined, typeof productName === "string" ? productName : undefined));
  if (duoRequired) {
    const parsed = parseElementsDuoSelection(selectedScent);
    const butterScents = scentsFor({ ...meta, scented: "true" });
    if (
      !parsed ||
      !isElementsDuoWash(parsed.wash) ||
      !butterScents.includes(parsed.butterScent)
    ) {
      return { required: true, kind: "duo", ok: false };
    }
    notes.push(elementsDuoOrderNote(parsed));
  }

  // Scent (candles, body butters). Layered like color/size — required whenever
  // the product is a scented good. The chosen scent is added to the order note.
  const scents = scentsFor(meta);
  const scentRequired = scents.length > 0 && !duoRequired && !careBasketRequired;
  if (scentRequired) {
    const scent = typeof selectedScent === "string" ? selectedScent.trim() : "";
    if (!scent || !scents.includes(scent)) {
      return { required: true, kind: "scent", ok: false };
    }
    notes.push(`Scent: ${scent}`);
  }

  const required =
    base.required ||
    footwearRequired ||
    sizeRequired ||
    colorRequired ||
    scentRequired ||
    duoRequired ||
    careBasketRequired;
  const kind: CustomizationKind =
    base.kind !== "none"
      ? base.kind
      : footwearRequired
        ? "footwear"
        : sizeRequired
          ? "size"
          : colorRequired
            ? "color"
            : careBasketRequired
              ? "careBasket"
              : duoRequired
                ? "duo"
                : scentRequired
                  ? "scent"
                  : "none";
  return {
    required,
    kind,
    ok: true,
    note: notes.length ? notes.join(" | ") : undefined,
    upchargeCents: upchargeCents || undefined,
  };
}

export function customizationErrorMessage(
  kind: CustomizationKind,
  productName: string,
): string {
  switch (kind) {
    case "handleColor":
      return `Please choose a handle color and logo for "${productName}" before checking out.`;
    case "phoneModel":
      return `Please choose your phone model and a logo for "${productName}" before checking out.`;
    case "logoOption":
      return `Please select a logo variation for "${productName}" before checking out.`;
    case "size":
      return `Please choose a size for "${productName}" before checking out.`;
    case "footwear":
      return `Please choose your gender and shoe size, and select one of our brand logos for "${productName}" before checking out.`;
    case "color":
      return `Please choose a color for "${productName}" before checking out.`;
    case "colorSoldOut":
      return `That color of "${productName}" is sold out. Please choose another color.`;
    case "scent":
      return `Please choose a scent for "${productName}" before checking out.`;
    case "duo":
      return `Please choose a 3-in-1 body wash and a body butter scent for "${productName}" before checking out.`;
    case "careBasket":
      return `Please choose your wash, body butter, deodorant, and two body oil scents for "${productName}" before checking out.`;
    default:
      return `Please complete your customization for "${productName}" before checking out.`;
  }
}
