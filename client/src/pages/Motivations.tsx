import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrandSectionBanner from "@/components/BrandSectionBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MOTIVATIONAL_POSTERS,
  type MotivationalPoster,
} from "@shared/motivationalPosters";

export default function Motivations() {
  const [selected, setSelected] = useState<MotivationalPoster | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <section className="container mx-auto px-4 pt-12">
          <BrandSectionBanner caption="Empire Motivations — sixteen messages to protect your peace, build your legacy, and write your own ticket. Tap any poster to view full size." />
        </section>

        <section className="container mx-auto px-4 py-16">
          <p className="mx-auto mb-12 max-w-3xl text-center text-muted-foreground leading-relaxed">
            These motivational graphics scroll across the home page so every
            visit starts with purpose. Save them, share them, and let them
            remind you to protect your peace, build your legacy, and write your
            own ticket.
          </p>

          <div
            className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
                className="group overflow-hidden rounded-xl border border-primary/25 bg-card text-left shadow-lg transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_18px_40px_hsl(var(--primary)/0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                data-testid={`motivation-card-${poster.id}`}
              >
                <img
                  src={poster.imageUrl}
                  alt={poster.title}
                  className="aspect-[3/4] w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <div className="border-t border-primary/20 bg-secondary/40 px-4 py-3">
                  <p className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
                    {poster.title}
                  </p>
                  {poster.tagline && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {poster.tagline}
                    </p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </main>
      <Footer />

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-primary/30">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display uppercase tracking-wide">
                  {selected.title}
                </DialogTitle>
              </DialogHeader>
              <img
                src={selected.imageUrl}
                alt={selected.title}
                className="w-full rounded-lg border border-primary/20 shadow-xl"
                data-testid="motivation-dialog-image"
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
