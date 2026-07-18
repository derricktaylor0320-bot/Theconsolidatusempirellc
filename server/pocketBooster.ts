import type { Express, Request, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { requireAuth } from "./auth";
import type { User } from "@shared/schema";
import {
  cashAdvances,
  educationalMilestones,
  repaymentSchedules,
  userSubscriptions,
  type CashAdvance,
  type EducationalMilestone,
  type RepaymentSchedule,
  type UserSubscription,
} from "@shared/schema";
import {
  POCKET_BOOSTER_PLATFORM,
  POCKET_BOOSTER_TIERS,
  PAY_TO_LEARN_MODULES,
  activateSubscriptionSchema,
  completeModuleSchema,
  getTierByLevel,
  requestCushionSchema,
  splitAmountEvenly,
  tierAllowsRepayment,
  type RepaymentChoice,
} from "@shared/pocketBooster";

function currentUserId(req: Request): string {
  return (req.user as User).id;
}

function parsePaydayDate(value: string): Date | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function getActiveSubscription(
  userId: string,
): Promise<UserSubscription | undefined> {
  const [row] = await db
    .select()
    .from(userSubscriptions)
    .where(
      and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.subscriptionStatus, "active"),
      ),
    )
    .limit(1);
  return row;
}

async function listAdvancesForUser(userId: string): Promise<CashAdvance[]> {
  return db
    .select()
    .from(cashAdvances)
    .where(eq(cashAdvances.userId, userId))
    .orderBy(desc(cashAdvances.createdAt));
}

async function listSchedulesForAdvance(
  advanceId: string,
): Promise<RepaymentSchedule[]> {
  return db
    .select()
    .from(repaymentSchedules)
    .where(eq(repaymentSchedules.advanceId, advanceId))
    .orderBy(repaymentSchedules.scheduledDate);
}

async function listMilestonesForUser(
  userId: string,
): Promise<EducationalMilestone[]> {
  return db
    .select()
    .from(educationalMilestones)
    .where(eq(educationalMilestones.userId, userId))
    .orderBy(desc(educationalMilestones.createdAt));
}

async function insertRepaymentSchedules(
  advanceId: string,
  userId: string,
  amounts: number[],
  firstPayday: Date,
  intervalDays: number,
): Promise<void> {
  for (let i = 0; i < amounts.length; i++) {
    await db.insert(repaymentSchedules).values({
      advanceId,
      userId,
      deductionAmount: amounts[i].toFixed(2),
      scheduledDate: addDays(firstPayday, i * intervalDays),
      status: "scheduled",
    });
  }
}

/**
 * Automated checkbox logic processing engine:
 * builds repayment_schedules rows from the selected repayment choice.
 */
async function scheduleRepayments(opts: {
  advanceId: string;
  userId: string;
  amountRequested: number;
  repaymentChoice: RepaymentChoice;
  nextPayday: Date;
  customSplitCount?: number;
}): Promise<void> {
  const {
    advanceId,
    userId,
    amountRequested,
    repaymentChoice,
    nextPayday,
    customSplitCount,
  } = opts;

  if (repaymentChoice === "FULL_NEXT_PAYDAY") {
    await insertRepaymentSchedules(
      advanceId,
      userId,
      [amountRequested],
      nextPayday,
      14,
    );
    return;
  }

  if (repaymentChoice === "BI_WEEKLY_SPLIT") {
    const amounts = splitAmountEvenly(amountRequested, 2);
    await insertRepaymentSchedules(advanceId, userId, amounts, nextPayday, 14);
    return;
  }

  // CUSTOM_PAYROLL_SPLIT — equal deductions across N bi-weekly paydays
  const parts = customSplitCount ?? 3;
  const amounts = splitAmountEvenly(amountRequested, parts);
  await insertRepaymentSchedules(advanceId, userId, amounts, nextPayday, 14);
}

