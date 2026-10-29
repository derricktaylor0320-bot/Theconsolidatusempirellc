/**
 * Elements Care Basket — our own store bundle (gift basket):
 * 1× 3-in-1 body wash, 1× triple whipped body butter, 1× scented butter lotion,
 * 1× natural deodorant.
 *
 * Individually: $10 + $12 + $12 + $12 = $46.
 * Basket price: $40 (save $6).
 *
 * Four scent choices are pipe-delimited in `selectedScent`:
 *   wash|butterScent|lotionScent|deodorant
 *
 * Legacy carts with two body oils (5 parts) still parse for fulfillment display.
 */

import { BODY_BUTTER_SCENT_NAMES } from "./elementsBodyButter";
import {
  BUTTER_LOTION_UNIT_PRICE_CENTS,
  isButterLotionScent,
} from "./elementsButterLotion";
import { DEODORANT_UNIT_PRICE_CENTS } from "./elementsDeodorant";
import {
  BODY_BUTTER_RETAIL_CENTS,
  BODY_WASH_RETAIL_CENTS,
  ELEMENTS_DUO_WASH_OPTIONS,
} from "./elementsDuo";

export const ELEMENTS_CARE_BASKET_PRODUCT_ID = "prod_kkelemscarebasket";
export const ELEMENTS_CARE_BASKET_PRICE_ID = "price_kkelemscarebasket";
export const ELEMENTS_CARE_BASKET_NAME = "Elements Care Basket";

export { BODY_WASH_RETAIL_CENTS, BODY_BUTTER_RETAIL_CENTS };

export const ELEMENTS_CARE_BASKET_PRICE_CENTS = 4000;
export const ELEMENTS_CARE_BASKET_SEPARATE_CENTS =
  BODY_WASH_RETAIL_CENTS +
  BODY_BUTTER_RETAIL_CENTS +
  BUTTER_LOTION_UNIT_PRICE_CENTS +
  DEODORANT_UNIT_PRICE_CENTS;
export const ELEMENTS_CARE_BASKET_SAVINGS_CENTS =
  ELEMENTS_CARE_BASKET_SEPARATE_CENTS - ELEMENTS_CARE_BASKET_PRICE_CENTS;

export const ELEMENTS_CARE_BASKET_DELIM = "|";

export const CARE_BASKET_DEODORANT_OPTIONS = [
  "Sandalwood & Teakwood",
  "Lavender",
] as const;

export type CareBasketDeodorant = (typeof CARE_BASKET_DEODORANT_OPTIONS)[number];

/** @deprecated Care Basket no longer includes fragrance body oils (legacy orders only). */
export const CARE_BASKET_BODY_OIL_OPTIONS = [
  "Lady Million",
  "Pink Passion",
  "Prada",
  "Dior Sauvage",
  "Armani Code",
  "Polo Black",
  "Polo Red",
  "Gucci Guilty",
  "Frankincense",
  "Tom Ford Oud",
  "Dolce & Gabbana",
  "Baccarat Rouge 540",
  "YSL",
  "Creed Aventus",
  "Trini Girl",
  "Riri",
  "Michele Obama",
  "Love Pink",
  "Fenty",
] as const;

export type CareBasketBodyOil = (typeof CARE_BASKET_BODY_OIL_OPTIONS)[number];

export interface ElementsCareBasketSelection {
  wash: string;
  butterScent: string;
  lotionScent: string;
  deodorant: string;
  /** Present only on legacy 5-part basket carts. */
  bodyOil1?: string;
  bodyOil2?: string;
}

export function elementsCareBasketPriceDollars(): number {
  return ELEMENTS_CARE_BASKET_PRICE_CENTS / 100;
}

export function elementsCareBasketSeparateDollars(): number {
  return ELEMENTS_CARE_BASKET_SEPARATE_CENTS / 100;
}

export function elementsCareBasketSavingsDollars(): number {
  return ELEMENTS_CARE_BASKET_SAVINGS_CENTS / 100;
}

export function isElementsCareBasketProduct(
  priceId?: string | null,
  title?: string | null,
): boolean {
  if (priceId === ELEMENTS_CARE_BASKET_PRICE_ID) return true;
  if (!title) return false;
  return /^\s*elements care basket\s*$/i.test(title);
}

export function isElementsCareBasketMetadata(metadata: unknown): boolean {
  const m = (metadata || {}) as { elementsCareBasket?: unknown };
  return String(m.elementsCareBasket || "").toLowerCase() === "true";
}

export function isCareBasketWash(value: unknown): value is (typeof ELEMENTS_DUO_WASH_OPTIONS)[number] {
  return (
    typeof value === "string" &&
    (ELEMENTS_DUO_WASH_OPTIONS as readonly string[]).includes(value)
  );
}

export function isCareBasketButterScent(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (BODY_BUTTER_SCENT_NAMES as readonly string[]).includes(value)
  );
}

export function isCareBasketLotionScent(value: unknown): boolean {
  return isButterLotionScent(value);
}

export function isCareBasketDeodorant(value: unknown): value is CareBasketDeodorant {
  return (
    typeof value === "string" &&
    (CARE_BASKET_DEODORANT_OPTIONS as readonly string[]).includes(value)
  );
}

/** @deprecated Legacy basket body oil picks */
export function isCareBasketBodyOil(value: unknown): value is CareBasketBodyOil {
  return (
    typeof value === "string" &&
    (CARE_BASKET_BODY_OIL_OPTIONS as readonly string[]).includes(value)
  );
}

export function encodeElementsCareBasketSelection(
  selection: Omit<ElementsCareBasketSelection, "bodyOil1" | "bodyOil2">,
): string {
  return [
    selection.wash.trim(),
    selection.butterScent.trim(),
    selection.lotionScent.trim(),
    selection.deodorant.trim(),
  ].join(ELEMENTS_CARE_BASKET_DELIM);
}

export function parseElementsCareBasketSelection(
  selected: unknown,
): ElementsCareBasketSelection | null {
  if (typeof selected !== "string") return null;
  const parts = selected.split(ELEMENTS_CARE_BASKET_DELIM);
  if (parts.length === 4) {
    const [wash, butterScent, lotionScent, deodorant] = parts.map((p) => p.trim());
    if (!wash || !butterScent || !lotionScent || !deodorant) return null;
    return { wash, butterScent, lotionScent, deodorant };
  }
  if (parts.length === 5) {
    const [wash, butterScent, deodorant, bodyOil1, bodyOil2] = parts.map((p) => p.trim());
    if (!wash || !butterScent || !deodorant || !bodyOil1 || !bodyOil2) return null;
    return {
      wash,
      butterScent,
      lotionScent: "",
      deodorant,
      bodyOil1,
      bodyOil2,
    };
  }
  return null;
}

export function elementsCareBasketOrderNote(
  selection: ElementsCareBasketSelection,
): string {
  const parts = [
    `3-in-1 wash: ${selection.wash}`,
    `Body butter: ${selection.butterScent}`,
  ];
  if (selection.lotionScent) {
    parts.push(`Butter lotion: ${selection.lotionScent}`);
  }
  parts.push(`Deodorant: ${selection.deodorant}`);
  if (selection.bodyOil1 && selection.bodyOil2) {
    parts.push(`Body oil 1: ${selection.bodyOil1}`);
    parts.push(`Body oil 2: ${selection.bodyOil2}`);
  }
  return parts.join(" | ");
}
