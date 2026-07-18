import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  CreditCard,
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
  type PocketBoosterTier,
  type RepaymentChoice,
} from "@shared/pocketBooster";
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

export default function PocketBooster() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  useEffect(() => {
    if (activeTier) {
      setSelectedTier(activeTier.level);
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
      toast({
        title: "Capital bridged",
        description:
          data.backOfficeVerification ||
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.18),_transparent_55%),linear-gradient(180deg,_hsl(25_45%_10%)_0%,_hsl(var(--background))_100%)]" />
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
          </div>
        </section>

        {/* Tiers */}
        <section className="max-w-6xl mx-auto px-6 py-14">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-primary mb-3">
              Choose Your Tier
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Your monthly membership unlocks a matching cushion limit and
              repayment options.
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
                        ? "border-primary/70 bg-secondary/60"
                        : "border-border bg-secondary/30 hover:border-primary/40"
                  }`}
                  data-testid={`tier-card-${tier.level}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="font-display text-sm uppercase tracking-widest text-primary">
                      Tier {tier.level}
                    </p>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-xs text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Active
                      </span>
                    )}
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
                  : `Activate Tier ${selectedTier}`}
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
        </section>

        {/* P2P Liquidity Loop */}
        <section className="border-t border-primary/15 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.08),_transparent_65%)]">
          <div className="max-w-4xl mx-auto px-6 py-14">
            <div className="flex items-center gap-3 mb-3 justify-center">
              <Landmark className="h-6 w-6 text-primary" />
              <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-primary">
                Peer-to-Peer Reserve
              </h2>
            </div>
            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
              Minimum $100, up to $5,000 ($100 · $500 · $1,000 · $1,500 · $2,000
              · $2,500 · $5,000) — 100% bridges into the Pocket Booster
              Instant-Disbursal Vault. Member subscription fees fund your{" "}
              {(yieldRate * 100).toFixed(1)}% compounding daily yield. Prefer
              apparel, The FR2P Club, or other Empire programs? Use{" "}
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                  {investmentAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() =>
                        setInvestAmount(amt as P2PInvestmentAmount)
                      }
                      className={`rounded-lg border px-3 py-3 font-display text-base sm:text-lg transition-colors ${
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
        <section className="border-t border-primary/15 bg-secondary/20">
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

        {/* Pay-to-Learn */}
        <section className="max-w-5xl mx-auto px-6 py-14">
          <div className="flex items-center gap-3 mb-3 justify-center">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-primary">
              Pay-to-Learn Track
            </h2>
          </div>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Complete a skill module to log your milestone. Tier 4 members earn a
            50% rebate on next month&apos;s membership ($50 instead of $100).
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {modules.map((mod, index) => {
              const done = completedModules.has(mod.id);
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
                  <p className="text-sm text-muted-foreground flex-grow mb-4">
                    {mod.description}
                  </p>
                  <Button
                    variant={done ? "secondary" : "default"}
                    disabled={
                      !isAuthenticated || done || moduleMutation.isPending
                    }
                    onClick={() => moduleMutation.mutate(mod.id)}
                    data-testid={`button-complete-module-${mod.id}`}
                  >
                    {done ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Completed
                      </>
                    ) : (
                      "Mark Complete"
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {user && activeTier?.level === 4 && (
            <p className="text-center text-sm text-primary mt-6">
              Premium Tier 4 active — module completion applies your skill
              rebate automatically.
            </p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
