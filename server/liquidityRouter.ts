import type { Express, Request, Response } from "express";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "./db";
import { requireAuth, requireOwner } from "./auth";
import type { User } from "@shared/schema";
import {
  companyEquity,
  investmentNotifications,
  pocketBoosterVault,
  projectLedger,
  projectYieldConfigs,
  userInvestments,
  userSubscriptions,
  yieldPayouts,
  type UserInvestment,
} from "@shared/schema";
import {
  CORE_LLC_MEMBERS,
  HUB_INVESTMENT_PROGRAMS,
  P2P_ANNUAL_YIELD_RATE,
  P2P_INVESTMENT_AMOUNTS,
  P2P_PROJECT_TAG,
  RPU_COMPLIANCE_STATUS,
  RPU_INSTRUMENT_TYPE,
  RPU_LEGAL_DISCLAIMER,
  RPU_LOCK_PERIOD_DAYS,
  bridgeP2pSchema,
  canonicalizeProjectTag,
  compoundDailyBankers,
  compoundDailyInterest,
  getProgramByTag,
  issueParticipationUnitsSchema,
  openInvestmentPrograms,
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
 * Draws from vault rows with remaining capital (FIFO by createdAt).
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

async function notifyInvestor(params: {
  userId: string;
  investmentId: string;
  projectTag: string;
  title: string;
  body: string;
}): Promise<void> {
  await db.insert(investmentNotifications).values({
    userId: params.userId,
    investmentId: params.investmentId,
    projectTag: params.projectTag,
    title: params.title,
    body: params.body,
  });
}

/**
 * Accrue daily-compounding yield on active investments and pay it from
 * the Pocket Booster subscription revenue pool (Empire internal banking loop).
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
    const days = Math.floor(
      (now.getTime() - new Date(last).getTime()) / msPerDay,
    );
    if (days < 1) continue;

    const interest = compoundDailyInterest(principal, days, rate);
    if (interest <= 0) continue;

    investmentsTouched += 1;
    accruedTotal += interest;

    const prevAccrued = parseFloat(inv.accruedYield || "0");
    const prevPaid = parseFloat(inv.paidYield || "0");
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
      const program = getProgramByTag(inv.projectTag);
      await db.insert(yieldPayouts).values({
        investmentId: inv.id,
        userId: inv.userId,
        amount: money(payable, 4),
        source: "SUBSCRIPTION_REVENUE",
        description: `Daily-compound yield (${(rate * 100).toFixed(1)}% APR) for ${days} day(s) on ${program?.shortName ?? inv.projectTag}, funded by hub program revenue.`,
      });
      await notifyInvestor({
        userId: inv.userId,
        investmentId: inv.id,
        projectTag: inv.projectTag,
        title: "Yield paid to your account",
        body: `$${payable.toFixed(4)} yield credited from ${program?.name ?? inv.projectTag}. Your money is working — no stock market required.`,
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
 * Partnership shield — confirm foundational LLC equity is present and untouched.
 * RPU issuance never writes to company_equity.
 */
async function assertCoreEquityShield(): Promise<{
  members: string[];
  coreEquityUntouched: true;
}> {
  const rows = await db
    .select({
      memberName: companyEquity.memberName,
      equityPercentage: companyEquity.equityPercentage,
      isFoundational: companyEquity.isFoundational,
    })
    .from(companyEquity)
    .where(eq(companyEquity.isFoundational, true));

  const lockedNames = new Set(
    rows
      .filter((r) => r.equityPercentage === "FOUNDATIONAL_LOCKED")
      .map((r) => r.memberName),
  );

  const missing = CORE_LLC_MEMBERS.filter((name) => !lockedNames.has(name));
  if (missing.length > 0) {
    throw Object.assign(
      new Error(
        `Core LLC equity shield failed — missing foundational member lock: ${missing.join(", ")}.`,
      ),
      { status: 500 },
    );
  }

  console.log(
    `[COMPLIANCE CHECK] Core LLC equity remains safely locked across ${CORE_LLC_MEMBERS.length} foundational members.`,
  );

  return {
    members: [...CORE_LLC_MEMBERS],
    coreEquityUntouched: true,
  };
}

export type RpuComplianceDetails = {
  investmentId: string;
  allocatedUnits: number;
  allocatedPool: string;
  lockPeriodDays: number;
  hasVotingRights: false;
  instrumentType: typeof RPU_INSTRUMENT_TYPE;
  annualYieldRate: number;
  legalDisclaimer: string;
  coreEquityUntouched: true;
  foundationalMembers: readonly string[];
};

/**
 * Bridge capital into a hub investment program as Revenue Participation Units.
 * Issues non-voting utility units (1 unit = $1). Never allocates corporate shares.
 * Pocket Booster also expands the lending vault; all programs write ledger + notify.
 */
async function bridgeInvestment(params: {
  investorId: string;
  investmentAmount: number;
  projectTag: string;
}): Promise<{
  investment: UserInvestment;
  programName: string;
  backOfficeVerification: string;
  message: string;
  complianceStatus: typeof RPU_COMPLIANCE_STATUS;
  details: RpuComplianceDetails;
}> {
  // 1. Double-check core partnership shield before any unit issuance
  const equityShield = await assertCoreEquityShield();

  const program = getProgramByTag(params.projectTag);
  if (!program) {
    throw Object.assign(new Error("Unknown investment program."), {
      status: 400,
    });
  }
  if (program.status !== "open") {
    throw Object.assign(
      new Error(
        `${program.name} is launching soon. Watch the hub for the real estate & property open.`,
      ),
      { status: 400 },
    );
  }

  const amountStr = money(params.investmentAmount);
  // 1 Unit = $1.00 USD contribution — non-voting project utility milestones
  const unitsAllocated = params.investmentAmount;
  const unitsStr = money(unitsAllocated);
  // Annual APR (compounded daily) — never treat 0.085 as a daily rate
  const yieldRate = money(program.annualYieldRate, 4);

  const [p2pRecord] = await db
    .insert(userInvestments)
    .values({
      userId: params.investorId,
      amountAllocated: amountStr,
      unitsCount: unitsStr,
      projectTag: program.tag,
      yieldRate,
      lockPeriodDays: RPU_LOCK_PERIOD_DAYS,
      hasVotingRights: false,
      instrumentType: RPU_INSTRUMENT_TYPE,
      status: "ACTIVE",
      lastYieldAt: new Date(),
    })
    .returning();

  const investmentId = p2pRecord.id;

  if (program.fundsPocketBoosterVault) {
    await db.insert(pocketBoosterVault).values({
      investmentId,
      totalVaultContribution: amountStr,
      availableLendingCapital: amountStr,
    });
  }

  await db.insert(projectLedger).values({
    investmentId,
    operationsSpend: amountStr,
    description: program.ledgerDescription,
  });

  const notificationBody = `Your $${params.investmentAmount.toFixed(0)} (${unitsAllocated.toFixed(0)} Revenue Participation Units) is now active in ${program.name}. ${program.allocationSummary}. Target yield: ${(program.annualYieldRate * 100).toFixed(1)}% APR compounding daily. ${RPU_LOCK_PERIOD_DAYS}-day liquidity lock. Non-equity — zero voting rights.`;

  await notifyInvestor({
    userId: params.investorId,
    investmentId,
    projectTag: program.tag,
    title: `Revenue Participation Units issued — ${program.shortName}`,
    body: notificationBody,
  });

  console.log(
    `[COMPLIANCE ENGINE]: Investor ${params.investorId} issued ${unitsAllocated} RPUs into ${program.tag} ($${params.investmentAmount}). has_voting_rights=false.`,
  );

  return {
    investment: p2pRecord,
    programName: program.name,
    backOfficeVerification: program.allocationSummary,
    message:
      "Revenue Participation Units successfully issued. Your capital is locked to the selected project only — it does not touch founder LLC shares or voting equity.",
    complianceStatus: RPU_COMPLIANCE_STATUS,
    details: {
      investmentId,
      allocatedUnits: unitsAllocated,
      allocatedPool: program.tag,
      lockPeriodDays: RPU_LOCK_PERIOD_DAYS,
      hasVotingRights: false,
      instrumentType: RPU_INSTRUMENT_TYPE,
      annualYieldRate: program.annualYieldRate,
      legalDisclaimer: RPU_LEGAL_DISCLAIMER,
      coreEquityUntouched: equityShield.coreEquityUntouched,
      foundationalMembers: CORE_LLC_MEMBERS,
    },
  };
}

/**
 * Liquidity Routing Engine — multi-program hub investing under
 * The Consolidatus Empire umbrella (Pocket Booster, FR2P, Apparel, Real Estate…).
 */
export function registerLiquidityRoutes(app: Express): void {
  // Catalog of investable hub programs (public)
  app.get("/api/liquidity/programs", (_req, res) => {
    res.json({
      programs: HUB_INVESTMENT_PROGRAMS,
      allowedInvestmentAmounts: P2P_INVESTMENT_AMOUNTS,
      openPrograms: openInvestmentPrograms().map((p) => p.tag),
    });
  });

  // Public five-pillar yield config catalog
  app.get("/api/liquidity/yield-configs", async (_req, res) => {
    try {
      const rows = await db.select().from(projectYieldConfigs);
      res.json({
        complianceProtocol: "REVENUE_PARTICIPATION_UNITS_ONLY",
        configs: rows,
      });
    } catch (error) {
      console.error("Yield configs error:", error);
      res.status(500).json({ error: "Failed to load project yield configs." });
    }
  });

  /**
   * Core route: calculate investor daily compounding yield per pillar.
   * Investors may only request their own userId; owners may inspect any.
   */
  app.get(
    "/api/liquidity/calculate-investor-yield/:userId",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const me = currentUser(req);
        const ownerAllowlist = (process.env.OWNER_EMAILS || "")
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);
        const isOwner =
          ownerAllowlist.length === 0 ||
          ownerAllowlist.includes((me.email || "").toLowerCase());
        if (me.id !== userId && !isOwner) {
          return res.status(403).json({
            error: "You can only view your own yield calculations.",
          });
        }

        const investments = await db
          .select({
            id: userInvestments.id,
            projectTag: userInvestments.projectTag,
            dollarValue: userInvestments.amountAllocated,
            createdAt: userInvestments.createdAt,
            projectName: projectYieldConfigs.projectName,
            annualYieldRate: projectYieldConfigs.annualYieldRate,
            backingAssetDescription:
              projectYieldConfigs.backingAssetDescription,
          })
          .from(userInvestments)
          .innerJoin(
            projectYieldConfigs,
            eq(
              userInvestments.projectTag,
              projectYieldConfigs.projectTag,
            ),
          )
          .where(
            and(
              eq(userInvestments.userId, userId),
              eq(userInvestments.status, "ACTIVE"),
            ),
          );

        // Also resolve any leftover legacy tags that weren't migrated yet
        const legacyInvestments =
          investments.length === 0
            ? await db
                .select()
                .from(userInvestments)
                .where(
                  and(
                    eq(userInvestments.userId, userId),
                    eq(userInvestments.status, "ACTIVE"),
                  ),
                )
            : [];

        const assetRows =
          investments.length > 0
            ? investments
            : legacyInvestments.map((inv) => {
                const program = getProgramByTag(inv.projectTag);
                return {
                  id: inv.id,
                  projectTag: canonicalizeProjectTag(inv.projectTag),
                  dollarValue: inv.amountAllocated,
                  createdAt: inv.createdAt,
                  projectName: program?.name ?? inv.projectTag,
                  annualYieldRate: money(
                    program?.annualYieldRate ?? 0,
                    4,
                  ),
                  backingAssetDescription:
                    program?.backingAssetDescription ?? null,
                };
              });

        if (assetRows.length === 0) {
          return res.status(200).json({
            success: true,
            message: "No active investments found.",
            complianceProtocol: "REVENUE_PARTICIPATION_UNITS_ONLY",
            investorId: userId,
            assets: [],
          });
        }

        const updatedAssets = assetRows.map((asset) => {
          const principal = parseFloat(asset.dollarValue);
          const annualRate = parseFloat(asset.annualYieldRate);
          const dateInvested = asset.createdAt
            ? new Date(asset.createdAt)
            : new Date();
          const timeDifference = Date.now() - dateInvested.getTime();
          const daysActive = Math.max(
            1,
            Math.floor(timeDifference / (1000 * 3600 * 24)),
          );
          const totalEarnings = compoundDailyBankers(
            principal,
            daysActive,
            annualRate,
          );
          const currentValue = principal + totalEarnings;

          return {
            investmentId: asset.id,
            pillarTag: asset.projectTag,
            pillarName: asset.projectName,
            backingAssetDescription: asset.backingAssetDescription,
            annualPercentage: `${(annualRate * 100).toFixed(1)}%`,
            daysCompounding: daysActive,
            initialPrincipal: principal.toFixed(2),
            currentValue: currentValue.toFixed(2),
            totalEarnings: totalEarnings.toFixed(2),
          };
        });

        return res.status(200).json({
          success: true,
          complianceProtocol: "REVENUE_PARTICIPATION_UNITS_ONLY",
          investorId: userId,
          assets: updatedAssets,
        });
      } catch (error) {
        console.error("Yield Calculation Failure:", error);
        return res.status(500).json({
          error: "Failed to securely calculate live asset-backed returns.",
        });
      }
    },
  );

  // Public vault snapshot (Pocket Booster lending liquidity)
  app.get("/api/liquidity/vault", async (_req, res) => {
    try {
      const [totals] = await db
        .select({
          contributed: sql<string>`COALESCE(SUM(${pocketBoosterVault.totalVaultContribution}), 0)`,
          available: sql<string>`COALESCE(SUM(${pocketBoosterVault.availableLendingCapital}), 0)`,
          positions: sql<string>`COUNT(*)::text`,
        })
        .from(pocketBoosterVault);

      const byProgram = await db
        .select({
          projectTag: userInvestments.projectTag,
          allocated: sql<string>`COALESCE(SUM(${userInvestments.amountAllocated}), 0)`,
          positions: sql<string>`COUNT(*)::text`,
        })
        .from(userInvestments)
        .where(eq(userInvestments.status, "ACTIVE"))
        .groupBy(userInvestments.projectTag);

      res.json({
        projectTag: P2P_PROJECT_TAG,
        annualYieldRate: P2P_ANNUAL_YIELD_RATE,
        allowedInvestmentAmounts: P2P_INVESTMENT_AMOUNTS,
        totalVaultContribution: parseFloat(totals?.contributed ?? "0"),
        availableLendingCapital: parseFloat(totals?.available ?? "0"),
        activePositions: parseInt(totals?.positions ?? "0", 10),
        byProgram: byProgram.map((row) => ({
          projectTag: row.projectTag,
          allocated: parseFloat(row.allocated ?? "0"),
          positions: parseInt(row.positions ?? "0", 10),
          program: getProgramByTag(row.projectTag) ?? null,
        })),
        programs: HUB_INVESTMENT_PROGRAMS,
      });
    } catch (error) {
      console.error("Vault snapshot error:", error);
      res.status(500).json({ error: "Failed to load vault snapshot." });
    }
  });

  // Investor back-office: positions, ledger, yield, notifications
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
            return {
              ...inv,
              program: getProgramByTag(inv.projectTag) ?? null,
              vault: vault ?? null,
              ledger,
              payouts,
            };
          }),
        );

        const notifications = await db
          .select()
          .from(investmentNotifications)
          .where(eq(investmentNotifications.userId, userId))
          .orderBy(desc(investmentNotifications.createdAt))
          .limit(30);

        const totalAllocated = withDetails.reduce(
          (s, i) => s + parseFloat(i.amountAllocated),
          0,
        );
        const totalPaidYield = withDetails.reduce(
          (s, i) => s + parseFloat(i.paidYield || "0"),
          0,
        );
        const unreadNotifications = notifications.filter((n) => !n.readAt)
          .length;

        res.json({
          investments: withDetails,
          notifications,
          unreadNotifications,
          totals: {
            allocated: totalAllocated,
            paidYield: totalPaidYield,
          },
          annualYieldRate: P2P_ANNUAL_YIELD_RATE,
          allowedInvestmentAmounts: P2P_INVESTMENT_AMOUNTS,
          programs: HUB_INVESTMENT_PROGRAMS,
        });
      } catch (error) {
        console.error("Liquidity me error:", error);
        res.status(500).json({ error: "Failed to load investor portfolio." });
      }
    },
  );

  // Notification inbox
  app.get(
    "/api/liquidity/notifications",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = currentUser(req).id;
        const rows = await db
          .select()
          .from(investmentNotifications)
          .where(eq(investmentNotifications.userId, userId))
          .orderBy(desc(investmentNotifications.createdAt))
          .limit(50);
        res.json({
          notifications: rows,
          unread: rows.filter((n) => !n.readAt).length,
        });
      } catch (error) {
        console.error("Notifications error:", error);
        res.status(500).json({ error: "Failed to load notifications." });
      }
    },
  );

  app.post(
    "/api/liquidity/notifications/read",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = currentUser(req).id;
        const id =
          typeof req.body?.id === "string" ? req.body.id : undefined;
        const now = new Date();

        if (id) {
          await db
            .update(investmentNotifications)
            .set({ readAt: now })
            .where(
              and(
                eq(investmentNotifications.id, id),
                eq(investmentNotifications.userId, userId),
              ),
            );
        } else {
          await db
            .update(investmentNotifications)
            .set({ readAt: now })
            .where(
              and(
                eq(investmentNotifications.userId, userId),
                isNull(investmentNotifications.readAt),
              ),
            );
        }

        res.json({ success: true });
      } catch (error) {
        console.error("Mark notifications read error:", error);
        res.status(500).json({ error: "Failed to update notifications." });
      }
    },
  );

  /**
   * Multi-program invest — bridge capital into any open hub venture.
   */
  app.post(
    "/api/liquidity/invest",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const parsed = bridgeP2pSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            error:
              parsed.error.errors[0]?.message ||
              "Investment amount must be $100, $250, $500, or $1,000.",
          });
        }

        const projectTag =
          parsed.data.projectTag?.trim() || P2P_PROJECT_TAG;
        const result = await bridgeInvestment({
          investorId: currentUser(req).id,
          investmentAmount: parsed.data.investmentAmount,
          projectTag,
        });

        return res.status(200).json({
          success: true,
          ...result,
          investmentId: result.investment.id,
        });
      } catch (error) {
        const status =
          error &&
          typeof error === "object" &&
          "status" in error &&
          typeof (error as { status: unknown }).status === "number"
            ? (error as { status: number }).status
            : 500;
        if (status === 400) {
          return res.status(400).json({
            error:
              error instanceof Error
                ? error.message
                : "Invalid investment request.",
          });
        }
        console.error("Hub investment bridging error:", error);
        return res.status(500).json({
          error:
            error instanceof Error &&
            error.message.includes("Core LLC equity shield")
              ? error.message
              : "Failed to securely process financial participation units.",
        });
      }
    },
  );

  /**
   * Compliance controller: Issue Revenue Participation Units.
   * Ensures NO corporate shares or voting equity are allocated to platform investors.
   */
  app.post(
    "/api/liquidity/issue-participation-units",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const parsed = issueParticipationUnitsSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            error:
              parsed.error.errors[0]?.message ||
              "Capital contribution must be $100, $250, $500, or $1,000.",
          });
        }

        const result = await bridgeInvestment({
          investorId: currentUser(req).id,
          investmentAmount: parsed.data.capitalContribution,
          projectTag: parsed.data.targetProjectPool,
        });

        return res.status(200).json({
          success: true,
          complianceStatus: result.complianceStatus,
          message: result.message,
          details: result.details,
          backOfficeVerification: result.backOfficeVerification,
          investment: result.investment,
          investmentId: result.investment.id,
        });
      } catch (error) {
        console.error("Compliance Engine Error:", error);
        const status =
          error &&
          typeof error === "object" &&
          "status" in error &&
          typeof (error as { status: unknown }).status === "number"
            ? (error as { status: number }).status
            : 500;
        if (status === 400) {
          return res.status(400).json({
            error:
              error instanceof Error
                ? error.message
                : "Invalid participation unit request.",
          });
        }
        return res.status(500).json({
          error:
            error instanceof Error &&
            error.message.includes("Core LLC equity shield")
              ? error.message
              : "Failed to securely process financial participation units.",
        });
      }
    },
  );

  /**
   * Legacy route: Tie P2P Investment Directly to Pocket Booster Reserve
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
              "Investment amount must be $100, $250, $500, or $1,000.",
          });
        }

        const result = await bridgeInvestment({
          investorId: currentUser(req).id,
          investmentAmount: parsed.data.investmentAmount,
          projectTag: P2P_PROJECT_TAG,
        });

        return res.status(200).json({
          success: true,
          complianceStatus: result.complianceStatus,
          message: result.message,
          details: result.details,
          backOfficeVerification: result.backOfficeVerification,
          investment: result.investment,
          investmentId: result.investment.id,
        });
      } catch (error) {
        console.error("Liquidity Vault Bridging Error:", error);
        return res.status(500).json({
          error:
            "Failed to securely process financial participation units.",
        });
      }
    },
  );

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
            "Hub program revenue routed to investor yield (daily compound).",
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
          const rate = parseFloat(
            inv.yieldRate || String(P2P_ANNUAL_YIELD_RATE),
          );
          const last = inv.lastYieldAt ?? inv.createdAt ?? now;
          const days = Math.floor(
            (now.getTime() - new Date(last).getTime()) /
              (24 * 60 * 60 * 1000),
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
