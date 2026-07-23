export type SiteLink = {
  href: string;
  label: string;
  compactLabel: string;
};

/**
 * The clockwise order used by the global compass navigation.
 * Keep every primary destination here so desktop and mobile stay in sync.
 */
export const SITE_LINKS: SiteLink[] = [
  { href: "/", label: "Home", compactLabel: "Home" },
  { href: "/hub", label: "Centralized Hub", compactLabel: "Central Hub" },
  { href: "/about", label: "About Us", compactLabel: "About Us" },
  {
    href: "/number-three",
    label: "The Number Three",
    compactLabel: "Number Three",
  },
  {
    href: "/canvas",
    label: "Branded Logo Collection",
    compactLabel: "Logo Collection",
  },
  { href: "/apparel", label: "Apparel", compactLabel: "Apparel" },
  { href: "/accessories", label: "Accessories", compactLabel: "Accessories" },
  {
    href: "/bedding",
    label: "Bedding & Intimates",
    compactLabel: "Bedding",
  },
  {
    href: "/elements",
    label: "Elements Health & Skincare",
    compactLabel: "Health & Skin",
  },
  {
    href: "/vintage",
    label: "Vintage Baltimore",
    compactLabel: "Vintage",
  },
  {
    href: "/poetry",
    label: "Poetry on a Plaque",
    compactLabel: "Poetry Plaque",
  },
  {
    href: "/hot-dogs",
    label: "Premium Choice Hot Dogs",
    compactLabel: "Hot Dogs",
  },
  { href: "/media", label: "Media & Music", compactLabel: "Media & Music" },
  { href: "/fr2p", label: "The FR2P Club", compactLabel: "FR2P Club" },
  {
    href: "/pocket-booster",
    label: "Pocket Booster",
    compactLabel: "Pocket Booster",
  },
  {
    href: "/invest",
    label: "Empire Invest",
    compactLabel: "Empire Invest",
  },
];
