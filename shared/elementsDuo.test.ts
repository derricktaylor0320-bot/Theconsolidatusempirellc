import assert from "node:assert/strict";
import test from "node:test";
import {
  BODY_BUTTER_DUO_CENTS,
  BODY_BUTTER_RETAIL_CENTS,
  BODY_WASH_RETAIL_CENTS,
  ELEMENTS_DUO_NAME,
  ELEMENTS_DUO_PRICE_CENTS,
  ELEMENTS_DUO_PRICE_ID,
  ELEMENTS_DUO_SAVINGS_CENTS,
  ELEMENTS_DUO_SEPARATE_CENTS,
  ELEMENTS_DUO_WASH_OPTIONS,
  elementsDuoOrderNote,
  elementsDuoPriceDollars,
  elementsDuoSavingsDollars,
  elementsDuoSeparateDollars,
  encodeElementsDuoSelection,
  isElementsBodyButterTitle,
  isElementsBodyWashTitle,
  isElementsDuoMetadata,
  isElementsDuoProduct,
  isElementsDuoWash,
  parseElementsDuoSelection,
} from "./elementsDuo";
import { BODY_BUTTER_LEGACY_NAME, BODY_BUTTER_LINE_NAME } from "./elementsBodyButter";

test("Elements Duo is $22: $15 wash + $7 butter, $8 off $30", () => {
  assert.equal(BODY_WASH_RETAIL_CENTS, 1500);
  assert.equal(BODY_BUTTER_RETAIL_CENTS, 1500);
  assert.equal(BODY_BUTTER_DUO_CENTS, 700);
  assert.equal(ELEMENTS_DUO_PRICE_CENTS, 2200);
  assert.equal(ELEMENTS_DUO_SEPARATE_CENTS, 3000);
  assert.equal(ELEMENTS_DUO_SAVINGS_CENTS, 800);
  assert.equal(elementsDuoPriceDollars(), 22);
  assert.equal(elementsDuoSeparateDollars(), 30);
  assert.equal(elementsDuoSavingsDollars(), 8);
});

test("encodes and parses wash + body butter scent", () => {
  const encoded = encodeElementsDuoSelection(
    "Island Tranquility",
    "Forbidden Taste",
  );
  assert.equal(encoded, "Island Tranquility \u2014 Forbidden Taste");
  assert.deepEqual(parseElementsDuoSelection(encoded), {
    wash: "Island Tranquility",
    butterScent: "Forbidden Taste",
  });
});

test("parse rejects missing or one-sided selections", () => {
  assert.equal(parseElementsDuoSelection(""), null);
  assert.equal(parseElementsDuoSelection("Island Tranquility"), null);
  assert.equal(parseElementsDuoSelection(" \u2014 Forbidden Taste"), null);
  assert.equal(parseElementsDuoSelection(undefined), null);
});

test("identifies the Duo SKU by price id or exact title", () => {
  assert.equal(isElementsDuoProduct(ELEMENTS_DUO_PRICE_ID, "Anything"), true);
  assert.equal(isElementsDuoProduct("price_other", ELEMENTS_DUO_NAME), true);
  assert.equal(isElementsDuoProduct("price_other", "Elements Duo "), true);
  assert.equal(isElementsDuoProduct("price_other", "Cocoa Mango"), false);
  assert.equal(isElementsDuoMetadata({ elementsDuo: "true" }), true);
  assert.equal(isElementsDuoMetadata({ elementsDuo: "false" }), false);
});

test("wash and butter title helpers match the standalone SKUs", () => {
  assert.equal(isElementsBodyWashTitle("Island Tranquility"), true);
  assert.equal(isElementsBodyWashTitle("100% Avocado Oil"), true);
  assert.equal(isElementsBodyWashTitle("Cocoa Mango"), true);
  assert.equal(
    isElementsBodyWashTitle("Men's Moisturizing Energizing Scent"),
    true,
  );
  assert.equal(isElementsBodyWashTitle(BODY_BUTTER_LEGACY_NAME), false);
  assert.equal(isElementsBodyButterTitle(BODY_BUTTER_LEGACY_NAME), true);
  assert.equal(isElementsBodyButterTitle(BODY_BUTTER_LINE_NAME), true);
  assert.equal(isElementsBodyButterTitle("Cocoa Mango"), false);
  assert.equal(isElementsDuoWash("Cocoa Mango"), true);
  assert.equal(isElementsDuoWash("Lavender"), false);
  assert.equal(ELEMENTS_DUO_WASH_OPTIONS.length, 4);
});

test("order note names both items for fulfillment", () => {
  assert.equal(
    elementsDuoOrderNote({
      wash: "Cocoa Mango",
      butterScent: "Too Tempting",
    }),
    "3-in-1 wash: Cocoa Mango | Body butter: Too Tempting",
  );
});
