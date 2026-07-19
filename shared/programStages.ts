/**
 * The Consolidatus Empire — Financial Roadway program stages (S1–S8).
 *
 * Canonical definitions for the member journey from emergency stabilization
 * through sovereign executive ownership of the multi-program hub.
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
  meaning: string;
  visualIdentity: string;
  /** Primary brand hex for this stage's visual identity */
  color: string;
  /** Soft companion tint for backgrounds / gradients */
  colorSoft: string;
  /** Hub app that advances this stage */
  relatedHref: string;
  relatedLabel: string;
};

export const PROGRAM_PATHWAY = {
  name: "Financial Roadway 2 Prosperity",
  shortName: "Empire Pathway",
  tagline:
    "Eight stages from cash cushion to sovereign ownership across The Consolidatus Empire.",
} as const;

export const PROGRAM_STAGES: ProgramStage[] = [
  {
    id: "S1",
    level: 1,
    title: "Emergency Fund First",
    meaning:
      "Immediate financial stabilization. This tier focuses on establishing a cash cushion to prevent future reliance on high-interest debt in case of unexpected expenses.",
    visualIdentity: "Rich Crimson Red",
    color: "#9B1B30",
    colorSoft: "#9B1B3026",
    relatedHref: "/pocket-booster",
    relatedLabel: "Pocket Booster",
  },
  {
    id: "S2",
    level: 2,
    title: "The Color of Money",
    meaning:
      "Financial literacy and mindset shift. This phase educates users on how money works, shifting the perspective from consumerism to asset ownership and wealth generation.",
    visualIdentity: "Deep Emerald Green",
    color: "#046307",
    colorSoft: "#04630726",
    relatedHref: "/pocket-booster",
    relatedLabel: "Pay-to-Learn",
  },
  {
    id: "S3",
    level: 3,
    title: "Community Accountability",
    meaning:
      "Peer-to-peer support and group responsibility. This stage leverages the community to provide encouragement, shared resources, and a structure of mutual trust for achieving financial goals.",
    visualIdentity: "Royal Navy Blue",
    color: "#0A1F44",
    colorSoft: "#0A1F4426",
    relatedHref: "/fr2p",
    relatedLabel: "FR2P Club",
  },
  {
    id: "S4",
    level: 4,
    title: "Structured Repayment Plans",
    meaning:
      "Disciplined financial management. This tier implements the system for systematically repaying the initial cash cushion microloans and establishing a perfect credit profile.",
    visualIdentity: "Deep Purple",
    color: "#4A0080",
    colorSoft: "#4A008026",
    relatedHref: "/pocket-booster",
    relatedLabel: "Cushion Autopilot",
  },
  {
    id: "S5",
    level: 5,
    title: "Side Hustle & Business Growth",
    meaning:
      "Entrepreneurial launchpad. This stage is focused on generating new income streams, launching micro-enterprises, and scaling a side business to a profitable level.",
    visualIdentity: "Dark Brown Leather",
    color: "#3D2314",
    colorSoft: "#3D231426",
    relatedHref: "/hub",
    relatedLabel: "Empire Hub",
  },
  {
    id: "S6",
    level: 6,
    title: "Six-Figure Skill Accelerator",
    meaning:
      "Professionalizing income. This phase represents the leap from a side hustle to a high-income business by mastering advanced skills and implementing scalable business infrastructure.",
    visualIdentity: "Vibrant Sparkling Emerald Green",
    color: "#00A86B",
    colorSoft: "#00A86B26",
    relatedHref: "/pocket-booster",
    relatedLabel: "Tier 4 Accelerator",
  },
  {
    id: "S7",
    level: 7,
    title: "Legacy & Portfolio Building",
    meaning:
      "Wealth preservation and investment. This tier utilizes business capital to build multi-generational wealth through asset accumulation, stock portfolios, real estate, and other investment vehicles.",
    visualIdentity: "Sparkling Deep Blue",
    color: "#0B1D51",
    colorSoft: "#0B1D5126",
    relatedHref: "/invest",
    relatedLabel: "Empire Invest",
  },
  {
    id: "S8",
    level: 8,
    title: "The Sovereign Executive",
    meaning:
      "Pinnacle of ownership and leadership. This represents complete executive authority and sovereign ownership of collaborative ventures, steering the entire multi-program Empire hub.",
    visualIdentity: "Sparkling Burnt Orange",
    color: "#C2410C",
    colorSoft: "#C2410C26",
    relatedHref: "/hub",
    relatedLabel: "Empire Hub",
  },
];

export function getStageById(id: string): ProgramStage | undefined {
  return PROGRAM_STAGES.find((s) => s.id === id);
}

export function getStageByLevel(level: number): ProgramStage | undefined {
  return PROGRAM_STAGES.find((s) => s.level === level);
}
