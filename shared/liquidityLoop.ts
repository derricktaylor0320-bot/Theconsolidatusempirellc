import { z } from "zod";

/** Default annual yield for Pocket Booster (primary reserve pillar) */
export const P2P_ANNUAL_YIELD_RATE = 0.085;

/** Allowed peer-to-peer investment ticket sizes (USD) */
export const P2P_INVESTMENT_AMOUNTS = [100, 250, 500, 1000] as const;

export type P2PInvestmentAmount = (typeof P2P_INVESTMENT_AMOUNTS)[number];

/** Canonical Pocket Booster pillar tag (5-pillar structure) */
export const P2P_PROJECT_TAG = "POCKET_BOOSTER" as const;

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
  /** Asset-backed revenue description for yield configs */
  backingAssetDescription: string;
  href?: string;
};

/**
 * Legacy project tags → canonical 5-pillar tags (for older investments).
 */
export const LEGACY_PROJECT_TAG_MAP: Record<string, string> = {
  POCKET_BOOSTER_RESERVE: "POCKET_BOOSTER",
  FR2P_CLUB_GROWTH: "FR2P_PROGRAM",
  APPAREL_OPERATIONS: "KHOMPLETE_KHEMISTRI",
  PREMIUM_CHOICE_HOT_DOGS: "PREMIUM_CHOICE_DOGS",
  REAL_ESTATE_PROPERTIES: "COMMERCIAL_REAL_ESTATE",
};

export function canonicalizeProjectTag(tag: string): string {
  return LEGACY_PROJECT_TAG_MAP[tag] ?? tag;
}

/**
 * Five-pillar Empire Invest structure — exact yield configs for the hub.
 */
export const HUB_INVESTMENT_PROGRAMS: HubInvestmentProgram[] = [
  {
    tag: "KHOMPLETE_KHEMISTRI",
    name: "Khomplete Khemistri Apparel Line",
    shortName: "Khomplete Khemistri",
    description:
      "Put capital into Khomplete Khemistri Apparel — our branded clothing line — covering inventory, fulfillment, and brand operations.",
    allocationSummary:
      "100% into Khomplete Khemistri apparel inventory & brand operations",
    ledgerDescription:
      "100% allocated to Khomplete Khemistri Apparel — inventory, fulfillment, and storefront growth for the branded clothing line under The Consolidatus Empire.",
    annualYieldRate: 0.07,
    status: "open",
    fundsPocketBoosterVault: false,
    backingAssetDescription:
      "High-margin physical apparel sales and fabric inventory.",
    href: "/apparel",
  },
  {
    tag: "FR2P_PROGRAM",
    name: "The FR2P Program (Financial Roadway to Prosperity)",
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
    backingAssetDescription:
      "Membership subscriptions and outside ad platform revenue.",
    href: "/fr2p",
  },
  {
    tag: "POCKET_BOOSTER",
    name: "Pocket Booster Liquidity Vault",
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
    backingAssetDescription: "Recurring monthly flat subscriber fees.",
    href: "/pocket-booster",
  },
  {
    tag: "PREMIUM_CHOICE_DOGS",
    name: "Premium Choice Dogs Infrastructure",
    shortName: "Premium Choice Dogs",
    description:
      "Fund Premium Choice Dogs infrastructure — quality franks, drinks, and homemade desserts from physical mobile units under The Consolidatus Empire.",
    allocationSummary:
      "100% into Premium Choice Dogs inventory, cart ops & street-food growth",
    ledgerDescription:
      "100% allocated to Premium Choice Dogs — food inventory, cart operations, drinks, desserts, and street-food growth under The Consolidatus Empire.",
    annualYieldRate: 0.11,
    status: "open",
    fundsPocketBoosterVault: false,
    backingAssetDescription:
      "Daily cash-and-card transactions from physical mobile units.",
    href: "/hot-dogs",
  },
  {
    tag: "COMMERCIAL_REAL_ESTATE",
    name: "Commercial Real Estate Portfolio",
    shortName: "Real Estate",
    description:
      "First up: mom-and-pop motel takeovers through creative financing — we step into day-to-day operations, tidy the property up so it feels like home (fresh rooms, real hospitality), and put a little extra retirement money in the owner's pocket from the revenue. Same playbook next for laundromat acquisitions. Launching soon.",
    allocationSummary:
      "100% into motel (then laundromat) acquisition & operations — creative financing pipeline",
    ledgerDescription:
      "Reserved for Commercial Real Estate — mom-and-pop motel acquisitions via creative financing, operator takeovers with guest-experience upgrades, retiring-owner revenue participation, then the same model for laundromats under The Consolidatus Empire (program launching soon).",
    annualYieldRate: 0,
    status: "coming_soon",
    fundsPocketBoosterVault: false,
    backingAssetDescription:
      "Future brick-and-mortar equity (Independent motels & laundromats).",
  },
];

export const HUB_PROGRAM_TAGS = HUB_INVESTMENT_PROGRAMS.map((p) => p.tag) as [
  string,
  ...string[],
];

export function getProgramByTag(
  tag: string,
): HubInvestmentProgram | undefined {
  const canonical = canonicalizeProjectTag(tag);
  return HUB_INVESTMENT_PROGRAMS.find((p) => p.tag === canonical);
}

export function openInvestmentPrograms(): HubInvestmentProgram[] {
  return HUB_INVESTMENT_PROGRAMS.filter((p) => p.status === "open");
}

/**
 * Daily compound factor for APR compounded daily (true effective daily rate).
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

/**
 * Banker's daily compound used for live investor yield widgets:
 * A = P * (1 + r/365)^days
 */
export function compoundDailyBankers(
  principal: number,
  days: number,
  annualRate: number,
): number {
  if (principal <= 0 || days <= 0 || annualRate <= 0) return 0;
  const currentValue = principal * Math.pow(1 + annualRate / 365, days);
  return currentValue - principal;
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
