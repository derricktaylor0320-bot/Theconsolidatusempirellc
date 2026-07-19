import { z } from "zod";

/** Default annual yield for open hub investment programs (no stock market) */
export const P2P_ANNUAL_YIELD_RATE = 0.085;

/** Allowed peer-to-peer investment ticket sizes (USD) */
export const P2P_INVESTMENT_AMOUNTS = [100, 250, 500, 1000] as const;

export type P2PInvestmentAmount = (typeof P2P_INVESTMENT_AMOUNTS)[number];

export const P2P_PROJECT_TAG = "POCKET_BOOSTER_RESERVE" as const;

/** Revenue Participation Units — non-equity project utility instrument */
export const RPU_INSTRUMENT_TYPE = "REVENUE_PARTICIPATION_UNIT" as const;
export const RPU_LOCK_PERIOD_DAYS = 90;
export const RPU_COMPLIANCE_STATUS = "VERIFIED_COMPLIANT" as const;
export const RPU_LEGAL_DISCLAIMER =
  "Your money goes only to the project you select — it does not buy ownership, voting shares, or any piece of the founders' LLC equity. This is a non-equity Revenue Participation Agreement locked to project utility only.";

/**
 * Foundational LLC members whose corporate equity must never be diluted
 * by platform investor unit issuance.
 */
export const CORE_LLC_MEMBERS = [
  "Derrick Taylor",
  "Carlyle Oliver",
  "Jerome Young Jr",
] as const;

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
      "Reserve Vault emergency cushion support — your capital funds interest-free member cushions; subscription fees return your yield.",
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
      "A personal venture focused on direct affiliate marketing and professional growth — courses, AI promotion, and sales built for recurring revenue with full compliance.",
    allocationSummary:
      "100% into FR2P Club growth, courses & affiliate operations",
    ledgerDescription:
      "100% allocated to The FR2P Club — direct affiliate marketing, professional growth courses, AI promotion & sales, and compliant recurring-revenue operations under The Consolidatus Empire.",
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
      "Put capital into Khomplete Khemistri Apparel — our branded clothing line — covering inventory, fulfillment, and brand operations.",
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
      "First up: mom-and-pop motel takeovers through creative financing — we step into day-to-day operations, tidy the property up so it feels like home (fresh rooms, real hospitality), and put a little extra retirement money in the owner’s pocket from the revenue. Same playbook next for laundromat acquisitions. Launching soon.",
    allocationSummary:
      "100% into motel (then laundromat) acquisition & operations — creative financing pipeline",
    ledgerDescription:
      "Reserved for Real Estate & Properties — mom-and-pop motel acquisitions via creative financing, operator takeovers with guest-experience upgrades, retiring-owner revenue participation, then the same model for laundromats under The Consolidatus Empire (program launching soon).",
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
    z.literal(250),
    z.literal(500),
    z.literal(1000),
  ]),
  /** Defaults to Pocket Booster when omitted (legacy bridge route) */
  projectTag: z.string().optional(),
});

export type BridgeP2pInput = z.infer<typeof bridgeP2pSchema>;

/** Explicit RPU issuance payload (alias of bridge invest) */
export const issueParticipationUnitsSchema = z.object({
  capitalContribution: z.union([
    z.literal(100),
    z.literal(250),
    z.literal(500),
    z.literal(1000),
  ]),
  targetProjectPool: z.string().min(1),
});

export type IssueParticipationUnitsInput = z.infer<
  typeof issueParticipationUnitsSchema
>;
