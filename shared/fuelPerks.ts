/**
 * FR2P Fuel Rewards — three membership tiers for the community fuel pool.
 */
export type FuelPerksTierId = "starter" | "pro" | "elite";

export type FuelPerksTier = {
  id: FuelPerksTierId;
  name: string;
  monthlyFee: number;
  /** Per-gallon savings in cents — matches tier price point (19 / 29 / 39). */
  centsPerGallon: number;
  bestFor: string;
  mostPopular?: boolean;
  perks: string[];
  /** Illustrative recurring commission share on active direct referrals. */
  commissionSharePercent: number;
  /** Example recurring commission per active referral at this tier's price. */
  commissionPerReferralMonthly: number;
  annualSubscriptionCost: number;
};

export type FuelPerksTierProjections = {
  tierId: FuelPerksTierId;
  gallonsPerMonth: number;
  illustrativeActiveReferrals: number;
  fuelSavingsMonthly: number;
  fuelSavingsAnnual: number;
  commissionRecurringMonthly: number;
  commissionRecurringAnnual: number;
  combinedUtilizationMonthly: number;
  combinedUtilizationAnnual: number;
  netAfterSubscriptionMonthly: number;
  netAfterSubscriptionAnnual: number;
};

export const FUEL_PERKS_PLATFORM = {
  platformName: "FR2P Fuel Rewards",
  shortName: "Fuel Rewards",
  tagline: "Community-backed fuel savings for every budget.",
} as const;

export const FUEL_PERKS_DEFAULT_TIER_ID: FuelPerksTierId = "pro";

/** Illustrative commuter usage for fuel-savings projections (not a guarantee). */
export const FUEL_PERKS_ILLUSTRATIVE_GALLONS_PER_MONTH = 80;

/** Illustrative active direct referrals for commission projections (not a guarantee). */
export const FUEL_PERKS_ILLUSTRATIVE_ACTIVE_REFERRALS = 5;

export const FUEL_PERKS_PAYOUT_EXPLAINER = {
  programType:
    "Affiliate marketing program with a community subscription fuel pool — not crowdfunding, equity, or a guaranteed income product.",
  howMoneyIsRaised: [
    "Each member pays their tier subscription monthly through Stripe (secure checkout).",
    "Those payments flow into the platform community fuel pool — a collective subscription fund, not anyone's personal pocket.",
    "The pool funds per-gallon fuel savings for active members and potential recurring affiliate commissions when you refer new paying partners.",
    "Payouts are processed through Stripe once commissions meet platform thresholds. Results depend on your activity and active referrals.",
  ],
  notCrowdfunding:
    "You are not buying equity or investing in a project. You join an affiliate program where subscription revenue shared across the community funds savings and potential recurring commissions.",
} as const;

export const FUEL_PERKS_TIERS: FuelPerksTier[] = [
  {
    id: "starter",
    name: "Road Starter",
    monthlyFee: 19.99,
    centsPerGallon: 19,
    bestFor: "Light drivers getting started",
    perks: [
      "19¢/gal community fuel pool savings",
      "Member QR code",
      "Referral link",
      "~15% potential recurring commission share",
    ],
    commissionSharePercent: 15,
    commissionPerReferralMonthly: 3.0,
    annualSubscriptionCost: 239.88,
  },
  {
    id: "pro",
    name: "Fleet Pro",
    monthlyFee: 29.99,
    centsPerGallon: 29,
    bestFor: "Daily commuters — most popular",
    mostPopular: true,
    perks: [
      "29¢/gal community fuel pool savings",
      "Member QR code",
      "Referral tracking",
      "Marketing Back Office access",
      "~20% potential recurring commission share",
    ],
    commissionSharePercent: 20,
    commissionPerReferralMonthly: 6.0,
    annualSubscriptionCost: 359.88,
  },
  {
    id: "elite",
    name: "Premium Elite",
    monthlyFee: 39.99,
    centsPerGallon: 39,
    bestFor: "Maximum savings & affiliate growth",
    perks: [
      "39¢/gal community fuel pool savings",
      "Magnet & asset kit",
      "FR2P cross-promo boosts",
      "Affiliate downline tools",
      "~25% potential recurring commission share",
    ],
    commissionSharePercent: 25,
    commissionPerReferralMonthly: 10.0,
    annualSubscriptionCost: 479.88,
  },
];

