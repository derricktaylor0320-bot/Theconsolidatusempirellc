import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  APPLICATION_TIER_VALUES,
  PAY_FREQUENCIES,
  POCKET_BOOSTER_TIERS,
  getTierByLevel,
  tierAllowsRepayment,
  tierLevelFromApplicationValue,
  type ApplicationTierValue,
  type PocketBoosterApplicationInput,
} from "@shared/pocketBooster";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  employerName: string;
  jobTitle: string;
  netPay: string;
  payFrequency: (typeof PAY_FREQUENCIES)[number];
  nextPayday: string;
  subscriptionTier: ApplicationTierValue;
  repaymentOption: "FULL_NEXT_PAYDAY" | "BI_WEEKLY_SPLIT";
  routingNumber: string;
  accountNumber: string;
  agreeToTerms: boolean;
};

const INITIAL: FormState = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  employerName: "",
  jobTitle: "",
  netPay: "",
  payFrequency: "Bi-Weekly",
  nextPayday: "",
  subscriptionTier: "TIER_1",
  repaymentOption: "FULL_NEXT_PAYDAY",
  routingNumber: "",
  accountNumber: "",
  agreeToTerms: false,
};

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

export default function PocketBoosterApplication() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormState>(INITIAL);

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || user.displayName || "",
      email: prev.email || user.email || "",
    }));
  }, [user?.id, user?.email, user?.displayName]);

  const selectedTier = useMemo(() => {
    const level = tierLevelFromApplicationValue(formData.subscriptionTier);
    return getTierByLevel(level);
  }, [formData.subscriptionTier]);

  const repaymentChoices = useMemo(() => {
    const choices: Array<"FULL_NEXT_PAYDAY" | "BI_WEEKLY_SPLIT"> = [
      "FULL_NEXT_PAYDAY",
    ];
    if (selectedTier && tierAllowsRepayment(selectedTier, "BI_WEEKLY_SPLIT")) {
      choices.push("BI_WEEKLY_SPLIT");
    }
    return choices;
  }, [selectedTier]);

  useEffect(() => {
    if (!repaymentChoices.includes(formData.repaymentOption)) {
      setFormData((prev) => ({
        ...prev,
        repaymentOption: "FULL_NEXT_PAYDAY",
      }));
    }
  }, [repaymentChoices, formData.repaymentOption]);

  const applyMutation = useMutation({
    mutationFn: async (payload: PocketBoosterApplicationInput) => {
      const res = await apiRequest("POST", "/api/pocket-booster/apply", payload);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pocket-booster/me"] });
      setFormData((prev) => ({
        ...INITIAL,
        fullName: user?.displayName || "",
        email: user?.email || "",
        agreeToTerms: false,
        // keep contact if they re-apply later
        phone: prev.phone,
      }));
      toast({
        title: "Application submitted",
        description:
          data.message ||
          "Your centralized profile is now processing.",
      });
    },
    onError: (err: unknown) => {
      toast({
        title: "Submission error",
        description: errorMessage(err, "Could not submit application."),
        variant: "destructive",
      });
    },
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" && "checked" in e.target
        ? (e.target as HTMLInputElement).checked
        : false;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      toast({
        title: "Authorization required",
        description:
          "Applicants must agree to the program authorization terms before submitting.",
        variant: "destructive",
      });
      return;
    }

    const payload: PocketBoosterApplicationInput = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      employerName: formData.employerName.trim(),
      jobTitle: formData.jobTitle.trim(),
      netPay: parseFloat(formData.netPay),
      payFrequency: formData.payFrequency,
      nextPayday: formData.nextPayday,
      subscriptionTier: formData.subscriptionTier,
      repaymentOption: formData.repaymentOption,
      routingNumber: formData.routingNumber.trim(),
      accountNumber: formData.accountNumber.trim(),
      agreeToTerms: true,
    };

    applyMutation.mutate(payload);
  };

  if (!isAuthenticated) {
    return (
      <div
        className="rounded-xl border border-border bg-secondary/25 p-8 text-center"
        data-testid="pocket-booster-application-signin"
      >
        <FileText className="h-8 w-8 text-primary mx-auto mb-3" />
        <h3 className="font-display text-xl uppercase tracking-wide text-primary mb-2">
          Secure Portal Application
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sign in to submit your Pocket Booster membership application.
        </p>
        <Button asChild data-testid="button-sign-in-application">
          <Link href="/auth">Sign In to Apply</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-primary/25 bg-background/60 overflow-hidden"
      data-testid="pocket-booster-application"
    >
      <div className="bg-[linear-gradient(135deg,_hsl(25_45%_12%),_hsl(var(--primary)/0.35))] border-b border-primary/40 px-6 py-5">
        <h3 className="font-display text-2xl font-bold uppercase tracking-wider text-primary">
          Pocket Booster
        </h3>
        <p className="text-sm text-foreground/80 italic mt-1">
          The Zero-Interest Financial Cushion &amp; Skill Accelerator
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Section 1 */}
        <section>
          <h4 className="font-display text-sm uppercase tracking-widest text-primary border-b border-border pb-2 mb-4">
            1. Applicant Personal Information
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Legal Name</Label>
              <Input
                id="fullName"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                data-testid="input-app-full-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                data-testid="input-app-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                data-testid="input-app-phone"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">
                Home Address (Street, City, State, ZIP)
              </Label>
              <Input
                id="address"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                data-testid="input-app-address"
              />
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <h4 className="font-display text-sm uppercase tracking-widest text-primary border-b border-border pb-2 mb-4">
            2. Employment &amp; Payroll Verification
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employerName">Current Employer Name</Label>
              <Input
                id="employerName"
                name="employerName"
                required
                value={formData.employerName}
                onChange={handleChange}
                data-testid="input-app-employer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title / Position</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                required
                value={formData.jobTitle}
                onChange={handleChange}
                data-testid="input-app-job-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="netPay">Net Pay Per Paycheck ($)</Label>
              <Input
                id="netPay"
                name="netPay"
                type="number"
                min={1}
                step="0.01"
                required
                value={formData.netPay}
                onChange={handleChange}
                data-testid="input-app-net-pay"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payFrequency">Pay Frequency</Label>
              <select
                id="payFrequency"
                name="payFrequency"
                value={formData.payFrequency}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                data-testid="select-app-pay-frequency"
              >
                {PAY_FREQUENCIES.map((freq) => (
                  <option key={freq} value={freq}>
                    {freq}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextPayday">Next Scheduled Payday Date</Label>
              <Input
                id="nextPayday"
                name="nextPayday"
                type="date"
                required
                value={formData.nextPayday}
                onChange={handleChange}
                data-testid="input-app-next-payday"
              />
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <h4 className="font-display text-sm uppercase tracking-widest text-primary border-b border-border pb-2 mb-2">
            3. Secure Direct Deposit / Banking Integration
          </h4>
          <p className="text-xs text-muted-foreground mb-4">
            Enter your checking coordinates for secure verification and
            automated direct-debit schedules on the Square network.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="routingNumber">ABA Routing Number (9 Digits)</Label>
              <Input
                id="routingNumber"
                name="routingNumber"
                required
                maxLength={9}
                pattern="\d{9}"
                inputMode="numeric"
                placeholder="021000021"
                value={formData.routingNumber}
                onChange={handleChange}
                className="font-mono tracking-wider"
                data-testid="input-app-routing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Bank Account Number</Label>
              <Input
                id="accountNumber"
                name="accountNumber"
                required
                inputMode="numeric"
                placeholder="1234567890"
                value={formData.accountNumber}
                onChange={handleChange}
                className="font-mono tracking-wider"
                data-testid="input-app-account"
              />
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section>
          <h4 className="font-display text-sm uppercase tracking-widest text-primary border-b border-border pb-2 mb-4">
            4. Select Your Membership Subscription Tier
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {POCKET_BOOSTER_TIERS.map((tier) => {
              const value = APPLICATION_TIER_VALUES[tier.level - 1];
              const selected = formData.subscriptionTier === value;
              return (
                <label
                  key={tier.level}
                  className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/20 hover:border-primary/40"
                  }`}
                  data-testid={`radio-app-tier-${tier.level}`}
                >
                  <input
                    type="radio"
                    name="subscriptionTier"
                    value={value}
                    checked={selected}
                    onChange={handleChange}
                    className="mt-1 accent-[hsl(var(--primary))]"
                  />
                  <div>
                    <p className="font-display font-bold uppercase tracking-wide text-sm">
                      Tier {tier.level}: {tier.name} ($
                      {tier.monthlySubscription.toFixed(0)}/mo)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Access up to a ${tier.maxCushionLimit.toFixed(0)} cushion
                      {tier.level === 4 ? " + Pay-to-Learn tracks" : ""}.
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        {/* Section 5 */}
        <section>
          <h4 className="font-display text-sm uppercase tracking-widest text-primary border-b border-border pb-2 mb-4">
            5. Select Your Automated Repayment Option
          </h4>
          <div className="space-y-3">
            <label
              className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer ${
                formData.repaymentOption === "FULL_NEXT_PAYDAY"
                  ? "border-primary bg-primary/10"
                  : "border-border"
              }`}
            >
              <input
                type="radio"
                name="repaymentOption"
                value="FULL_NEXT_PAYDAY"
                checked={formData.repaymentOption === "FULL_NEXT_PAYDAY"}
                onChange={handleChange}
                className="mt-1 accent-[hsl(var(--primary))]"
                data-testid="radio-app-repay-full"
              />
              <span className="text-sm">
                <strong>Option 1: Pay In Full</strong> — Automatically deduct
                the total borrowed balance from my next direct-deposit paycheck.
              </span>
            </label>
            {repaymentChoices.includes("BI_WEEKLY_SPLIT") ? (
              <label
                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer ${
                  formData.repaymentOption === "BI_WEEKLY_SPLIT"
                    ? "border-primary bg-primary/10"
                    : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="repaymentOption"
                  value="BI_WEEKLY_SPLIT"
                  checked={formData.repaymentOption === "BI_WEEKLY_SPLIT"}
                  onChange={handleChange}
                  className="mt-1 accent-[hsl(var(--primary))]"
                  data-testid="radio-app-repay-split"
                />
                <span className="text-sm">
                  <strong>Option 2: Bi-Weekly Split Balance</strong> — Deduct 50%
                  on the next payday and the remaining 50% on the following
                  payday.
                </span>
              </label>
            ) : (
              <p className="text-xs text-muted-foreground">
                Bi-weekly split is available on Tier 1–2. Your selected tier uses
                pay-in-full (or custom payroll after approval).
              </p>
            )}
          </div>
        </section>

        <div className="rounded-lg border border-border bg-secondary/30 p-4 text-xs text-muted-foreground text-justify leading-relaxed">
          By checking the authorization box below, I certify that all information
          provided is accurate and true. I authorize Pocket Booster to verify my
          employment history. I explicitly acknowledge that Pocket Booster
          microloans carry a 0% interest rate and that I am responsible only for
          paying back the exact cash cushion amount distributed, alongside my
          chosen recurring flat monthly membership tier fee. I authorize
          automated repayment processing schedules to be securely locked into
          the platform via my banking routing info using the Square secure
          network.
        </div>

        <label className="flex items-start gap-3 cursor-pointer text-sm font-medium">
          <input
            type="checkbox"
            name="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleChange}
            className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]"
            data-testid="checkbox-app-agree"
          />
          <span className="inline-flex gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            I authorize the electronic signature and agree to the payment
            parameters detailed above.
          </span>
        </label>

        <Button
          type="submit"
          className="w-full"
          disabled={applyMutation.isPending}
          data-testid="button-submit-application"
        >
          {applyMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          Submit Secure Portal Application
        </Button>
      </form>
    </div>
  );
}
