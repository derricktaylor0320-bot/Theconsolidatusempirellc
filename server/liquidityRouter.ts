import type { Express, Request, Response } from "express";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { requireAuth, requireOwner } from "./auth";
import type { User } from "@shared/schema";
import {
  pocketBoosterVault,
  projectLedger,
  userInvestments,
  userSubscriptions,
  yieldPayouts,
  type UserInvestment,
} from "@shared/schema";
import {
  P2P_ANNUAL_YIELD_RATE,
  P2P_INVESTMENT_AMOUNTS,
  P2P_PROJECT_TAG,
  bridgeP2pSchema,
  compoundDailyInterest,
} from "@shared/liquidityLoop";

function currentUser(req: Request): User {
  return req.user as User;
}

function money(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

/** Sum of available lending capital across the Pocket Booster reserve vault. */
export async function getVaultAvailableCapital(): Promise<number> {
  const [row] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${pocketBoosterVault.availableLendingCapital}), 0)`,
    })
    .from(pocketBoosterVault);
  return parseFloat(row?.total ?? "0");
}

/**
 * Debit available vault capital for an approved cushion.
 * Draws proportionally from vault rows with remaining capital (FIFO by createdAt).
 * Returns false if the vault cannot cover the amount.
 */
export async function debitVaultForCushion(
  amount: number,
): Promise<{ ok: true } | { ok: false; available: number }> {
  const available = await getVaultAvailableCapital();
  if (amount > available + 0.001) {
    return { ok: false, available };
  }

  let remaining = amount;
  const rows = await db
    .select()
    .from(pocketBoosterVault)
    .where(sql`${pocketBoosterVault.availableLendingCapital} > 0`)
    .orderBy(asc(pocketBoosterVault.createdAt));

  for (const row of rows) {
    if (remaining <= 0) break;
    const rowAvail = parseFloat(row.availableLendingCapital);
    if (rowAvail <= 0) continue;
    const take = Math.min(rowAvail, remaining);
    const next = rowAvail - take;
    await db
      .update(pocketBoosterVault)
      .set({
        availableLendingCapital: money(next),
        updatedAt: new Date(),
      })
      .where(eq(pocketBoosterVault.id, row.id));
    remaining -= take;
  }

  return { ok: true };
}

/** Restore vault capital when a cushion is repaid (future repayment hooks). */
export async function creditVaultCapital(amount: number): Promise<void> {
  if (amount <= 0) return;
  // Credit the oldest vault row that still has room under its contribution,
  // otherwise the most recent contribution.
  const rows = await db
    .select()
    .from(pocketBoosterVault)
    .orderBy(asc(pocketBoosterVault.createdAt));

  let remaining = amount;
  for (const row of rows) {
    if (remaining <= 0) break;
    const contrib = parseFloat(row.totalVaultContribution);
    const avail = parseFloat(row.availableLendingCapital);
    const room = Math.max(0, contrib - avail);
    if (room <= 0) continue;
    const add = Math.min(room, remaining);
    await db
      .update(pocketBoosterVault)
      .set({
        availableLendingCapital: money(avail + add),
        updatedAt: new Date(),
      })
      .where(eq(pocketBoosterVault.id, row.id));
    remaining -= add;
  }

  // Overflow (repayments exceeding drawn capital) goes to the newest vault row.
  if (remaining > 0 && rows.length > 0) {
    const newest = rows[rows.length - 1];
    const avail = parseFloat(newest.availableLendingCapital);
    await db
      .update(pocketBoosterVault)
      .set({
        availableLendingCapital: money(avail + remaining),
        updatedAt: new Date(),
      })
      .where(eq(pocketBoosterVault.id, newest.id));
  }
}

/**
 * Accrue daily-compounding 8.5% yield on active investments and pay it from
 * the subscription revenue pool (sum of active monthly subscription fees).
 */
export async function distributeSubscriptionYield(): Promise<{
  accruedTotal: number;
  paidTotal: number;
  subscriptionPool: number;
  investmentsTouched: number;
}> {
  const [poolRow] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${userSubscriptions.monthlySubscription}), 0)`,
    })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.subscriptionStatus, "active"));

  let subscriptionPool = parseFloat(poolRow?.total ?? "0");

  const active = await db
    .select()
    .from(userInvestments)
    .where(eq(userInvestments.status, "ACTIVE"))
    .orderBy(asc(userInvestments.createdAt));

  const now = new Date();
  let accruedTotal = 0;
  let paidTotal = 0;
  let investmentsTouched = 0;

  for (const inv of active) {
    const principal = parseFloat(inv.amountAllocated);
    const rate = parseFloat(inv.yieldRate || String(P2P_ANNUAL_YIELD_RATE));
    const last = inv.lastYieldAt ?? inv.createdAt ?? now;
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.floor((now.getTime() - new Date(last).getTime()) / msPerDay);
    if (days < 1) continue;

    const interest = compoundDailyInterest(principal, days, rate);
    if (interest <= 0) continue;

    investmentsTouched += 1;
    accruedTotal += interest;

    const prevAccrued = parseFloat(inv.accruedYield || "0");
    const prevPaid = parseFloat(inv.paidYield || "0");

    // Pay what the subscription pool can cover; leave the rest accrued.
    const payable = Math.min(interest, subscriptionPool);
    const unpaid = interest - payable;

    await db
      .update(userInvestments)
      .set({
        accruedYield: money(prevAccrued + unpaid, 4),
        paidYield: money(prevPaid + payable, 4),
        lastYieldAt: now,
      })
      .where(eq(userInvestments.id, inv.id));

    if (payable > 0) {
      subscriptionPool -= payable;
      paidTotal += payable;
      await db.insert(yieldPayouts).values({
        investmentId: inv.id,
        userId: inv.userId,
        amount: money(payable, 4),
        source: "SUBSCRIPTION_REVENUE",
        description: `Daily-compound yield (${(rate * 100).toFixed(1)}% APR) for ${days} day(s) funded by Pocket Booster subscription fees.`,
      });
    }
  }

  return {
    accruedTotal,
    paidTotal,
    subscriptionPool,
    investmentsTouched,
  };
}

