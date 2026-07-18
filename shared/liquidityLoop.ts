import { z } from "zod";

/** Annual yield paid to P2P investors from Pocket Booster subscription revenue */
export const P2P_ANNUAL_YIELD_RATE = 0.085;

/** Allowed peer-to-peer investment ticket sizes (USD) */
export const P2P_INVESTMENT_AMOUNTS = [100, 500, 1000] as const;

export type P2PInvestmentAmount = (typeof P2P_INVESTMENT_AMOUNTS)[number];

export const P2P_PROJECT_TAG = "POCKET_BOOSTER_RESERVE" as const;

/**
 * Daily compound factor for 8.5% APR compounded daily.
 * Effective daily rate = (1 + r)^(1/365) - 1
 */
export function dailyCompoundRate(
  annualRate: number = P2P_ANNUAL_YIELD_RATE,
): number {
  return Math.pow(1 + annualRate, 1 / 365) - 1;
}

/** Accrue compound daily interest for `days` on principal (USD). */
export function compoundDailyInterest(
  principal: number,
  days: number,
  annualRate: number = P2P_ANNUAL_YIELD_RATE,
): number {
  if (principal <= 0 || days <= 0) return 0;
  const factor = Math.pow(1 + dailyCompoundRate(annualRate), days);
  return principal * (factor - 1);
}

export const bridgeP2pSchema = z.object({
  investmentAmount: z.union([
    z.literal(100),
    z.literal(500),
    z.literal(1000),
  ]),
});

export type BridgeP2pInput = z.infer<typeof bridgeP2pSchema>;
