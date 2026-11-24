import assert from "node:assert/strict";
import test from "node:test";
import {
  CUSTOM_BUTTER_LOTION_LINE_NAME,
  CUSTOM_BUTTER_LOTION_SCENT_NAMES,
  CUSTOM_BUTTER_LOTION_UNIT_PRICE_CENTS,
  customButterLotionScentNotes,
  customButterLotionUnitPriceDollars,
  isCustomButterLotionScent,
  isElementsCustomButterLotionProduct,
} from "./elementsCustomButterLotion";

test("custom butter lotion stays at $12 per jar", () => {
  assert.equal(CUSTOM_BUTTER_LOTION_UNIT_PRICE_CENTS, 1200);
  assert.equal(customButterLotionUnitPriceDollars(), 12);
  assert.equal(CUSTOM_BUTTER_LOTION_LINE_NAME, "Custom Butter Lotion");
});

test("custom line lists eight confidence-in-a-jar scents", () => {
  assert.equal(CUSTOM_BUTTER_LOTION_SCENT_NAMES.length, 8);
  assert.ok(CUSTOM_BUTTER_LOTION_SCENT_NAMES.includes("Delicious Vulva"));
  assert.ok(CUSTOM_BUTTER_LOTION_SCENT_NAMES.includes("Pure Havoc"));
  assert.ok(CUSTOM_BUTTER_LOTION_SCENT_NAMES.includes("Khomplete Khemistri"));
  assert.equal(
    customButterLotionScentNotes("Dark Chemistry"),
    "Coffee & Sweet Tobacco",
  );
});

test("validates custom lotion scent names", () => {
  assert.equal(isCustomButterLotionScent("Velvet Desire"), true);
  assert.equal(isCustomButterLotionScent("Sinful Seduction"), true);
  assert.equal(isCustomButterLotionScent("Island Tranquility"), false);
  assert.equal(isCustomButterLotionScent("Forbidden Taste"), false);
});

test("identifies custom butter lotion SKU", () => {
  assert.equal(
    isElementsCustomButterLotionProduct("price_kkcustombutterlotion", "x"),
    true,
  );
  assert.equal(
    isElementsCustomButterLotionProduct("x", "Custom Butter Lotion"),
    true,
  );
  assert.equal(
    isElementsCustomButterLotionProduct("x", "Scented Butter Lotion"),
    false,
  );
});
