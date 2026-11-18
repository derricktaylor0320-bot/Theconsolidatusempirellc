/**
 * Bluevine Sales Items helpers.
 *
 * Bluevine has no public Items API, so the site cannot push SKUs into the app
 * automatically. These helpers build a ranked, CSV-ready packing list from the
 * storefront catalog so owners can enter (or re-check) every sellable item in
 * Bluevine → Sales → Items. Live Stripe Products sync uses the same sellable
 * filter so Bluevine's linked Stripe account stays aligned with the site.
 */

export type BluevineCatalogRowInput = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  productType?: string | null;
  price?: string | null;
  comingSoon?: boolean;
  soldOut?: boolean;
  scents?: string | null;
};

export type BluevineCatalogRow = {
  sku: string;
  name: string;
  description: string;
  unitPriceDollars: string;
  category: string;
  productType: string;
  status: "active" | "coming_soon" | "sold_out";
  priorityGroup: "elements_body_care" | "elements" | "catalog";
  scents: string;
};

const BODY_CARE_NAME_HINTS = [
  "butter lotion",
  "body butter",
  "triple butter",
  "body wash",
  "deodorant",
  "elements quad",
  "care basket",
  "core 4",
];

function normalize(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function isElementsBodyCareProduct(input: {
  title?: string | null;
  category?: string | null;
  productType?: string | null;
  id?: string | null;
}): boolean {
  const haystack = [
    normalize(input.title),
    normalize(input.category),
    normalize(input.productType),
    normalize(input.id),
  ].join(" ");

  if (haystack.includes("body care")) return true;
  return BODY_CARE_NAME_HINTS.some((hint) => haystack.includes(hint));
}

export function bluevinePriorityGroup(input: {
  title?: string | null;
  category?: string | null;
  productType?: string | null;
  id?: string | null;
}): BluevineCatalogRow["priorityGroup"] {
  if (isElementsBodyCareProduct(input)) return "elements_body_care";
  if (normalize(input.productType) === "elements") return "elements";
  return "catalog";
}

export function isBluevineExportableProduct(input: {
  id?: string | null;
  title?: string | null;
  price?: string | null;
}): boolean {
  const id = String(input.id || "").trim();
  const title = String(input.title || "").trim();
  const amount = parseFloat(String(input.price ?? ""));
  return Boolean(id && title && Number.isFinite(amount) && amount > 0);
}

export function toBluevineCatalogRow(
  input: BluevineCatalogRowInput,
): BluevineCatalogRow | null {
  if (!isBluevineExportableProduct(input)) return null;

  const amount = parseFloat(String(input.price));
  let status: BluevineCatalogRow["status"] = "active";
  if (input.comingSoon) status = "coming_soon";
  else if (input.soldOut) status = "sold_out";

  return {
    sku: String(input.id).trim(),
    name: String(input.title).trim(),
    description: String(input.description || "")
      .replace(/\s+/g, " ")
      .trim(),
    unitPriceDollars: amount.toFixed(2),
    category: String(input.category || "General").trim() || "General",
    productType: String(input.productType || "general").trim() || "general",
    status,
    priorityGroup: bluevinePriorityGroup(input),
    scents: String(input.scents || "").trim(),
  };
}

const PRIORITY_RANK: Record<BluevineCatalogRow["priorityGroup"], number> = {
  elements_body_care: 0,
  elements: 1,
  catalog: 2,
};

export function rankBluevineCatalogRows(
  rows: BluevineCatalogRow[],
): BluevineCatalogRow[] {
  return [...rows].sort((a, b) => {
    const pr = PRIORITY_RANK[a.priorityGroup] - PRIORITY_RANK[b.priorityGroup];
    if (pr !== 0) return pr;
    const statusRank = (s: BluevineCatalogRow["status"]) =>
      s === "active" ? 0 : s === "sold_out" ? 1 : 2;
    const sr = statusRank(a.status) - statusRank(b.status);
    if (sr !== 0) return sr;
    return a.name.localeCompare(b.name);
  });
}

export function buildBluevineCatalogRows(
  products: BluevineCatalogRowInput[],
): BluevineCatalogRow[] {
  const rows: BluevineCatalogRow[] = [];
  for (const product of products) {
    const row = toBluevineCatalogRow(product);
    if (row) rows.push(row);
  }
  return rankBluevineCatalogRows(rows);
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export const BLUEVINE_CSV_HEADERS = [
  "sku",
  "name",
  "description",
  "unit_price_usd",
  "category",
  "product_type",
  "status",
  "priority_group",
  "scents",
] as const;

export function bluevineCatalogToCsv(rows: BluevineCatalogRow[]): string {
  const lines = [BLUEVINE_CSV_HEADERS.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.sku,
        row.name,
        row.description,
        row.unitPriceDollars,
        row.category,
        row.productType,
        row.status,
        row.priorityGroup,
        row.scents,
      ]
        .map((cell) => csvEscape(String(cell)))
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}
