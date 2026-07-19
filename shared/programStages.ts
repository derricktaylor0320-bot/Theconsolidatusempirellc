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
    visualIdentity: "Royal Navy Blue",
    color: "#0A1F44",
    colorSoft: "#0A1F4426",
    relatedHref: "/pocket-booster#stages",
    relatedLabel: "Pocket Booster Community",
  },
  {
    id: "S4",
    level: 4,
    title: "Structured Repayment Plans",
    meaning:
      "Disciplined financial management. This Pocket Booster tab runs the cushion Autopilot — systematically repaying microloan cushions and building a clean repayment profile.",
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
    visualIdentity: "Dark Brown Leather",
    color: "#3D2314",
    colorSoft: "#3D231426",
    relatedHref: "/pocket-booster#stages",
    relatedLabel: "Growth Track",
  },
  {
    id: "S6",
    level: 6,
    title: "Six-Figure Skill Accelerator",
    meaning:
      "Professionalizing income. This Pocket Booster tab is the Tier 4 leap — advanced skills, priority funding, and scalable infrastructure toward six-figure momentum.",
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
    visualIdentity: "Sparkling Burnt Orange",
    color: "#C2410C",
    colorSoft: "#C2410C26",
    relatedHref: "/pocket-booster#stages",
    relatedLabel: "Sovereign Track",
  },
];

export function getStageById(id: string): ProgramStage | undefined {
  return PROGRAM_STAGES.find((s) => s.id === id);
}

export function getStageByLevel(level: number): ProgramStage | undefined {
  return PROGRAM_STAGES.find((s) => s.level === level);
}
