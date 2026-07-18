import { z } from "zod";

/** Pocket Booster — Zero-Capital (Subscription Powered) funding tiers */
export const POCKET_BOOSTER_PLATFORM = {
  platformName: "Pocket Booster",
  fundingStrategy: "Zero-Capital (Subscription Powered)",
} as const;

export const REPAYMENT_CHOICES = [
  "FULL_NEXT_PAYDAY",
  "BI_WEEKLY_SPLIT",
  "CUSTOM_PAYROLL_SPLIT",
] as const;

export type RepaymentChoice = (typeof REPAYMENT_CHOICES)[number];

export type PocketBoosterTier = {
  level: 1 | 2 | 3 | 4;
  name: string;
  monthlySubscription: number;
  maxCushionLimit: number;
  repaymentOptions: RepaymentChoice[];
  features?: string[];
};

export const POCKET_BOOSTER_TIERS: PocketBoosterTier[] = [
  {
    level: 1,
    name: "Starter Cushion",
    monthlySubscription: 10.0,
    maxCushionLimit: 100.0,
    repaymentOptions: ["FULL_NEXT_PAYDAY", "BI_WEEKLY_SPLIT"],
  },
  {
    level: 2,
    name: "Growth Cushion",
    monthlySubscription: 25.0,
    maxCushionLimit: 250.0,
    repaymentOptions: [
      "FULL_NEXT_PAYDAY",
      "BI_WEEKLY_SPLIT",
      "CUSTOM_PAYROLL_SPLIT",
    ],
  },
  {
    level: 3,
    name: "Builder Cushion",
    monthlySubscription: 50.0,
    maxCushionLimit: 500.0,
    repaymentOptions: ["FULL_NEXT_PAYDAY", "CUSTOM_PAYROLL_SPLIT"],
  },
  {
    level: 4,
    name: "Six-Figure Skill Accelerator",
    monthlySubscription: 100.0,
    maxCushionLimit: 1000.0,
    features: [
      "Priority Instant Funding",
      "Affiliate Rewards Access",
      "Pay-to-Learn Track",
    ],
    repaymentOptions: ["FULL_NEXT_PAYDAY", "CUSTOM_PAYROLL_SPLIT"],
  },
];

export const REPAYMENT_LABELS: Record<RepaymentChoice, string> = {
  FULL_NEXT_PAYDAY: "Full Next Payday",
  BI_WEEKLY_SPLIT: "Bi-Weekly Split",
  CUSTOM_PAYROLL_SPLIT: "Custom Payroll Split",
};

/** Tier 4 Pay-to-Learn modules that unlock the 50% membership rebate */
export const PAY_TO_LEARN_MODULES = [
  {
    id: "cashflow-foundations",
    title: "Cashflow Foundations",
    description: "Build a simple weekly money plan that keeps cushions temporary.",
  },
  {
    id: "income-acceleration",
    title: "Income Acceleration",
    description: "Map skills and side income paths toward six-figure momentum.",
  },
  {
    id: "credit-and-capital",
    title: "Credit & Capital Basics",
    description: "Understand how repayment discipline unlocks bigger opportunities.",
  },
] as const;

export function getTierByLevel(level: number): PocketBoosterTier | undefined {
  return POCKET_BOOSTER_TIERS.find((t) => t.level === level);
}

export function tierAllowsRepayment(
  tier: PocketBoosterTier,
  choice: RepaymentChoice,
): boolean {
  return tier.repaymentOptions.includes(choice);
}

export const activateSubscriptionSchema = z.object({
  tierLevel: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
});

export const requestCushionSchema = z.object({
  amountRequested: z
    .number()
    .positive("Amount must be greater than zero")
    .max(1000, "Amount exceeds the highest tier limit"),
  repaymentChoice: z.enum(REPAYMENT_CHOICES),
  nextPaydayDate: z.string().min(1, "Next payday date is required"),
  /** For CUSTOM_PAYROLL_SPLIT: number of equal payroll deductions (2–6) */
  customSplitCount: z.number().int().min(2).max(6).optional(),
});

export const completeModuleSchema = z.object({
  completedModule: z
    .string()
    .trim()
    .min(1, "Module name is required")
    .max(120),
});

export type ActivateSubscriptionInput = z.infer<typeof activateSubscriptionSchema>;
export type RequestCushionInput = z.infer<typeof requestCushionSchema>;
export type CompleteModuleInput = z.infer<typeof completeModuleSchema>;

/** Split a dollar amount into N equal parts that sum exactly (handles cents). */
export function splitAmountEvenly(total: number, parts: number): number[] {
  if (parts < 1) throw new Error("parts must be >= 1");
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / parts);
  const remainder = cents - base * parts;
  const amounts: number[] = [];
  for (let i = 0; i < parts; i++) {
    const extra = i < remainder ? 1 : 0;
    amounts.push((base + extra) / 100);
  }
  return amounts;
}
