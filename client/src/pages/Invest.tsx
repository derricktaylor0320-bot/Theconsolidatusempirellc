import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Beef,
  Bell,
  Building2,
  CheckCircle2,
  Landmark,
  Loader2,
  Rocket,
  Shirt,
  TrendingUp,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  HUB_INVESTMENT_PROGRAMS,
  P2P_INVESTMENT_AMOUNTS,
  RPU_LEGAL_DISCLAIMER,
  RPU_LOCK_PERIOD_DAYS,
  type HubInvestmentProgram,
  type P2PInvestmentAmount,
} from "@shared/liquidityLoop";

type ProgramsResponse = {
  programs: HubInvestmentProgram[];
  allowedInvestmentAmounts: number[];
};

type LiquidityMeResponse = {
  investments: Array<{
    id: string;
    amountAllocated: string;
    unitsCount?: string;
    projectTag: string;
    yieldRate: string;
    lockPeriodDays?: number;
    hasVotingRights?: boolean;
    instrumentType?: string;
    accruedYield: string;
    paidYield: string;
    status: string;
    createdAt: string | null;
    program: HubInvestmentProgram | null;
    ledger: Array<{
      id: string;
      operationsSpend: string;
      description: string;
      createdAt: string | null;
    }>;
    payouts: Array<{
      id: string;
      amount: string;
      source: string;
      description: string | null;
      createdAt: string | null;
    }>;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    projectTag: string | null;
    readAt: string | null;
    createdAt: string | null;
  }>;
  unreadNotifications: number;
  totals: { allocated: number; paidYield: number };
  allowedInvestmentAmounts: number[];
  programs: HubInvestmentProgram[];
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
    // not JSON
  }
  return raw || fallback;
}

function programIcon(tag: string) {
  switch (tag) {
    case "POCKET_BOOSTER_RESERVE":
      return Rocket;
    case "FR2P_CLUB_GROWTH":
      return TrendingUp;
    case "APPAREL_OPERATIONS":
      return Shirt;
    case "PREMIUM_CHOICE_HOT_DOGS":
      return Beef;
    case "REAL_ESTATE_PROPERTIES":
      return Building2;
    default:
      return Landmark;
  }
}

