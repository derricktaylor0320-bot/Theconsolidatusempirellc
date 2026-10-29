import { deodorantPricingLabel } from "./elementsDeodorant";
import { bodyButterPricingLabel } from "./elementsBodyButter";
import { butterLotionPricingLabel } from "./elementsButterLotion";
import {
  BODY_WASH_RETAIL_CENTS,
  elementsDuoSeparateDollars,
  elementsQuadFleaMarketPriceDollars,
} from "./elementsDuo";

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
    name: "3-in-1 Triple Butter Base Formula",
    detail: "4 oz triple-whipped jars — pick your exotic scent at the table",
    pricing: bodyButterPricingLabel(),
  },
  {
    name: "Scented Butter Lotion",
    detail:
      "Scents match our 3-in-1 washes — Cocoa Mango, Island Tranquility, and 100% Avocado Oil",
    pricing: butterLotionPricingLabel(),
  },
  {
    name: "3-in-1 Body Wash, Shampoo & Conditioner",
    detail:
      "8 oz bottles — Avocado Oil, Island Tranquility, Cocoa Mango, Men's Energizing Scent",
    pricing: `$${(BODY_WASH_RETAIL_CENTS / 100).toFixed(0)} each`,
  },
  {
    name: "Elements Quad Bundle",
    detail:
      "3-in-1 wash + triple body butter + butter lotion + natural deodorant",
    pricing: `$${elementsQuadFleaMarketPriceDollars().toFixed(0)} at flea markets ($${elementsDuoSeparateDollars().toFixed(0)} separately)`,
  },
] as const;

export function fleaMarketSquareSummary(): string {
  return (
    "Natural deodorant, triple whipped body butters, scented butter lotion, 3-in-1 body wash, " +
    "and the Elements Quad bundle are sold in person at local flea markets. Card payments go through Square."
  );
}
