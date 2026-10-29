import assert from "node:assert/strict";
import test from "node:test";
import { BUTTER_LOTION_UNIT_PRICE_CENTS } from "./elementsButterLotion";
import { DEODORANT_UNIT_PRICE_CENTS } from "./elementsDeodorant";
import {
  BODY_BUTTER_RETAIL_CENTS,
  BODY_WASH_RETAIL_CENTS,
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
  isCareBasketButterScent,
  isCareBasketDeodorant,
  isCareBasketLotionScent,
  isCareBasketWash,
  isElementsCareBasketMetadata,
  isElementsCareBasketProduct,
  parseElementsCareBasketSelection,
} from "./elementsCareBasket";
import { BODY_BUTTER_SCENT_NAMES } from "./elementsBodyButter";
import { ELEMENTS_DUO_WASH_OPTIONS } from "./elementsDuo";

test("Elements Care Basket is $40: $46 separate, save $6", () => {
  assert.equal(BODY_WASH_RETAIL_CENTS, 1000);
  assert.equal(BODY_BUTTER_RETAIL_CENTS, 1200);
  assert.equal(BUTTER_LOTION_UNIT_PRICE_CENTS, 1200);
  assert.equal(DEODORANT_UNIT_PRICE_CENTS, 1200);
  assert.equal(ELEMENTS_CARE_BASKET_SEPARATE_CENTS, 4600);
  assert.equal(ELEMENTS_CARE_BASKET_PRICE_CENTS, 4000);
  assert.equal(ELEMENTS_CARE_BASKET_SAVINGS_CENTS, 600);
  assert.equal(elementsCareBasketPriceDollars(), 40);
  assert.equal(elementsCareBasketSeparateDollars(), 46);
  assert.equal(elementsCareBasketSavingsDollars(), 6);
});

test("encodes and parses all four basket selections", () => {
  const encoded = encodeElementsCareBasketSelection({
    wash: "Island Tranquility",
    butterScent: "Forbidden Taste",
    lotionScent: "Island Tranquility",
    deodorant: "Lavender",
  });
  assert.equal(
    encoded,
    "Island Tranquility|Forbidden Taste|Island Tranquility|Lavender",
  );
  assert.deepEqual(parseElementsCareBasketSelection(encoded), {
    wash: "Island Tranquility",
    butterScent: "Forbidden Taste",
    lotionScent: "Island Tranquility",
    deodorant: "Lavender",
  });
});

test("parse accepts legacy five-part baskets with body oils", () => {
  assert.deepEqual(
    parseElementsCareBasketSelection(
      "Cocoa Mango|Too Tempting|Lavender|Prada|YSL",
    ),
    {
      wash: "Cocoa Mango",
      butterScent: "Too Tempting",
      lotionScent: "",
      deodorant: "Lavender",
      bodyOil1: "Prada",
      bodyOil2: "YSL",
    },
  );
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
  assert.equal(isCareBasketLotionScent("Vanilla Bliss"), true);
  assert.equal(isCareBasketLotionScent("Forbidden Taste"), false);
  assert.equal(isCareBasketDeodorant(CARE_BASKET_DEODORANT_OPTIONS[0]), true);
  assert.equal(isCareBasketDeodorant("Rose"), false);
  assert.equal(ELEMENTS_DUO_WASH_OPTIONS.length, 4);
  assert.equal(CARE_BASKET_DEODORANT_OPTIONS.length, 2);
});

test("order note names every item for fulfillment", () => {
  assert.equal(
    elementsCareBasketOrderNote({
      wash: "Cocoa Mango",
      butterScent: "Too Tempting",
      lotionScent: "Cocoa Mango",
      deodorant: "Sandalwood & Teakwood",
    }),
    "3-in-1 wash: Cocoa Mango | Body butter: Too Tempting | Butter lotion: Cocoa Mango | Deodorant: Sandalwood & Teakwood",
  );
});
