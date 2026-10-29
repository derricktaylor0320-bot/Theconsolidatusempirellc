import assert from "node:assert/strict";
import test from "node:test";
import {
  MULTIPLE_PLACEMENT_SURCHARGE_CENTS,
  checkCustomization,
  customizationErrorMessage,
  placementSurchargeCents,
  placementSurchargeDollars,
} from "./customization";
import { encodeElementsDuoSelection } from "./elementsDuo";
import {
  encodeElementsCareBasketSelection,
} from "./elementsCareBasket";

test("one print location is included in the garment price", () => {
  assert.equal(placementSurchargeCents(0), 0);
  assert.equal(placementSurchargeCents(1), 0);
  assert.equal(placementSurchargeDollars(1), 0);
});

test("multiple print locations add one flat $3 fee", () => {
  assert.equal(MULTIPLE_PLACEMENT_SURCHARGE_CENTS, 300);
  assert.equal(placementSurchargeCents(2), 300);
  assert.equal(placementSurchargeCents(6), 300);
  assert.equal(placementSurchargeDollars(2), 3);
});

test("invalid placement counts never add a fee", () => {
  assert.equal(placementSurchargeCents(undefined), 0);
  assert.equal(placementSurchargeCents("2"), 0);
  assert.equal(placementSurchargeCents(Number.NaN), 0);
});

const DUO_META = {
  customize: "none",
  scented: "true",
  scentOptions:
    "Forbidden Taste, Too Tempting, Pure Havoc, Midnight Habit, Sinfull Seduction, Dark Chemistry, Uncensored, Wicked Touch, Raw Attraction, After Dark, Lethal Charm, Sweet Addiction, Velvet Desire, Guilty Pleasure, Dangerous Craving, Delicious Lava, Delicious Vulva",
  elementsDuo: "true",
  productType: "elements",
};

test("Elements Duo requires a wash and a body butter scent", () => {
  const missing = checkCustomization(DUO_META, undefined, undefined, undefined, "Elements Duo");
  assert.equal(missing.ok, false);
  assert.equal(missing.kind, "duo");

  const washOnly = checkCustomization(
    DUO_META,
    undefined,
    undefined,
    undefined,
    "Elements Duo",
    "Island Tranquility",
  );
  assert.equal(washOnly.ok, false);
  assert.equal(washOnly.kind, "duo");

  const ok = checkCustomization(
    DUO_META,
    undefined,
    undefined,
    undefined,
    "Elements Trio",
    encodeElementsDuoSelection(
      "Island Tranquility",
      "Forbidden Taste",
      "Island Tranquility",
      "Lavender",
    ),
  );
  assert.equal(ok.ok, true);
  assert.equal(ok.kind, "duo");
  assert.match(ok.note || "", /3-in-1 wash: Island Tranquility/);
  assert.match(ok.note || "", /Deodorant: Lavender/);
});

test("Elements Duo rejects an unknown wash or butter scent", () => {
  const badWash = checkCustomization(
    DUO_META,
    undefined,
    undefined,
    undefined,
    "Elements Duo",
    encodeElementsDuoSelection("Fake Wash", "Forbidden Taste", "Island Tranquility", "Lavender"),
  );
  assert.equal(badWash.ok, false);

  const badButter = checkCustomization(
    DUO_META,
    undefined,
    undefined,
    undefined,
    "Elements Duo",
    encodeElementsDuoSelection("Cocoa Mango", "Not A Scent", "Cocoa Mango", "Lavender"),
  );
  assert.equal(badButter.ok, false);
});

test("Elements Care Basket checkout copy asks for all picks", () => {
  assert.match(
    customizationErrorMessage("careBasket", "Elements Care Basket"),
    /wash, body butter, butter lotion, and deodorant/,
  );
});

const CARE_BASKET_META = {
  customize: "none",
  scented: "true",
  scentOptions:
    "Forbidden Taste, Too Tempting, Pure Havoc, Midnight Habit, Sinfull Seduction, Dark Chemistry, Uncensored, Wicked Touch, Raw Attraction, After Dark, Lethal Charm, Sweet Addiction, Velvet Desire, Guilty Pleasure, Dangerous Craving, Delicious Lava, Delicious Vulva",
  elementsCareBasket: "true",
  productType: "elements",
};

test("Elements Care Basket requires all four scent picks", () => {
  const missing = checkCustomization(
    CARE_BASKET_META,
    undefined,
    undefined,
    undefined,
    "Elements Care Basket",
  );
  assert.equal(missing.ok, false);
  assert.equal(missing.kind, "careBasket");

  const ok = checkCustomization(
    CARE_BASKET_META,
    undefined,
    undefined,
    undefined,
    "Elements Care Basket",
    encodeElementsCareBasketSelection({
      wash: "Cocoa Mango",
      butterScent: "Forbidden Taste",
      lotionScent: "Cocoa Mango",
      deodorant: "Lavender",
    }),
  );
  assert.equal(ok.ok, true);
  assert.equal(ok.kind, "careBasket");
  assert.match(ok.note || "", /3-in-1 wash: Cocoa Mango/);
  assert.match(ok.note || "", /Butter lotion: Cocoa Mango/);
});

test("Elements Quad checkout copy asks for wash, butter, lotion, and deodorant", () => {
  assert.match(
    customizationErrorMessage("duo", "Elements Quad"),
    /body wash, body butter scent, butter lotion scent, and deodorant/,
  );
});
