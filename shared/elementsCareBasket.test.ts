import assert from "node:assert/strict";
import test from "node:test";
import { DEODORANT_UNIT_PRICE_CENTS } from "./elementsDeodorant";
import {
  BODY_BUTTER_RETAIL_CENTS,
  BODY_OIL_COUNT,
  BODY_OIL_RETAIL_CENTS,
  BODY_WASH_RETAIL_CENTS,
  CARE_BASKET_BODY_OIL_OPTIONS,
  CARE_BASKET_DEODORANT_OPTIONS,
  ELEMENTS_CARE_BASKET_NAME,
  ELEMENTS_CARE_BASKET_PRICE_CENTS,
  ELEMENTS_CARE_BASKET_PRICE_ID,
  ELEMENTS_CARE_BASKET_SAVINGS_CENTS,
  ELEMENTS_CARE_BASKET_SEPARATE_CENTS,
  elementsCareBasketOrderNote,
  elementsCareBasketPriceDollars,
  elementsCareBasketSavingsDollars,
  elementsCareBasketSeparateDollars,
  encodeElementsCareBasketSelection,
  isCareBasketBodyOil,
  isCareBasketButterScent,
  isCareBasketDeodorant,
  isCareBasketWash,
  isElementsCareBasketMetadata,
  isElementsCareBasketProduct,
  parseElementsCareBasketSelection,
} from "./elementsCareBasket";
import { BODY_BUTTER_SCENT_NAMES } from "./elementsBodyButter";
import { ELEMENTS_DUO_WASH_OPTIONS } from "./elementsDuo";

test("Elements Care Basket is $40: $62 separate, save $22", () => {
  assert.equal(BODY_WASH_RETAIL_CENTS, 1500);
  assert.equal(BODY_BUTTER_RETAIL_CENTS, 1500);
  assert.equal(DEODORANT_UNIT_PRICE_CENTS, 1200);
  assert.equal(BODY_OIL_RETAIL_CENTS, 1000);
  assert.equal(BODY_OIL_COUNT, 2);
  assert.equal(ELEMENTS_CARE_BASKET_SEPARATE_CENTS, 6200);
  assert.equal(ELEMENTS_CARE_BASKET_PRICE_CENTS, 4000);
  assert.equal(ELEMENTS_CARE_BASKET_SAVINGS_CENTS, 2200);
  assert.equal(elementsCareBasketPriceDollars(), 40);
  assert.equal(elementsCareBasketSeparateDollars(), 62);
  assert.equal(elementsCareBasketSavingsDollars(), 22);
});

test("encodes and parses all five basket selections", () => {
  const encoded = encodeElementsCareBasketSelection({
    wash: "Island Tranquility",
    butterScent: "Forbidden Taste",
    deodorant: "Lavender",
    bodyOil1: "Dior Sauvage",
    bodyOil2: "Pink Passion",
  });
  assert.equal(
    encoded,
    "Island Tranquility|Forbidden Taste|Lavender|Dior Sauvage|Pink Passion",
  );
  assert.deepEqual(parseElementsCareBasketSelection(encoded), {
    wash: "Island Tranquility",
    butterScent: "Forbidden Taste",
    deodorant: "Lavender",
    bodyOil1: "Dior Sauvage",
    bodyOil2: "Pink Passion",
  });
});

test("parse rejects incomplete selections", () => {
  assert.equal(parseElementsCareBasketSelection(""), null);
  assert.equal(parseElementsCareBasketSelection("Island Tranquility|Forbidden Taste"), null);
  assert.equal(parseElementsCareBasketSelection(undefined), null);
});

test("identifies the Care Basket SKU by price id or exact title", () => {
  assert.equal(isElementsCareBasketProduct(ELEMENTS_CARE_BASKET_PRICE_ID, "Anything"), true);
  assert.equal(isElementsCareBasketProduct("price_other", ELEMENTS_CARE_BASKET_NAME), true);
  assert.equal(isElementsCareBasketProduct("price_other", "Elements Care Basket "), true);
  assert.equal(isElementsCareBasketProduct("price_other", "Elements Duo"), false);
  assert.equal(isElementsCareBasketMetadata({ elementsCareBasket: "true" }), true);
  assert.equal(isElementsCareBasketMetadata({ elementsCareBasket: "false" }), false);
});

test("option validators match the standalone SKUs", () => {
  assert.equal(isCareBasketWash("Cocoa Mango"), true);
  assert.equal(isCareBasketWash("Lavender"), false);
  assert.equal(isCareBasketButterScent(BODY_BUTTER_SCENT_NAMES[0]), true);
  assert.equal(isCareBasketButterScent("Not A Scent"), false);
  assert.equal(isCareBasketDeodorant(CARE_BASKET_DEODORANT_OPTIONS[0]), true);
  assert.equal(isCareBasketDeodorant("Rose"), false);
  assert.equal(isCareBasketBodyOil(CARE_BASKET_BODY_OIL_OPTIONS[0]), true);
  assert.equal(isCareBasketBodyOil("Unknown"), false);
  assert.equal(ELEMENTS_DUO_WASH_OPTIONS.length, 4);
  assert.equal(CARE_BASKET_DEODORANT_OPTIONS.length, 2);
  assert.equal(CARE_BASKET_BODY_OIL_OPTIONS.length, 19);
});

test("order note names every item for fulfillment", () => {
  assert.equal(
    elementsCareBasketOrderNote({
      wash: "Cocoa Mango",
      butterScent: "Too Tempting",
      deodorant: "Sandalwood & Teakwood",
      bodyOil1: "Prada",
      bodyOil2: "YSL",
    }),
    "3-in-1 wash: Cocoa Mango | Body butter: Too Tempting | Deodorant: Sandalwood & Teakwood | Body oil 1: Prada | Body oil 2: YSL",
  );
});
