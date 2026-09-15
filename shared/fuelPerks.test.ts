import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FUEL_PERKS_PAID_TIERS,
  FUEL_PERKS_TIERS,
  formatFuelPerksPriceRange,
  formatFuelPerksTierLabel,
  getDefaultFuelPerksTier,
  getFuelPerksProgramConfig,
  getFuelPerksTierById,
} from "./fuelPerks.ts";

describe("fuelPerks tiers", () => {
  it("exposes four tiers including free Member Access and three paid tiers", () => {
    assert.equal(FUEL_PERKS_TIERS.length, 4);
    assert.equal(FUEL_PERKS_PAID_TIERS.length, 3);
    assert.deepEqual(
      FUEL_PERKS_PAID_TIERS.map((t) => t.monthlyFee),
      [19.99, 29.99, 39.99],
    );
  });

  it("marks Pro Partner as the default paid tier", () => {
    const pro = getFuelPerksTierById("pro");
    assert.ok(pro);
    assert.equal(pro!.monthlyFee, 29.99);
    assert.equal(pro!.mostPopular, true);
    assert.equal(getDefaultFuelPerksTier().id, "pro");
  });

  it("increases cents-per-gallon savings with paid tier price", () => {
    const rates = FUEL_PERKS_PAID_TIERS.map((t) => t.centsPerGallon);
    assert.deepEqual(rates, [5, 8, 12]);
    for (let i = 1; i < rates.length; i++) {
      assert.ok(rates[i]! > rates[i - 1]!);
    }
  });

  it("includes affiliate commission and growth content in program config", () => {
    const config = getFuelPerksProgramConfig();
    assert.ok(config.payoutExplainer.howMoneyFlows.length >= 5);
    assert.ok(config.featureGuides.length >= 7);
    assert.ok(config.tierComparison.length >= 10);
    assert.equal(config.paidTiers[2].potentialCommissionLabel, "~25% potential recurring share");
  });

  it("resolves tiers by id and formats labels", () => {
    const elite = getFuelPerksTierById("elite");
    assert.ok(elite);
    assert.equal(formatFuelPerksTierLabel(elite!), "Elite Premium ($39.99/mo)");
    assert.equal(formatFuelPerksPriceRange(), "$19.99–$39.99/mo");
    assert.equal(getFuelPerksTierById("unknown")?.id, undefined);
  });
});
