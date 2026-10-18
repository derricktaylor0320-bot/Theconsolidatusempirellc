import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  BODY_BUTTER_LEGACY_NAME,
  BODY_BUTTER_LINE_NAME,
  BODY_BUTTER_SCENT_CATEGORY_ORDER,
  BODY_BUTTER_SCENT_NAMES,
  BODY_BUTTER_SCENT_OPTIONS,
  BODY_BUTTER_TRIPLE_PRICE_CENTS,
  BODY_BUTTER_UNIT_PRICE_CENTS,
  bodyButterBundlePitch,
  bodyButterPricingLabel,
  bodyButterScentCategoryLabel,
  bodyButterScentNotes,
  bodyButterScentsByCategory,
  bodyButterTotalCents,
  isBodyButterProductTitle,
  isElementsBodyButterProduct,
} from "./elementsBodyButter";

describe("elementsBodyButter pricing", () => {
  test("single and triple tiers", () => {
    assert.equal(bodyButterTotalCents(1), BODY_BUTTER_UNIT_PRICE_CENTS);
    assert.equal(bodyButterTotalCents(3), BODY_BUTTER_TRIPLE_PRICE_CENTS);
  });

  test("larger quantities use the best pack mix", () => {
    assert.equal(bodyButterTotalCents(4), 4200);
    assert.equal(bodyButterTotalCents(5), 5400);
    assert.equal(bodyButterTotalCents(6), 6000);
    assert.equal(bodyButterTotalCents(7), 7200);
  });

  test("pricing label, bundle pitch, and product detection", () => {
    assert.match(bodyButterPricingLabel(), /\$12/);
    assert.match(bodyButterPricingLabel(), /\$30/);
    assert.match(bodyButterBundlePitch(), /Buy 2, Get 1 50% Off/);
    assert.match(bodyButterBundlePitch(), /Save \$6/);
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
