import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LEGACY_SEA_MOSS_GEL_NAME,
  SEA_MOSS_GEL_HERITAGE_TAGLINE,
  SEA_MOSS_GEL_IMAGES,
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

test("five sea moss gels use uploaded jar photos", () => {
  const withPhotos = SEA_MOSS_GELS.filter((g) =>
    g.imageUrl.startsWith("/attached_assets/sea-moss-gels/"),
  );
  assert.equal(withPhotos.length, 5);
  assert.equal(
    SEA_MOSS_GELS.find((g) => g.id === "original")?.imageUrl,
    SEA_MOSS_GEL_IMAGES.original,
  );
  assert.equal(
    SEA_MOSS_GELS.find((g) => g.id === "healthy-heart")?.imageUrl,
    SEA_MOSS_GEL_IMAGES.healthyHeart,
  );
});

test("sea moss gel descriptions use submitted blend copy", () => {
  const heart = SEA_MOSS_GELS.find((g) => g.id === "healthy-heart");
  assert.ok(heart);
  assert.match(
    seaMossGelDescription(heart!),
    /Supports heart health, circulation, and energy\./,
  );

  const immune = SEA_MOSS_GELS.find((g) => g.id === "immune-booster");
  assert.ok(immune);
  assert.match(
    seaMossGelDescription(immune!),
    /Improves respiratory function and helps clear mucus\./,
  );

  const moon = SEA_MOSS_GELS.find((g) => g.id === "peaceful-moon-cycle");
  assert.ok(moon);
  assert.match(
    seaMossGelDescription(moon!),
    /Supports women's hormonal balance, mood wellness, and menstrual comfort\./,
  );
  assert.match(seaMossGelDescription(moon!), new RegExp(SEA_MOSS_GEL_HERITAGE_TAGLINE, "i"));
});

test("isSeaMossGelProduct matches priceId and title", () => {
  const gel = SEA_MOSS_GELS[3];
  assert.equal(isSeaMossGelProduct(gel.priceId, null), true);
  assert.equal(isSeaMossGelProduct(null, gel.name), true);
  assert.equal(isSeaMossGelProduct(null, LEGACY_SEA_MOSS_GEL_NAME), false);
});
