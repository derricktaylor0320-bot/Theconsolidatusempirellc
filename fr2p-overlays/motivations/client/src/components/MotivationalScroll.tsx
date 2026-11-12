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
      className="relative z-30 border-b border-[#FFD700]/35 bg-gradient-to-r from-[#001f3f] via-[#002855] to-[#001f3f] shadow-[0_0_1.25rem_rgba(255,215,0,0.15)]"
      aria-label="FR2P Club motivational messages"
      data-testid="motivational-scroll"
    >
      <div className="flex items-stretch">
        <Link
          href="/motivations"
          className="group flex shrink-0 items-center border-r border-[#FFD700]/30 bg-[#FFD700]/10 px-3 py-2.5 transition-colors hover:bg-[#FFD700]/20 sm:px-4"
          data-testid="link-motivations-hub"
        >
          <span className="text-[10px] uppercase leading-tight tracking-[0.18em] text-[#FFD700] sm:text-xs font-bold">
            FR2P
            <span className="block text-cream-100/90 group-hover:text-[#FFD700]">
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
                  className="text-[#FFD700]/70"
                  aria-hidden="true"
                >
                  ✦
                </span>
              ) : (
                <span
                  key={`msg-${index}`}
                  className="text-sm tracking-[0.04em] text-cream-100/95 sm:text-base font-medium"
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
