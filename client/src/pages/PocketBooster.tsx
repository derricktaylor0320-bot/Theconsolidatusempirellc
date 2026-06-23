import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Rocket,
  DollarSign,
  CheckCircle2,
  Clock,
  Shield,
  Users,
  ChevronRight,
  Mail,
  Banknote,
  TrendingUp,
  Zap,
} from "lucide-react";

const LOAN_AMOUNTS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Users,
    title: "Join as a Member",
    body: "Active FR2P Club or Consolidatus Empire members get priority access. Your membership is your foundation.",
  },
  {
    step: "02",
    icon: DollarSign,
    title: "Choose Your Amount",
    body: "Select a micro-loan from $100 to $1,000 in $100 increments — only what you need, no more.",
  },
  {
    step: "03",
    icon: Zap,
    title: "Fast Decision",
    body: "Simple application, quick review. No credit score destruction. We look at your profile and history with the community.",
  },
  {
    step: "04",
    icon: TrendingUp,
    title: "Boost & Repay",
    body: "Get your funds, use them to grow, and repay on a simple schedule. Build your credit history in the process.",
  },
];

const WHY_POCKET_BOOSTER = [
  { icon: Banknote, text: "Micro-loans from $100 to $1,000" },
  { icon: Shield, text: "No hard credit pull to apply" },
  { icon: Clock, text: "Fast decisions — no waiting weeks" },
  { icon: CheckCircle2, text: "FR2P members get priority access" },
  { icon: TrendingUp, text: "Build credit with on-time repayment" },
  { icon: Users, text: "Community-backed lending model" },
];

export default function PocketBooster() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const handleNotify = async () => {
    if (!email.includes("@")) return;
    setNotifyStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "pocket-booster" }),
      });
      setNotifyStatus(res.ok ? "done" : "error");
    } catch {
      setNotifyStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-grow">

        {/* Hero */}
        <section className="relative overflow-hidden py-24 px-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-background pointer-events-none" />
          <div className="relative z-10 container mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6 uppercase tracking-widest">
              <Rocket className="w-4 h-4" />
              Consolidatus Empire — Coming Soon
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold uppercase tracking-tight mb-4" data-testid="text-pocket-booster-title">
              Pocket <span className="text-primary">Booster</span>
            </h1>
            <p className="text-xl md:text-2xl font-display text-muted-foreground mb-4 uppercase tracking-wide">
              Micro-Loans for Everyday Entrepreneurs
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10" data-testid="text-coming-soon-description">
              Need a quick capital boost to launch, restock, or grow? Pocket Booster gives Consolidatus Empire members access to micro-loans from <strong className="text-primary">$100 to $1,000</strong> — no massive hoops, no predatory rates. Small money, big moves.
            </p>

            {/* Pre-launch notify form */}
            <div className="max-w-md mx-auto bg-background/80 border border-primary/20 rounded-2xl p-6 shadow-lg" data-testid="form-notify-launch">
              <p className="font-display font-bold text-sm uppercase tracking-widest text-primary mb-3">
                Get Notified at Launch
              </p>
              {notifyStatus === "done" ? (
                <div className="flex items-center justify-center gap-2 text-green-400 font-medium">
                  <CheckCircle2 className="w-5 h-5" />
                  You're on the early access list!
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="input-notify-email"
                  />
                  <Button
                    onClick={handleNotify}
                    disabled={notifyStatus === "sending"}
                    className="bg-primary text-black hover:bg-primary/90 font-display uppercase tracking-wider px-4 shrink-0"
                    data-testid="button-notify-launch"
                  >
                    {notifyStatus === "sending" ? "..." : <><Mail className="w-4 h-4 mr-1" /> Notify Me</>}
                  </Button>
                </div>
              )}
              {notifyStatus === "error" && (
                <p className="text-xs text-red-400 mt-2">Something went wrong. Please try again.</p>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                Be first in line when funding is secured. No spam — just the launch announcement.
              </p>
            </div>
          </div>
        </section>

        {/* Loan Amount Selector (preview only — not functional yet) */}
        <section className="py-20 bg-muted/20">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight mb-3">
                Choose Your <span className="text-primary">Boost</span>
              </h2>
              <p className="text-muted-foreground">
                Loans in $100 increments — borrow exactly what you need.
              </p>
            </div>
            <div className="grid grid-cols-5 gap-3 max-w-2xl mx-auto" data-testid="grid-loan-amounts">
              {LOAN_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setSelectedAmount(amount === selectedAmount ? null : amount)}
                  className={`rounded-xl border py-3 text-sm font-bold font-display uppercase tracking-wider transition-all ${
                    selectedAmount === amount
                      ? "border-primary bg-primary text-black shadow-lg scale-105"
                      : "border-border bg-background hover:border-primary/60 hover:text-primary"
                  }`}
                  data-testid={`button-loan-${amount}`}
                >
                  ${amount}
                </button>
              ))}
            </div>
            {selectedAmount && (
              <div className="mt-8 text-center">
                <div className="inline-block border border-primary/30 bg-primary/5 rounded-2xl px-8 py-5">
                  <p className="text-muted-foreground text-sm mb-1">Selected loan amount</p>
                  <p className="font-display text-4xl font-bold text-primary">${selectedAmount}</p>
                  <p className="text-muted-foreground text-xs mt-2">Early-access applications open at launch</p>
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 border border-amber-400/30 bg-amber-400/10 rounded-full px-3 py-1">
                    <Clock className="w-3 h-3" />
                    Funding in progress — application coming soon
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold uppercase tracking-tight mb-3">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Simple four-step process. No banks, no runaround. Community-powered capital.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="grid-how-it-works">
            {HOW_IT_WORKS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="rounded-2xl border border-primary/15 bg-muted/20 p-6 hover:border-primary/40 transition-colors"
                  data-testid={`card-step-${item.step}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold text-primary/40 font-display">{item.step}</span>
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-display font-bold uppercase tracking-wide text-sm mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why Pocket Booster */}
        <section className="py-20 bg-muted/20">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight mb-3">
                Why <span className="text-primary">Pocket Booster</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Built for entrepreneurs inside the Consolidatus Empire — not for banks.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto" data-testid="grid-benefits">
              {WHY_POCKET_BOOSTER.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-primary/15 bg-background p-4 hover:border-primary/40 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm font-medium">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Coming Soon CTA */}
        <section className="py-20 container mx-auto px-6 text-center max-w-3xl">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-12">
            <Rocket className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="font-display text-3xl font-bold uppercase tracking-tight mb-4" data-testid="text-coming-soon">
              Launching Soon
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
              Pocket Booster is currently securing funding to power the community lending pool. Once launched, FR2P Club and Consolidatus Empire members get first access.
              <br /><br />
              In the meantime, become an FR2P Club member to position yourself for priority access when applications open.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://fr2p-club-production.up.railway.app/join" target="_blank" rel="noopener noreferrer">
                <Button className="bg-primary text-black hover:bg-primary/90 font-display uppercase tracking-wider px-8">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Join FR2P Club for Priority Access
                </Button>
              </a>
              <a href="/hub">
                <Button variant="outline" className="border-primary/40 hover:border-primary font-display uppercase tracking-wider px-8">
                  Back to Empire Hub
                </Button>
              </a>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
