import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";
import { SITE_LINKS } from "@/lib/siteNavigation";
import {
  BedDouble,
  Beef,
  Fuel,
  Feather,
  Heart,
  HeartPulse,
  Shield,
  Landmark,
  Music,
  Palette,
  Rocket,
  Shirt,
  Sparkles,
  TrendingUp,
  Trophy,
  WalletCards,
  Watch,
  Wine,
} from "lucide-react";
import InstallAppButton from "@/components/InstallAppButton";

type DirectoryItem = {
  href: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  comingSoon?: boolean;
};

const DIRECTORY_ITEMS: DirectoryItem[] = [
  {
    href: "/apparel",
    title: "Apparel",
    description: "Branded clothing for men, women, and kids in sizes XS–6XL.",
    Icon: Shirt,
  },
  {
    href: "/football-teams",
    title: "Football Sports Edition",
    description:
      "Seasonal team-inspired crests for shirts, sweatshirts, jackets, and more.",
    Icon: Trophy,
  },
  {
    href: "/feminine",
    title: "Feminine Collection",
    description: "Feminine apparel, lounge picks, and pearl crest suggestions.",
    Icon: Heart,
  },
  {
    href: "/masculine",
    title: "Masculine Collection",
    description: "Masculine apparel and sword/eagle crest suggestions.",
    Icon: Shield,
  },
  {
    href: "/accessories",
    title: "Accessories",
    description: "Mugs, tumblers, bags, umbrellas, candles, cases, and more.",
    Icon: Watch,
  },
  {
    href: "/bedding",
    title: "Bedding & Intimates",
    description: "Bedding sets, loungewear, pajamas, slippers, and intimates.",
    Icon: BedDouble,
  },
  {
    href: "/elements",
    title: "Elements",
    description: "Khomplete Khemistri health, supplements, and skin care.",
    Icon: HeartPulse,
  },
  {
    href: "/canvas",
    title: "Branded Logo Collection",
    description: "Choose a signature collection and customize select products.",
    Icon: Palette,
  },
  {
    href: "/vintage",
    title: "Vintage Baltimore",
    description: "Nostalgic Baltimore-themed apparel and memorabilia.",
    Icon: Landmark,
  },
  {
    href: "/wine",
    title: "Founder's Signature Wine",
    description:
      "The Empire's premium wine collection — more flavors and pricing coming soon.",
    Icon: Wine,
    comingSoon: true,
  },
  {
    href: "/media",
    title: "Media & Music",
    description: "Artwork, singing clips, audio projects, and creative releases.",
    Icon: Music,
  },
  {
    href: "/poetry",
    title: "Poetry on a Plaque",
    description: "Custom poems created for weddings, memorials, and milestones.",
    Icon: Feather,
  },
  {
    href: "/hot-dogs",
    title: "Premium Choice Hot Dogs",
    description: "A premium street-food experience with quality choices.",
    Icon: Beef,
    comingSoon: true,
  },
  {
    href: "/pocket-booster",
    title: "Pocket Booster",
    description: "Community-focused funding designed to help small businesses grow.",
    Icon: Rocket,
  },
  {
    href: "/expense-relief",
    title: "TCE Expense Advantage",
    description:
      "Four tiers — get a portion of verified out-of-pocket expenses back.",
    Icon: WalletCards,
  },
  {
    href: "/fr2p",
    title: "The FR2P Club",
    description: "A connected program in the Empire investment ecosystem.",
    Icon: TrendingUp,
  },
  {
    href: "/invest",
    title: "Empire Invest",
    description: "Explore Empire programs, opportunities, and investor resources.",
    Icon: Landmark,
  },
  {
    href: "/fuel-perks",
    title: "FR2P Fuel Rewards",
    description:
      "Community fuel pool savings, QR magnets, and member plans from $19.99–$39.99/mo.",
    Icon: Fuel,
  },
];

export default function EmpireDirectory() {
  return (
    <section
      className="mx-auto mb-12 max-w-6xl overflow-hidden rounded-2xl border border-primary/60 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.16),transparent_38%),linear-gradient(145deg,hsl(var(--card)),hsl(var(--background)))] p-1 shadow-[0_20px_70px_rgba(0,0,0,0.35)]"
      aria-labelledby="empire-directory-title"
      data-testid="section-empire-directory"
    >
      <div className="rounded-xl border-2 border-primary/35 px-4 py-8 sm:px-7 lg:px-10">
        <div className="text-center">
          <Sparkles className="mx-auto mb-3 h-5 w-5 text-primary" />
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.38em] text-primary sm:text-xs">
            Your guide to the full experience
          </p>
          <h2
            id="empire-directory-title"
            className="font-brand text-2xl font-bold tracking-wide text-foreground sm:text-4xl"
          >
            The Consolidatus Empire
          </h2>
          <p className="mt-2 font-display text-sm uppercase tracking-[0.16em] text-muted-foreground sm:text-base">
            Khomplete Khemistri Apparel &amp; Accessories — numbered site map
          </p>
          <a
            href="https://tceholdings.org"
            className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
          >
            tceholdings.org
          </a>
        </div>

        <div className="my-7 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/60" />
          <span className="h-2 w-2 rotate-45 border border-primary/70" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/60" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DIRECTORY_ITEMS.map(({ href, title, description, Icon, comingSoon }) => {
            const siteIndex = SITE_LINKS.findIndex((link) => link.href === href);
            const siteNumber = siteIndex >= 0 ? siteIndex + 1 : null;

            return (
            <Link
              key={href}
              href={href}
              className="group flex min-h-32 gap-4 rounded-xl border border-primary/20 bg-background/45 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              data-testid={`link-directory-${href.replace(/\//g, "")}`}
            >
              <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border border-primary/35 bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                {siteNumber !== null ? (
                  <>
                    <span className="font-display text-[10px] font-bold leading-none">
                      {siteNumber}
                    </span>
                    <Icon className="mt-0.5 h-3.5 w-3.5" />
                  </>
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </span>
              <span>
                <span className="flex flex-wrap items-center gap-2">
                  {siteNumber !== null && (
                    <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-primary">
                      #{siteNumber}
                    </span>
                  )}
                  <span className="font-display text-base font-bold uppercase tracking-wide text-foreground">
                    {title}
                  </span>
                  {comingSoon && (
                    <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                      Coming Soon
                    </span>
                  )}
                </span>
                <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                  {description}
                </span>
              </span>
            </Link>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl border border-primary/30 bg-black/15 px-4 py-6 text-center sm:px-8">
          <h3 className="font-display text-xl font-bold uppercase tracking-wider text-primary">
            Take the Empire With You
          </h3>
          <p className="mx-auto mb-4 mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Install the app for one-tap access to the directory, shopping, and
            Empire programs from your phone or computer.
          </p>
          <InstallAppButton />
        </div>
      </div>
    </section>
  );
}
