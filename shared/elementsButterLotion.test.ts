import assert from "node:assert/strict";
import test from "node:test";
import { COCOA_SHEA_BUTTER_LINE_NAME } from "./elementsRetired";
import {
  BUTTER_LOTION_SCENT_NAMES,
  BUTTER_LOTION_WASH_MATCHED_SCENTS,
  butterLotionScentForWash,
  isButterLotionScent,
  isElementsButterLotionProduct,
} from "./elementsButterLotion";

test("butter lotion lineup matches 3-in-1 washes (except men's energizing)", () => {
  assert.equal(BUTTER_LOTION_WASH_MATCHED_SCENTS.length, 3);
  assert.equal(BUTTER_LOTION_SCENT_NAMES.length, 3);
});

test("wash picks suggest the matching lotion scent", () => {
  assert.equal(butterLotionScentForWash("Cocoa Mango"), "Cocoa Mango");
  assert.equal(butterLotionScentForWash("Island Tranquility"), "Island Tranquility");
  assert.equal(butterLotionScentForWash("Avocado Oil"), "100% Avocado Oil");
  assert.equal(butterLotionScentForWash("Men's Energizing Scent"), undefined);
});

test("validates lotion scent names", () => {
  assert.equal(isButterLotionScent("Cocoa Mango"), true);
  assert.equal(isButterLotionScent(COCOA_SHEA_BUTTER_LINE_NAME), false);
  assert.equal(isButterLotionScent("Vanilla Bliss"), false);
  assert.equal(isButterLotionScent("Forbidden Taste"), false);
});

test("identifies butter lotion SKU", () => {
  assert.equal(isElementsButterLotionProduct("price_kkbutterlotion", "x"), true);
  assert.equal(isElementsButterLotionProduct("x", "Scented Butter Lotion"), true);
  assert.equal(isElementsButterLotionProduct("x", "Body Oil"), false);
});
