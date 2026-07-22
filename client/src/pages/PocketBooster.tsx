import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  CreditCard,
  FileDown,
  Landmark,
  Loader2,
  Rocket,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  PAY_TO_LEARN_MODULES,
  POCKET_BOOSTER_TIERS,
  REPAYMENT_LABELS,
  type PayToLearnModule,
  type PocketBoosterTier,
  type RepaymentChoice,
} from "@shared/pocketBooster";
import {
  PROGRAM_PATHWAY,
  PROGRAM_STAGES,
  type ProgramStage,
  type ProgramStageId,
} from "@shared/programStages";
import {
  P2P_ANNUAL_YIELD_RATE,
  P2P_INVESTMENT_AMOUNTS,
  type P2PInvestmentAmount,
} from "@shared/liquidityLoop";

type TiersResponse = {
  platformName: string;
  fundingStrategy: string;
  tiers: PocketBoosterTier[];
  modules: typeof PAY_TO_LEARN_MODULES;
};

type MeResponse = {
  subscription: {
    id: string;
    tierLevel: number;
    monthlySubscription: string;
    maxCushionLimit: string;
    nextBillingAmount: string;
    subscriptionStatus: string;
  } | null;
  tier: PocketBoosterTier | null;
  advances: Array<{
    id: string;
    amountBorrowed: string;
    repaymentType: string;
    status: string;
    createdAt: string | null;
    schedules: Array<{
      id: string;
      deductionAmount: string;
      scheduledDate: string;
      status: string;
      squareInvoiceId?: string | null;
      squareInvoiceUrl?: string | null;
      squareInvoiceStatus?: string | null;
    }>;
  }>;
  squareConfigured?: boolean;
  milestones: Array<{
    id: string;
    moduleName: string;
    createdAt: string | null;
  }>;
};

type VaultResponse = {
  projectTag: string;
  annualYieldRate: number;
  allowedInvestmentAmounts: number[];
  totalVaultContribution: number;
  availableLendingCapital: number;
  activePositions: number;
};

type LiquidityMeResponse = {
  investments: Array<{
    id: string;
    amountAllocated: string;
    projectTag: string;
    yieldRate: string;
    accruedYield: string;
    paidYield: string;
    status: string;
    createdAt: string | null;
    ledger: Array<{
      id: string;
      operationsSpend: string;
      description: string;
    }>;
  }>;
  totals: { allocated: number; paidYield: number };
  annualYieldRate: number;
  allowedInvestmentAmounts: number[];
};

const CREST_LABELS: Record<ProgramStageId, string> = {
  S1: "Red Foundation Crest",
  S2: "Money Green Crest",
  S3: "Navy Community Crest",
  S4: "Purple Autopilot Crest",
  S5: "Brown Growth Crest",
  S6: "Six-Figure Emerald Crest",
  S7: "Founders Royal Blue & Silver Crest",
  S8: "Diamond Burnt Orange Crest",
};

function formatMoney(value: number | string) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `$${n.toFixed(2)}`;
}

function errorMessage(err: unknown, fallback: string) {
  if (!(err instanceof Error)) return fallback;
  const raw = err.message.replace(/^\d+:\s*/, "");
  try {
    const parsed = JSON.parse(raw) as { error?: string };
    if (parsed.error) return parsed.error;
  } catch {
    // not JSON — use raw text
  }
  return raw || fallback;
}

function ProgramColorCrest({ stage }: { stage: ProgramStage }) {
  const gradientId = `program-crest-${stage.id}`;
  const isDiamond = stage.id === "S8";

  return (
    <div
      className="mx-auto aspect-[4/5] w-full max-w-[11rem]"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 160 200"
        className="h-full w-full drop-shadow-[0_10px_18px_rgba(107,74,21,0.22)]"
        role="img"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff6d8" />
            <stop offset="34%" stopColor={stage.color} />
            <stop offset="68%" stopColor={stage.color} />
            <stop offset="100%" stopColor="#f4c650" />
          </linearGradient>
        </defs>
        <path
          d="M80 9c7 12 17 18 31 18 4 0 9-.5 14-1-2 15 2 28 13 39-8 12-11 25-8 40 2 11 0 24-8 36-9 15-24 28-42 40-18-12-33-25-42-40-8-12-10-25-8-36 3-15 0-28-8-40 11-11 15-24 13-39 5 .5 10 1 14 1 14 0 24-6 31-18z"
          fill={`url(#${gradientId})`}
          stroke="#b7831f"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d="M80 28c9 11 21 17 37 17-5 16-1 29 9 40-5 9-7 19-5 31 2 19-12 36-41 55-29-19-43-36-41-55 2-12 0-22-5-31 10-11 14-24 9-40 16 0 28-6 37-17z"
          fill="none"
          stroke="#fff6d8"
          strokeOpacity="0.9"
          strokeWidth="3"
        />
        <path
          d="M28 76c-8 13-10 29-4 45M132 76c8 13 10 29 4 45"
          fill="none"
          stroke="#b7831f"
          strokeLinecap="round"
          strokeWidth="4"
        />
        {isDiamond ? (
          <path
            d="M80 58 108 91 80 139 52 91z"
            fill="none"
            stroke="#fff6d8"
            strokeWidth="5"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M80 56v82M57 80c12 8 34 8 46 0M57 116c12-8 34-8 46 0"
            fill="none"
            stroke="#fff6d8"
            strokeLinecap="round"
            strokeWidth="5"
          />
        )}
        <circle cx="80" cy="42" r="8" fill="#fff6d8" stroke="#b7831f" strokeWidth="3" />
        <text
          x="80"
          y="105"
          textAnchor="middle"
          className="fill-white font-display text-[30px] font-bold tracking-wider"
          style={{ paintOrder: "stroke", stroke: "rgba(48, 28, 8, 0.45)", strokeWidth: 3 }}
        >
          {stage.id}
        </text>
      </svg>
    </div>
  );
}