export default function Invest() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: catalog } = useQuery<ProgramsResponse>({
    queryKey: ["/api/liquidity/programs"],
  });

  const { data: me, isLoading: meLoading } = useQuery<LiquidityMeResponse>({
    queryKey: ["/api/liquidity/me"],
    enabled: isAuthenticated,
  });

  const programs = catalog?.programs ?? HUB_INVESTMENT_PROGRAMS;
  const amounts =
    catalog?.allowedInvestmentAmounts ?? [...P2P_INVESTMENT_AMOUNTS];

  const [selectedTag, setSelectedTag] = useState(
    () =>
      programs.find((p) => p.status === "open")?.tag ??
      "POCKET_BOOSTER_RESERVE",
  );
  const [investAmount, setInvestAmount] =
    useState<P2PInvestmentAmount>(100);

  const selectedProgram = useMemo(
    () => programs.find((p) => p.tag === selectedTag) ?? programs[0],
    [programs, selectedTag],
  );

  const investMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/liquidity/invest", {
        investmentAmount: investAmount,
        projectTag: selectedTag,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/liquidity/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/liquidity/vault"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/liquidity/notifications"],
      });
      const units = data.details?.allocatedUnits;
      toast({
        title:
          data.complianceStatus === "VERIFIED_COMPLIANT"
            ? "Participation units issued"
            : "Capital allocated",
        description:
          units != null
            ? `${units} Revenue Participation Units locked to project utility. ${data.backOfficeVerification || data.message || ""}`
            : data.backOfficeVerification ||
              data.message ||
              "Your investment is active in the back office.",
      });
    },
    onError: (err: unknown) => {
      toast({
        title: "Investment failed",
        description: errorMessage(err, "Could not allocate capital."),
        variant: "destructive",
      });
    },
  });

  const readMutation = useMutation({
    mutationFn: async (id?: string) => {
      const res = await apiRequest(
        "POST",
        "/api/liquidity/notifications/read",
        id ? { id } : {},
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/liquidity/me"] });
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <section className="relative overflow-hidden border-b border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.16),_transparent_55%),linear-gradient(180deg,_hsl(25_40%_9%)_0%,_hsl(var(--background))_100%)]" />
          <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center rounded-full p-5 mb-6 border border-primary/40 bg-primary/10"
            >
              <Landmark className="h-10 w-10 text-primary" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="font-display text-4xl md:text-6xl font-bold uppercase tracking-wider text-primary mb-4"
              data-testid="text-invest-title"
            >
              Empire Invest
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="text-lg md:text-xl text-foreground/85 max-w-3xl mx-auto mb-3"
              data-testid="text-invest-intro"
            >
              Put your investment to work and watch it grow across The
              Consolidatus Empire LLC — choose Khomplete Khemistri Apparel (our
              branded clothing line), The FR2P Club Program (direct affiliate
              marketing, courses, AI promotion and sales, and compliant
              recurring revenue),
              Pocket Booster (Reserve Vault emergency cushion support), or
              Premium Choice Hot Dogs (our premium street-food line). Upcoming:
              real estate — mom-and-pop motel takeovers, then laundromats,
              through creative financing. Clear back-office tracking so you see
              where your investment goes and how it grows.
            </motion.p>
            <p className="text-sm uppercase tracking-[0.2em] text-primary/80 font-display">
              Project-focused investments · No owner shares · Full allocation transparency
            </p>
            <p
              className="text-sm text-muted-foreground max-w-2xl mx-auto mt-4"
              data-testid="text-project-only-capital"
            >
              Your investment supports only the program you pick.
              It has nothing to do with the owners&apos; shares or LLC ownership —
              those stay with the founding members.
            </p>
          </div>
        </section>

        {/* Programs */}
        <section className="max-w-6xl mx-auto px-6 py-14">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-primary mb-3">
              Choose a Program
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every dollar is tagged to a venture under the hub umbrella. You
              get notified when it lands — and see the ledger forever.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {programs.map((program, index) => {
              const Icon = programIcon(program.tag);
              const selected = selectedTag === program.tag;
              const soon = program.status === "coming_soon";
              return (
                <motion.button
                  key={program.tag}
                  type="button"
                  disabled={soon}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => !soon && setSelectedTag(program.tag)}
                  className={`text-left rounded-xl border p-5 transition-colors ${
                    soon
                      ? "border-border/50 bg-secondary/15 opacity-70 cursor-not-allowed"
                      : selected
                        ? "border-primary bg-primary/15"
                        : "border-border bg-secondary/30 hover:border-primary/40"
                  }`}
                  data-testid={`program-card-${program.tag}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </span>
                      <div>
                        <p className="font-display text-sm uppercase tracking-widest text-primary">
                          {soon ? "Coming soon" : "Open"}
                        </p>
                        <h3 className="font-display text-xl font-bold uppercase tracking-wide">
                          {program.name}
                        </h3>
                      </div>
                    </div>
                    <p className="font-display text-lg text-primary shrink-0">
                      {(program.annualYieldRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {program.description}
                  </p>
                  <p className="text-xs text-foreground/70 border-t border-border/50 pt-3">
                    {program.allocationSummary}
                  </p>
                  {program.href && !soon ? (
                    <Link
                      href={program.href}
                      className="inline-block mt-3 text-xs uppercase tracking-wider text-primary underline underline-offset-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit {program.shortName}
                    </Link>
                  ) : null}
                </motion.button>
              );
            })}
          </div>

          <div className="mt-10 max-w-xl mx-auto text-center space-y-5">
            {selectedProgram?.status === "open" ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Investing in{" "}
                  <span className="text-primary font-display uppercase tracking-wide">
                    {selectedProgram.name}
                  </span>{" "}
                  at{" "}
                  {(selectedProgram.annualYieldRate * 100).toFixed(1)}% APR
                  (daily compound).
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {amounts.map((amt) => (
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
                      data-testid={`button-hub-invest-amount-${amt}`}
                    >
                      {formatMoney(amt)}
                    </button>
                  ))}
                </div>
                {authLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                ) : !isAuthenticated ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <p className="text-sm text-muted-foreground">
                      Sign in to put your investment to work and open your back
                      office.
                    </p>
                    <Button asChild data-testid="button-sign-in-invest-page">
                      <Link href="/auth">Sign In</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={() => investMutation.mutate()}
                      disabled={investMutation.isPending}
                      data-testid="button-confirm-hub-invest"
                    >
                      {investMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Landmark className="h-4 w-4" />
                      )}
                      Issue {formatMoney(investAmount)} Participation Units
                    </Button>
                    <p
                      className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed"
                      data-testid="text-rpu-disclaimer"
                    >
                      Your {formatMoney(investAmount)} goes only into{" "}
                      {selectedProgram.shortName} as Revenue Participation Units
                      (1 unit = $1), with a {RPU_LOCK_PERIOD_DAYS}-day lock and
                      zero voting rights. {RPU_LEGAL_DISCLAIMER}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p
                className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed"
                data-testid="text-real-estate-pipeline"
              >
                Coming soon: we&apos;re building a local mom-and-pop motel
                pipeline — creative financing, sit-downs with owners ready to
                retire, and us taking over day-to-day ops while they keep a
                little extra income. We&apos;ll tighten the guest experience
                (clean, smells like home, real hospitality), then run the same
                playbook for laundromat acquisitions.
              </p>
            )}
          </div>
        </section>

        {/* Back office */}
        <section className="border-t border-primary/15 bg-secondary/20">
          <div className="max-w-4xl mx-auto px-6 py-14">
            <div className="flex items-center gap-3 mb-3 justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-primary">
                Investor Back Office
              </h2>
            </div>
            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
              Follow every allocation, ledger line, and yield payout so you can
              see where your investment goes and how it grows.
            </p>

            {!isAuthenticated ? (
              <p className="text-center text-sm text-muted-foreground">
                Sign in to view your portfolio and allocation history.
              </p>
            ) : meLoading ? (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div
                  className="grid gap-4 sm:grid-cols-2 mb-8"
                  data-testid="invest-portfolio-totals"
                >
                  <div className="rounded-xl border border-border/70 bg-background/40 p-4 text-center">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Investment at work
                    </p>
                    <p className="font-display text-2xl text-primary">
                      {formatMoney(me?.totals.allocated ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/40 p-4 text-center">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Yield received
                    </p>
                    <p className="font-display text-2xl text-primary">
                      {formatMoney(me?.totals.paidYield ?? 0)}
                    </p>
                  </div>
                </div>

                {/* Notifications */}
                <div className="mb-10" data-testid="invest-notifications">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className="font-display text-xl uppercase tracking-wide text-primary inline-flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Allocation alerts
                      {(me?.unreadNotifications ?? 0) > 0 ? (
                        <span className="text-sm normal-case tracking-normal text-muted-foreground">
                          ({me?.unreadNotifications} new)
                        </span>
                      ) : null}
                    </h3>
                    {(me?.unreadNotifications ?? 0) > 0 ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => readMutation.mutate(undefined)}
                        disabled={readMutation.isPending}
                        data-testid="button-mark-notifications-read"
                      >
                        Mark all read
                      </Button>
                    ) : null}
                  </div>
                  {me?.notifications?.length ? (
                    <ul className="space-y-3">
                      {me.notifications.slice(0, 8).map((n) => (
                        <li
                          key={n.id}
                          className={`rounded-lg border p-4 ${
                            n.readAt
                              ? "border-border/50 bg-background/30"
                              : "border-primary/40 bg-primary/10"
                          }`}
                          data-testid={`notification-${n.id}`}
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                            <p className="font-display text-sm uppercase tracking-wide text-primary">
                              {n.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {n.createdAt
                                ? new Date(n.createdAt).toLocaleString()
                                : ""}
                            </p>
                          </div>
                          <p className="text-sm text-foreground/85">{n.body}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">
                      No allocation alerts yet — invest in a program to get your
                      first notification.
                    </p>
                  )}
                </div>

                {/* Positions */}
                <div className="space-y-4" data-testid="list-hub-investments">
                  <h3 className="font-display text-xl uppercase tracking-wide text-primary text-center">
                    Your positions
                  </h3>
                  {me?.investments?.length ? (
                    me.investments.map((inv) => (
                      <div
                        key={inv.id}
                        className="rounded-lg border border-border/70 bg-background/40 p-4"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                          <p className="font-display text-lg text-primary">
                            {formatMoney(inv.amountAllocated)} ·{" "}
                            {inv.program?.shortName ??
                              inv.projectTag.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            {(parseFloat(inv.yieldRate) * 100).toFixed(1)}% APR ·{" "}
                            {inv.status}
                          </p>
                        </div>
                        <p className="text-xs text-primary/90 mb-2">
                          {parseFloat(
                            inv.unitsCount ?? inv.amountAllocated,
                          ).toFixed(0)}{" "}
                          RPUs ·{" "}
                          {inv.lockPeriodDays ?? RPU_LOCK_PERIOD_DAYS}-day lock ·
                          no voting rights
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Paid {formatMoney(inv.paidYield)} · Accrued{" "}
                          {formatMoney(inv.accruedYield)}
                        </p>
                        {inv.ledger[0] ? (
                          <p className="text-xs text-foreground/75 border-t border-border/50 pt-2">
                            {inv.ledger[0].description}
                          </p>
                        ) : null}
                        {inv.payouts[0] ? (
                          <p className="text-xs text-primary/90 mt-2">
                            Latest payout: {formatMoney(inv.payouts[0].amount)}{" "}
                            ({inv.payouts[0].source.replace(/_/g, " ")})
                          </p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">
                      No positions yet. Choose a program above to put your
                      investment to work.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
