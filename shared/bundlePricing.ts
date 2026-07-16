/**
 * Bundle Pricing & Upsell Engine for the Premium Lighter line.
 *
 * Rules:
 *  1. Target Margin — newly generated bundles aim for ≥ 45% profit margin.
 *  2. Dynamic Upcharge — (accessory base cost × 2.5), rounded up to .99 or .00.
 *  3. Cart Upsell Hook — surface add-on toggles / modal when the cart holds
 *     only a Premium Lighter.
 *
 * Predefined bundles use the curated retail / upcharge figures in
 * bundle_config.json. The dynamic formula is used when generating new bundles.
 */

import bundleConfigJson from "./bundle_config.json";

/** Square / storefront price id for the Custom Branded Luxury Logo Lighter. */
export const PREMIUM_LIGHTER_PRICE_ID = "price_kkbrandedlighter";

/** Product name substrings that identify a Premium Lighter in the cart. */
export const PREMIUM_LIGHTER_NAME_HINTS = [
  "luxury logo lighter",
  "branded luxury logo lighter",
  "custom embossed metallic lighter",
  "premium metallic lighter",
] as const;

export interface BundleComponent {
  item: string;
  base_cost: number;
}

export interface BundleDefinition {
  bundle_id: string;
  display_name: string;
  description: string;
  components: BundleComponent[];
  total_base_cost: number;
  suggested_retail: number;
  suggested_upcharge_add_on: number;
  calculated_profit: number;
  margin_percent: number;
  upsell_prompt: string;
}

export interface BundleConfig {
  store_branding: {
    parent_company: string;
    brands: string[];
  };
  base_products: {
    premium_lighter: {
      name: string;
      variations: string[];
      base_cost_usd: number;
      retail_price_usd: number;
      unit_profit_usd: number;
      margin_percent: number;
    };
  };
  bundle_definitions: BundleDefinition[];
  pricing_engine_rules: {
    target_bundle_margin_min: number;
    auto_upcharge_multiplier: number;
    rounding_strategy: "ends_in_ninety_nine";
  };
}

export const BUNDLE_CONFIG = bundleConfigJson as BundleConfig;

export type BundleId = (typeof BUNDLE_CONFIG.bundle_definitions)[number]["bundle_id"];

export interface GeneratedBundlePricing {
  accessoryBaseCost: number;
  upchargeUsd: number;
  totalBaseCost: number;
  suggestedRetail: number;
  profitUsd: number;
  marginPercent: number;
  meetsTargetMargin: boolean;
}

export interface CartLineLike {
  priceId: string;
  title?: string;
  quantity?: number;
  bundleId?: string | null;
}

/**
 * Round a dollar amount UP to the next price ending in .00 or .99.
 * Examples: 5.625 → 5.99, 6.25 → 6.99, 10.5 → 10.99, 15 → 15.00
 */
export function roundUpToNinetyNineOrZero(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const cents = Math.ceil(value * 100 - 1e-9);
  const dollars = Math.floor(cents / 100);
  const rem = cents % 100;
  if (rem === 0) return dollars;
  if (rem <= 99) {
    // Anything past a whole dollar rounds up to X.99 (or the next whole dollar
    // when rem would already be past 99 after ceil — handled below).
    if (rem === 99) return dollars + 0.99;
    return dollars + 0.99;
  }
  return dollars + 1;
}

/**
 * Dynamic upcharge: (accessory base cost × multiplier) rounded up to .99 / .00.
 */
export function computeDynamicUpcharge(
  accessoryBaseCostUsd: number,
  multiplier = BUNDLE_CONFIG.pricing_engine_rules.auto_upcharge_multiplier,
): number {
  return roundUpToNinetyNineOrZero(accessoryBaseCostUsd * multiplier);
}

/**
 * Price a newly generated bundle from accessory costs + the premium lighter.
 * Uses the dynamic upcharge formula and reports whether the 45% margin target
 * is met (shipping / fees buffer).
 */
