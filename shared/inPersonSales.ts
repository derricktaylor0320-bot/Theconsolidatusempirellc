import { deodorantPricingLabel } from "./elementsDeodorant";
import { bodyButterPricingLabel } from "./elementsBodyButter";
import { BODY_WASH_RETAIL_CENTS } from "./elementsDuo";

/** In-person sales channels that run through Square (not Stripe). */
export const SQUARE_IN_PERSON_CHANNELS = [
  "Premium Choice Hot Dogs",
  "Local flea markets",
] as const;

/** Elements body-care lines stocked for in-person flea market sales. */
export const FLEA_MARKET_ELEMENTS_LINES = [
  {
    name: "Natural Deodorant",
    detail: "Aluminum-free sticks (2.5 oz)",
    pricing: deodorantPricingLabel(),
  },
  {
    name: "Whipped Body Butters",
    detail: "4 oz jars — pick your scent at the table",
    pricing: bodyButterPricingLabel(),
  },
  {
    name: "3-in-1 Body Wash, Shampoo & Conditioner",
    detail: "8 oz bottles — Cocoa & Shea, Island Tranquility, Cocoa Mango",
    pricing: `$${(BODY_WASH_RETAIL_CENTS / 100).toFixed(0)} each`,
  },
] as const;

export function fleaMarketSquareSummary(): string {
  return (
    "Natural deodorant, whipped body butters, and 3-in-1 body wash are sold " +
    "in person at local flea markets. Card payments go through Square."
  );
}
