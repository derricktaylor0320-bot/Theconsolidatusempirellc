import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Rocket, Brain, BarChart3, DollarSign, CheckCircle, Clock,
  Shield, Zap, Star, ArrowRight, AlertCircle, TrendingUp,
  Users, Building2, ExternalLink, Handshake
} from "lucide-react";

const FR2P_BASE = "https://fr2p-club-production.up.railway.app";

export default function PocketBooster() {
  const [step, setStep] = useState<"form" | "done">("form");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", loanAmount: "", purpose: "", monthsAsMember: "", message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.loanAmount || !form.purpose) return;
    setSubmitting(true);
    try {
      await fetch(`${FR2P_BASE}/api/pocket-booster/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch {}
    setSubmitting(false);
    setStep("done");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-black via-zinc-900 to-background py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-primary/10 border border-primary/30 rounded-full p-5 w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Rocket className="h-12 w-12 text-primary" />
          </div>
          <Badge className="bg-primary/20 text-primary border border-primary/40 mb-4 text-sm px-4 py-1">
            A Consolidatus Empire Company
          </Badge>
          <h1 className="font-display text-5xl md:text-6xl font-bold uppercase tracking-wider text-primary mb-4">
            Pocket Booster
          </h1>
          <p className="text-2xl md:text-3xl font-display font-semibold text-white mb-6">
            Your Financial Acceleration Ecosystem
          </p>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Micro-loans, AI-powered side hustle building, and real-time investment tracking — 
            all in one program built for community members ready to level up.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#waitlist">
              <Button size="lg" className="bg-primary text-black font-bold hover:bg-primary/90 gap-2">
                Join the Waitlist <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <a href="#programs">
              <Button size="lg" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
                Explore Programs
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-zinc-900/50 border-y border-primary/20 py-8">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "Loan Range", value: "$100 – $1K" },
            { label: "Program Tiers", value: "3 Levels" },
            { label: "Skill Tracks", value: "6 Paths" },
            { label: "Empire Businesses", value: "4 Companies" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-primary font-display">{s.value}</div>
              <div className="text-muted-foreground text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary border border-primary/30 mb-4">THE PROGRAMS</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider text-primary mb-3">
            Three Ways to Grow
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Pocket Booster isn't just a loan company. It's a full ecosystem to fund, build, and track your financial future.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Micro-Loans */}
          <Card className="bg-zinc-900 border-primary/30 hover:border-primary transition-colors">
            <CardHeader className="pb-3">
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 w-14 h-14 flex items-center justify-center mb-3">
                <DollarSign className="h-7 w-7 text-primary" />
              </div>
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 w-fit text-xs mb-2">PRE-LAUNCH</Badge>
              <CardTitle className="text-primary font-display text-xl uppercase tracking-wide">
                Pocket Micro-Loans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Community-backed micro-loans from $100 to $1,000 for members with a business purpose. 
                No credit check. Based on your standing in the community.
              </p>
              <ul className="space-y-2 text-sm mb-5">
                {["$100 – $1,000 range", "No credit check required", "Active FR2P member (60+ days)", "Business use only", "Flexible repayment"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <a href="#waitlist">
                <Button className="w-full bg-primary text-black font-bold hover:bg-primary/90">
                  Join Waitlist
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Incubator */}
          <Card className="bg-zinc-900 border-purple-500/40 hover:border-purple-400 transition-colors">
            <CardHeader className="pb-3">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 w-14 h-14 flex items-center justify-center mb-3">
                <Brain className="h-7 w-7 text-purple-400" />
              </div>
              <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 w-fit text-xs mb-2">FR2P MEMBERS</Badge>
              <CardTitle className="text-purple-300 font-display text-xl uppercase tracking-wide">
                AI Side Hustle Incubator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Invest $1,000, $2,500, or $5,000 in yourself. AI guides you through 6 skill tracks, 
                builds your digital assets, and maps a 24-month income roadmap.
              </p>
              <ul className="space-y-2 text-sm mb-5">
                {["3 investment tiers", "6 AI skill tracks", "24-month roadmap", "Digital asset creation", "Community Win Board"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <a href={`${FR2P_BASE}/hustle-incubator`} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center gap-2">
                  Explore Incubator <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Tracker */}
          <Card className="bg-zinc-900 border-emerald-500/40 hover:border-emerald-400 transition-colors">
            <CardHeader className="pb-3">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 w-14 h-14 flex items-center justify-center mb-3">
                <BarChart3 className="h-7 w-7 text-emerald-400" />
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 w-fit text-xs mb-2">FR2P MEMBERS</Badge>
              <CardTitle className="text-emerald-300 font-display text-xl uppercase tracking-wide">
                Investment Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Your back-office dashboard. See fund allocation, phase timeline, ROI projections, 
                and real member success stories — all in one place.
              </p>
              <ul className="space-y-2 text-sm mb-5">
                {["Skill ROI Calculator", "Fund allocation view", "Phase progress tracker", "Community Win Board", "Month 1–24 projections"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <a href={`${FR2P_BASE}/investment-tracker`} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2">
                  Open Tracker <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Connects */}
      <section className="bg-zinc-900/40 border-y border-primary/10 py-14 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="bg-primary/10 text-primary border border-primary/30 mb-4">HOW IT WORKS</Badge>
          <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-primary mb-10">
            Your Path to Financial Freedom
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: Users, step: "01", label: "Join The FR2P Club", desc: "Become a paid member for 60+ days" },
              { icon: DollarSign, step: "02", label: "Access Pocket Booster", desc: "Apply for micro-loan or choose an Incubator tier" },
              { icon: Brain, step: "03", label: "Build Your Side Hustle", desc: "AI guides your skill track and business setup" },
              { icon: TrendingUp, step: "04", label: "Track Your ROI", desc: "Watch your investment grow in real time" },
            ].map(({ icon: Icon, step, label, desc }) => (
              <div key={step} className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 w-16 h-16 flex items-center justify-center mx-auto">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 bg-primary text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {step}
                  </span>
                </div>
                <h3 className="text-white font-bold text-sm mb-1">{label}</h3>
                <p className="text-muted-foreground text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist Form */}
      <section id="waitlist" className="max-w-2xl mx-auto px-6 py-16 w-full">
        <div className="text-center mb-8">
          <Badge className="bg-primary/10 text-primary border border-primary/30 mb-4">MICRO-LOANS</Badge>
          <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-primary mb-2">
            Join the Waitlist
          </h2>
          <p className="text-muted-foreground">
            Be first in line when Pocket Booster launches. No credit card required — just your info and your vision.
          </p>
        </div>

        {step === "done" ? (
          <Card className="bg-zinc-900 border-2 border-emerald-500 text-center p-10">
            <div className="bg-emerald-500 rounded-full p-4 w-20 h-20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-primary font-display mb-3">You're On The List!</h3>
            <p className="text-muted-foreground mb-2">We'll email you the moment Pocket Booster launches.</p>
            <p className="text-muted-foreground text-sm">In the meantime, join The FR2P Club to qualify for your loan.</p>
            <a href="https://fr2p-club-production.up.railway.app" target="_blank" rel="noopener noreferrer" className="mt-6 block">
              <Button className="bg-primary text-black font-bold hover:bg-primary/90">
                Join The FR2P Club →
              </Button>
            </a>
          </Card>
        ) : (
          <Card className="bg-zinc-900 border border-primary/30">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-300 mb-1.5 block">Full Name *</Label>
                    <Input
                      placeholder="Your full name"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-300 mb-1.5 block">Email Address *</Label>
                    <Input
                      type="email"
                      placeholder="you@email.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-300 mb-1.5 block">Phone (optional)</Label>
                    <Input
                      type="tel"
                      placeholder="(555) 000-0000"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-300 mb-1.5 block">Loan Amount Needed *</Label>
                    <Select onValueChange={v => setForm(f => ({ ...f, loanAmount: v }))}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Select amount" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="$100 – $250">$100 – $250</SelectItem>
                        <SelectItem value="$250 – $500">$250 – $500</SelectItem>
                        <SelectItem value="$500 – $750">$500 – $750</SelectItem>
                        <SelectItem value="$750 – $1,000">$750 – $1,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-zinc-300 mb-1.5 block">Loan Purpose *</Label>
                  <Select onValueChange={v => setForm(f => ({ ...f, purpose: v }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="What's it for?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Business startup costs">Business startup costs</SelectItem>
                      <SelectItem value="Equipment or tools">Equipment or tools</SelectItem>
                      <SelectItem value="Marketing and ads">Marketing and ads</SelectItem>
                      <SelectItem value="Online course or certification">Online course or certification</SelectItem>
                      <SelectItem value="Inventory or supplies">Inventory or supplies</SelectItem>
                      <SelectItem value="Side hustle incubator tier">Side Hustle Incubator tier</SelectItem>
                      <SelectItem value="Other business purpose">Other business purpose</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-zinc-300 mb-1.5 block">How long have you been an FR2P member?</Label>
                  <Select onValueChange={v => setForm(f => ({ ...f, monthsAsMember: v }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not yet a member">Not yet a member</SelectItem>
                      <SelectItem value="Less than 2 months">Less than 2 months</SelectItem>
                      <SelectItem value="2–6 months">2–6 months</SelectItem>
                      <SelectItem value="6–12 months">6–12 months</SelectItem>
                      <SelectItem value="1+ year">1+ year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-zinc-300 mb-1.5 block">Tell us your business idea (optional)</Label>
                  <Textarea
                    placeholder="A quick description of your plan..."
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    rows={3}
                  />
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-300 text-xs">
                      Pre-launch waitlist only — no funds collected now. Joining the waitlist doesn't guarantee approval. 
                      You must be an active FR2P member for 60+ days to qualify.
                    </p>
                  </div>
                </div>

                <Button type="submit" disabled={submitting} className="w-full bg-primary text-black font-bold hover:bg-primary/90 py-3 text-base">
                  {submitting ? "Submitting..." : "Reserve My Spot →"}
                </Button>
                <p className="text-muted-foreground text-xs text-center">
                  No credit card. No commitment. Just your spot in line.
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Empire Footer Banner */}
      <section className="bg-gradient-to-r from-zinc-900 via-black to-zinc-900 border-t border-primary/20 py-10 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Handshake className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-display text-xl font-bold uppercase tracking-wider text-primary mb-2">
            Part of the Consolidatus Empire
          </h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-2xl mx-auto">
            Pocket Booster sits alongside The FR2P Club, Khomplete Khemistri Apparel, GuardConnect DMV Security, 
            and Studio Business — one community, multiple paths to prosperity.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: "The FR2P Club", href: "/fr2p" },
              { label: "KK Apparel", href: "/" },
              { label: "Empire Hub", href: "/hub" },
            ].map(link => (
              <a key={link.label} href={link.href}>
                <Badge className="bg-primary/10 text-primary border border-primary/30 px-4 py-2 hover:bg-primary/20 cursor-pointer text-sm">
                  {link.label}
                </Badge>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
