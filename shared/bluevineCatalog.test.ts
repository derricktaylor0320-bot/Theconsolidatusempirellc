import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BLUEVINE_CSV_HEADERS,
  bluevineCatalogToCsv,
  buildBluevineCatalogRows,
  isElementsBodyCareProduct,
} from "./bluevineCatalog";

describe("bluevineCatalog", () => {
  it("flags butter lotion, washes, deodorant, and body butter as body care", () => {
    assert.equal(
      isElementsBodyCareProduct({ title: "Scented Butter Lotion" }),
      true,
    );
    assert.equal(
      isElementsBodyCareProduct({
        title: "3-in-1 Triple Butter Base Formula",
        category: "Body Care",
      }),
      true,
    );
    assert.equal(
      isElementsBodyCareProduct({ title: "Avocado Oil", category: "Body Care" }),
      true,
    );
    assert.equal(
      isElementsBodyCareProduct({ title: "Lavender Deodorant" }),
      true,
    );
    assert.equal(
      isElementsBodyCareProduct({ title: "Classic Tee", productType: "apparel" }),
      false,
    );
  });

  it("builds a full ranked export including coming-soon deodorant", () => {
    const rows = buildBluevineCatalogRows([
      {
        id: "prod_tee",
        title: "Classic Tee",
        price: "30.00",
        productType: "apparel",
        category: "Apparel",
      },
      {
        id: "prod_kkbutterlotion",
        title: "Scented Butter Lotion",
        price: "12.00",
        productType: "accessory",
        category: "Body Care",
        scents: "Cocoa Mango, Island Tranquility",
      },
      {
        id: "prod_kkelemsdeodorantlavender",
        title: "Lavender Deodorant",
        price: "12.00",
        productType: "elements",
        category: "Body Care",
        comingSoon: true,
      },
      {
        id: "prod_skip",
        title: "No Price Yet",
        price: null,
      },
    ]);

    assert.equal(rows.length, 3);
    assert.equal(rows[0].sku, "prod_kkbutterlotion");
    assert.equal(rows[0].priorityGroup, "elements_body_care");
    assert.equal(rows[1].sku, "prod_kkelemsdeodorantlavender");
    assert.equal(rows[1].status, "coming_soon");
    assert.equal(rows[2].sku, "prod_tee");
    assert.equal(rows[2].priorityGroup, "catalog");
  });

  it("emits a CSV Bluevine can use as an Items entry checklist", () => {
    const rows = buildBluevineCatalogRows([
      {
        id: "prod_kkbutterlotion",
        title: 'Scented Butter Lotion, "Signature"',
        description: "Rich lotion\nfor daily use",
        price: "12",
        category: "Body Care",
        productType: "accessory",
      },
    ]);
    const csv = bluevineCatalogToCsv(rows);
    assert.ok(csv.startsWith(BLUEVINE_CSV_HEADERS.join(",")));
    assert.ok(csv.includes('"Scented Butter Lotion, ""Signature"""'));
    assert.ok(csv.includes("12.00"));
    assert.ok(csv.includes("elements_body_care"));
  });
});
