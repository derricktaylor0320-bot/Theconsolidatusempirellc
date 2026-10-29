import assert from "node:assert/strict";
import test from "node:test";
import {
  COCOA_SHEA_BUTTER_LINE_NAME,
  filterRetiredCocoaSheaScents,
  isRetiredCocoaSheaStorefrontProduct,
} from "./elementsRetired";
import { scentsFor } from "./customization";

test("retired cocoa & shea product titles are recognized", () => {
  assert.equal(isRetiredCocoaSheaStorefrontProduct(COCOA_SHEA_BUTTER_LINE_NAME), true);
  assert.equal(isRetiredCocoaSheaStorefrontProduct("Cocoa & Shea Butter Lotion"), true);
  assert.equal(isRetiredCocoaSheaStorefrontProduct("Cocoa Mango"), false);
  assert.equal(isRetiredCocoaSheaStorefrontProduct("Scented Butter Lotion"), false);
});

test("retired cocoa & shea scents are stripped from metadata scent lists", () => {
  assert.deepEqual(
    filterRetiredCocoaSheaScents([
      "Cocoa Mango",
      COCOA_SHEA_BUTTER_LINE_NAME,
      "Island Tranquility",
    ]),
    ["Cocoa Mango", "Island Tranquility"],
  );
  assert.deepEqual(
    scentsFor({
      scented: "true",
      scentOptions: "Cocoa Mango, Cocoa & Shea Butter, 100% Avocado Oil",
    }),
    ["Cocoa Mango", "100% Avocado Oil"],
  );
});
