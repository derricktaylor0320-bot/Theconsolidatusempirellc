import assert from "node:assert/strict";
import test from "node:test";
import { DEODORANT_UNIT_PRICE_CENTS } from "./elementsDeodorant";
import {
  BODY_BUTTER_RETAIL_CENTS,
  BODY_WASH_RETAIL_CENTS,
  ELEMENTS_DUO_NAME,
  ELEMENTS_DUO_PRICE_CENTS,
  ELEMENTS_DUO_PRICE_ID,
  ELEMENTS_DUO_SAVINGS_CENTS,
  ELEMENTS_DUO_SEPARATE_CENTS,
  ELEMENTS_DUO_WASH_OPTIONS,
  ELEMENTS_TRIO_FLEA_MARKET_CENTS,
  elementsDuoOrderNote,
  elementsDuoPriceDollars,
  elementsDuoSavingsDollars,
  elementsDuoSeparateDollars,
  elementsTrioFleaMarketPriceDollars,
  encodeElementsDuoSelection,
  isElementsBodyButterTitle,
  isElementsBodyWashTitle,
  isElementsDuoDeodorant,
  isElementsDuoMetadata,
  isElementsDuoProduct,
  isElementsDuoWash,
  parseElementsDuoSelection,
} from "./elementsDuo";
import { BODY_BUTTER_LEGACY_NAME, BODY_BUTTER_LINE_NAME } from "./elementsBodyButter";

test("Elements Trio is $30: $34 separate, save $4; flea market $28", () => {
  assert.equal(BODY_WASH_RETAIL_CENTS, 1000);
  assert.equal(BODY_BUTTER_RETAIL_CENTS, 1200);
  assert.equal(DEODORANT_UNIT_PRICE_CENTS, 1200);
  assert.equal(ELEMENTS_DUO_SEPARATE_CENTS, 3400);
  assert.equal(ELEMENTS_DUO_PRICE_CENTS, 3000);
  assert.equal(ELEMENTS_DUO_SAVINGS_CENTS, 400);
  assert.equal(ELEMENTS_TRIO_FLEA_MARKET_CENTS, 2800);
  assert.equal(elementsDuoPriceDollars(), 30);
  assert.equal(elementsDuoSeparateDollars(), 34);
  assert.equal(elementsDuoSavingsDollars(), 4);
  assert.equal(elementsTrioFleaMarketPriceDollars(), 28);
});

test("encodes and parses wash, body butter, and deodorant", () => {
  const encoded = encodeElementsDuoSelection(
    "Island Tranquility",
    "Forbidden Taste",
    "Lavender",
  );
  assert.equal(encoded, "Island Tranquility|Forbidden Taste|Lavender");
  assert.deepEqual(parseElementsDuoSelection(encoded), {
    wash: "Island Tranquility",
    butterScent: "Forbidden Taste",
    deodorant: "Lavender",
  });
});

test("parse accepts legacy em-dash duo carts without deodorant", () => {
  assert.deepEqual(parseElementsDuoSelection("Island Tranquility \u2014 Forbidden Taste"), {
    wash: "Island Tranquility",
    butterScent: "Forbidden Taste",
    deodorant: "",
  });
});

test("parse rejects missing or incomplete selections", () => {
  assert.equal(parseElementsDuoSelection(""), null);
  assert.equal(parseElementsDuoSelection("Island Tranquility"), null);
  assert.equal(parseElementsDuoSelection("Island Tranquility|Forbidden Taste"), null);
  assert.equal(parseElementsDuoSelection(undefined), null);
});

test("identifies the Trio SKU by price id or title", () => {
  assert.equal(isElementsDuoProduct(ELEMENTS_DUO_PRICE_ID, "Anything"), true);
  assert.equal(isElementsDuoProduct("price_other", ELEMENTS_DUO_NAME), true);
  assert.equal(isElementsDuoProduct("price_other", "Elements Trio "), true);
  assert.equal(isElementsDuoProduct("price_other", "Elements Duo "), true);
  assert.equal(isElementsDuoProduct("price_other", "Cocoa Mango"), false);
  assert.equal(isElementsDuoMetadata({ elementsDuo: "true" }), true);
  assert.equal(isElementsDuoMetadata({ elementsDuo: "false" }), false);
});

test("wash, butter, and deodorant validators match the standalone SKUs", () => {
  assert.equal(isElementsBodyWashTitle("Avocado Oil"), true);
  assert.equal(isElementsBodyWashTitle("Cocoa & Shea Butter"), false);
  assert.equal(isElementsBodyButterTitle(BODY_BUTTER_LEGACY_NAME), true);
  assert.equal(isElementsBodyButterTitle(BODY_BUTTER_LINE_NAME), true);
  assert.equal(isElementsDuoWash("Cocoa Mango"), true);
  assert.equal(isElementsDuoDeodorant("Lavender"), true);
  assert.equal(isElementsDuoDeodorant("Rose"), false);
  assert.equal(ELEMENTS_DUO_WASH_OPTIONS.length, 4);
});

test("order note names every item for fulfillment", () => {
  assert.equal(
    elementsDuoOrderNote({
      wash: "Cocoa Mango",
      butterScent: "Too Tempting",
      deodorant: "Sandalwood & Teakwood",
    }),
    "3-in-1 wash: Cocoa Mango | Body butter: Too Tempting | Deodorant: Sandalwood & Teakwood",
  );
});
