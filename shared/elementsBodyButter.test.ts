import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  BODY_BUTTER_LEGACY_NAME,
  BODY_BUTTER_LINE_NAME,
  BODY_BUTTER_SCENT_CATEGORY_ORDER,
  BODY_BUTTER_SCENT_NAMES,
  BODY_BUTTER_SCENT_OPTIONS,
  BODY_BUTTER_UNIT_PRICE_CENTS,
  bodyButterPricingLabel,
  bodyButterScentCategoryLabel,
  bodyButterScentNotes,
  bodyButterScentsByCategory,
  bodyButterTotalCents,
  isBodyButterProductTitle,
  isElementsBodyButterProduct,
} from "./elementsBodyButter";

describe("elementsBodyButter pricing", () => {
  test("single jar is $20", () => {
    assert.equal(bodyButterTotalCents(1), BODY_BUTTER_UNIT_PRICE_CENTS);
    assert.equal(bodyButterTotalCents(3), 6000);
  });

  test("larger quantities scale linearly", () => {
    assert.equal(bodyButterTotalCents(4), 8000);
    assert.equal(bodyButterTotalCents(5), 10000);
  });

  test("pricing label and product detection", () => {
    assert.match(bodyButterPricingLabel(), /\$20/);
    assert.equal(
      isElementsBodyButterProduct("price_kkbodybutter"),
      true,
    );
    assert.equal(
      isElementsBodyButterProduct(undefined, BODY_BUTTER_LINE_NAME),
      true,
    );
    assert.equal(
      isElementsBodyButterProduct(undefined, BODY_BUTTER_LEGACY_NAME),
      true,
    );
    assert.equal(isBodyButterProductTitle(BODY_BUTTER_LINE_NAME), true);
    assert.equal(isBodyButterProductTitle(BODY_BUTTER_LEGACY_NAME), true);
    assert.equal(isElementsBodyButterProduct(undefined, "BCAA Complex"), false);
  });
});

describe("elementsBodyButter scents", () => {
  test("catalog lists 18 named scents with notes", () => {
    assert.equal(BODY_BUTTER_SCENT_NAMES.length, 18);
    assert.equal(BODY_BUTTER_SCENT_OPTIONS.split(", ").length, 18);
    assert.equal(bodyButterScentNotes("Forbidden Taste"), "Rich Plum, Dark Berry & Vanilla Bourbon");
    assert.equal(bodyButterScentNotes("Delicious Vulva"), "Sweet Strawberry, Whipped Cream & Exotic Jasmine");
    assert.equal(bodyButterScentNotes("PHATT"), "Warm Amber, Spiced Vanilla & Soft Musk — Pretty Hot And Tempting To Touch");
    assert.equal(bodyButterScentNotes("Not A Scent"), undefined);
  });

  test("scents group by category for storefront display", () => {
    const grouped = bodyButterScentsByCategory();
    assert.equal(grouped["The Initial 3"].length, 3);
    assert.equal(grouped["Men's & Unisex"].length, 7);
    assert.equal(grouped["Sweet, Gourmand & Provocative"].length, 8);
    assert.equal(BODY_BUTTER_SCENT_CATEGORY_ORDER.length, 3);
    assert.equal(bodyButterScentCategoryLabel("The Initial 3"), null);
    assert.equal(bodyButterScentCategoryLabel("Men's & Unisex"), "Men's & Unisex");
  });
});
