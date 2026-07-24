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
  calculatePocketBoosterEligibility,
  completeModuleSchema,
  getTierByLevel,
  isRepaymentCycleOnTime,
  requestCushionSchema,
  splitAmountEvenly,
  tierAllowsRepayment,
  type PocketBoosterEligibility,
  type RepaymentChoice,
} from "@shared/pocketBooster";
import {
  createScheduledRepaymentInvoice,
  findOrCreateSquareCustomer,
  isSquareConfigured,
  retrieveRepaymentInvoice,
} from "./squareClient";
import {
  creditVaultCapital,
  debitVaultForCushion,
  getVaultAvailableCapital,
} from "./liquidityRouter";

function currentUser(req: Request): User {
  return req.user as User;
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

type AdvanceWithSchedules = CashAdvance & {
  schedules: RepaymentSchedule[];
};

async function listAdvancesWithSchedules(
  userId: string,
): Promise<AdvanceWithSchedules[]> {
  const advances = await listAdvancesForUser(userId);
  return Promise.all(
    advances.map(async (advance) => ({
      ...advance,
      schedules: await listSchedulesForAdvance(advance.id),
    })),
  );
}

/**
 * Reconcile scheduled invoices with Square. A completed advance is marked
 * repaid exactly once, which also safely restores its reserve-vault capital.
 */
async function syncSquareRepaymentHistory(userId: string): Promise<void> {
  if (!isSquareConfigured()) return;

  const advances = await listAdvancesWithSchedules(userId);
  for (const advance of advances) {
    if (advance.status !== "active") continue;

    for (const schedule of advance.schedules) {
      if (
        schedule.status === "collected" ||
        schedule.status === "cancelled" ||
        !schedule.squareInvoiceId
      ) {
        continue;
      }

      const invoice = await retrieveRepaymentInvoice(schedule.squareInvoiceId);
      if (!invoice) continue;

      const nextStatus =
        invoice.status === "PAID"
          ? "collected"
          : invoice.status === "CANCELED"
            ? "cancelled"
            : invoice.status === "FAILED"
              ? "failed"
              : schedule.status;

      await db
        .update(repaymentSchedules)
        .set({
          status: nextStatus,
          squareInvoiceStatus: invoice.status,
          collectedAt:
            invoice.status === "PAID"
              ? invoice.updatedAt ?? new Date()
              : schedule.collectedAt,
        })
        .where(eq(repaymentSchedules.id, schedule.id));
    }

    const refreshedSchedules = await listSchedulesForAdvance(advance.id);
    if (
      refreshedSchedules.length === 0 ||
      !refreshedSchedules.every((schedule) => schedule.status === "collected")
    ) {
      continue;
    }

    const repaidAt = refreshedSchedules.reduce<Date>((latest, schedule) => {
      const collectedAt = schedule.collectedAt
        ? new Date(schedule.collectedAt)
        : latest;
      return collectedAt > latest ? collectedAt : latest;
    }, new Date(0));

    const [repaidAdvance] = await db
      .update(cashAdvances)
      .set({ status: "repaid", repaidAt })
      .where(
        and(
          eq(cashAdvances.id, advance.id),
          eq(cashAdvances.status, "active"),
        ),
      )
      .returning();

    if (repaidAdvance) {
      await creditVaultCapital(parseFloat(repaidAdvance.amountBorrowed));
    }
  }
}

function buildEligibility(
  advances: AdvanceWithSchedules[],
  grandfatheredTier = 1,
): PocketBoosterEligibility {
  return calculatePocketBoosterEligibility(
    advances.map((advance) => ({
      tierLevel: advance.tierLevel,
      repaidOnTime:
        advance.status === "repaid" &&
        isRepaymentCycleOnTime(advance.schedules),
    })),
    grandfatheredTier,
  );
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
): Promise<RepaymentSchedule[]> {
  const rows: RepaymentSchedule[] = [];
  for (let i = 0; i < amounts.length; i++) {
    const [row] = await db
      .insert(repaymentSchedules)
      .values({
        advanceId,
        userId,
        deductionAmount: amounts[i].toFixed(2),
        scheduledDate: addDays(firstPayday, i * intervalDays),
        status: "scheduled",
      })
      .returning();
    rows.push(row);
  }
  return rows;
}

/**
 * Automated checkbox logic processing engine:
 * builds repayment_schedules rows from the selected repayment choice.
 */
async function buildRepaymentSchedules(opts: {
  advanceId: string;
  userId: string;
  amountRequested: number;
  repaymentChoice: RepaymentChoice;
  nextPayday: Date;
  customSplitCount?: number;
}): Promise<RepaymentSchedule[]> {
  const {
    advanceId,
    userId,
    amountRequested,
    repaymentChoice,
    nextPayday,
    customSplitCount,
  } = opts;

  if (repaymentChoice === "FULL_NEXT_PAYDAY") {
    return insertRepaymentSchedules(
      advanceId,
      userId,
      [amountRequested],
      nextPayday,
      14,
    );
  }

  if (repaymentChoice === "BI_WEEKLY_SPLIT") {
    const amounts = splitAmountEvenly(amountRequested, 2);
    return insertRepaymentSchedules(advanceId, userId, amounts, nextPayday, 14);
  }

  // CUSTOM_PAYROLL_SPLIT — equal deductions across N bi-weekly paydays
  const parts = customSplitCount ?? 3;
  const amounts = splitAmountEvenly(amountRequested, parts);
  return insertRepaymentSchedules(advanceId, userId, amounts, nextPayday, 14);
}

/**
 * Square Autopilot: for each DB schedule row, create + publish a Square invoice
 * due on that payday (card-on-file charge when available, otherwise emailed invoice).
 */
async function queueSquareRepaymentInvoices(opts: {
  user: User;
  schedules: RepaymentSchedule[];
  repaymentChoice: RepaymentChoice;
}): Promise<{
  schedules: RepaymentSchedule[];
  squareQueued: boolean;
  automaticPayments: number;
}> {
  if (!isSquareConfigured()) {
    console.warn(
      "[pocket-booster] Square is not configured — repayment schedules saved in DB only.",
    );
    return {
      schedules: opts.schedules,
      squareQueued: false,
      automaticPayments: 0,
    };
  }

  const customer = await findOrCreateSquareCustomer({
    email: opts.user.email,
    givenName: opts.user.displayName,
  });

  let automaticPayments = 0;
  const updated: RepaymentSchedule[] = [];

  for (let i = 0; i < opts.schedules.length; i++) {
    const schedule = opts.schedules[i];
    const amountCents = Math.round(parseFloat(schedule.deductionAmount) * 100);
    const partLabel =
      opts.schedules.length > 1
        ? ` (payment ${i + 1} of ${opts.schedules.length})`
        : "";

    const invoice = await createScheduledRepaymentInvoice({
      amountCents,
      dueDate: new Date(schedule.scheduledDate!),
      customerId: customer.customerId,
      title: `Pocket Booster Cushion Repayment${partLabel}`,
      description: `Automated ${opts.repaymentChoice.replace(/_/g, " ").toLowerCase()} repayment for advance schedule ${schedule.id}.`,
      preferCardOnFile: true,
    });

    if (invoice.automaticPayment) automaticPayments += 1;

    const [row] = await db
      .update(repaymentSchedules)
      .set({
        squareOrderId: invoice.orderId,
        squareInvoiceId: invoice.invoiceId,
        squareInvoiceUrl: invoice.publicUrl,
        squareInvoiceStatus: invoice.status,
      })
      .where(eq(repaymentSchedules.id, schedule.id))
      .returning();

    updated.push(row);
  }

  return {
    schedules: updated,
    squareQueued: true,
    automaticPayments,
  };
}

export function registerPocketBoosterRoutes(app: Express): void {
  // Public tier catalog for the Pocket Booster page
  app.get("/api/pocket-booster/tiers", (_req, res) => {
    res.json({
      ...POCKET_BOOSTER_PLATFORM,
      tiers: POCKET_BOOSTER_TIERS,
      modules: PAY_TO_LEARN_MODULES,
      squareConfigured: isSquareConfigured(),
    });
  });

  // Current member's subscription + recent activity
  app.get(
    "/api/pocket-booster/me",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = currentUser(req).id;
        const subscription = await getActiveSubscription(userId);
        await syncSquareRepaymentHistory(userId);
        const advances = await listAdvancesWithSchedules(userId);
        const milestones = await listMilestonesForUser(userId);
        const eligibility = buildEligibility(
          advances,
          subscription?.tierLevel ?? 1,
        );

        res.json({
          subscription: subscription ?? null,
          advances: advances.slice(0, 10),
          milestones,
          eligibility,
          tier:
            subscription != null
              ? getTierByLevel(subscription.tierLevel) ?? null
              : null,
          squareConfigured: isSquareConfigured(),
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

        const userId = currentUser(req).id;
        const existing = await db
          .select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.userId, userId))
          .limit(1);
        await syncSquareRepaymentHistory(userId);
        const advances = await listAdvancesWithSchedules(userId);
        const eligibility = buildEligibility(
          advances,
          existing[0]?.tierLevel ?? 1,
        );

        if (tier.level > eligibility.highestUnlockedTier) {
          const currentTier = getTierByLevel(eligibility.progressTier);
          return res.status(403).json({
            error: `Tier ${tier.level} is locked. Complete ${eligibility.remainingRepayments} more on-time ${currentTier?.name ?? `Tier ${eligibility.progressTier}`} cushion repayment${eligibility.remainingRepayments === 1 ? "" : "s"} to unlock the next tier.`,
            eligibility,
          });
        }

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

        return res.status(200).json({
          success: true,
          message: `Tier ${tier.level} (${tier.name}) is active. Cushion limit: $${tier.maxCushionLimit.toFixed(2)}.`,
          subscription,
          tier,
          eligibility,
        });
      } catch (error) {
        console.error("Pocket Booster activate error:", error);
        return res
          .status(500)
          .json({ error: "Failed to activate subscription tier." });
      }
    },
  );

  // Route: application form + Square payment scheduling autopilot
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
        const user = currentUser(req);
        const userId = user.id;

        // 1. Verify user's max tier limits from the database
        const subscription = await getActiveSubscription(userId);
        if (!subscription) {
          return res
            .status(400)
            .json({ error: "No active subscription found." });
        }

        await syncSquareRepaymentHistory(userId);
        const [openAdvance] = await db
          .select({ id: cashAdvances.id })
          .from(cashAdvances)
          .where(
            and(
              eq(cashAdvances.userId, userId),
              eq(cashAdvances.status, "active"),
            ),
          )
          .limit(1);
        if (openAdvance) {
          return res.status(400).json({
            error:
              "Repay your current cushion before requesting the next one. Each completed on-time cushion builds your tier trust.",
          });
        }

        const maxLimit = parseFloat(subscription.maxCushionLimit);
        if (amountRequested > maxLimit) {
          return res.status(400).json({
            error: `Amount exceeds your tier limit of $${maxLimit.toFixed(2)}`,
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

        // 1b. Cushion Disbursal — when P2P capital is in the reserve vault,
        // draw from it for instant liquidity. If the vault has never been
        // funded (available = 0), fall back to subscription-powered access.
        // If the vault is partially funded but too small for this request,
        // reject so cushions stay fully reserved.
        const vaultAvailable = await getVaultAvailableCapital();
        if (vaultAvailable > 0) {
          const vaultDebit = await debitVaultForCushion(amountRequested);
          if (!vaultDebit.ok) {
            return res.status(400).json({
              error: `Pocket Booster Reserve Vault has insufficient lending capital. Available: $${vaultAvailable.toFixed(2)}. Peer-to-peer investors fund this pool.`,
              availableLendingCapital: vaultAvailable,
            });
          }
        }

        // 2. Insert the active advance record
        const [newAdvance] = await db
          .insert(cashAdvances)
          .values({
            userId,
            tierLevel: subscription.tierLevel,
            amountBorrowed: amountRequested.toFixed(2),
            repaymentType: repaymentChoice,
            status: "active",
          })
          .returning();

        // 3. Automated Checkbox Logic Engine tailored for Square
        const dbSchedules = await buildRepaymentSchedules({
          advanceId: newAdvance.id,
          userId,
          amountRequested,
          repaymentChoice,
          nextPayday: parsePayday,
          customSplitCount,
        });

        // Square Automation: create scheduled invoices / card-on-file debits
        // matched to each payday calendar date.
        const squareResult = await queueSquareRepaymentInvoices({
          user,
          schedules: dbSchedules,
          repaymentChoice,
        });

        return res.status(200).json({
          success: true,
          message:
            "Cushion approved. Square repayment processing schedules are locked and fully automated.",
          advance: newAdvance,
          schedules: squareResult.schedules,
          squareQueued: squareResult.squareQueued,
          automaticPayments: squareResult.automaticPayments,
        });
      } catch (error) {
        console.error("Square Autopilot Engine Error:", error);
        const detail =
          error instanceof Error ? error.message : "Unknown Square error";
        return res.status(500).json({
          error: "Internal processing engine failure.",
          detail,
        });
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
        const userId = currentUser(req).id;

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
