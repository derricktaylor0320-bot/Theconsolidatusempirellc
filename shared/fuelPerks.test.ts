import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FUEL_PERKS_TIERS,
  formatFuelPerksPriceRange,
  formatFuelPerksTierLabel,
  getDefaultFuelPerksTier,
  getFuelPerksTierById,
} from "./fuelPerks.ts";

describe("fuelPerks tiers", () => {
  it("exposes three membership tiers at $19.99, $29.99, and $39.99", () => {
    assert.equal(FUEL_PERKS_TIERS.length, 3);
    assert.deepEqual(
      FUEL_PERKS_TIERS.map((t) => t.monthlyFee),
      [19.99, 29.99, 39.99],
    );
  });

  it("marks Fleet Pro as the most popular mid tier", () => {
    const pro = getFuelPerksTierById("pro");
    assert.ok(pro);
    assert.equal(pro!.monthlyFee, 29.99);
    assert.equal(pro!.mostPopular, true);
    assert.equal(getDefaultFuelPerksTier().id, "pro");
  });

  it("increases cents-per-gallon savings with tier price", () => {
    const rates = FUEL_PERKS_TIERS.map((t) => t.centsPerGallon);
    assert.deepEqual(rates, [5, 8, 12]);
    for (let i = 1; i < rates.length; i++) {
      assert.ok(rates[i] > rates[i - 1]);
    }
  });

  it("resolves tiers by id and formats labels", () => {
    const elite = getFuelPerksTierById("elite");
    assert.ok(elite);
    assert.equal(formatFuelPerksTierLabel(elite!), "Premium Elite ($39.99/mo)");
    assert.equal(formatFuelPerksPriceRange(), "$19.99–$39.99/mo");
    assert.equal(getFuelPerksTierById("unknown")?.id, undefined);
  });
});
