// State-based sales tax for checkout. The buyer picks the state their order
// ships to BEFORE we create the Square-hosted checkout (Square only collects
// the address during its own checkout page — too late to add tax), and the
// server adds an order-level percentage tax so Square computes and charges it.
//
// Rates are the state-level sales tax rates (no local/county add-ons). The
// canonical list lives here so the client estimate and the server-authoritative
// charge always agree. Five states charge no state sales tax (AK, DE, MT, NH,
// OR) — no tax line is added for them.

export interface StateTaxInfo {
  code: string;
  name: string;
  /** State sales tax rate as a percentage, e.g. 6.25 for 6.25%. */
  ratePercent: number;
}

export const STATE_SALES_TAX: readonly StateTaxInfo[] = [
  { code: "AL", name: "Alabama", ratePercent: 4 },
  { code: "AK", name: "Alaska", ratePercent: 0 },
  { code: "AZ", name: "Arizona", ratePercent: 5.6 },
  { code: "AR", name: "Arkansas", ratePercent: 6.5 },
  { code: "CA", name: "California", ratePercent: 7.25 },
  { code: "CO", name: "Colorado", ratePercent: 2.9 },
  { code: "CT", name: "Connecticut", ratePercent: 6.35 },
  { code: "DE", name: "Delaware", ratePercent: 0 },
  { code: "DC", name: "District of Columbia", ratePercent: 6 },
  { code: "FL", name: "Florida", ratePercent: 6 },
  { code: "GA", name: "Georgia", ratePercent: 4 },
  { code: "HI", name: "Hawaii", ratePercent: 4 },
  { code: "ID", name: "Idaho", ratePercent: 6 },
  { code: "IL", name: "Illinois", ratePercent: 6.25 },
  { code: "IN", name: "Indiana", ratePercent: 7 },
  { code: "IA", name: "Iowa", ratePercent: 6 },
  { code: "KS", name: "Kansas", ratePercent: 6.5 },
  { code: "KY", name: "Kentucky", ratePercent: 6 },
  { code: "LA", name: "Louisiana", ratePercent: 5 },
  { code: "ME", name: "Maine", ratePercent: 5.5 },
  { code: "MD", name: "Maryland", ratePercent: 6 },
  { code: "MA", name: "Massachusetts", ratePercent: 6.25 },
  { code: "MI", name: "Michigan", ratePercent: 6 },
  { code: "MN", name: "Minnesota", ratePercent: 6.875 },
  { code: "MS", name: "Mississippi", ratePercent: 7 },
  { code: "MO", name: "Missouri", ratePercent: 4.225 },
  { code: "MT", name: "Montana", ratePercent: 0 },
  { code: "NE", name: "Nebraska", ratePercent: 5.5 },
  { code: "NV", name: "Nevada", ratePercent: 6.85 },
  { code: "NH", name: "New Hampshire", ratePercent: 0 },
  { code: "NJ", name: "New Jersey", ratePercent: 6.625 },
  { code: "NM", name: "New Mexico", ratePercent: 4.875 },
  { code: "NY", name: "New York", ratePercent: 4 },
  { code: "NC", name: "North Carolina", ratePercent: 4.75 },
  { code: "ND", name: "North Dakota", ratePercent: 5 },
  { code: "OH", name: "Ohio", ratePercent: 5.75 },
  { code: "OK", name: "Oklahoma", ratePercent: 4.5 },
  { code: "OR", name: "Oregon", ratePercent: 0 },
  { code: "PA", name: "Pennsylvania", ratePercent: 6 },
  { code: "RI", name: "Rhode Island", ratePercent: 7 },
  { code: "SC", name: "South Carolina", ratePercent: 6 },
  { code: "SD", name: "South Dakota", ratePercent: 4.2 },
  { code: "TN", name: "Tennessee", ratePercent: 7 },
  { code: "TX", name: "Texas", ratePercent: 6.25 },
  { code: "UT", name: "Utah", ratePercent: 6.1 },
  { code: "VT", name: "Vermont", ratePercent: 6 },
  { code: "VA", name: "Virginia", ratePercent: 5.3 },
  { code: "WA", name: "Washington", ratePercent: 6.5 },
  { code: "WV", name: "West Virginia", ratePercent: 6 },
  { code: "WI", name: "Wisconsin", ratePercent: 5 },
  { code: "WY", name: "Wyoming", ratePercent: 4 },
] as const;

const BY_CODE = new Map(STATE_SALES_TAX.map((s) => [s.code, s]));

/** Looks up a state by its 2-letter code (case-insensitive). Null if unknown. */
export function stateTaxInfo(code: unknown): StateTaxInfo | null {
  if (typeof code !== "string") return null;
  return BY_CODE.get(code.trim().toUpperCase()) || null;
}

/** Estimated sales tax in cents for a subtotal, for client-side display. The
 * real charge is computed by Square from the same percentage. */
export function estimateTaxCents(subtotalCents: number, code: unknown): number {
  const info = stateTaxInfo(code);
  if (!info || info.ratePercent <= 0) return 0;
  return Math.round(subtotalCents * (info.ratePercent / 100));
}
