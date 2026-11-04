import { Link, useLocation } from "wouter";
import {
  SITE_DIRECTORY_ROW_LAYOUT,
  SITE_LINKS,
  SITE_LINK_CATEGORIES,
  type SiteLink,
} from "@/lib/siteNavigation";
import { cn } from "@/lib/utils";

type EmpireNavigationGridProps = {
  onNavigate?: () => void;
  variant?: "compact" | "default" | "rows";
  showCategories?: boolean;
  className?: string;
};

function NavigationButton({
  link,
  number,
  isActive,
  isCompact,
  onNavigate,
}: {
  link: SiteLink;
  number: number;
  isActive: boolean;
  isCompact: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-label={`${number}. ${link.label}`}
      aria-current={isActive ? "page" : undefined}
      title={link.label}
      data-testid={`link-empire-nav-${link.href === "/" ? "home" : link.href.slice(1)}`}
      className={cn(
        "group flex h-full w-full flex-col items-stretch rounded-xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isCompact ? "min-h-[4.5rem] p-2.5" : "min-h-[5.25rem] p-3",
        isActive
          ? "border-primary bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.28)]"
          : "border-primary/25 bg-background/70 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5",
      )}
    >
      <span
        className={cn(
          "mb-1.5 inline-flex w-fit items-center justify-center rounded-md border font-display font-bold leading-none",
          isCompact ? "h-6 min-w-6 px-1.5 text-[11px]" : "h-7 min-w-7 px-2 text-xs",
          isActive
            ? "border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground"
            : "border-primary/35 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
        )}
      >
        {number}
      </span>
      <span
        className={cn(
          "font-display font-semibold uppercase leading-snug tracking-wide",
          isCompact ? "text-[10px] sm:text-[11px]" : "text-[11px] sm:text-xs",
          isActive ? "text-primary-foreground" : "text-foreground",
        )}
      >
        <span className="sm:hidden">{link.compactLabel}</span>
        <span className="hidden sm:inline">{link.label}</span>
      </span>
    </Link>
  );
}

function RowLayoutGrid({
  onNavigate,
  isCompact,
  location,
}: {
  onNavigate?: () => void;
  isCompact: boolean;
  location: string;
}) {
  let startIndex = 0;

  return (
    <div className="flex flex-col gap-3">
      {SITE_DIRECTORY_ROW_LAYOUT.map((rowCount, rowIndex) => {
        const rowLinks = SITE_LINKS.slice(startIndex, startIndex + rowCount);
        startIndex += rowCount;

        return (
          <ol
            key={`row-${rowIndex}`}
            className={cn(
              "grid list-none gap-2 p-0 m-0",
              rowCount === 6 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
              rowCount === 7 && "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7",
              rowCount === 8 && "grid-cols-2 sm:grid-cols-4 lg:grid-cols-8",
              rowCount === 9 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-9",
            )}
          >
            {rowLinks.map((link) => {
              const number = SITE_LINKS.indexOf(link) + 1;
              return (
                <li key={link.href}>
                  <NavigationButton
                    link={link}
                    number={number}
                    isActive={location === link.href}
                    isCompact={isCompact}
                    onNavigate={onNavigate}
                  />
                </li>
              );
            })}
          </ol>
        );
      })}
    </div>
  );
}

export default function EmpireNavigationGrid({
  onNavigate,
  variant = "default",
  showCategories = false,
  className,
}: EmpireNavigationGridProps) {
  const [location] = useLocation();
  const isCompact = variant === "compact";
  const isRows = variant === "rows";

  if (showCategories) {
    return (
      <nav
        className={cn("w-full space-y-6", className)}
        aria-label="Empire site directory"
        data-testid="empire-navigation-grid"
      >
        {SITE_LINK_CATEGORIES.map((category) => {
          const categoryLinks = SITE_LINKS.filter(
            (link) => link.category === category.id,
          );

          if (categoryLinks.length === 0) {
            return null;
          }

          return (
            <section
              key={category.id}
              aria-labelledby={`nav-category-${category.id}`}
            >
              <div className="mb-3">
                <h3
                  id={`nav-category-${category.id}`}
                  className="font-display text-sm font-bold uppercase tracking-[0.18em] text-primary sm:text-base"
                >
                  {category.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <ol
                className={cn(
                  "grid list-none gap-2 p-0 m-0",
                  "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
                )}
              >
                {categoryLinks.map((link) => {
                  const number = SITE_LINKS.indexOf(link) + 1;
                  return (
                    <li key={link.href}>
                      <NavigationButton
                        link={link}
                        number={number}
                        isActive={location === link.href}
                        isCompact={isCompact}
                        onNavigate={onNavigate}
                      />
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className={cn("w-full", className)}
      aria-label="Empire site directory"
      data-testid="empire-navigation-grid"
    >
      {isRows ? (
        <RowLayoutGrid
          onNavigate={onNavigate}
          isCompact={isCompact}
          location={location}
        />
      ) : (
        <ol
          className={cn(
            "grid list-none gap-2 p-0 m-0",
            isCompact
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-7",
          )}
        >
          {SITE_LINKS.map((link, index) => {
            const number = index + 1;
            return (
              <li key={link.href}>
                <NavigationButton
                  link={link}
                  number={number}
                  isActive={location === link.href}
                  isCompact={isCompact}
                  onNavigate={onNavigate}
                />
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}
