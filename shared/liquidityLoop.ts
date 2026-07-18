import { z } from "zod";

/** Default annual yield for open hub investment programs (no stock market) */
export const P2P_ANNUAL_YIELD_RATE = 0.085;

/** Allowed peer-to-peer investment ticket sizes (USD) */
export const P2P_INVESTMENT_AMOUNTS = [100, 500, 1000] as const;

export type P2PInvestmentAmount = (typeof P2P_INVESTMENT_AMOUNTS)[number];

export const P2P_PROJECT_TAG = "POCKET_BOOSTER_RESERVE" as const;

export type HubProgramStatus = "open" | "coming_soon";

export type HubInvestmentProgram = {
  tag: string;
  name: string;
  shortName: string;
  description: string;
  /** Where capital is put to work (shown in back office) */
  allocationSummary: string;
  /** Exact ledger line investors see after bridging */
  ledgerDescription: string;
  annualYieldRate: number;
  status: HubProgramStatus;
  /** When true, capital also expands the Pocket Booster lending vault */
  fundsPocketBoosterVault: boolean;
  href?: string;
};

/**
 * Investable (and upcoming) programs under The Consolidatus Empire umbrella.
 * Members put money to work inside the hub — transparent allocation, tangible ROI.
 */
export const HUB_INVESTMENT_PROGRAMS: HubInvestmentProgram[] = [
  {
    tag: "POCKET_BOOSTER_RESERVE",
    name: "Pocket Booster Reserve",
    shortName: "Pocket Booster",
    description:
      "Back interest-free member cushions. Your capital funds the Instant-Disbursal Reserve Vault; subscription fees return your yield.",
    allocationSummary:
      "100% into the Pocket Booster Instant-Disbursal Reserve Vault",
    ledgerDescription:
      "100% allocated to the Pocket Booster Instant-Disbursal Reserve Vault to back interest-free member cushions.",
    annualYieldRate: 0.085,
    status: "open",
    fundsPocketBoosterVault: true,
    href: "/pocket-booster",
  },
  {
    tag: "FR2P_CLUB_GROWTH",
    name: "FR2P Club Growth",
    shortName: "FR2P Club",
    description:
      "Fuel The FR2P Club’s member experience, rewards infrastructure, and community growth inside the centralized hub.",
    allocationSummary:
      "100% into FR2P Club growth & member rewards operations",
    ledgerDescription:
      "100% allocated to FR2P Club Growth — member rewards, community operations, and club expansion under The Consolidatus Empire.",
    annualYieldRate: 0.08,
    status: "open",
    fundsPocketBoosterVault: false,
    href: "/fr2p",
  },
  {
    tag: "APPAREL_OPERATIONS",
    name: "Apparel & Brand Operations",
    shortName: "Apparel Line",
    description:
      "Put capital into Khomplete Khemistri apparel inventory, fulfillment, and brand operations that power the storefront.",
    allocationSummary:
      "100% into apparel inventory & brand operations",
    ledgerDescription:
      "100% allocated to Apparel & Brand Operations — inventory, fulfillment, and storefront growth for the Khomplete Khemistri apparel line.",
    annualYieldRate: 0.075,
    status: "open",
    fundsPocketBoosterVault: false,
    href: "/apparel",
  },
  {
    tag: "REAL_ESTATE_PROPERTIES",
    name: "Real Estate & Properties",
    shortName: "Real Estate",
    description:
      "Owners and property ventures — including motel acquisitions — launching soon under the Empire umbrella.",
    allocationSummary:
      "Property acquisition & motel operations (launching soon)",
    ledgerDescription:
      "Reserved for Real Estate & Properties — motel and property ventures under The Consolidatus Empire (program launching soon).",
    annualYieldRate: 0.09,
    status: "coming_soon",
    fundsPocketBoosterVault: false,
  },
];

export const HUB_PROGRAM_TAGS = HUB_INVESTMENT_PROGRAMS.map((p) => p.tag) as [
  string,
  ...string[],
];

export function getProgramByTag(
  tag: string,
): HubInvestmentProgram | undefined {
  return HUB_INVESTMENT_PROGRAMS.find((p) => p.tag === tag);
}

export function openInvestmentPrograms(): HubInvestmentProgram[] {
  return HUB_INVESTMENT_PROGRAMS.filter((p) => p.status === "open");
}

/**
 * Daily compound factor for APR compounded daily.
 * Effective daily rate = (1 + r)^(1/365) - 1
 */
export function dailyCompoundRate(
  annualRate: number = P2P_ANNUAL_YIELD_RATE,
): number {
  return Math.pow(1 + annualRate, 1 / 365) - 1;
}

/** Accrue compound daily interest for `days` on principal (USD). */
export function compoundDailyInterest(
  principal: number,
  days: number,
  annualRate: number = P2P_ANNUAL_YIELD_RATE,
): number {
  if (principal <= 0 || days <= 0) return 0;
  const factor = Math.pow(1 + dailyCompoundRate(annualRate), days);
  return principal * (factor - 1);
}

export const bridgeP2pSchema = z.object({
  investmentAmount: z.union([
    z.literal(100),
    z.literal(500),
    z.literal(1000),
  ]),
  /** Defaults to Pocket Booster when omitted (legacy bridge route) */
  projectTag: z.string().optional(),
});

export type BridgeP2pInput = z.infer<typeof bridgeP2pSchema>;
