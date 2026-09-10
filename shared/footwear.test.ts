import assert from "node:assert/strict";
import test from "node:test";
import { checkCustomization } from "./customization";
import {
  DEFAULT_FOOTWEAR_PLACEMENTS,
  encodeFootwearSize,
  formatFootwearPlacementNote,
  normalizeFootwearPlacements,
  parseFootwearSize,
  FOOTWEAR_CUSTOMIZABLE_META,
} from "./footwear";

const FOOTWEAR_META = {
  category: "Footwear",
  productType: "apparel",
  footwearCustomizable: FOOTWEAR_CUSTOMIZABLE_META,
};

test("footwear size encoding and parsing", () => {
  const encoded = encodeFootwearSize("Men", "10");
  assert.equal(encoded, "Men's 10");
  assert.deepEqual(parseFootwearSize(encoded), { gender: "Men", size: "10" });
  assert.equal(parseFootwearSize("Women's 8.5")?.size, "8.5");
  assert.equal(parseFootwearSize("invalid"), null);
});

test("footwear requires brand logo and size", () => {
  const missing = checkCustomization(FOOTWEAR_META, undefined, undefined, undefined, "Air Nitrogen");
  assert.equal(missing.ok, false);

  const sizeOnly = checkCustomization(
    FOOTWEAR_META,
    undefined,
    undefined,
    "Men's 10",
    "Air Nitrogen",
  );
  assert.equal(sizeOnly.ok, false);

  const ok = checkCustomization(
    FOOTWEAR_META,
    "Apparel Logo",
    undefined,
    "Men's 10",
    "Air Nitrogen",
  );
  assert.equal(ok.ok, false);

  const withRealLogo = checkCustomization(
    FOOTWEAR_META,
    "Gold 3D Emblem",
    undefined,
    "Women's 9",
    "Air Nitrogen",
    undefined,
    "/media-files/custom-designs/test.png",
    DEFAULT_FOOTWEAR_PLACEMENTS,
  );
  assert.equal(withRealLogo.ok, true);
  assert.match(withRealLogo.note || "", /Logo: Gold 3D Emblem/);
  assert.match(withRealLogo.note || "", /Size: Women's 9/);
  assert.match(withRealLogo.note || "", /Custom design:/);
  assert.match(withRealLogo.note || "", /Placement: Tongue, Side Panel/);
  assert.equal(withRealLogo.upchargeCents, 300);
});

test("footwear requires at least one valid placement", () => {
  const missing = checkCustomization(
    FOOTWEAR_META,
    "Gold 3D Emblem",
    undefined,
    "Men's 10",
    "Air Nitrogen",
  );
  assert.equal(missing.ok, false);

  const invalid = checkCustomization(
    FOOTWEAR_META,
    "Gold 3D Emblem",
    undefined,
    "Men's 10",
    "Air Nitrogen",
    undefined,
    undefined,
    ["invalid"],
  );
  assert.equal(invalid.ok, false);
});

test("footwear placement helpers normalize all-over as exclusive", () => {
  assert.deepEqual(normalizeFootwearPlacements(["tongue", "side"]), ["tongue", "side"]);
  assert.deepEqual(
    normalizeFootwearPlacements(["all-over", "tongue"]),
    ["all-over"],
  );
  assert.equal(
    formatFootwearPlacementNote(["heel", "back"]),
    "Placement: Heel, Back",
  );
});

test("logo-customizable apparel accepts optional custom design upload", () => {
  const apparelMeta = { productType: "apparel", category: "Accessories" };
  const ok = checkCustomization(
    apparelMeta,
    "Gold 3D Emblem",
    undefined,
    "M",
    "Custom Tee",
    undefined,
    "/media-files/custom-designs/shirt.png",
  );
  assert.equal(ok.ok, true);
  assert.match(ok.note || "", /Custom design:/);
});
