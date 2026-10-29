/**
 * Elements Quad — 3-in-1 body wash (8 oz) + triple whipped body butter (4 oz) +
 * scented butter lotion + natural deodorant (2.5 oz).
 *
 * Individually: $10 wash + $12 butter + $12 lotion + $12 deodorant = $46.
 * Online bundle: $42 (save $4, ~9% off).
 * In-person flea markets may use $36 (see inPersonSales.ts).
 *
 * Wash, body butter, lotion, and deodorant choices are pipe-delimited in
 * `selectedScent`: wash|butterScent|lotionScent|deodorant
 *
 * Legacy trio carts (3 parts, no lotion) still parse for older orders.
 */

import { isBodyButterProductTitle } from "./elementsBodyButter";
import { BUTTER_LOTION_UNIT_PRICE_CENTS } from "./elementsButterLotion";
import { DEODORANT_UNIT_PRICE_CENTS } from "./elementsDeodorant";

export const ELEMENTS_DUO_PRODUCT_ID = "prod_kkelemsduo";
export const ELEMENTS_DUO_PRICE_ID = "price_kkelemsduo";
/** Storefront name; legacy Stripe rows may still say "Elements Duo" or "Elements Trio". */
export const ELEMENTS_DUO_NAME = "Elements Quad";
/** @deprecated Use ELEMENTS_DUO_NAME — kept for copy that still says Trio. */
export const ELEMENTS_TRIO_NAME = "Elements Trio";

export const BODY_WASH_RETAIL_CENTS = 1000;
export const BODY_BUTTER_RETAIL_CENTS = 1200;
export const ELEMENTS_DUO_PRICE_CENTS = 4200;
export const ELEMENTS_DUO_SEPARATE_CENTS =
  BODY_WASH_RETAIL_CENTS +
  BODY_BUTTER_RETAIL_CENTS +
  BUTTER_LOTION_UNIT_PRICE_CENTS +
  DEODORANT_UNIT_PRICE_CENTS;
export const ELEMENTS_DUO_SAVINGS_CENTS =
  ELEMENTS_DUO_SEPARATE_CENTS - ELEMENTS_DUO_PRICE_CENTS;

/** Flea-market / pop-up price (not used at Stripe checkout). */
export const ELEMENTS_QUAD_FLEA_MARKET_CENTS = 3600;
/** @deprecated Renamed to ELEMENTS_QUAD_FLEA_MARKET_CENTS when the bundle added lotion. */
export const ELEMENTS_TRIO_FLEA_MARKET_CENTS = ELEMENTS_QUAD_FLEA_MARKET_CENTS;

export const ELEMENTS_DUO_DELIM = "|";

/** Legacy em dash used before pipe-delimited bundles. */
export const ELEMENTS_DUO_LEGACY_DELIM = " \u2014 ";

export const ELEMENTS_DUO_DEODORANT_OPTIONS = [
  "Sandalwood & Teakwood",
  "Lavender",
] as const;

export type ElementsDuoDeodorant =
  (typeof ELEMENTS_DUO_DEODORANT_OPTIONS)[number];

export const ELEMENTS_DUO_WASH_OPTIONS = [
  "Avocado Oil",
  "Island Tranquility",
  "Cocoa Mango",
  "Men's Energizing Scent",
] as const;

export type ElementsDuoWash = (typeof ELEMENTS_DUO_WASH_OPTIONS)[number];

export interface ElementsDuoSelection {
  wash: string;
  butterScent: string;
  lotionScent: string;
  deodorant: string;
}

export function elementsDuoPriceDollars(): number {
  return ELEMENTS_DUO_PRICE_CENTS / 100;
}

export function elementsDuoSeparateDollars(): number {
  return ELEMENTS_DUO_SEPARATE_CENTS / 100;
}

export function elementsDuoSavingsDollars(): number {
  return ELEMENTS_DUO_SAVINGS_CENTS / 100;
}

export function elementsQuadFleaMarketPriceDollars(): number {
  return ELEMENTS_QUAD_FLEA_MARKET_CENTS / 100;
}

/** @deprecated Use elementsQuadFleaMarketPriceDollars */
export function elementsTrioFleaMarketPriceDollars(): number {
  return elementsQuadFleaMarketPriceDollars();
}

export function isElementsDuoProduct(
  priceId?: string | null,
  title?: string | null,
): boolean {
  if (priceId === ELEMENTS_DUO_PRICE_ID) return true;
  if (!title) return false;
  return /^\s*elements (duo|trio|quad)\s*$/i.test(title);
}

export function isElementsDuoMetadata(metadata: unknown): boolean {
  const m = (metadata || {}) as { elementsDuo?: unknown };
  return String(m.elementsDuo || "").toLowerCase() === "true";
}

export function isElementsBodyWashTitle(title?: string | null): boolean {
  if (!title) return false;
  const trimmed = title.trim();
  return (ELEMENTS_DUO_WASH_OPTIONS as readonly string[]).includes(trimmed);
}

export function isElementsBodyButterTitle(title?: string | null): boolean {
  return isBodyButterProductTitle(title);
}

export function isElementsDuoWash(value: unknown): value is ElementsDuoWash {
  return (
    typeof value === "string" &&
    (ELEMENTS_DUO_WASH_OPTIONS as readonly string[]).includes(value)
  );
}

export function isElementsDuoDeodorant(
  value: unknown,
): value is ElementsDuoDeodorant {
  return (
    typeof value === "string" &&
    (ELEMENTS_DUO_DEODORANT_OPTIONS as readonly string[]).includes(value)
  );
}

export function encodeElementsDuoSelection(
  wash: string,
  butterScent: string,
  lotionScent: string,
  deodorant: string,
): string {
  return [wash.trim(), butterScent.trim(), lotionScent.trim(), deodorant.trim()].join(
    ELEMENTS_DUO_DELIM,
  );
}

export function parseElementsDuoSelection(
  selected: unknown,
): ElementsDuoSelection | null {
  if (typeof selected !== "string") return null;
  const trimmed = selected.trim();
  if (!trimmed) return null;

  if (trimmed.includes(ELEMENTS_DUO_DELIM)) {
    const parts = trimmed.split(ELEMENTS_DUO_DELIM);
    if (parts.length === 4) {
      const [wash, butterScent, lotionScent, deodorant] = parts.map((p) => p.trim());
      if (!wash || !butterScent || !lotionScent || !deodorant) return null;
      return { wash, butterScent, lotionScent, deodorant };
    }
    if (parts.length === 3) {
      const [wash, butterScent, deodorant] = parts.map((p) => p.trim());
      if (!wash || !butterScent || !deodorant) return null;
      return { wash, butterScent, lotionScent: "", deodorant };
    }
    return null;
  }

  const idx = trimmed.indexOf(ELEMENTS_DUO_LEGACY_DELIM);
  if (idx <= 0) return null;
  const wash = trimmed.slice(0, idx).trim();
  const butterScent = trimmed
    .slice(idx + ELEMENTS_DUO_LEGACY_DELIM.length)
    .trim();
  if (!wash || !butterScent) return null;
  return { wash, butterScent, lotionScent: "", deodorant: "" };
}

export function elementsDuoOrderNote(selection: ElementsDuoSelection): string {
  const parts = [
    `3-in-1 wash: ${selection.wash}`,
    `Body butter: ${selection.butterScent}`,
  ];
  if (selection.lotionScent) {
    parts.push(`Butter lotion: ${selection.lotionScent}`);
  }
  if (selection.deodorant) {
    parts.push(`Deodorant: ${selection.deodorant}`);
  }
  return parts.join(" | ");
}
