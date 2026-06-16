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

export type CustomizationKind =
  | "handleColor"
  | "phoneModel"
  | "logoOption"
  | "size"
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

export function checkCustomization(
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
    // These products now present the full visual logo catalog picker, so the
    // customer's choice is a catalog logo `alt` name validated against the
    // shared allowlist. The old plain-text labels (e.g. "Apparel Logo") are
    // still accepted for backward compatibility with any pre-existing carts.
    const ok = !!sel && (LOGO_ALT_SET.has(sel) || logoOptions.includes(sel));
    return {
      required: true,
      kind: "logoOption",
      ok,
      note: ok ? `Logo: ${sel}` : undefined,
    };
  }

  return { required: false, kind: "none", ok: true };
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
    default:
      return `Please complete your customization for "${productName}" before checking out.`;
  }
}
