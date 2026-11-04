import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import EmpireNavigationGrid from "@/components/EmpireNavigationGrid";
import { getSiteLinkNumber, SITE_LINKS } from "@/lib/siteNavigation";

export default function TopSlideNav() {
  const [isExpanded, setIsExpanded] = useState(false);
  const apparelNumber = getSiteLinkNumber("/apparel");
  const elementsNumber = getSiteLinkNumber("/elements");
  const accessoriesNumber = getSiteLinkNumber("/accessories");

  return (
    <div
      className="sticky top-20 z-40 w-full border-b border-primary/30 bg-secondary/95 shadow-[0_0.5rem_1.5rem_hsl(219_96%_54%/0.12)] backdrop-blur supports-[backdrop-filter]:bg-secondary/90"
      data-testid="top-slide-nav"
    >
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-primary/5"
        aria-expanded={isExpanded}
        aria-controls="top-slide-nav-panel"
        data-testid="button-top-slide-nav-toggle"
      >
        <span className="font-display text-xs uppercase tracking-[0.22em] text-primary sm:text-sm">
          {isExpanded
            ? `Site Directory · All ${SITE_LINKS.length} Destinations`
            : `Click Below — Site Directory for All ${SITE_LINKS.length} Destinations`}
        </span>
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="hidden sm:inline">
            {isExpanded ? "Hide" : "Open directory"}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-primary transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id="top-slide-nav-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="overflow-hidden border-t border-primary/20"
            data-testid="panel-top-slide-nav"
          >
            <div className="container mx-auto px-4 py-4">
              <p className="mb-4 text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Tap{" "}
                <span className="font-semibold text-primary">
                  Click Here — Site Directory
                </span>{" "}
                in the center of the menu bar above for the full directory, or
                browse every numbered destination right here.
              </p>
              <p className="mb-4 text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Every button is numbered and labeled — go straight where you
                need. Shop clothing at{" "}
                <span className="font-semibold text-foreground">
                  {apparelNumber}. Apparel
                </span>
                , accessories at{" "}
                <span className="font-semibold text-foreground">
                  {accessoriesNumber}. Accessories
                </span>
                , and lotion or skin care at{" "}
                <span className="font-semibold text-foreground">
                  {elementsNumber}. Elements Health &amp; Skincare
                </span>
                .
              </p>

              <EmpireNavigationGrid
                variant="rows"
                onNavigate={() => setIsExpanded(false)}
              />

              <div className="mt-4 flex justify-center">
                <Link href="/hub" onClick={() => setIsExpanded(false)}>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-primary underline-offset-4 hover:underline">
                    Open the full hub with descriptions →
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
