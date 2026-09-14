/**
 * FR2P Fuel Rewards — three membership tiers for the community fuel pool.
 */
export type FuelPerksTierId = "starter" | "pro" | "elite";

export type FuelPerksTier = {
  id: FuelPerksTierId;
  name: string;
  monthlyFee: number;
  centsPerGallon: number;
  bestFor: string;
  mostPopular?: boolean;
  perks: string[];
};

export const FUEL_PERKS_PLATFORM = {
  platformName: "FR2P Fuel Rewards",
  shortName: "Fuel Rewards",
  tagline: "Community-backed fuel savings for every budget.",
} as const;

export const FUEL_PERKS_DEFAULT_TIER_ID: FuelPerksTierId = "pro";

export const FUEL_PERKS_TIERS: FuelPerksTier[] = [
  {
    id: "starter",
    name: "Road Starter",
    monthlyFee: 19.99,
    centsPerGallon: 5,
    bestFor: "Light drivers getting started",
    perks: ["5¢/gal savings", "Member QR code", "Referral link"],
  },
  {
    id: "pro",
    name: "Fleet Pro",
    monthlyFee: 29.99,
    centsPerGallon: 8,
    bestFor: "Daily commuters — most popular",
    mostPopular: true,
    perks: ["8¢/gal savings", "Member QR code", "Referral tracking"],
  },
  {
    id: "elite",
    name: "Premium Elite",
    monthlyFee: 39.99,
    centsPerGallon: 12,
    bestFor: "Maximum savings & affiliate growth",
    perks: [
      "12¢/gal savings",
      "Magnet & asset kit",
      "FR2P cross-promo boosts",
      "Affiliate downline tools",
    ],
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
