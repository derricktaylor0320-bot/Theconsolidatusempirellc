import assert from "node:assert/strict";
import test from "node:test";
import { COCOA_SHEA_BUTTER_LINE_NAME } from "./elementsRetired";
import {
  BUTTER_LOTION_SCENT_NAMES,
  BUTTER_LOTION_UNIT_PRICE_CENTS,
  BUTTER_LOTION_WASH_MATCHED_SCENTS,
  butterLotionScentForWash,
  butterLotionScentNotes,
  butterLotionUnitPriceDollars,
  isButterLotionScent,
  isElementsButterLotionProduct,
} from "./elementsButterLotion";

test("butter lotion is $10 per 4 oz jar", () => {
  assert.equal(BUTTER_LOTION_UNIT_PRICE_CENTS, 1000);
  assert.equal(butterLotionUnitPriceDollars(), 10);
});

test("butter lotion lineup includes wash-matched and everyday scents", () => {
  assert.equal(BUTTER_LOTION_WASH_MATCHED_SCENTS.length, 4);
  assert.equal(BUTTER_LOTION_SCENT_NAMES.length, 14);
  assert.ok(BUTTER_LOTION_SCENT_NAMES.includes("Apple Pear"));
  assert.ok(BUTTER_LOTION_SCENT_NAMES.includes("Whispering Rose"));
  assert.ok(BUTTER_LOTION_SCENT_NAMES.includes("100% Avocado Oil"));
});

test("wash picks suggest the matching lotion scent", () => {
  assert.equal(butterLotionScentForWash("Cocoa Mango"), "Cocoa Mango");
  assert.equal(butterLotionScentForWash("Island Tranquility"), "Island Tranquility");
  assert.equal(butterLotionScentForWash("Avocado Oil"), "100% Avocado Oil");
  assert.equal(
    butterLotionScentForWash("Men's Energizing Scent"),
    "Men's Energizing Scent",
  );
});

test("validates lotion scent names and notes", () => {
  assert.equal(isButterLotionScent("Cocoa Mango"), true);
  assert.equal(isButterLotionScent("Vanilla Sugar Bliss"), true);
  assert.equal(isButterLotionScent(COCOA_SHEA_BUTTER_LINE_NAME), false);
  assert.equal(isButterLotionScent("Vanilla Bliss"), false);
  assert.equal(isButterLotionScent("Forbidden Taste"), false);
  assert.equal(
    butterLotionScentNotes("Island Tranquility"),
    "Grapefruit & Lemongrass",
  );
});

test("identifies butter lotion SKU", () => {
  assert.equal(isElementsButterLotionProduct("price_kkbutterlotion", "x"), true);
  assert.equal(isElementsButterLotionProduct("x", "Scented Butter Lotion"), true);
  assert.equal(isElementsButterLotionProduct("x", "Custom Butter Lotion"), false);
  assert.equal(isElementsButterLotionProduct("x", "Body Oil"), false);
});
