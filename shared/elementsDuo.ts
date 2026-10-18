/**
 * Elements Duo — 3-in-1 body wash (bottle) + whipped body butter (jar).
 *
 * Individually: $10 wash + $15 butter = $25.
 * Duo price: $10 wash + $7 butter = $17 (save $8).
 *
 * The customer picks one wash scent and one body-butter scent. Those two
 * choices are joined with an em dash and stored as `selectedScent` so the
 * existing cart / checkout field can carry both without a new line-item shape.
 */

import { isBodyButterProductTitle } from "./elementsBodyButter";

export const ELEMENTS_DUO_PRODUCT_ID = "prod_kkelemsduo";
export const ELEMENTS_DUO_PRICE_ID = "price_kkelemsduo";
export const ELEMENTS_DUO_NAME = "Elements Duo";

export const BODY_WASH_RETAIL_CENTS = 1000;
export const BODY_BUTTER_RETAIL_CENTS = 1500;
export const BODY_BUTTER_DUO_CENTS = 700;
export const ELEMENTS_DUO_PRICE_CENTS =
  BODY_WASH_RETAIL_CENTS + BODY_BUTTER_DUO_CENTS;
export const ELEMENTS_DUO_SEPARATE_CENTS =
  BODY_WASH_RETAIL_CENTS + BODY_BUTTER_RETAIL_CENTS;
export const ELEMENTS_DUO_SAVINGS_CENTS =
  ELEMENTS_DUO_SEPARATE_CENTS - ELEMENTS_DUO_PRICE_CENTS;

/** Em dash used to join wash + butter scent in `selectedScent`. */
export const ELEMENTS_DUO_DELIM = " \u2014 ";

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

export function isElementsDuoProduct(
  priceId?: string | null,
  title?: string | null,
): boolean {
  if (priceId === ELEMENTS_DUO_PRICE_ID) return true;
  if (!title) return false;
  return /^\s*elements duo\s*$/i.test(title);
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

export function encodeElementsDuoSelection(
  wash: string,
  butterScent: string,
): string {
  return `${wash.trim()}${ELEMENTS_DUO_DELIM}${butterScent.trim()}`;
}

export function parseElementsDuoSelection(
  selected: unknown,
): ElementsDuoSelection | null {
  if (typeof selected !== "string") return null;
  const idx = selected.indexOf(ELEMENTS_DUO_DELIM);
  if (idx <= 0) return null;
  const wash = selected.slice(0, idx).trim();
  const butterScent = selected.slice(idx + ELEMENTS_DUO_DELIM.length).trim();
  if (!wash || !butterScent) return null;
  return { wash, butterScent };
}

export function elementsDuoOrderNote(selection: ElementsDuoSelection): string {
  return `3-in-1 wash: ${selection.wash} | Body butter: ${selection.butterScent}`;
}