export function generateBundlePricing(
  accessoryBaseCostsUsd: number[],
  options?: {
    lighterRetailUsd?: number;
    lighterBaseCostUsd?: number;
    multiplier?: number;
    targetMarginMin?: number;
  },
): GeneratedBundlePricing {
  const lighter = BUNDLE_CONFIG.base_products.premium_lighter;
  const lighterRetail =
    options?.lighterRetailUsd ?? lighter.retail_price_usd;
  const lighterCost =
    options?.lighterBaseCostUsd ?? lighter.base_cost_usd;
  const multiplier =
    options?.multiplier ??
    BUNDLE_CONFIG.pricing_engine_rules.auto_upcharge_multiplier;
  const targetMargin =
    options?.targetMarginMin ??
    BUNDLE_CONFIG.pricing_engine_rules.target_bundle_margin_min;

  const accessoryBaseCost = accessoryBaseCostsUsd.reduce(
    (sum, c) => sum + (Number.isFinite(c) ? c : 0),
    0,
  );
  const upchargeUsd = computeDynamicUpcharge(accessoryBaseCost, multiplier);
  const totalBaseCost = roundMoney(lighterCost + accessoryBaseCost);
  const suggestedRetail = roundMoney(lighterRetail + upchargeUsd);
  const profitUsd = roundMoney(suggestedRetail - totalBaseCost);
  const marginPercent =
    suggestedRetail > 0
      ? roundMoney((profitUsd / suggestedRetail) * 100, 1)
      : 0;

  return {
    accessoryBaseCost: roundMoney(accessoryBaseCost),
    upchargeUsd,
    totalBaseCost,
    suggestedRetail,
    profitUsd,
    marginPercent,
    meetsTargetMargin: marginPercent >= targetMargin,
  };
}

export function getBundleById(bundleId: string): BundleDefinition | undefined {
  return BUNDLE_CONFIG.bundle_definitions.find((b) => b.bundle_id === bundleId);
}

export function isValidBundleId(bundleId: unknown): bundleId is string {
  return (
    typeof bundleId === "string" &&
    BUNDLE_CONFIG.bundle_definitions.some((b) => b.bundle_id === bundleId)
  );
}

/** Upcharge in USD for a known bundle (curated config value). */
export function bundleUpchargeUsd(bundleId: string): number {
  const bundle = getBundleById(bundleId);
  return bundle ? bundle.suggested_upcharge_add_on : 0;
}

/** Upcharge in cents for Square line-item math. */
export function bundleUpchargeCents(bundleId: string): number {
  return Math.round(bundleUpchargeUsd(bundleId) * 100);
}

/**
 * Whether a catalog product (by price id and/or title) is the Premium Lighter.
 */
export function isPremiumLighterProduct(
  priceId: string,
  title?: string,
): boolean {
  if (priceId === PREMIUM_LIGHTER_PRICE_ID) return true;
  if (!title) return false;
  const lower = title.toLowerCase();
  return PREMIUM_LIGHTER_NAME_HINTS.some((hint) => lower.includes(hint));
}

/**
 * Cart Upsell Hook — true when every line is a Premium Lighter
 * (and the cart is non-empty). Triggers checkout modal / cart toggles.
 */
export function shouldShowLighterBundleUpsell(
  items: CartLineLike[],
): boolean {
  if (!items.length) return false;
  return items.every((item) =>
    isPremiumLighterProduct(item.priceId, item.title),
  );
}

/**
 * Unit price shown in cart = lighter retail + selected bundle upcharge.
 */
export function lighterUnitPriceWithBundle(
  lighterRetailUsd: number,
  bundleId?: string | null,
): number {
  if (!bundleId) return roundMoney(lighterRetailUsd);
  return roundMoney(lighterRetailUsd + bundleUpchargeUsd(bundleId));
}

/** Note appended to the Square order line when a bundle is selected. */
export function bundleOrderNote(bundleId: string): string | undefined {
  const bundle = getBundleById(bundleId);
  if (!bundle) return undefined;
  const upcharge = bundle.suggested_upcharge_add_on.toFixed(2);
  return `Bundle: ${bundle.display_name} (+$${upcharge})`;
}

/**
 * Accessory-only base costs for a predefined bundle (excludes the lighter).
 */
export function accessoryBaseCostsForBundle(
  bundle: BundleDefinition,
): number[] {
  const lighterCost =
    BUNDLE_CONFIG.base_products.premium_lighter.base_cost_usd;
  return bundle.components
    .filter((c) => Math.abs(c.base_cost - lighterCost) > 0.001)
    .map((c) => c.base_cost);
}

/** Whether a predefined bundle meets the target margin rule. */
export function bundleMeetsTargetMargin(bundleId: string): boolean {
  const bundle = getBundleById(bundleId);
  if (!bundle) return false;
  return (
    bundle.margin_percent >=
    BUNDLE_CONFIG.pricing_engine_rules.target_bundle_margin_min
  );
}

function roundMoney(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
