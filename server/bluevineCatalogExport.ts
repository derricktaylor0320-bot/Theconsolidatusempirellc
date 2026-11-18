import {
  bluevineCatalogToCsv,
  buildBluevineCatalogRows,
  type BluevineCatalogRow,
} from "@shared/bluevineCatalog";
import { getStorefrontProductsDetailed } from "./storefrontProducts";

export type BluevineCatalogExport = {
  generatedAt: string;
  source: "db" | "unavailable";
  total: number;
  bodyCareCount: number;
  comingSoonCount: number;
  rows: BluevineCatalogRow[];
  instructions: string[];
};

export async function exportBluevineCatalog(): Promise<BluevineCatalogExport> {
  const { products, source } = await getStorefrontProductsDetailed();
  const rows = buildBluevineCatalogRows(products);

  return {
    generatedAt: new Date().toISOString(),
    source,
    total: rows.length,
    bodyCareCount: rows.filter((r) => r.priorityGroup === "elements_body_care")
      .length,
    comingSoonCount: rows.filter((r) => r.status === "coming_soon").length,
    rows,
    instructions: [
      "Bluevine does not offer a public Items import API — use this list in Bluevine → Sales → Items.",
      "Enter active rows first. Body-care (butter lotion, triple butter, washes, deodorant, Elements bundles) is sorted to the top.",
      "Coming-soon deodorant stays in the CSV with status=coming_soon so you can add it when stock is ready.",
      "After Items are saved, use them in Tap to Pay, Payment Links, and Invoices. Funds settle to Bluevine via your linked Stripe account.",
      "Run Sync to Stripe from Back Office so the same SKUs exist as Stripe Products for API invoices / Payment Links.",
    ],
  };
}

export async function exportBluevineCatalogCsv(): Promise<{
  filename: string;
  csv: string;
  total: number;
}> {
  const exported = await exportBluevineCatalog();
  const stamp = exported.generatedAt.slice(0, 10);
  return {
    filename: `bluevine-items-catalog-${stamp}.csv`,
    csv: bluevineCatalogToCsv(exported.rows),
    total: exported.total,
  };
}
