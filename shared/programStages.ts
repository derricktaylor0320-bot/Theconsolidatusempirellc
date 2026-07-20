/**
 * Pocket Booster — program stage tabs (S1–S8).
 *
 * These eight codes describe what each Pocket Booster program tab represents
 * along the member journey from emergency cash cushion through sovereign
 * executive ownership. They are Pocket Booster program definitions — not
 * product catalog items (e.g. vitamin supplement bottles).
 */

export type ProgramStageId =
  | "S1"
  | "S2"
  | "S3"
  | "S4"
  | "S5"
  | "S6"
  | "S7"
  | "S8";

export type ProgramStage = {
  id: ProgramStageId;
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  title: string;
  /** What this Pocket Booster tab represents for the member */
  meaning: string;
  /** Concrete actions this code unlocks or runs inside Pocket Booster */
  inProgram: string;
  visualIdentity: string;
  /** Primary brand hex for this stage's visual identity */
  color: string;
  /** Soft companion tint for backgrounds / gradients */
  colorSoft: string;
  /** In-app focus area advanced by this Pocket Booster tab */
  relatedHref: string;
  relatedLabel: string;
};

export const PROGRAM_PATHWAY = {
  name: "Pocket Booster Program",
  shortName: "Pocket Booster Stages",
  tagline:
    "Eight Pocket Booster tabs — from cash cushion to sovereign ownership — each with a clear purpose in the program.",
  program: "Pocket Booster",
} as const;

export const PROGRAM_STAGES: ProgramStage[] = [
  {
    id: "S1",
    level: 1,
    title: "Emergency Fund First",
    meaning:
      "Immediate financial stabilization. This Pocket Booster tab focuses on establishing a cash cushion to prevent future reliance on high-interest debt when unexpected expenses hit.",
    inProgram:
      "Inside Pocket Booster, S1 steers you to Choose Your Tier, activate a membership, and request an interest-free cushion from the Reserve Vault before bills force payday loans or credit cards.",
    visualIdentity: "Rich Crimson Red",
    color: "#9B1B30",
    colorSoft: "#9B1B3026",
    relatedHref: "/pocket-booster#tiers",
    relatedLabel: "Cushion Tiers",
  },
  {
    id: "S2",
    level: 2,
    title: "The Color of Money",
    meaning:
      "Financial literacy and mindset shift. This Pocket Booster tab educates members on how money works, moving from consumer habits toward asset ownership and wealth generation through Pay-to-Learn.",
    inProgram:
      "Inside Pocket Booster, S2 opens the Pay-to-Learn track — Cash Flow Foundations, Income Acceleration, and Capital Accessories — real programs you take; graduating them can unlock Tier 4 membership rebates automatically.",
    visualIdentity: "Deep Emerald Green",
    color: "#046307",
    colorSoft: "#04630726",
    relatedHref: "/pocket-booster#pay-to-learn",
    relatedLabel: "Pay-to-Learn",
  },
  {
    id: "S3",
    level: 3,
    title: "Community Accountability",
    meaning:
      "Peer-to-peer support and group responsibility. This Pocket Booster tab leans on community encouragement, shared resources, and mutual trust so members stay on track with their financial goals.",
    inProgram:
      "Inside Pocket Booster, S3 is the accountability layer — stay visible to the community pathway, share progress with peers, and keep repayment and growth goals honest instead of going it alone.",
    visualIdentity: "Royal Navy Blue",
    color: "#0A1F44",
    colorSoft: "#0A1F4426",
    relatedHref: "/pocket-booster#program-codes",
    relatedLabel: "Pocket Booster Community",
  },
  {
    id: "S4",
    level: 4,
    title: "Structured Repayment Plans",
    meaning:
      "Disciplined financial management. This Pocket Booster tab runs the cushion Autopilot — systematically repaying microloan cushions and building a clean repayment profile.",
    inProgram:
      "Inside Pocket Booster, S4 powers Cushion Autopilot: pick Full Next Payday, Bi-Weekly Split, or Custom Payroll Split, schedule Square invoices, and prove repayment discipline for larger limits.",
    visualIdentity: "Deep Purple",
    color: "#4A0080",
    colorSoft: "#4A008026",
    relatedHref: "/pocket-booster#cushion",
    relatedLabel: "Cushion Autopilot",
  },
  {
    id: "S5",
    level: 5,
    title: "Side Hustle & Business Growth",
    meaning:
      "Entrepreneurial launchpad. This Pocket Booster tab focuses on new income streams, launching micro-enterprises, and scaling a side hustle into a profitable business.",
    inProgram:
      "Inside Pocket Booster, S5 turns surplus cushion capacity into growth fuel — use stability from earlier stages to fund side hustles, micro-enterprises, and income experiments without derailing repayment.",
    visualIdentity: "Dark Brown Leather",
    color: "#3D2314",
    colorSoft: "#3D231426",
    relatedHref: "/pocket-booster#program-codes",
    relatedLabel: "Growth Track",
  },
  {
    id: "S6",
    level: 6,
    title: "Six-Figure Skill Accelerator",
    meaning:
      "Professionalizing income. This Pocket Booster tab is the Tier 4 leap — advanced skills, priority funding, and scalable infrastructure toward six-figure momentum.",
    inProgram:
      "Inside Pocket Booster, S6 maps to Tier 4 ($100/mo, up to $1,000 cushion): Priority Instant Funding, Affiliate Rewards Access, and the Pay-to-Learn track with a 50% skill rebate when modules are complete.",
    visualIdentity: "Vibrant Sparkling Emerald Green",
    color: "#00A86B",
    colorSoft: "#00A86B26",
    relatedHref: "/pocket-booster#tiers",
    relatedLabel: "Tier 4 Accelerator",
  },
  {
    id: "S7",
    level: 7,
    title: "Legacy & Portfolio Building",
    meaning:
      "Wealth preservation and investment. This Pocket Booster tab channels disciplined capital into multi-generational wealth — including the P2P reserve vault that backs member cushions.",
    inProgram:
      "Inside Pocket Booster, S7 is the Peer-to-Peer Reserve path — bridge $100–$1,000 into the Instant-Disbursal Vault that funds member cushions while your position earns compounding yield from subscription revenue.",
    visualIdentity: "Sparkling Deep Blue",
    color: "#0B1D51",
    colorSoft: "#0B1D5126",
    relatedHref: "/pocket-booster#reserve",
    relatedLabel: "P2P Reserve Vault",
  },
  {
    id: "S8",
    level: 8,
    title: "The Sovereign Executive",
    meaning:
      "Pinnacle of ownership and leadership. This Pocket Booster tab represents full executive authority — steering your position across the program with sovereign ownership of your financial path.",
    inProgram:
      "Inside Pocket Booster, S8 is the end-state operating posture: you run cushions, skills, community accountability, and reserve capital as one sovereign stack — directing every tab instead of reacting stage by stage.",
    visualIdentity: "Sparkling Burnt Orange",
    color: "#C2410C",
    colorSoft: "#C2410C26",
    relatedHref: "/pocket-booster#program-codes",
    relatedLabel: "Sovereign Track",
  },
];

export function getStageById(id: string): ProgramStage | undefined {
  return PROGRAM_STAGES.find((s) => s.id === id);
}

export function getStageByLevel(level: number): ProgramStage | undefined {
  return PROGRAM_STAGES.find((s) => s.level === level);
}