async function listInvestmentsForUser(userId: string): Promise<UserInvestment[]> {
  return db
    .select()
    .from(userInvestments)
    .where(eq(userInvestments.userId, userId))
    .orderBy(desc(userInvestments.createdAt));
}

/**
 * Liquidity Routing Engine — bridges P2P investor capital into the
 * Pocket Booster Instant-Disbursal Reserve Vault, and routes subscription
 * revenue back as 8.5% compounding daily yield.
 */
export function registerLiquidityRoutes(app: Express): void {
  // Public vault snapshot (how much cushion liquidity is on hand)
  app.get("/api/liquidity/vault", async (_req, res) => {
    try {
      const [totals] = await db
        .select({
          contributed: sql<string>`COALESCE(SUM(${pocketBoosterVault.totalVaultContribution}), 0)`,
          available: sql<string>`COALESCE(SUM(${pocketBoosterVault.availableLendingCapital}), 0)`,
          positions: sql<string>`COUNT(*)::text`,
        })
        .from(pocketBoosterVault);

      res.json({
        projectTag: P2P_PROJECT_TAG,
        annualYieldRate: P2P_ANNUAL_YIELD_RATE,
        allowedInvestmentAmounts: P2P_INVESTMENT_AMOUNTS,
        totalVaultContribution: parseFloat(totals?.contributed ?? "0"),
        availableLendingCapital: parseFloat(totals?.available ?? "0"),
        activePositions: parseInt(totals?.positions ?? "0", 10),
      });
    } catch (error) {
      console.error("Vault snapshot error:", error);
      res.status(500).json({ error: "Failed to load vault snapshot." });
    }
  });

  // Investor back-office: positions, ledger, yield history
  app.get(
    "/api/liquidity/me",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = currentUser(req).id;
        const investments = await listInvestmentsForUser(userId);

        const withDetails = await Promise.all(
          investments.map(async (inv) => {
            const [vault] = await db
              .select()
              .from(pocketBoosterVault)
              .where(eq(pocketBoosterVault.investmentId, inv.id))
              .limit(1);
            const ledger = await db
              .select()
              .from(projectLedger)
              .where(eq(projectLedger.investmentId, inv.id))
              .orderBy(desc(projectLedger.createdAt));
            const payouts = await db
              .select()
              .from(yieldPayouts)
              .where(eq(yieldPayouts.investmentId, inv.id))
              .orderBy(desc(yieldPayouts.createdAt))
              .limit(20);
            return { ...inv, vault: vault ?? null, ledger, payouts };
          }),
        );

        const totalAllocated = withDetails.reduce(
          (s, i) => s + parseFloat(i.amountAllocated),
          0,
        );
        const totalPaidYield = withDetails.reduce(
          (s, i) => s + parseFloat(i.paidYield || "0"),
          0,
        );

        res.json({
          investments: withDetails,
          totals: {
            allocated: totalAllocated,
            paidYield: totalPaidYield,
          },
          annualYieldRate: P2P_ANNUAL_YIELD_RATE,
          allowedInvestmentAmounts: P2P_INVESTMENT_AMOUNTS,
        });
      } catch (error) {
        console.error("Liquidity me error:", error);
        res.status(500).json({ error: "Failed to load investor portfolio." });
      }
    },
  );

  /**
   * ROUTE: Tie P2P Investment Directly to Pocket Booster Reserve
   * Automatically allocates incoming peer-to-peer funds to strengthen the microloan pool
   */
  app.post(
    "/api/liquidity/bridge-p2p-to-booster",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const parsed = bridgeP2pSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            error:
              parsed.error.errors[0]?.message ||
              "Investment amount must be $100, $500, or $1,000.",
          });
        }

        const investorId = currentUser(req).id;
        const investmentAmount = parsed.data.investmentAmount;
        const amountStr = money(investmentAmount);

        // 1. Log the investment in the Peer-to-Peer Ledger
        const [p2pRecord] = await db
          .insert(userInvestments)
          .values({
            userId: investorId,
            amountAllocated: amountStr,
            projectTag: P2P_PROJECT_TAG,
            yieldRate: money(P2P_ANNUAL_YIELD_RATE, 4),
            status: "ACTIVE",
            lastYieldAt: new Date(),
          })
          .returning();

        const investmentId = p2pRecord.id;

        // 2. Tying it to Pocket Booster: Inject 100% of this capital into the active microloan liquidity vault
        await db.insert(pocketBoosterVault).values({
          investmentId,
          totalVaultContribution: amountStr,
          availableLendingCapital: amountStr,
        });

        // 3. Update the Central Project Ledger so the investor can see exactly where it went in their back office
        await db.insert(projectLedger).values({
          investmentId,
          operationsSpend: amountStr,
          description:
            "100% allocated to the Pocket Booster Instant-Disbursal Reserve Vault to back interest-free member cushions.",
        });

        // 4. Trigger Automated Text/Dashboard Notification
        console.log(
          `[SYSTEM AUTOMATION]: Investor ${investorId} capital bridged directly to Pocket Booster Lending Vault.`,
        );

        return res.status(200).json({
          success: true,
          message:
            "Peer-to-peer investment successfully tied to Pocket Booster. Vault capital has been instantly expanded.",
          backOfficeVerification:
            "100% of your capital is active in the Pocket Booster Reserve Vault.",
          investment: p2pRecord,
          investmentId,
        });
      } catch (error) {
        console.error("Liquidity Vault Bridging Error:", error);
        return res.status(500).json({
          error:
            "Failed to route P2P capital into the Pocket Booster ecosystem.",
        });
      }
    },
  );

  /**
   * Accrue & pay 8.5% compounding daily interest from the subscription fee pool.
   * Owner-triggered (or cron) — uses active members' monthly subscription totals
   * as the yield funding source.
   */
  app.post(
    "/api/liquidity/distribute-yield",
    requireAuth,
    requireOwner,
    async (_req: Request, res: Response) => {
      try {
        const result = await distributeSubscriptionYield();
        return res.status(200).json({
          success: true,
          message:
            "Subscription revenue routed to P2P investor yield (8.5% APR, daily compound).",
          ...result,
        });
      } catch (error) {
        console.error("Yield distribution error:", error);
        return res.status(500).json({
          error: "Failed to distribute subscription-funded yield.",
        });
      }
    },
  );

  // Authenticated members can also request a personal accrual preview / soft
  // of accrued-but-unpaid yield without requiring owner (no payout, just math).
  app.post(
    "/api/liquidity/accrue-my-yield",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = currentUser(req).id;
        const now = new Date();
        const mine = await db
          .select()
          .from(userInvestments)
          .where(
            and(
              eq(userInvestments.userId, userId),
              eq(userInvestments.status, "ACTIVE"),
            ),
          );

        let pendingInterest = 0;
        for (const inv of mine) {
          const principal = parseFloat(inv.amountAllocated);
          const rate = parseFloat(inv.yieldRate || String(P2P_ANNUAL_YIELD_RATE));
          const last = inv.lastYieldAt ?? inv.createdAt ?? now;
          const days = Math.floor(
            (now.getTime() - new Date(last).getTime()) / (24 * 60 * 60 * 1000),
          );
          pendingInterest += compoundDailyInterest(principal, days, rate);
        }

        res.json({
          pendingInterest,
          accruedUnpaid: mine.reduce(
            (s, i) => s + parseFloat(i.accruedYield || "0"),
            0,
          ),
          paidYield: mine.reduce(
            (s, i) => s + parseFloat(i.paidYield || "0"),
            0,
          ),
          annualYieldRate: P2P_ANNUAL_YIELD_RATE,
        });
      } catch (error) {
        console.error("Accrue-my-yield error:", error);
        res.status(500).json({ error: "Failed to calculate pending yield." });
      }
    },
  );
}
