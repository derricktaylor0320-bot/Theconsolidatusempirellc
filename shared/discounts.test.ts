import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DISCOUNT_CODES,
  RETURN_VISITOR_DISCOUNT_CENTS,
  parseDiscountCode,
} from "./discounts.ts";
import { AIR_GENESIS_PRICE_ID, isAirGenesisProduct } from "./airGenesis.ts";

describe("ReturnVisitor5 discount", () => {
  it("parses ReturnVisitor5 with a fixed five-dollar amount", () => {
    const def = parseDiscountCode("ReturnVisitor5");
    assert.ok(def);
    assert.equal(def!.code, DISCOUNT_CODES.RETURN_VISITOR);
    assert.equal(def!.fixedAmountCents, RETURN_VISITOR_DISCOUNT_CENTS);
    assert.equal(def!.requiresSubscriberEmail, true);
    assert.equal(def!.requiresAuth, undefined);
  });

  it("matches ReturnVisitor5 case-insensitively", () => {
    const def = parseDiscountCode("returnvisitor5");
    assert.equal(def?.code, DISCOUNT_CODES.RETURN_VISITOR);
  });
});

describe("Air Genesis product helpers", () => {
  it("detects Air Genesis by price id or title", () => {
    assert.equal(isAirGenesisProduct(AIR_GENESIS_PRICE_ID, null), true);
    assert.equal(
      isAirGenesisProduct("other", "Khomplete Khemistri Apparel Air Genesis"),
      true,
    );
    assert.equal(isAirGenesisProduct("other", "Some other shoe"), false);
  });
});
