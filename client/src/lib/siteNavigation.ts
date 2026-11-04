export type SiteLink = {
  href: string;
  label: string;
  compactLabel: string;
  category: SiteLinkCategory;
};

export type SiteLinkCategory =
  | "empire"
  | "shop"
  | "creative"
  | "programs";

export type SiteLinkCategoryMeta = {
  id: SiteLinkCategory;
  title: string;
  description: string;
};

/**
 * Table-of-contents groupings for the numbered site directory.
 */
export const SITE_LINK_CATEGORIES: SiteLinkCategoryMeta[] = [
  {
    id: "empire",
    title: "Empire",
    description: "Home, hub, and brand story",
  },
  {
    id: "shop",
    title: "Shop",
    description: "Clothing, accessories, wellness, and more",
  },
  {
    id: "creative",
    title: "Creative",
    description: "Logos, poetry, food, and media",
  },
  {
    id: "programs",
    title: "Programs",
    description: "Memberships, tools, and investing",
  },
];

/**
 * Desktop row layout for the full 22-destination directory (7 + 7 + 8).
 */
export const SITE_DIRECTORY_ROW_LAYOUT = [7, 7, 9] as const;

/**
 * The canonical order for the global site directory.
 * Keep every primary destination here so desktop and mobile stay in sync.
 */
export const SITE_LINKS: SiteLink[] = [
  { href: "/", label: "Home", compactLabel: "Home", category: "empire" },
  {
    href: "/hub",
    label: "Centralized Hub",
    compactLabel: "Central Hub",
    category: "empire",
  },
  { href: "/about", label: "About Us", compactLabel: "About Us", category: "empire" },
  {
    href: "/number-three",
    label: "The Number Three",
    compactLabel: "Number Three",
    category: "empire",
  },
  {
    href: "/motivations",
    label: "Empire Motivations",
    compactLabel: "Motivations",
    category: "empire",
  },
  {
    href: "/canvas",
    label: "Branded Logo Collection",
    compactLabel: "Logo Collection",
    category: "creative",
  },
  { href: "/apparel", label: "Apparel", compactLabel: "Apparel", category: "shop" },
  {
    href: "/football-teams",
    label: "Football Teams Sports Edition",
    compactLabel: "Football Teams",
    category: "shop",
  },
  {
    href: "/feminine",
    label: "Feminine Collection",
    compactLabel: "Feminine",
    category: "shop",
  },
  {
    href: "/masculine",
    label: "Masculine Collection",
    compactLabel: "Masculine",
    category: "shop",
  },
  {
    href: "/accessories",
    label: "Accessories",
    compactLabel: "Accessories",
    category: "shop",
  },
  {
    href: "/bedding",
    label: "Bedding & Intimates",
    compactLabel: "Bedding",
    category: "shop",
  },
  {
    href: "/elements",
    label: "Elements Health & Skincare",
    compactLabel: "Health & Skin",
    category: "shop",
  },
  {
    href: "/vintage",
    label: "Vintage Baltimore",
    compactLabel: "Vintage",
    category: "shop",
  },
  {
    href: "/wine",
    label: "Founder's Signature Wine",
    compactLabel: "Wine",
    category: "shop",
  },
  {
    href: "/poetry",
    label: "Poetry on a Plaque",
    compactLabel: "Poetry Plaque",
    category: "creative",
  },
  {
    href: "/hot-dogs",
    label: "Premium Choice Hot Dogs",
    compactLabel: "Hot Dogs",
    category: "creative",
  },
  {
    href: "/media",
    label: "Media & Music",
    compactLabel: "Media & Music",
    category: "creative",
  },
  {
    href: "/fr2p",
    label: "The FR2P Club",
    compactLabel: "The FR2P Club",
    category: "programs",
  },
  {
    href: "/pocket-booster",
    label: "Pocket Booster",
    compactLabel: "Pocket Booster",
    category: "programs",
  },
  {
    href: "/expense-relief",
    label: "TCE Expense Advantage",
    compactLabel: "Expense Advantage",
    category: "programs",
  },
  {
    href: "/invest",
    label: "Empire Invest",
    compactLabel: "Empire Invest",
    category: "programs",
  },
  {
    href: "/fuel-perks",
    label: "FR2P Fuel Rewards",
    compactLabel: "Fuel Rewards",
    category: "programs",
  },
];

export function getSiteLinkNumber(href: string): number {
  const index = SITE_LINKS.findIndex((link) => link.href === href);
  return index === -1 ? 0 : index + 1;
}

export function getSiteLinksByCategory(category: SiteLinkCategory): SiteLink[] {
  return SITE_LINKS.filter((link) => link.category === category);
}