export function registerPocketBoosterRoutes(app: Express): void {
  // Public tier catalog for the Pocket Booster page
  app.get("/api/pocket-booster/tiers", (_req, res) => {
    res.json({
      ...POCKET_BOOSTER_PLATFORM,
      tiers: POCKET_BOOSTER_TIERS,
      modules: PAY_TO_LEARN_MODULES,
    });
  });

  // Current member's subscription + recent activity
  app.get(
    "/api/pocket-booster/me",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = currentUserId(req);
        const subscription = await getActiveSubscription(userId);
        const advances = await listAdvancesForUser(userId);
        const milestones = await listMilestonesForUser(userId);

        const advancesWithSchedules = await Promise.all(
          advances.slice(0, 10).map(async (advance) => ({
            ...advance,
            schedules: await listSchedulesForAdvance(advance.id),
          })),
        );

        res.json({
          subscription: subscription ?? null,
          advances: advancesWithSchedules,
          milestones,
          tier:
            subscription != null
              ? getTierByLevel(subscription.tierLevel) ?? null
              : null,
        });
      } catch (error) {
        console.error("Pocket Booster me error:", error);
        res.status(500).json({ error: "Failed to load Pocket Booster account." });
      }
    },
  );

  // Activate / switch tier (subscription-powered access gate)
  app.post(
    "/api/pocket-booster/activate",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const parsed = activateSubscriptionSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            error: parsed.error.errors[0]?.message || "Invalid tier selection.",
          });
        }

        const tier = getTierByLevel(parsed.data.tierLevel);
        if (!tier) {
          return res.status(400).json({ error: "Unknown subscription tier." });
        }

        const userId = currentUserId(req);
        const existing = await db
          .select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.userId, userId))
          .limit(1);

        const values = {
          tierLevel: tier.level,
          monthlySubscription: tier.monthlySubscription.toFixed(2),
          maxCushionLimit: tier.maxCushionLimit.toFixed(2),
          nextBillingAmount: tier.monthlySubscription.toFixed(2),
          subscriptionStatus: "active" as const,
          updatedAt: new Date(),
        };

        let subscription: UserSubscription;
        if (existing[0]) {
          const [updated] = await db
            .update(userSubscriptions)
            .set(values)
            .where(eq(userSubscriptions.userId, userId))
            .returning();
          subscription = updated;
        } else {
          const [created] = await db
            .insert(userSubscriptions)
            .values({ userId, ...values })
            .returning();
          subscription = created;
        }

        // Stripe subscription / invoice wiring lands here when billing goes live.

        return res.status(200).json({
          success: true,
          message: `Tier ${tier.level} (${tier.name}) is active. Cushion limit: $${tier.maxCushionLimit.toFixed(2)}.`,
          subscription,
          tier,
        });
      } catch (error) {
        console.error("Pocket Booster activate error:", error);
        return res
          .status(500)
          .json({ error: "Failed to activate subscription tier." });
      }
    },
  );

  // Route: application form + checked repayment options → automated schedules
  app.post(
    "/api/pocket-booster/request-cushion",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const parsed = requestCushionSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            error:
              parsed.error.errors[0]?.message || "Invalid cushion request.",
          });
        }

        const {
          amountRequested,
          repaymentChoice,
          nextPaydayDate,
          customSplitCount,
        } = parsed.data;
        const userId = currentUserId(req);

        // 1. Verify user's max tier limits first
        const subscription = await getActiveSubscription(userId);
        if (!subscription) {
          return res
            .status(400)
            .json({ error: "No active subscription found." });
        }

        const maxLimit = parseFloat(subscription.maxCushionLimit);
        if (amountRequested > maxLimit) {
          return res.status(400).json({
            error: `Amount exceeds your current tier limit of $${maxLimit.toFixed(2)}`,
          });
        }

        const tier = getTierByLevel(subscription.tierLevel);
        if (!tier || !tierAllowsRepayment(tier, repaymentChoice)) {
          return res.status(400).json({
            error:
              "That repayment option is not available on your current tier.",
          });
        }

        if (
          repaymentChoice === "CUSTOM_PAYROLL_SPLIT" &&
          customSplitCount == null
        ) {
          return res.status(400).json({
            error:
              "Custom payroll split requires customSplitCount (2–6 deductions).",
          });
        }

        const parsePayday = parsePaydayDate(nextPaydayDate);
        if (!parsePayday) {
          return res
            .status(400)
            .json({ error: "Invalid next payday date." });
        }

        // 2. Insert the active advance record
        const [newAdvance] = await db
          .insert(cashAdvances)
          .values({
            userId,
            amountBorrowed: amountRequested.toFixed(2),
            repaymentType: repaymentChoice,
            status: "active",
          })
          .returning();

        // 3. Automated Checkbox Logic Processing Engine
        await scheduleRepayments({
          advanceId: newAdvance.id,
          userId,
          amountRequested,
          repaymentChoice,
          nextPayday: parsePayday,
          customSplitCount,
        });

        const schedules = await listSchedulesForAdvance(newAdvance.id);

        // 4. Trigger Instant Disbursal API (e.g. Stripe Custom Payouts) goes here

        return res.status(200).json({
          success: true,
          message:
            "Cushion approved. Repayment processing schedules are locked and fully automated.",
          advance: newAdvance,
          schedules,
        });
      } catch (error) {
        console.error("Autopilot Engine Error:", error);
        return res
          .status(500)
          .json({ error: "Internal processing engine failure." });
      }
    },
  );

  // Route: fired when tracking verifies Pay-to-Learn module completion
  app.post(
    "/api/pocket-booster/complete-module",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const parsed = completeModuleSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            error: parsed.error.errors[0]?.message || "Invalid module payload.",
          });
        }

        const { completedModule } = parsed.data;
        const userId = currentUserId(req);

        // 1. Log the milestone accomplishment (idempotent per user+module)
        await db
          .insert(educationalMilestones)
          .values({
            userId,
            moduleName: completedModule,
          })
          .onConflictDoNothing({
            target: [
              educationalMilestones.userId,
              educationalMilestones.moduleName,
            ],
          });

        // 2. Check if user is an active Premium Tier 4 member ($100 tier)
        const subscription = await getActiveSubscription(userId);

        if (subscription && subscription.tierLevel === 4) {
          // 3. Tier 4 benefit: next month's invoice at 50% ($50 reward)
          // In production this also triggers Stripe Invoice Item / Coupon API.
          const [updated] = await db
            .update(userSubscriptions)
            .set({
              nextBillingAmount: "50.00",
              updatedAt: new Date(),
            })
            .where(eq(userSubscriptions.userId, userId))
            .returning();

          return res.status(200).json({
            success: true,
            message:
              "Milestone logged! Premium Tier 4 benefit applied: Next month's membership fee reduced by 50% for investing in your skills.",
            rebateApplied: true,
            subscription: updated,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Milestone logged successfully.",
          rebateApplied: false,
        });
      } catch (error) {
        console.error("Education Reward Engine Error:", error);
        return res
          .status(500)
          .json({ error: "Processing error on educational credit." });
      }
    },
  );
}
