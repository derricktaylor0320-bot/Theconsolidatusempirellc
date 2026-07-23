import type { CSSProperties } from "react";
import { Link, useLocation } from "wouter";
import { Compass, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SITE_LINKS } from "@/lib/siteNavigation";
import compassLogo from "@assets/generated_images/consolidatus_empire_logo_2020.png";

type CompassNavigationProps = {
  accountName: string;
  isAuthenticated: boolean;
  isOpen: boolean;
  onLogout: () => void;
  onOpenChange: (open: boolean) => void;
};

type CompassLinkStyle = CSSProperties & {
  "--angle": string;
  "--counter-angle": string;
  "--distance": string;
};

const START_ANGLE = -90;
const FULL_CIRCLE = 360;

export default function CompassNavigation({
  accountName,
  isAuthenticated,
  isOpen,
  onLogout,
  onOpenChange,
}: CompassNavigationProps) {
  const [location] = useLocation();

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-10 border-primary/60 bg-primary/10 px-3 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.16)] hover:bg-primary hover:text-primary-foreground"
          aria-label="Open the Empire compass navigation"
          data-testid="button-compass-navigation"
        >
          <Compass className="h-5 w-5" />
          <span className="ml-2 hidden uppercase tracking-[0.16em] xl:inline">
            Empire Compass
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="h-dvh w-screen max-w-none overflow-hidden border-l-0 bg-background/98 p-0 sm:max-w-none"
        data-testid="dialog-compass-navigation"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_72%)]" />
        </div>

        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <SheetHeader className="shrink-0 border-b border-primary/30 px-5 py-3 text-center sm:px-8 sm:py-4">
            <SheetTitle className="font-display text-xl uppercase tracking-[0.2em] text-primary sm:text-2xl">
              Explore the Empire
            </SheetTitle>
            <SheetDescription className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
              {SITE_LINKS.length} destinations — choose any golden point
            </SheetDescription>
          </SheetHeader>

          <nav
            className="flex min-h-0 flex-1 items-center justify-center"
            aria-label="Empire compass"
          >
            <div className="compass-rose" data-testid="compass-rose">
              <svg
                viewBox="0 0 100 100"
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="compassGlow">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.38" />
                    <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.09" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="compassRay" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                <circle cx="50" cy="50" r="48" fill="url(#compassGlow)" />
                <circle
                  cx="50"
                  cy="50"
                  r="41.5"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeOpacity="0.3"
                  strokeWidth="0.35"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="30.5"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeOpacity="0.22"
                  strokeWidth="0.25"
                  strokeDasharray="1.4 1.4"
                />

                {SITE_LINKS.map((link, index) => {
                  const angle =
                    START_ANGLE + (index * FULL_CIRCLE) / SITE_LINKS.length;
                  const radians = (angle * Math.PI) / 180;
                  const endX = 50 + Math.cos(radians) * 44;
                  const endY = 50 + Math.sin(radians) * 44;

                  return (
                    <g key={link.href}>
                      <line
                        x1="50"
                        y1="50"
                        x2={endX}
                        y2={endY}
                        stroke="url(#compassRay)"
                        strokeWidth={index % 2 === 0 ? "0.42" : "0.25"}
                      />
                      <circle
                        cx={endX}
                        cy={endY}
                        r={index % 2 === 0 ? "0.9" : "0.65"}
                        fill="hsl(var(--primary))"
                      />
                    </g>
                  );
                })}
              </svg>

              <div className="compass-center" aria-hidden="true">
                <div className="absolute inset-[-18%] rounded-full border border-primary/25" />
                <div className="absolute inset-[-34%] animate-[spin_36s_linear_infinite] rounded-full border border-dashed border-primary/20 motion-reduce:animate-none" />
                <img
                  src={compassLogo}
                  alt=""
                  className="h-[72%] w-[72%] object-contain drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)]"
                />
              </div>

              {SITE_LINKS.map((link, index) => {
                const angle =
                  START_ANGLE + (index * FULL_CIRCLE) / SITE_LINKS.length;
                const style: CompassLinkStyle = {
                  "--angle": `${angle}deg`,
                  "--counter-angle": `${-angle}deg`,
                  "--distance":
                    index % 2 === 0
                      ? "var(--compass-outer-radius)"
                      : "var(--compass-inner-radius)",
                };
                const isActive = location === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={style}
                    className={`compass-nav-link ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-primary/55 bg-background/90 text-primary hover:border-primary hover:bg-primary hover:text-primary-foreground"
                    }`}
                    onClick={() => onOpenChange(false)}
                    aria-label={`${index + 1}. ${link.label}`}
                    aria-current={isActive ? "page" : undefined}
                    title={link.label}
                    data-testid={`link-compass-${link.href === "/" ? "home" : link.href.slice(1)}`}
                  >
                    <span className="compass-link-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="sm:hidden">{link.compactLabel}</span>
                    <span className="hidden sm:inline">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="relative z-20 flex min-h-12 shrink-0 items-center justify-center border-t border-primary/25 bg-background/75 px-5 py-2 backdrop-blur-sm">
            {isAuthenticated ? (
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                  <UserIcon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="max-w-44 truncate">{accountName}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onLogout();
                  }}
                  className="h-8 border-primary/50 uppercase tracking-wider"
                  data-testid="button-logout-compass"
                >
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link href="/auth" onClick={() => onOpenChange(false)}>
                <Button
                  size="sm"
                  className="h-8 bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-signin-compass"
                >
                  <LogIn className="mr-1.5 h-3.5 w-3.5" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
