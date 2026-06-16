// Server-authoritative validation of a customer's customization choice for
// custom-branded products. Shared so every checkout endpoint enforces the same
// rules (the UI is never the only gate).
//
// A product is "customized" when its metadata carries one of:
//  - handleColors: comma list of handle colors (e.g. the Coffee Mug). The client
//    sends selectedLogo as "<color> handle \u2014 <logo name>".
//  - caseType: "iphone" | "samsung" (phone cases). The client sends selectedLogo
//    as "<phone model> \u2014 <logo name>".
//  - logoOptions: comma list of plain text logo choices. selectedLogo is the
//    exact chosen option.
//
// For handleColors and caseType, the trailing "<logo name>" must be a real logo
// from the shared catalog allowlist — this prevents model/color-only or
// arbitrary-text submissions that bypass the "pick a model AND a logo" rule.

import { PHONE_MODELS_BY_TYPE } from "./phoneModels";
import { LOGO_ALT_SET } from "./logoNames";

// Em dash used by the client to join the choice (color/model) and the logo name.
const DELIM = " \u2014 ";

// Sentinel placed in a product's `logoOptions` (in the API response) to mean
// "offer the entire branded logo catalog." Every purchasable product is logo
// customizable by default; the pickers render the full catalog from
// logoCatalog, so the actual string value here is only a truthy flag.
export const FULL_LOGO_CATALOG_OPTION = "__FULL_LOGO_CATALOG__";

// Product types that are NOT logo-customizable (a brand logo doesn't physically
// apply to them). The poetry plaques / glass frames are art pieces.
const NON_LOGO_PRODUCT_TYPES = new Set(["poetry"]);

// True when a product should present the full logo catalog picker by default.
// This is every purchasable product EXCEPT: those with their own specialized
// customizer (handle colors, phone-case models, or sizes) and non-logo product
// types (e.g. poetry plaques/frames). Shared so the storefront UI and the
// server-side checkout enforcement agree on which products require a logo.
export function isDefaultLogoCustomizable(metadata: any): boolean {
  const m = metadata || {};
  if (m.handleColors || m.caseType || m.sizes) return false;
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
  | "color"
  | "colorSoldOut"
  | "none";

export interface CustomizationCheck {
  required: boolean;
  kind: CustomizationKind;
  ok: boolean;
  /** The normalized note to attach to the order line item when ok. */
  note?: string;
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
export function checkCustomization(
  metadata: any,
  selectedLogo: unknown,
  selectedColor?: unknown,
): CustomizationCheck {
  const meta = metadata || {};
  const base = checkLogoChoice(meta, selectedLogo);

  const colors = colorList(meta);
  // A color choice only matters when there are 2+ real options. A single value
  // (often free-text like "specify at checkout") is not a pickable variant.
  if (colors.length < 2) return base;

  // Report a missing/invalid logo first so the shopper fixes one thing at a time.
  if (base.required && !base.ok) return base;

  const color = typeof selectedColor === "string" ? selectedColor.trim() : "";
  if (!color || !colors.includes(color)) {
    return { required: true, kind: "color", ok: false };
  }
  if (soldOutColorList(meta).includes(color)) {
    return { required: true, kind: "colorSoldOut", ok: false };
  }

  const colorNote = `Color: ${color}`;
  const note = base.note ? `${base.note} | ${colorNote}` : colorNote;
  return { required: true, kind: base.kind === "none" ? "color" : base.kind, ok: true, note };
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
    case "color":
      return `Please choose a color for "${productName}" before checking out.`;
    case "colorSoldOut":
      return `That color of "${productName}" is sold out. Please choose another color.`;
    default:
      return `Please complete your customization for "${productName}" before checking out.`;
  }
}
