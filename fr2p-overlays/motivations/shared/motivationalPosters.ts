export type MotivationalPoster = {
  id: string;
  title: string;
  tagline?: string;
  /** Path under the FR2P public root (no leading slash). */
  imagePath: string;
};

/** Empire motivation posters — hosted inside The FR2P Club. */
export const MOTIVATIONAL_POSTERS: MotivationalPoster[] = [
  {
    id: "respect",
    title: "Live With Respect!",
    imagePath: "attached_assets/motivations/copilot_image_1793426063233.png",
  },
  {
    id: "integrity",
    title: "Live With Integrity!",
    imagePath: "attached_assets/motivations/copilot_image_1793529000501.png",
  },
  {
    id: "peace",
    title: "Protect Your P.E.A.C.E.!",
    imagePath: "attached_assets/motivations/copilot_image_1793756690775.png",
  },
  {
    id: "perseverance",
    title: "Persevere to Succeed!",
    imagePath: "attached_assets/motivations/copilot_image_1793757202976.png",
  },
  {
    id: "strength",
    title: "Build Your Strength!",
    imagePath: "attached_assets/motivations/copilot_image_1793757383309.png",
  },
  {
    id: "soul",
    title: "Get Your S.O.U.L. Centered!",
    imagePath: "attached_assets/motivations/copilot_image_1793757836756.png",
  },
  {
    id: "life",
    title: "Get Your Life in Order!",
    imagePath: "attached_assets/motivations/copilot_image_1793757975931.png",
  },
  {
    id: "together",
    title: "Get Your S.H.I.T. Together!",
    imagePath: "attached_assets/motivations/copilot_image_1793758177676.png",
  },
  {
    id: "success-path",
    title: "Build Your Path to Success",
    imagePath: "attached_assets/motivations/copilot_image_1793758647100.png",
  },
  {
    id: "endurance",
    title: "Embrace Endurance!",
    tagline: "Strength today · greater tomorrow",
    imagePath: "attached_assets/motivations/copilot_image_1793759044210.png",
  },
  {
    id: "legacy",
    title: "Build a Lasting Legacy!",
    tagline: "More than success · a greater impact",
    imagePath: "attached_assets/motivations/copilot_image_1793759264982.png",
  },
  {
    id: "success",
    title: "Achieve Success!",
    tagline: "Discipline today · a brighter tomorrow",
    imagePath: "attached_assets/motivations/copilot_image_1793760144797.png",
  },
  {
    id: "future",
    title: "Invest in Your Future!",
    tagline: "Today's discipline · tomorrow's opportunities",
    imagePath: "attached_assets/motivations/copilot_image_1793760622833.png",
  },
  {
    id: "past",
    title: "Don't Let Your Past Steal Your Future!",
    tagline: "Heal today · live fully tomorrow",
    imagePath: "attached_assets/motivations/copilot_image_1793761029404.png",
  },
  {
    id: "forgiveness",
    title: "Choose Forgiveness!",
    tagline: "A healed heart · a brighter tomorrow",
    imagePath: "attached_assets/motivations/copilot_image_1793761450035.png",
  },
  {
    id: "healing",
    title: "Choose Healing!",
    tagline: "A stronger you · a brighter tomorrow",
    imagePath: "attached_assets/motivations/copilot_image_1793761654948.png",
  },
];

export function motivationalScrollLine(poster: MotivationalPoster): string {
  if (poster.tagline) {
    return `${poster.title} — ${poster.tagline}`;
  }
  return poster.title;
}

/** Resolve poster image against Vite embed base (`/` or `/fr2p/embed/`). */
export function motivationalPosterSrc(poster: MotivationalPoster): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}${poster.imagePath.replace(/^\//, "")}`;
}
