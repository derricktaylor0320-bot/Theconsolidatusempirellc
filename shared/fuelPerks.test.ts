import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FUEL_PERKS_TIERS,
  buildFuelPerksTierProjections,
  formatFuelPerksPriceRange,
  formatFuelPerksTierLabel,
  formatUsd,
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

  it("maps tier price to per-gallon savings at 19, 29, and 39 cents", () => {
    assert.deepEqual(
      FUEL_PERKS_TIERS.map((t) => t.centsPerGallon),
      [19, 29, 39],
    );
  });

  it("marks Fleet Pro as the most popular mid tier", () => {
    const pro = getFuelPerksTierById("pro");
    assert.ok(pro);
    assert.equal(pro!.monthlyFee, 29.99);
    assert.equal(pro!.mostPopular, true);
    assert.equal(getDefaultFuelPerksTier().id, "pro");
  });

  it("projects illustrative monthly and annual utilization value", () => {
    const starter = buildFuelPerksTierProjections(getFuelPerksTierById("starter")!);
    assert.equal(starter.fuelSavingsMonthly, 15.2);
    assert.equal(starter.fuelSavingsAnnual, 182.4);
    assert.equal(starter.commissionRecurringMonthly, 15);
    assert.equal(starter.commissionRecurringAnnual, 180);
    assert.equal(starter.combinedUtilizationMonthly, 30.2);
    assert.equal(starter.netAfterSubscriptionMonthly, 10.21);

    const pro = buildFuelPerksTierProjections(getFuelPerksTierById("pro")!);
    assert.equal(pro.fuelSavingsMonthly, 23.2);
    assert.equal(pro.commissionRecurringMonthly, 30);
    assert.equal(pro.netAfterSubscriptionMonthly, 23.21);

    const elite = buildFuelPerksTierProjections(getFuelPerksTierById("elite")!);
    assert.equal(elite.fuelSavingsMonthly, 31.2);
    assert.equal(elite.commissionRecurringMonthly, 50);
    assert.equal(elite.netAfterSubscriptionMonthly, 41.21);
    assert.equal(elite.netAfterSubscriptionAnnual, 494.52);
  });

  it("resolves tiers by id and formats labels", () => {
    const elite = getFuelPerksTierById("elite");
    assert.ok(elite);
    assert.equal(formatFuelPerksTierLabel(elite!), "Premium Elite ($39.99/mo)");
    assert.equal(formatFuelPerksPriceRange(), "$19.99–$39.99/mo");
    assert.equal(formatUsd(10.21), "$10.21");
    assert.equal(getFuelPerksTierById("unknown")?.id, undefined);
  });
});
