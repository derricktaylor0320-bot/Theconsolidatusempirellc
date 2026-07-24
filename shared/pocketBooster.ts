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

export const POCKET_BOOSTER_REPAYMENTS_TO_UNLOCK = 2;
export const POCKET_BOOSTER_FIRST_TIER = 1;
export const POCKET_BOOSTER_MAX_TIER = 4;

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

/** A single takeable lesson inside a Pay-to-Learn program */
export type PayToLearnLesson = {
  id: string;
  title: string;
  minutes: number;
  /** Short teaching body the member actually reads/works through */
  body: string[];
  /** One keyed takeaway they apply before advancing */
  actionPrompt: string;
};

/** Tier 4 Pay-to-Learn programs — real tools members take; completion auto-rewards */
export const PAY_TO_LEARN_MODULES = [
  {
    id: "cashflow-foundations",
    title: "Cash Flow Foundations",
    description:
      "Build a simple weekly money plan that keeps cushions temporary — take the lessons, then the system marks you complete.",
    lessons: [
      {
        id: "cf-1",
        title: "Map Your Real Cash Week",
        minutes: 8,
        body: [
          "List every dollar that hits your account this week and every bill that leaves it — paydays, tips, transfers, subscriptions, food, transport.",
          "Separate needs (housing, food, transport, minimum debt) from wants. Cushions exist for needs when timing slips — not for lifestyle upgrades.",
          "Your cushion stays temporary only if this map is honest. Guessing creates the payday-loan cycle Pocket Booster is built to break.",
        ],
        actionPrompt:
          "Write your next 7 days of income and must-pay bills. Circle the one day cash gets tight.",
      },
      {
        id: "cf-2",
        title: "The Temporary Cushion Rule",
        minutes: 7,
        body: [
          "A Pocket Booster cushion is a bridge, not income. Treat borrowed dollars as already owed on your next payday.",
          "Before you request a cushion, name the exact bill it covers and the exact repayment date. No vague “extra money.”",
          "If you cannot name the repayment source, do not borrow — tighten the week plan first.",
        ],
        actionPrompt:
          "If you needed a cushion tomorrow, which one bill would it cover and which payday pays it back?",
      },
      {
        id: "cf-3",
        title: "Weekly Money Plan Template",
        minutes: 10,
        body: [
          "Use three buckets: Survive (bills & food), Stabilize (cushion repayment & small reserve), and Grow (skills & side income).",
          "Move money on payday in that order. Growth never jumps ahead of Survive or Stabilize.",
          "Review every Sunday for 10 minutes. Adjust amounts — keep the order. This is the foundation that unlocks larger cushions later.",
        ],
        actionPrompt:
          "Assign this week’s dollars into Survive / Stabilize / Grow. Confirm Grow is last.",
      },
    ],
  },
  {
    id: "income-acceleration",
    title: "Income Acceleration",
    description:
      "Map skills and side-income paths toward six-figure momentum — finish the track and the system rewards Tier 4 automatically.",
    lessons: [
      {
        id: "ia-1",
        title: "Inventory Your Monetizable Skills",
        minutes: 8,
        body: [
          "List skills people already pay for — driving, cooking, coding, sales, care work, content, trades, admin.",
          "Circle two you could offer in the next 30 days without new debt. Speed beats perfection.",
          "Income acceleration starts with proof of paid work, not a perfect business plan.",
        ],
        actionPrompt:
          "Name two skills you could sell this month and one person or platform who might buy them.",
      },
      {
        id: "ia-2",
        title: "Design a 30-Day Side Offer",
        minutes: 10,
        body: [
          "Package one offer with a clear outcome, price, and delivery time (example: “resume rewrite — $75 — 48 hours”).",
          "Tell ten people or post in three communities. Track replies, not likes.",
          "Use cushion capacity only if repayment still fits Survive + Stabilize. Never fund a hustle by skipping repayment.",
        ],
        actionPrompt:
          "Write your one-sentence offer: outcome + price + delivery time.",
      },
      {
        id: "ia-3",
        title: "From Side Offer to Six-Figure Path",
        minutes: 9,
        body: [
          "Six-figure momentum is stacked months of paid offers, not one viral win. Raise price when demand shows up.",
          "Reinvest a slice of new income into skills (Tier 4 Pay-to-Learn) and a personal reserve before lifestyle upgrades.",
          "Your Pocket Booster repayment history becomes proof you can handle larger capital — protect that record.",
        ],
        actionPrompt:
          "Set a 90-day income target and the weekly offer count needed to reach it.",
      },
    ],
  },
  {
    id: "credit-and-capital",
    title: "Capital Accessories",
    description:
      "Learn the capital tools — repayment discipline, credit posture, and reserve access — then graduate for an automatic reward.",
    lessons: [
      {
        id: "ca-1",
        title: "Repayment Is Your Credit Story",
        minutes: 8,
        body: [
          "Inside Pocket Booster, on-time cushion repayment is your internal trust file. Everyone starts at the $10 Starter Cushion with access up to $100.",
          "Repay two separate cushions on time at each level and the next tier unlocks automatically. Late repayments do not count toward the two successful cycles.",
          "Treat every scheduled invoice like a non-negotiable bill — ahead of wants.",
        ],
        actionPrompt:
          "Open your next repayment date and add it to your calendar with a payday reminder.",
      },
      {
        id: "ca-2",
        title: "Capital Tools You Can Actually Use",
        minutes: 9,
        body: [
          "Capital Accessories are the tools around the cushion: tier membership, Autopilot schedules, Square invoices, and the P2P Reserve Vault.",
          "Each tool has a job — membership sets your limit, Autopilot collects, invoices document, Reserve funds the pool.",
          "Using the tools in order (activate → borrow only what you need → repay on schedule) is how capital compounds for you.",
        ],
        actionPrompt:
          "Name which capital tool you will use next: Activate Tier, Request Cushion, Autopilot, or Reserve.",
      },
      {
        id: "ca-3",
        title: "Graduate Into Larger Opportunity",
        minutes: 8,
        body: [
          "When you finish this track, the system logs your milestone — you do not manually “Mark Complete.”",
          "Tier 4 members receive the skill rebate automatically on the next billing cycle for investing in education.",
          "Keep stacking: Cash Flow Foundations + Income Acceleration + Capital Accessories = the full Pay-to-Learn roadway.",
        ],
        actionPrompt:
          "Confirm you will finish the remaining lessons so the system can graduate and reward you.",
      },
    ],
  },
] as const;

