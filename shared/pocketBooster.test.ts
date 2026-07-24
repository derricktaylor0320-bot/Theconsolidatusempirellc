import assert from "node:assert/strict";
import test from "node:test";
import {
  calculatePocketBoosterEligibility,
  isRepaymentCycleOnTime,
} from "./pocketBooster";

test("members start at Tier 1 and need two on-time cycles to unlock Tier 2", () => {
  assert.deepEqual(calculatePocketBoosterEligibility([]), {
    highestUnlockedTier: 1,
    progressTier: 1,
    onTimeRepayments: 0,
    requiredRepayments: 2,
    remainingRepayments: 2,
    isMaxTier: false,
    onTimeRepaymentsByTier: { 1: 0, 2: 0, 3: 0, 4: 0 },
  });

  const afterOne = calculatePocketBoosterEligibility([
    { tierLevel: 1, repaidOnTime: true },
  ]);
  assert.equal(afterOne.highestUnlockedTier, 1);
  assert.equal(afterOne.remainingRepayments, 1);

  const afterTwo = calculatePocketBoosterEligibility([
    { tierLevel: 1, repaidOnTime: true },
    { tierLevel: 1, repaidOnTime: true },
  ]);
  assert.equal(afterTwo.highestUnlockedTier, 2);
  assert.equal(afterTwo.remainingRepayments, 2);
});

test("each new tier requires its own two on-time cycles", () => {
  const eligibility = calculatePocketBoosterEligibility([
    { tierLevel: 1, repaidOnTime: true },
    { tierLevel: 1, repaidOnTime: true },
    { tierLevel: 2, repaidOnTime: true },
    { tierLevel: 2, repaidOnTime: true },
    { tierLevel: 3, repaidOnTime: true },
  ]);

  assert.equal(eligibility.highestUnlockedTier, 3);
  assert.equal(eligibility.onTimeRepayments, 1);
  assert.equal(eligibility.remainingRepayments, 1);
});

test("late or incomplete repayments do not build tier trust", () => {
  const eligibility = calculatePocketBoosterEligibility([
    { tierLevel: 1, repaidOnTime: true },
    { tierLevel: 1, repaidOnTime: false },
    { tierLevel: 1, repaidOnTime: false },
  ]);

  assert.equal(eligibility.highestUnlockedTier, 1);
  assert.equal(eligibility.onTimeRepayments, 1);
});

test("grandfathered members keep their current tier", () => {
  const eligibility = calculatePocketBoosterEligibility([], 3);
  assert.equal(eligibility.highestUnlockedTier, 3);
  assert.equal(eligibility.remainingRepayments, 2);
});

test("a repayment cycle is on time only when every installment clears by its due date", () => {
  assert.equal(
    isRepaymentCycleOnTime([
      {
        status: "collected",
        scheduledDate: "2026-07-10T00:00:00.000Z",
        collectedAt: "2026-07-10T18:30:00.000Z",
      },
      {
        status: "collected",
        scheduledDate: "2026-07-24T00:00:00.000Z",
        collectedAt: "2026-07-24T09:00:00.000Z",
      },
    ]),
    true,
  );

  assert.equal(
    isRepaymentCycleOnTime([
      {
        status: "collected",
        scheduledDate: "2026-07-10T00:00:00.000Z",
        collectedAt: "2026-07-11T00:00:00.000Z",
      },
    ]),
    false,
  );

  assert.equal(
    isRepaymentCycleOnTime([
      {
        status: "scheduled",
        scheduledDate: "2026-07-10T00:00:00.000Z",
        collectedAt: null,
      },
    ]),
    false,
  );
});