export default function PocketBooster() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.body.classList.add("pocket-booster-theme");
    return () => document.body.classList.remove("pocket-booster-theme");
  }, []);

  const { data: catalog } = useQuery<TiersResponse>({
    queryKey: ["/api/pocket-booster/tiers"],
  });

  const { data: me, isLoading: meLoading } = useQuery<MeResponse>({
    queryKey: ["/api/pocket-booster/me"],
    enabled: isAuthenticated,
  });

  const { data: vault } = useQuery<VaultResponse>({
    queryKey: ["/api/liquidity/vault"],
  });

  const { data: liquidityMe } = useQuery<LiquidityMeResponse>({
    queryKey: ["/api/liquidity/me"],
    enabled: isAuthenticated,
  });

  const tiers = catalog?.tiers ?? POCKET_BOOSTER_TIERS;
  const modules = catalog?.modules ?? PAY_TO_LEARN_MODULES;
  const activeTier = me?.tier ?? null;
  const maxLimit = activeTier?.maxCushionLimit ?? 0;
  const investmentAmounts =
    vault?.allowedInvestmentAmounts ?? [...P2P_INVESTMENT_AMOUNTS];
  const yieldRate = vault?.annualYieldRate ?? P2P_ANNUAL_YIELD_RATE;

  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3 | 4>(1);
  const [amount, setAmount] = useState("");
  const [repaymentChoice, setRepaymentChoice] =
    useState<RepaymentChoice>("FULL_NEXT_PAYDAY");
  const [nextPayday, setNextPayday] = useState("");
  const [customSplitCount, setCustomSplitCount] = useState(3);
  const [investAmount, setInvestAmount] =
    useState<P2PInvestmentAmount>(100);
  const [activeStageId, setActiveStageId] = useState<ProgramStageId>("S1");
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [lessonNotes, setLessonNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activeTier) {
      // Prefill repayment options only — do not auto-select / auto-activate a tier
      const first = activeTier.repaymentOptions[0];
      if (first) setRepaymentChoice(first);
    }
  }, [activeTier?.level]);

  const repaymentOptions = useMemo<RepaymentChoice[]>(() => {
    const tier = activeTier ?? tiers.find((t) => t.level === selectedTier);
    return tier?.repaymentOptions ?? ["FULL_NEXT_PAYDAY"];
  }, [activeTier, selectedTier, tiers]);

  const activateMutation = useMutation({
    mutationFn: async (tierLevel: 1 | 2 | 3 | 4) => {
      const res = await apiRequest("POST", "/api/pocket-booster/activate", {
        tierLevel,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pocket-booster/me"] });
      toast({ title: "Tier activated", description: data.message });
    },
    onError: (err: unknown) => {
      toast({
        title: "Could not activate tier",
        description: errorMessage(err, "Activation failed."),
        variant: "destructive",
      });
    },
  });

  const cushionMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        amountRequested: parseFloat(amount),
        repaymentChoice,
        nextPaydayDate: nextPayday,
      };
      if (repaymentChoice === "CUSTOM_PAYROLL_SPLIT") {
        payload.customSplitCount = customSplitCount;
      }
      const res = await apiRequest(
        "POST",
        "/api/pocket-booster/request-cushion",
        payload,
      );
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pocket-booster/me"] });
      setAmount("");
      toast({ title: "Cushion approved", description: data.message });
    },
    onError: (err: unknown) => {
      toast({
        title: "Cushion request failed",
        description: errorMessage(err, "Request failed."),
        variant: "destructive",
      });
    },
  });

  const moduleMutation = useMutation({
    mutationFn: async (completedModule: string) => {
      const res = await apiRequest(
        "POST",
        "/api/pocket-booster/complete-module",
        { completedModule },
      );
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pocket-booster/me"] });
      toast({ title: "Module complete", description: data.message });
    },
    onError: (err: unknown) => {
      toast({
        title: "Could not log module",
        description: errorMessage(err, "Could not log module."),
        variant: "destructive",
      });
    },
  });

  const investMutation = useMutation({
    mutationFn: async (investmentAmount: P2PInvestmentAmount) => {
      const res = await apiRequest(
        "POST",
        "/api/liquidity/bridge-p2p-to-booster",
        { investmentAmount },
      );
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/liquidity/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/liquidity/vault"] });
      const units = data.details?.allocatedUnits;
      toast({
        title:
          data.complianceStatus === "VERIFIED_COMPLIANT"
            ? "Participation units issued"
            : "Capital bridged",
        description:
          units != null
            ? `${units} non-equity RPUs bridged to the Reserve Vault. Zero voting rights.`
            : data.backOfficeVerification ||
              data.message ||
              "Investment routed to the Pocket Booster Reserve Vault.",
      });
    },
    onError: (err: unknown) => {
      toast({
        title: "Investment failed",
        description: errorMessage(err, "Could not bridge P2P capital."),
        variant: "destructive",
      });
    },
  });

  const completedModules = new Set(
    (me?.milestones ?? []).map((m) => m.moduleName),
  );

  const activeCourse: PayToLearnModule | undefined = modules.find(
    (m) => m.id === activeCourseId,
  );
  const activeLesson = activeCourse?.lessons[lessonIndex];
  const courseLessonCount = activeCourse?.lessons.length ?? 0;
  const isLastLesson =
    activeCourse != null && lessonIndex >= courseLessonCount - 1;

  const openCourse = (moduleId: string) => {
    setActiveCourseId(moduleId);
    setLessonIndex(0);
  };

  const advanceLesson = () => {
    if (!activeCourse) return;
    if (!isLastLesson) {
      setLessonIndex((i) => i + 1);
      return;
    }
    // Graduation: system marks complete automatically — no manual Mark Complete
    if (!completedModules.has(activeCourse.id)) {
      moduleMutation.mutate(activeCourse.id, {
        onSuccess: () => {
          setActiveCourseId(null);
          setLessonIndex(0);
        },
      });
    } else {
      setActiveCourseId(null);
      setLessonIndex(0);
    }
  };

  return (
    <div className="pocket-booster-theme min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.24),_transparent_55%),linear-gradient(180deg,_hsl(42_68%_88%)_0%,_hsl(var(--background))_100%)]" />
          <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="inline-flex items-center justify-center rounded-full p-5 mb-6 border border-primary/40 bg-primary/10"
            >
              <Rocket className="h-10 w-10 text-primary" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-display text-4xl md:text-6xl font-bold uppercase tracking-wider text-primary mb-4"
              data-testid="text-pocket-booster-title"
            >
              Pocket Booster
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="text-lg md:text-xl text-foreground/85 max-w-2xl mx-auto mb-3"
            >
              Subscription-powered cash cushions backed by peer-to-peer reserve
              capital — with {(yieldRate * 100).toFixed(1)}% yield returning to
              investors.
            </motion.p>
            <p
              className="text-sm uppercase tracking-[0.2em] text-primary/80 font-display"
              data-testid="text-funding-strategy"
            >
              {catalog?.fundingStrategy ??
                "Zero-Capital (Subscription Powered)"}{" "}
              · P2P Liquidity Loop
            </p>
            <p className="mt-4 text-sm text-muted-foreground max-w-xl mx-auto">
              {PROGRAM_PATHWAY.tagline} Open the{" "}
              <a
                href="#building-blocks"
                className="text-primary underline underline-offset-2"
                data-testid="link-pb-stages"
              >
                colorful program tabs
              </a>
              , choose a membership only when you are ready to activate, and take
              the real Pay-to-Learn programs below.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild data-testid="button-open-building-blocks">
                <a href="#building-blocks">Open Building Blocks</a>
              </Button>
              <Button asChild variant="outline" data-testid="button-open-pay-to-learn">
                <a href="#pay-to-learn">Take a Program</a>
              </Button>
              <Button
                asChild
                variant="outline"
                data-testid="button-download-pdf-application"
              >
                <a href="/assets/pocket-booster-application.pdf" download>
                  <FileDown className="h-4 w-4" />
                  Download PDF Application
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Colorful S1–S8 building-block crests */}
        <section
          id="building-blocks"
          className="border-y border-primary/15 bg-secondary/20"
          data-testid="section-building-blocks"
        >
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="text-center mb-8">
              <p className="font-display text-xs uppercase tracking-[0.3em] text-primary mb-2">
                Pocket Booster Application
              </p>
              <h2
                className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-primary mb-3"
                data-testid="text-building-blocks-title"
              >
                Building Blocks · Color Crests S1–S8
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                These eight color crests are the program building blocks. Tap a
                crest to see what that stage represents — then continue into the
                matching tool inside Pocket Booster.
              </p>
            </div>

            <div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              data-testid="pocket-booster-stage-tabs"
            >
              {PROGRAM_STAGES.map((stage, index) => {
                const selected = activeStageId === stage.id;
                return (
                  <motion.button
                    key={stage.id}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => setActiveStageId(stage.id)}
                    className="rounded-2xl border p-4 text-center transition-colors"
                    style={{
                      borderColor: selected ? stage.color : "hsl(var(--border))",
                      background: selected
                        ? `linear-gradient(180deg, ${stage.colorSoft}, hsl(var(--card)))`
                        : "hsl(var(--card) / 0.78)",
                      boxShadow: selected
                        ? `0 0 0 2px ${stage.colorSoft}, 0 14px 30px ${stage.colorSoft}`
                        : "none",
                    }}
                    data-testid={`tab-building-block-${stage.id}`}
                    aria-pressed={selected}
                    aria-label={`${CREST_LABELS[stage.id]}: ${stage.title}`}
                  >
                    <ProgramColorCrest stage={stage} />
                    <span
                      className="mt-3 block font-display text-sm font-bold uppercase tracking-[0.18em]"
                      style={{ color: stage.color }}
                    >
                      {CREST_LABELS[stage.id]}
                    </span>
                    <span className="mt-1 block text-xs uppercase tracking-wide text-foreground/75">
                      {stage.title}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {PROGRAM_STAGES.map((stage) =>
              stage.id === activeStageId ? (
                <motion.article
                  key={stage.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 max-w-3xl mx-auto border p-6 md:p-8"
                  style={{
                    borderColor: stage.color,
                    background: `linear-gradient(180deg, ${stage.colorSoft}, transparent)`,
                  }}
                  data-testid={`panel-building-block-${stage.id}`}
                >
                  <div
                    className="h-1.5 w-full mb-5"
                    style={{
                      background: `linear-gradient(90deg, ${stage.color}, transparent)`,
                    }}
                  />
                  <p
                    className="font-display text-xs uppercase tracking-[0.25em] mb-2"
                    style={{ color: stage.color }}
                  >
                    {stage.id} · {stage.visualIdentity}
                  </p>
                  <h3 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight mb-3">
                    {stage.title}
                  </h3>
                  <p className="text-foreground/85 leading-relaxed mb-3">
                    {stage.meaning}
                  </p>
                  <p
                    className="text-foreground/75 text-sm leading-relaxed mb-6 border-l-2 pl-4"
                    style={{ borderColor: stage.color }}
                  >
                    {stage.inProgram}
                  </p>
                  <Button
                    asChild
                    className="uppercase tracking-wider font-display text-black"
                    style={{ backgroundColor: stage.color }}
                    data-testid="button-building-block-continue"
                  >
                    <a href={stage.relatedHref}>
                      Continue to {stage.relatedLabel}
                    </a>
                  </Button>
                </motion.article>
              ) : null,
            )}
          </div>
        </section>

        {/* Tiers + S1–S8 program plaques */}
        <section id="tiers" className="max-w-6xl mx-auto px-6 py-14">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-primary mb-3">
              Choose Your Tier
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse every membership freely. Nothing is Active until you
              press Activate on the one tier you want — Starter Cushion and the
              rest stay inactive until you choose.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {tiers.map((tier, index) => {
              const isActive = activeTier?.level === tier.level;
              const isSelected = selectedTier === tier.level;
              return (
                <motion.button
                  key={tier.level}
                  type="button"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                  onClick={() => setSelectedTier(tier.level)}
                  className={`text-left rounded-xl border p-5 transition-colors ${
                    isActive
                      ? "border-primary bg-primary/15"
                      : isSelected
                        ? "border-primary/50 bg-secondary/40"
                        : "border-border bg-secondary/30 hover:border-primary/40"
                  }`}
                  data-testid={`tier-card-${tier.level}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="font-display text-sm uppercase tracking-widest text-primary">
                      Tier {tier.level}
                    </p>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : isSelected ? (
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <h3 className="font-display text-xl font-bold uppercase tracking-wide mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-2xl font-display text-primary mb-1">
                    {formatMoney(tier.monthlySubscription)}
                    <span className="text-sm text-muted-foreground font-sans normal-case tracking-normal">
                      /mo
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Cushion up to {formatMoney(tier.maxCushionLimit)}
                  </p>
                  <ul className="space-y-1.5 text-sm text-foreground/80 mb-3">
                    {tier.repaymentOptions.map((opt) => (
                      <li key={opt} className="flex gap-2">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                        <span>{REPAYMENT_LABELS[opt]}</span>
                      </li>
                    ))}
                  </ul>
                  {tier.features?.length ? (
                    <ul className="space-y-1.5 text-sm text-foreground/70 border-t border-border/60 pt-3">
                      {tier.features.map((f) => (
                        <li key={f}>• {f}</li>
                      ))}
                    </ul>
                  ) : null}
                </motion.button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {authLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : !isAuthenticated ? (
              <>
                <p className="text-muted-foreground text-sm">
                  Sign in to activate a tier and request a cushion.
                </p>
                <Button asChild data-testid="button-sign-in-pocket-booster">
                  <Link href="/auth">Sign In</Link>
                </Button>
              </>
            ) : (
              <Button
                onClick={() => activateMutation.mutate(selectedTier)}
                disabled={
                  activateMutation.isPending ||
                  activeTier?.level === selectedTier
                }
                data-testid="button-activate-tier"
              >
                {activateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {activeTier?.level === selectedTier
                  ? `Tier ${selectedTier} Active`
                  : `Activate Tier ${selectedTier} Only`}
              </Button>
            )}
          </div>

          {isAuthenticated && me?.subscription && (
            <p
              className="text-center text-sm text-muted-foreground mt-4"
              data-testid="text-billing-amount"
            >
              Next billing: {formatMoney(me.subscription.nextBillingAmount)}
              {parseFloat(me.subscription.nextBillingAmount) <
              parseFloat(me.subscription.monthlySubscription)
                ? " (skill rebate applied)"
                : ""}
            </p>
          )}

          {/* Eight program codes (S1–S8) */}
          <div
            id="program-codes"
            className="mt-16 pt-12 border-t border-primary/20"
            data-testid="section-pocket-booster-stages"
          >
            {/* Legacy #stages deep link from Pathway / FR2P */}
            <span id="stages" className="sr-only">
              Pocket Booster program codes
            </span>
            <div className="text-center mb-8">
              <p className="font-display text-xs uppercase tracking-[0.3em] text-primary mb-2">
                {PROGRAM_PATHWAY.program}
              </p>
              <h3
                className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-primary mb-3"
                data-testid="text-pb-stages-title"
              >
                Program Codes S1–S8
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Select a code for the full explanation of what it does inside
                Pocket Booster.
              </p>
            </div>

            <div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
              data-testid="grid-pocket-booster-plaques"
            >
              {PROGRAM_STAGES.map((stage, index) => {
                const selected = activeStageId === stage.id;
                return (
                  <motion.button
                    key={stage.id}
                    type="button"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setActiveStageId(stage.id)}
                    className="flex min-h-28 flex-col justify-between gap-4 border p-4 text-left transition-colors"
                    style={{
                      borderColor: selected ? stage.color : "hsl(var(--border))",
                      background: selected ? stage.colorSoft : "hsl(var(--secondary) / 0.35)",
                    }}
                    data-testid={`plaque-card-${stage.id}`}
                    aria-pressed={selected}
                  >
                    <p
                      className="font-display text-2xl font-bold tracking-wider"
                      style={{ color: stage.color }}
                    >
                      {stage.id}
                    </p>
                    <p className="font-display text-sm uppercase tracking-tight text-foreground/90 line-clamp-2">
                      {stage.title}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            {PROGRAM_STAGES.map((stage) =>
              stage.id === activeStageId ? (
                <motion.article
                  key={stage.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-3xl mx-auto border p-6 md:p-8"
                  style={{
                    borderColor: stage.color,
                    background: `linear-gradient(180deg, ${stage.colorSoft}, transparent)`,
                  }}
                  data-testid={`panel-pb-stage-${stage.id}`}
                >
                  <div
                    className="h-1.5 w-full mb-6"
                    style={{
                      background: `linear-gradient(90deg, ${stage.color}, transparent)`,
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span
                      className="font-display text-sm uppercase tracking-[0.25em]"
                      style={{ color: stage.color }}
                      data-testid="text-pb-active-stage-id"
                    >
                      {stage.id} · Code {stage.level}
                    </span>
                    <span
                      className="text-xs uppercase tracking-widest px-2 py-1 border"
                      style={{
                        borderColor: stage.color,
                        color: stage.color,
                        background: stage.colorSoft,
                      }}
                      data-testid="text-pb-active-visual-identity"
                    >
                      {stage.visualIdentity}
                    </span>
                  </div>
                  <h4
                    className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight mb-4"
                    data-testid="text-pb-active-stage-title"
                  >
                    {stage.title}
                  </h4>
                  <p
                    className="text-foreground/85 text-base md:text-lg leading-relaxed mb-4"
                    data-testid="text-pb-active-stage-meaning"
                  >
                    {stage.meaning}
                  </p>
                  <p
                    className="text-foreground/75 text-sm md:text-base leading-relaxed mb-6 border-l-2 pl-4"
                    style={{ borderColor: stage.color }}
                    data-testid="text-pb-active-stage-in-program"
                  >
                    {stage.inProgram}
                  </p>
                  <Button
                    asChild
                    className="uppercase tracking-wider font-display text-white hover:opacity-90"
                    style={{ backgroundColor: stage.color }}
                    data-testid="button-pb-stage-continue"
                  >
                    <a href={stage.relatedHref}>
                      Continue to {stage.relatedLabel}
                    </a>
                  </Button>
                </motion.article>
              ) : null,
            )}

            <p className="sr-only" aria-live="polite">
              Showing Pocket Booster code {activeStageId}:{" "}
              {
                PROGRAM_STAGES.find((s) => s.id === activeStageId)?.title
              }
            </p>
          </div>
        </section>

        {/* P2P Liquidity Loop */}
        <section
          id="reserve"
          className="border-t border-primary/15 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.08),_transparent_65%)]"
        >
          <div className="max-w-4xl mx-auto px-6 py-14">
            <div className="flex items-center gap-3 mb-3 justify-center">
              <Landmark className="h-6 w-6 text-primary" />
              <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-primary">
                Peer-to-Peer Reserve
              </h2>
            </div>
            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
              Invest $100, $250, $500, or $1,000 — 100% bridges into the Pocket Booster
              Instant-Disbursal Vault. Member subscription fees fund your{" "}
              {(yieldRate * 100).toFixed(1)}% compounding daily yield. Prefer
              apparel, FR2P, or other Empire programs? Use{" "}
              <Link
                href="/invest"
                className="text-primary underline underline-offset-2"
                data-testid="link-empire-invest-from-pb"
              >
                Empire Invest
              </Link>
              .
            </p>

            <div
              className="grid gap-4 sm:grid-cols-3 mb-8"
              data-testid="vault-stats"
            >
              <div className="rounded-xl border border-border/70 bg-background/40 p-4 text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Vault total
                </p>
                <p className="font-display text-2xl text-primary">
                  {formatMoney(vault?.totalVaultContribution ?? 0)}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/40 p-4 text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Available to lend
                </p>
                <p className="font-display text-2xl text-primary">
                  {formatMoney(vault?.availableLendingCapital ?? 0)}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/40 p-4 text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Annual yield
                </p>
                <p className="font-display text-2xl text-primary inline-flex items-center gap-2 justify-center">
                  <TrendingUp className="h-5 w-5" />
                  {(yieldRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <p className="text-sm text-muted-foreground">
                  Sign in to bridge capital into the reserve vault.
                </p>
                <Button asChild data-testid="button-sign-in-invest">
                  <Link href="/auth">Sign In</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap justify-center gap-3">
                  {investmentAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() =>
                        setInvestAmount(amt as P2PInvestmentAmount)
                      }
                      className={`min-w-[7rem] rounded-lg border px-5 py-3 font-display text-lg transition-colors ${
                        investAmount === amt
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-secondary/30 hover:border-primary/40"
                      }`}
                      data-testid={`button-invest-amount-${amt}`}
                    >
                      {formatMoney(amt)}
                    </button>
                  ))}
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={() => investMutation.mutate(investAmount)}
                    disabled={investMutation.isPending}
                    data-testid="button-bridge-p2p"
                  >
                    {investMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Landmark className="h-4 w-4" />
                    )}
                    Bridge {formatMoney(investAmount)} to Reserve Vault
                  </Button>
                </div>

                {liquidityMe?.investments?.length ? (
                  <div className="mt-8 space-y-3" data-testid="list-investments">
                    <h3 className="font-display text-xl uppercase tracking-wide text-primary text-center">
                      Your back office
                    </h3>
                    <p className="text-center text-sm text-muted-foreground">
                      Allocated {formatMoney(liquidityMe.totals.allocated)} ·
                      Yield paid {formatMoney(liquidityMe.totals.paidYield)} ·{" "}
                      <Link
                        href="/invest"
                        className="text-primary underline underline-offset-2"
                      >
                        Full portfolio
                      </Link>
                    </p>
                    {liquidityMe.investments.slice(0, 5).map((inv) => (
                      <div
                        key={inv.id}
                        className="rounded-lg border border-border/70 bg-background/40 p-4"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                          <p className="font-display text-lg text-primary">
                            {formatMoney(inv.amountAllocated)}
                          </p>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            {inv.projectTag.replace(/_/g, " ")} · {inv.status}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Yield rate {(parseFloat(inv.yieldRate) * 100).toFixed(1)}
                          % · Paid {formatMoney(inv.paidYield)} · Accrued{" "}
                          {formatMoney(inv.accruedYield)}
                        </p>
                        {inv.ledger[0] ? (
                          <p className="text-xs text-foreground/70 mt-2">
                            {inv.ledger[0].description}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>

        {/* Cushion request */}
        <section
          id="cushion"
          className="border-t border-primary/15 bg-secondary/20"
        >
          <div className="max-w-3xl mx-auto px-6 py-14">
            <div className="flex items-center gap-3 mb-3 justify-center">
              <Wallet className="h-6 w-6 text-primary" />
              <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-primary">
                Request a Cushion
              </h2>
            </div>
            <p className="text-center text-muted-foreground mb-8">
              Pick an amount within your tier limit and lock an automated
              repayment schedule on your next payday.
            </p>

            {!isAuthenticated ? (
              <p className="text-center text-sm text-muted-foreground">
                Sign in and activate a subscription to request funding.
              </p>
            ) : meLoading ? (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !activeTier ? (
              <p
                className="text-center text-sm text-muted-foreground"
                data-testid="text-need-subscription"
              >
                Activate a tier above to unlock cushion requests.
              </p>
            ) : (
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  cushionMutation.mutate();
                }}
                data-testid="form-request-cushion"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">
                      Amount (max {formatMoney(maxLimit)})
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      min={1}
                      max={maxLimit}
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      data-testid="input-cushion-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payday">Next payday</Label>
                    <Input
                      id="payday"
                      type="date"
                      value={nextPayday}
                      onChange={(e) => setNextPayday(e.target.value)}
                      required
                      data-testid="input-next-payday"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Repayment option</Label>
                  <div className="grid gap-2">
                    {repaymentOptions.map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer ${
                          repaymentChoice === opt
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        }`}
                      >
                        <input
                          type="radio"
                          name="repayment"
                          value={opt}
                          checked={repaymentChoice === opt}
                          onChange={() => setRepaymentChoice(opt)}
                          className="accent-[hsl(var(--primary))]"
                          data-testid={`radio-repayment-${opt}`}
                        />
                        <span>{REPAYMENT_LABELS[opt]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {repaymentChoice === "CUSTOM_PAYROLL_SPLIT" && (
                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="splits">Number of payroll deductions</Label>
                    <Input
                      id="splits"
                      type="number"
                      min={2}
                      max={6}
                      value={customSplitCount}
                      onChange={(e) =>
                        setCustomSplitCount(parseInt(e.target.value, 10) || 2)
                      }
                      data-testid="input-custom-split-count"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={cushionMutation.isPending}
                  data-testid="button-submit-cushion"
                >
                  {cushionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Rocket className="h-4 w-4" />
                  )}
                  Approve & Schedule Repayment
                </Button>
              </form>
            )}

            {me?.advances?.length ? (
              <div className="mt-10 space-y-4" data-testid="list-advances">
                <h3 className="font-display text-xl uppercase tracking-wide text-primary">
                  Recent cushions
                </h3>
                {me.advances.slice(0, 5).map((advance) => (
                  <div
                    key={advance.id}
                    className="rounded-lg border border-border/70 bg-background/40 p-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                      <p className="font-display text-lg text-primary">
                        {formatMoney(advance.amountBorrowed)}
                      </p>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {advance.repaymentType.replace(/_/g, " ")} ·{" "}
                        {advance.status}
                      </p>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {advance.schedules.map((s) => (
                        <li key={s.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>
                            {formatMoney(s.deductionAmount)} on{" "}
                            {new Date(s.scheduledDate).toLocaleDateString()} (
                            {s.status}
                            {s.squareInvoiceStatus
                              ? ` · Square ${s.squareInvoiceStatus}`
                              : ""}
                            )
                          </span>
                          {s.squareInvoiceUrl ? (
                            <a
                              href={s.squareInvoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline underline-offset-2"
                              data-testid={`link-square-invoice-${s.id}`}
                            >
                              Pay invoice
                            </a>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {/* Pay-to-Learn — actual takeable programs */}
        <section id="pay-to-learn" className="max-w-5xl mx-auto px-6 py-14">
          <div className="flex items-center gap-3 mb-3 justify-center">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-primary">
              Pay-to-Learn Programs
            </h2>
          </div>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            These are the actual programs you take inside Pocket Booster — Cash
            Flow Foundations, Income Acceleration, and Capital Accessories.
            Finish every lesson and the system graduates you automatically
            (Tier 4 members get the 50% skill rebate). No manual Mark Complete.
          </p>

          {!activeCourse ? (
            <div className="grid gap-4 md:grid-cols-3">
              {modules.map((mod, index) => {
                const done = completedModules.has(mod.id);
                const lessonCount = mod.lessons?.length ?? 0;
                return (
                  <motion.div
                    key={mod.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.07 }}
                    className="rounded-xl border border-border bg-secondary/25 p-5 flex flex-col"
                    data-testid={`module-card-${mod.id}`}
                  >
                    <h3 className="font-display text-lg uppercase tracking-wide mb-2">
                      {mod.title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex-grow mb-3">
                      {mod.description}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-primary/80 mb-4">
                      {lessonCount} lessons · takeable program
                    </p>
                    {done ? (
                      <Button
                        variant="secondary"
                        disabled
                        data-testid={`button-complete-module-${mod.id}`}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Graduated
                      </Button>
                    ) : (
                      <Button
                        disabled={!isAuthenticated}
                        onClick={() => openCourse(mod.id)}
                        data-testid={`button-start-module-${mod.id}`}
                      >
                        {!isAuthenticated ? "Sign in to take program" : "Start Program"}
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-xl border border-primary/40 bg-secondary/30 p-6 md:p-8"
              data-testid="course-player"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <p className="font-display text-xs uppercase tracking-[0.25em] text-primary mb-1">
                    Taking program
                  </p>
                  <h3
                    className="font-display text-2xl font-bold uppercase tracking-wide"
                    data-testid="text-active-course-title"
                  >
                    {activeCourse.title}
                  </h3>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveCourseId(null);
                    setLessonIndex(0);
                  }}
                  data-testid="button-exit-course"
                >
                  Exit
                </Button>
              </div>

              <div
                className="flex gap-2 mb-6 overflow-x-auto"
                data-testid="course-lesson-progress"
              >
                {activeCourse.lessons.map((lesson, idx) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setLessonIndex(idx)}
                    className={`shrink-0 px-3 py-1.5 text-xs font-display uppercase tracking-wider border ${
                      idx === lessonIndex
                        ? "border-primary bg-primary text-black"
                        : idx < lessonIndex
                          ? "border-primary/50 text-primary"
                          : "border-border text-muted-foreground"
                    }`}
                    data-testid={`button-lesson-${lesson.id}`}
                  >
                    {idx + 1}. {lesson.title}
                  </button>
                ))}
              </div>

              {activeLesson && (
                <article data-testid={`lesson-panel-${activeLesson.id}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                    <h4 className="font-display text-xl uppercase tracking-wide">
                      Lesson {lessonIndex + 1}: {activeLesson.title}
                    </h4>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest">
                      ~{activeLesson.minutes} min
                    </span>
                  </div>
                  <div className="space-y-4 text-foreground/85 leading-relaxed mb-6">
                    {activeLesson.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  <div className="rounded-lg border border-primary/30 bg-background/40 p-4 mb-6">
                    <Label
                      htmlFor="lesson-action"
                      className="font-display text-xs uppercase tracking-widest text-primary mb-2 block"
                    >
                      Apply it now
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      {activeLesson.actionPrompt}
                    </p>
                    <Input
                      id="lesson-action"
                      value={lessonNotes[activeLesson.id] ?? ""}
                      onChange={(e) =>
                        setLessonNotes((prev) => ({
                          ...prev,
                          [activeLesson.id]: e.target.value,
                        }))
                      }
                      placeholder="Type your answer or plan here…"
                      data-testid="input-lesson-action"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      disabled={lessonIndex === 0}
                      onClick={() => setLessonIndex((i) => Math.max(0, i - 1))}
                      data-testid="button-lesson-back"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={advanceLesson}
                      disabled={
                        moduleMutation.isPending ||
                        !(lessonNotes[activeLesson.id] ?? "").trim()
                      }
                      data-testid="button-lesson-continue"
                    >
                      {moduleMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isLastLesson ? (
                        "Finish & Graduate"
                      ) : (
                        "Next Lesson"
                      )}
                    </Button>
                  </div>
                  {isLastLesson && (
                    <p className="text-xs text-muted-foreground mt-4">
                      Finishing this lesson graduates you automatically — the
                      system logs the milestone and applies any Tier 4 rebate.
                    </p>
                  )}
                </article>
              )}
            </div>
          )}

          {!isAuthenticated && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              <Link href="/auth" className="text-primary underline underline-offset-2">
                Sign in
              </Link>{" "}
              to take programs and earn automatic graduation rewards.
            </p>
          )}

          {user && activeTier?.level === 4 && (
            <p className="text-center text-sm text-primary mt-6">
              Premium Tier 4 active — graduating a program applies your skill
              rebate automatically.
            </p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