export type PayToLearnModule = (typeof PAY_TO_LEARN_MODULES)[number];
export type PayToLearnModuleId = PayToLearnModule["id"];

export function getTierByLevel(level: number): PocketBoosterTier | undefined {
  return POCKET_BOOSTER_TIERS.find((t) => t.level === level);
}

export function tierAllowsRepayment(
  tier: PocketBoosterTier,
  choice: RepaymentChoice,
): boolean {
  return tier.repaymentOptions.includes(choice);
}

export type PocketBoosterRepaymentCycle = {
  tierLevel: number;
  repaidOnTime: boolean;
};

export type PocketBoosterScheduleForEligibility = {
  status: string;
  scheduledDate: Date | string | null;
  collectedAt: Date | string | null;
};

export type PocketBoosterEligibility = {
  highestUnlockedTier: number;
  progressTier: number;
  onTimeRepayments: number;
  requiredRepayments: number;
  remainingRepayments: number;
  isMaxTier: boolean;
  onTimeRepaymentsByTier: Record<number, number>;
};

function validDate(value: Date | string | null): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * A trust-building cycle counts only when every billed installment was
 * collected no later than its scheduled due date and the entire cushion was
 * repaid within 30 days.
 */
export function isRepaymentCycleOnTime(
  schedules: PocketBoosterScheduleForEligibility[],
  cycleStartedAt: Date | string | null,
): boolean {
  if (schedules.length === 0) return false;
  const startedAt = validDate(cycleStartedAt);
  if (!startedAt) return false;
  const cycleDeadline = new Date(startedAt);
  cycleDeadline.setUTCDate(cycleDeadline.getUTCDate() + 30);
  cycleDeadline.setUTCHours(23, 59, 59, 999);

  return schedules.every((schedule) => {
    if (schedule.status !== "collected") return false;
    const dueAt = validDate(schedule.scheduledDate);
    const collectedAt = validDate(schedule.collectedAt);
    if (!dueAt || !collectedAt) return false;

    const dueEndOfDay = new Date(dueAt);
    dueEndOfDay.setUTCHours(23, 59, 59, 999);
    return (
      collectedAt.getTime() <= dueEndOfDay.getTime() &&
      collectedAt.getTime() <= cycleDeadline.getTime()
    );
  });
}

/**
 * Tier 1 is always the starting point. Each tier unlocks the next only after
 * two separate on-time cushion repayment cycles at that level.
 */
export function calculatePocketBoosterEligibility(
  cycles: PocketBoosterRepaymentCycle[],
  grandfatheredTier = POCKET_BOOSTER_FIRST_TIER,
): PocketBoosterEligibility {
  const onTimeRepaymentsByTier: Record<number, number> = {};
  for (let level = POCKET_BOOSTER_FIRST_TIER; level <= POCKET_BOOSTER_MAX_TIER; level++) {
    onTimeRepaymentsByTier[level] = 0;
  }

  for (const cycle of cycles) {
    if (
      cycle.repaidOnTime &&
      cycle.tierLevel >= POCKET_BOOSTER_FIRST_TIER &&
      cycle.tierLevel <= POCKET_BOOSTER_MAX_TIER
    ) {
      onTimeRepaymentsByTier[cycle.tierLevel] += 1;
    }
  }

  let highestUnlockedTier = Math.min(
    POCKET_BOOSTER_MAX_TIER,
    Math.max(POCKET_BOOSTER_FIRST_TIER, Math.trunc(grandfatheredTier)),
  );

  while (
    highestUnlockedTier < POCKET_BOOSTER_MAX_TIER &&
    onTimeRepaymentsByTier[highestUnlockedTier] >=
      POCKET_BOOSTER_REPAYMENTS_TO_UNLOCK
  ) {
    highestUnlockedTier += 1;
  }

  const isMaxTier = highestUnlockedTier === POCKET_BOOSTER_MAX_TIER;
  const onTimeRepayments = Math.min(
    onTimeRepaymentsByTier[highestUnlockedTier],
    POCKET_BOOSTER_REPAYMENTS_TO_UNLOCK,
  );
  const remainingRepayments = isMaxTier
    ? 0
    : Math.max(0, POCKET_BOOSTER_REPAYMENTS_TO_UNLOCK - onTimeRepayments);

  return {
    highestUnlockedTier,
    progressTier: highestUnlockedTier,
    onTimeRepayments,
    requiredRepayments: POCKET_BOOSTER_REPAYMENTS_TO_UNLOCK,
    remainingRepayments,
    isMaxTier,
    onTimeRepaymentsByTier,
  };
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
