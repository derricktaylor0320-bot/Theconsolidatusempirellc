import { useState } from "react";
import { motion } from "framer-motion";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MOTIVATIONAL_POSTERS,
  motivationalPosterSrc,
  type MotivationalPoster,
} from "@shared/motivationalPosters";

export default function Motivations() {
  const [selected, setSelected] = useState<MotivationalPoster | null>(null);

  return (
    <div className="min-h-screen bg-secondary flex">
      <SidebarNav />
      <div className="flex-1 md:ml-64">
        <section
          className="border-b border-[#FFD700]/25 px-4 py-10 sm:px-6 lg:px-8"
          style={{ backgroundColor: "#0b0c2a" }}
        >
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#FFD700]">
              The FR2P Club
            </p>
            <h1 className="mb-4 text-3xl font-bold text-cream-100 sm:text-4xl">
              Empire Motivations
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-cream-100/75 sm:text-base">
              Sixteen messages to protect your peace, build your legacy, and
              write your own ticket. They scroll across the dashboard — tap any
              poster to view full size.
            </p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8" style={{ backgroundColor: "#0b0c2a" }}>
          <div
            className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            data-testid="motivations-grid"
          >
            {MOTIVATIONAL_POSTERS.map((poster, index) => (
              <motion.button
                key={poster.id}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(index * 0.04, 0.4) }}
                onClick={() => setSelected(poster)}
                className="group overflow-hidden rounded-xl border border-[#FFD700]/25 bg-[#001f3f]/60 text-left shadow-lg transition hover:-translate-y-1 hover:border-[#FFD700]/60 hover:shadow-[0_18px_40px_rgba(255,215,0,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
                data-testid={`motivation-card-${poster.id}`}
              >
                <img
                  src={motivationalPosterSrc(poster)}
                  alt={poster.title}
                  className="aspect-[3/4] w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <div className="border-t border-[#FFD700]/20 bg-[#001f3f]/80 px-4 py-3">
                  <p className="text-sm font-bold uppercase tracking-wide text-cream-100">
                    {poster.title}
                  </p>
                  {poster.tagline && (
                    <p className="mt-1 text-xs text-cream-100/60">
                      {poster.tagline}
                    </p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-[#FFD700]/30 bg-[#0b0c2a] text-cream-100">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="uppercase tracking-wide text-[#FFD700]">
                  {selected.title}
                </DialogTitle>
              </DialogHeader>
              <img
                src={motivationalPosterSrc(selected)}
                alt={selected.title}
                className="w-full rounded-lg border border-[#FFD700]/20 shadow-xl"
                data-testid="motivation-dialog-image"
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
