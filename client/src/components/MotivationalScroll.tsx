import { Link } from "wouter";
import {
  MOTIVATIONAL_POSTERS,
  motivationalScrollLine,
} from "@shared/motivationalPosters";

const scrollItems = MOTIVATIONAL_POSTERS.flatMap((poster) => [
  motivationalScrollLine(poster),
  "✦",
]);

export default function MotivationalScroll() {
  const track = [...scrollItems, ...scrollItems];

  return (
    <section
      className="relative z-30 border-b border-primary/35 bg-gradient-to-r from-secondary via-secondary/95 to-secondary shadow-[0_0_1.25rem_hsl(var(--primary)/0.2)]"
      aria-label="Empire motivational messages"
      data-testid="motivational-scroll"
    >
      <div className="flex items-stretch">
        <Link
          href="/motivations"
          className="group flex shrink-0 items-center border-r border-primary/30 bg-primary/10 px-3 py-2.5 transition-colors hover:bg-primary/20 sm:px-4"
          data-testid="link-motivations-hub"
        >
          <span className="font-display text-[10px] uppercase leading-tight tracking-[0.18em] text-primary sm:text-xs">
            Empire
            <span className="block text-foreground/90 group-hover:text-primary">
              Motivations
            </span>
          </span>
        </Link>

        <div className="motivational-marquee relative min-w-0 flex-1 overflow-hidden py-2.5">
          <div className="motivational-marquee-track flex w-max items-center gap-8 whitespace-nowrap px-4">
            {track.map((line, index) =>
              line === "✦" ? (
                <span
                  key={`sep-${index}`}
                  className="text-primary/70"
                  aria-hidden="true"
                >
                  ✦
                </span>
              ) : (
                <span
                  key={`msg-${index}`}
                  className="font-brand text-sm tracking-[0.04em] text-foreground/95 sm:text-base"
                >
                  {line}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
