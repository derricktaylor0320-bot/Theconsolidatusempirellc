import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LEGACY_SEA_MOSS_GEL_NAME,
  SEA_MOSS_GEL_PRICE_CENTS,
  SEA_MOSS_GELS,
  isSeaMossGelProduct,
  seaMossGelDescription,
} from "./elementsSeaMossGels";

test("holistic sea moss gels are $45 each", () => {
  assert.equal(SEA_MOSS_GEL_PRICE_CENTS, 4500);
});

test("seven sea moss gel SKUs are defined", () => {
  assert.equal(SEA_MOSS_GELS.length, 7);
  const names = SEA_MOSS_GELS.map((g) => g.name);
  assert.ok(names.includes("Original Sea Moss Gel"));
  assert.ok(names.includes("Healthy Heart Sea Moss Gel"));
  assert.ok(names.includes("Peaceful Moon Cycle Women's Sea Moss Gel"));
});

test("original sea moss gel mentions apothecary craftsmanship", () => {
  const original = SEA_MOSS_GELS.find((g) => g.id === "original");
  assert.ok(original);
  const desc = seaMossGelDescription(original!);
  assert.match(desc, /traditional herbal apothecary/i);
  assert.match(desc, /energy levels and mineral support/i);
});

test("holistic sea moss gel descriptions mention wellness intent", () => {
  const heart = SEA_MOSS_GELS.find((g) => g.id === "healthy-heart");
  assert.ok(heart);
  const desc = seaMossGelDescription(heart!);
  assert.match(desc, /holistic/i);
  assert.match(desc, /heart health, circulation, and energy/i);
});

test("isSeaMossGelProduct matches priceId and title", () => {
  const gel = SEA_MOSS_GELS[3];
  assert.equal(isSeaMossGelProduct(gel.priceId, null), true);
  assert.equal(isSeaMossGelProduct(null, gel.name), true);
  assert.equal(isSeaMossGelProduct(null, LEGACY_SEA_MOSS_GEL_NAME), false);
});
