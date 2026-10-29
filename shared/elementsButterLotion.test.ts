import assert from "node:assert/strict";
import test from "node:test";
import {
  BUTTER_LOTION_SCENT_NAMES,
  BUTTER_LOTION_WASH_MATCHED_SCENTS,
  butterLotionScentForWash,
  isButterLotionScent,
  isElementsButterLotionProduct,
} from "./elementsButterLotion";

test("butter lotion lineup: 3 wash-matched + 5 extra scents", () => {
  assert.equal(BUTTER_LOTION_WASH_MATCHED_SCENTS.length, 3);
  assert.equal(BUTTER_LOTION_SCENT_NAMES.length, 8);
});

test("wash picks suggest the matching lotion scent", () => {
  assert.equal(butterLotionScentForWash("Cocoa Mango"), "Cocoa Mango");
  assert.equal(butterLotionScentForWash("Island Tranquility"), "Island Tranquility");
  assert.equal(butterLotionScentForWash("Avocado Oil"), "100% Avocado Oil");
  assert.equal(butterLotionScentForWash("Men's Energizing Scent"), undefined);
});

test("validates lotion scent names", () => {
  assert.equal(isButterLotionScent("Vanilla Bliss"), true);
  assert.equal(isButterLotionScent("Whispering Rose"), true);
  assert.equal(isButterLotionScent("Forbidden Taste"), false);
});

test("identifies butter lotion SKU", () => {
  assert.equal(isElementsButterLotionProduct("price_kkbutterlotion", "x"), true);
  assert.equal(isElementsButterLotionProduct("x", "Scented Butter Lotion"), true);
  assert.equal(isElementsButterLotionProduct("x", "Body Oil"), false);
});
