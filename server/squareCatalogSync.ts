import { randomUUID } from "crypto";
import { squareFetch } from "./squareClient";
import { getStorefrontProductsDetailed } from "./storefrontProducts";

// Every item this sync creates in Square carries a variation SKU starting with
// this prefix. That namespace is how we recognize "our" mirrored items on later
// runs (to update/remove them) while NEVER touching items the owner created by
// hand in Square (e.g. the in-person hot dog menu).
const SKU_PREFIX = "KKWEB-";

const SQUARE_NAME_MAX = 512;
const SQUARE_DESC_MAX = 4096;

export interface SquareSyncResult {
  created: number;
  updated: number;
  archived: number;
  skipped: number;
  total: number;
  pruned: boolean;
}

interface ExistingItem {
  itemId: string;
  itemVersion: number;
  variationId: string;
  variationVersion: number;
}

export function squareConfigured(): boolean {
  return Boolean(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID);
}

// Square's client-supplied temporary IDs (the "#..." form used when creating new
// objects) must be alphanumeric/hyphen. Stripe ids contain underscores, so build
// a safe token for the temp id while the real id still lives in the SKU.
function tempToken(productId: string): string {
  return productId.replace(/[^A-Za-z0-9-]/g, "-");
}

// Pulls every catalog ITEM we previously synced (variation SKU begins with our
// prefix), keyed by the website product id, with the versions needed to update.
async function listSyncedItems(): Promise<Map<string, ExistingItem>> {
  const map = new Map<string, ExistingItem>();
  let cursor: string | undefined;

  do {
    const body: any = { object_types: ["ITEM"], include_deleted_objects: false };
    if (cursor) body.cursor = cursor;

    const data = await squareFetch("/v2/catalog/search", { method: "POST", body });
    const objects: any[] = Array.isArray(data?.objects) ? data.objects : [];

    for (const obj of objects) {
      if (obj?.type !== "ITEM") continue;
      const variations: any[] = Array.isArray(obj?.item_data?.variations)
        ? obj.item_data.variations
        : [];
      const variation = variations.find(
        (v) =>
          typeof v?.item_variation_data?.sku === "string" &&
          v.item_variation_data.sku.startsWith(SKU_PREFIX),
      );
      if (!variation) continue;

      const productId = String(variation.item_variation_data.sku).slice(SKU_PREFIX.length);
      map.set(productId, {
        itemId: obj.id,
        itemVersion: Number(obj.version) || 0,
        variationId: variation.id,
        variationVersion: Number(variation.version) || 0,
      });
    }

    cursor = data?.cursor;
  } while (cursor);

  return map;
}

// One-way mirror: website products -> Square Item Library. Creates missing
// items, updates changed ones (name/description/price), and removes only our own
// previously-synced items that no longer exist on the storefront. Idempotent —
// safe to re-run. Returns a per-run summary.
export async function syncStorefrontToSquare(): Promise<SquareSyncResult> {
  if (!squareConfigured()) {
    throw new Error(
      "Square is not configured (SQUARE_ACCESS_TOKEN / SQUARE_LOCATION_ID).",
    );
  }

  const { products, source } = await getStorefrontProductsDetailed();
  const existing = await listSyncedItems();

  const objects: any[] = [];
  const seen = new Set<string>();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    const id = String(p.id || "").trim();
    const title = String(p.title || "").trim();
    const amountCents = Math.round(parseFloat(p.price ?? "0") * 100);

    // Skip anything we can't price as a real fixed-price item.
    if (!id || !title || !Number.isFinite(amountCents) || amountCents <= 0) {
      skipped++;
      continue;
    }
    seen.add(id);

    const ex = existing.get(id);
    const token = tempToken(id);
    const itemId = ex ? ex.itemId : `#item-${token}`;
    const variationId = ex ? ex.variationId : `#var-${token}`;
    const name = title.slice(0, SQUARE_NAME_MAX);

    const itemData: any = {
      name,
      variations: [
        {
          type: "ITEM_VARIATION",
          id: variationId,
          ...(ex ? { version: ex.variationVersion } : {}),
          item_variation_data: {
            item_id: itemId,
            name: "Regular",
            sku: `${SKU_PREFIX}${id}`,
            pricing_type: "FIXED_PRICING",
            price_money: { amount: amountCents, currency: "USD" },
          },
        },
      ],
    };

    const description = (p.description ? String(p.description) : "").slice(0, SQUARE_DESC_MAX);
    if (description) itemData.description = description;

    objects.push({
      type: "ITEM",
      id: itemId,
      ...(ex ? { version: ex.itemVersion } : {}),
      item_data: itemData,
    });

    if (ex) updated++;
    else created++;
  }

  // Upsert in batches (Square caps a batch at 1000 objects).
  const UPSERT_CHUNK = 1000;
  for (let i = 0; i < objects.length; i += UPSERT_CHUNK) {
    const slice = objects.slice(i, i + UPSERT_CHUNK);
    await squareFetch("/v2/catalog/batch-upsert", {
      method: "POST",
      body: { idempotency_key: randomUUID(), batches: [{ objects: slice }] },
    });
  }

  // Remove our own synced items that are no longer for sale on the storefront.
  // Only KKWEB-* items are eligible, so hand-made Square items are never touched.
  //
  // SAFETY: pruning is destructive and irreversible, so only do it when the
  // product list came from the authoritative DB source AND is non-empty. The
  // Stripe-fallback path (or a transient empty result) could be partial, and
  // pruning against a partial list would wrongly delete valid Square items.
  let archived = 0;
  const canPrune = source === "db" && products.length > 0;

  if (canPrune) {
    const toDelete: string[] = [];
    existing.forEach((ex, productId) => {
      if (!seen.has(productId)) toDelete.push(ex.itemId);
    });

    const DELETE_CHUNK = 200;
    for (let i = 0; i < toDelete.length; i += DELETE_CHUNK) {
      const slice = toDelete.slice(i, i + DELETE_CHUNK);
      await squareFetch("/v2/catalog/batch-delete", {
        method: "POST",
        body: { object_ids: slice },
      });
      archived += slice.length;
    }
  }

  return { created, updated, archived, skipped, total: products.length, pruned: canPrune };
}
