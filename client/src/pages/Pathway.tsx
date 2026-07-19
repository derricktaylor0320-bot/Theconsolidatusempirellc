import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrandSectionBanner from "@/components/BrandSectionBanner";
import { Button } from "@/components/ui/button";
import {
  PROGRAM_PATHWAY,
  PROGRAM_STAGES,
  type ProgramStage,
} from "@shared/programStages";

type StagesResponse = {
  pathway: typeof PROGRAM_PATHWAY;
  stages: ProgramStage[];
};

export default function Pathway() {
  const { data } = useQuery<StagesResponse>({
    queryKey: ["/api/program-stages"],
  });

  const stages = data?.stages ?? PROGRAM_STAGES;
  const pathway = data?.pathway ?? PROGRAM_PATHWAY;
  const [activeId, setActiveId] = useState<string>(stages[0]?.id ?? "S1");
  const active = stages.find((s) => s.id === activeId) ?? stages[0];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 0%, ${active?.colorSoft ?? "transparent"}, transparent 55%),
              radial-gradient(ellipse 70% 45% at 90% 15%, hsl(var(--primary) / 0.12), transparent 50%),
              linear-gradient(180deg, hsl(var(--secondary) / 0.55), hsl(var(--background)) 42%)
            `,
          }}
        />

        <section className="relative z-10 container mx-auto px-4 pt-14 pb-10 text-center">
          <BrandSectionBanner compact />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="inline-flex items-center justify-center rounded-full p-4 mb-5 border border-primary/35 bg-primary/10"
          >
            <Compass className="h-8 w-8 text-primary" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="font-display text-xs md:text-sm uppercase tracking-[0.35em] text-primary mb-3"
            data-testid="text-pathway-eyebrow"
          >
            Pocket Booster Program
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="font-display text-4xl md:text-6xl font-bold uppercase tracking-tight mb-4"
            data-testid="text-pathway-title"
          >
            {pathway.shortName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
            className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg mb-8"
            data-testid="text-pathway-tagline"
          >
            {pathway.tagline}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/pocket-booster#program-codes">
              <Button
                className="bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display"
                data-testid="button-pathway-pocket-booster"
              >
                Open Choose Your Tier Plaques
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/fr2p">
              <Button
                variant="outline"
                className="uppercase tracking-wider font-display border-primary/40"
                data-testid="button-pathway-fr2p"
              >
                Enter FR2P Club
              </Button>
            </Link>
          </motion.div>
        </section>

        <section className="relative z-10 container mx-auto px-4 pb-6">
          <div
            className="flex gap-2 overflow-x-auto pb-2 justify-start md:justify-center"
            data-testid="pathway-stage-nav"
          >
            {stages.map((stage, index) => {
              const selected = stage.id === activeId;
              return (
                <motion.button
                  key={stage.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => setActiveId(stage.id)}
                  className="shrink-0 min-w-[4.5rem] px-3 py-2 border transition-colors"
                  style={{
                    borderColor: selected ? stage.color : "hsl(var(--border))",
                    background: selected ? stage.colorSoft : "transparent",
                    color: selected ? stage.color : "hsl(var(--muted-foreground))",
                  }}
                  data-testid={`button-stage-${stage.id}`}
                  aria-pressed={selected}
                >
                  <span className="block font-display text-sm font-bold tracking-wider">
                    {stage.id}
                  </span>
                  <span className="block text-[10px] uppercase tracking-widest opacity-80">
                    Tab {stage.level}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>

        <section className="relative z-10 container mx-auto px-4 pb-20">
          <AnimatePresence mode="wait">
            {active && (
              <motion.article
                key={active.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="max-w-3xl mx-auto"
                data-testid={`panel-stage-${active.id}`}
              >
                <div
                  className="h-1.5 w-full mb-8"
                  style={{
                    background: `linear-gradient(90deg, ${active.color}, transparent)`,
                  }}
                />
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span
                    className="inline-flex items-center gap-2 font-display text-sm uppercase tracking-[0.25em]"
                    style={{ color: active.color }}
                    data-testid="text-active-stage-id"
                  >
                    <Sparkles className="h-4 w-4" />
                    {active.id} · Tab {active.level}
                  </span>
                  <span
                    className="text-xs uppercase tracking-widest px-2 py-1 border"
                    style={{
                      borderColor: active.color,
                      color: active.color,
                      background: active.colorSoft,
                    }}
                    data-testid="text-active-visual-identity"
                  >
                    {active.visualIdentity}
                  </span>
                </div>
                <h2
                  className="font-display text-3xl md:text-5xl font-bold uppercase tracking-tight mb-5"
                  data-testid="text-active-stage-title"
                >
                  {active.title}
                </h2>
                <p
                  className="text-foreground/85 text-lg leading-relaxed mb-4"
                  data-testid="text-active-stage-meaning"
                >
                  {active.meaning}
                </p>
                <p
                  className="text-foreground/75 text-base leading-relaxed mb-8 border-l-2 border-primary/50 pl-4"
                  data-testid="text-active-stage-in-program"
                >
                  {active.inProgram}
                </p>
                <Link href={active.relatedHref}>
                  <Button
                    className="uppercase tracking-wider font-display text-white hover:opacity-90"
                    style={{ backgroundColor: active.color }}
                    data-testid="button-active-stage-cta"
                  >
                    Continue in {active.relatedLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.article>
            )}
          </AnimatePresence>

          <div className="mt-16 max-w-4xl mx-auto">
            <h3 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-center mb-8 text-primary">
              Full Pocket Booster Roadway
            </h3>
            <ol className="space-y-0" data-testid="list-pathway-stages">
              {stages.map((stage, index) => (
                <li key={stage.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveId(stage.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full text-left group flex gap-4 py-5 border-t border-border/60 hover:bg-secondary/30 transition-colors px-2 md:px-4"
                    data-testid={`list-stage-${stage.id}`}
                  >
                    <span
                      className="shrink-0 w-1 self-stretch"
                      style={{ backgroundColor: stage.color }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                        <span
                          className="font-display text-sm tracking-widest uppercase"
                          style={{ color: stage.color }}
                        >
                          {stage.id}
                        </span>
                        <span className="font-display text-lg md:text-xl font-semibold uppercase tracking-tight group-hover:text-primary transition-colors">
                          {stage.title}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {stage.meaning}
                      </p>
                    </div>
                    {index < stages.length - 1 && (
                      <span className="hidden md:block text-xs uppercase tracking-widest text-muted-foreground self-center">
                        Next
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