export const FUEL_PERKS_TIER_IDS = FUEL_PERKS_TIERS.map(
  (t) => t.id,
) as unknown as [FuelPerksTierId, ...FuelPerksTierId[]];

export function getFuelPerksTierById(
  id: string | undefined,
): FuelPerksTier | undefined {
  return FUEL_PERKS_TIERS.find((t) => t.id === id);
}

export function getDefaultFuelPerksTier(): FuelPerksTier {
  return (
    getFuelPerksTierById(FUEL_PERKS_DEFAULT_TIER_ID) ?? FUEL_PERKS_TIERS[1]
  );
}

export function formatFuelPerksTierLabel(tier: FuelPerksTier): string {
  return `${tier.name} ($${tier.monthlyFee.toFixed(2)}/mo)`;
}

export function formatFuelPerksPriceRange(): string {
  const fees = FUEL_PERKS_TIERS.map((t) => t.monthlyFee);
  const low = Math.min(...fees);
  const high = Math.max(...fees);
  return `$${low.toFixed(2)}–$${high.toFixed(2)}/mo`;
}

export function calculateFuelSavingsMonthly(
  tier: FuelPerksTier,
  gallonsPerMonth = FUEL_PERKS_ILLUSTRATIVE_GALLONS_PER_MONTH,
): number {
  return (gallonsPerMonth * tier.centsPerGallon) / 100;
}

export function calculateCommissionRecurringMonthly(
  tier: FuelPerksTier,
  activeReferrals = FUEL_PERKS_ILLUSTRATIVE_ACTIVE_REFERRALS,
): number {
  return tier.commissionPerReferralMonthly * activeReferrals;
}

export function buildFuelPerksTierProjections(
  tier: FuelPerksTier,
  gallonsPerMonth = FUEL_PERKS_ILLUSTRATIVE_GALLONS_PER_MONTH,
  activeReferrals = FUEL_PERKS_ILLUSTRATIVE_ACTIVE_REFERRALS,
): FuelPerksTierProjections {
  const fuelSavingsMonthly = roundMoney(
    calculateFuelSavingsMonthly(tier, gallonsPerMonth),
  );
  const commissionRecurringMonthly = roundMoney(
    calculateCommissionRecurringMonthly(tier, activeReferrals),
  );
  const combinedUtilizationMonthly = roundMoney(
    fuelSavingsMonthly + commissionRecurringMonthly,
  );
  const netAfterSubscriptionMonthly = roundMoney(
    combinedUtilizationMonthly - tier.monthlyFee,
  );

  return {
    tierId: tier.id,
    gallonsPerMonth,
    illustrativeActiveReferrals: activeReferrals,
    fuelSavingsMonthly,
    fuelSavingsAnnual: roundMoney(fuelSavingsMonthly * 12),
    commissionRecurringMonthly,
    commissionRecurringAnnual: roundMoney(commissionRecurringMonthly * 12),
    combinedUtilizationMonthly,
    combinedUtilizationAnnual: roundMoney(combinedUtilizationMonthly * 12),
    netAfterSubscriptionMonthly,
    netAfterSubscriptionAnnual: roundMoney(netAfterSubscriptionMonthly * 12),
  };
}

export function getFuelPerksConfigPayload() {
  return {
    platform: FUEL_PERKS_PLATFORM,
    payoutExplainer: FUEL_PERKS_PAYOUT_EXPLAINER,
    assumptions: {
      gallonsPerMonth: FUEL_PERKS_ILLUSTRATIVE_GALLONS_PER_MONTH,
      activeReferrals: FUEL_PERKS_ILLUSTRATIVE_ACTIVE_REFERRALS,
      disclaimer:
        "All figures are illustrative examples of potential fuel savings and recurring commissions only. Not guaranteed. Actual results depend on gallons purchased, referral activity, and active subscriptions.",
    },
    tiers: FUEL_PERKS_TIERS.map((tier) => ({
      ...tier,
      projections: buildFuelPerksTierProjections(tier),
    })),
  };
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}
