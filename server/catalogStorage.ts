import { sql } from "drizzle-orm";
import { db } from "./db";

// Read-only access to the storefront product catalog.
//
// The catalog rows physically live in the `stripe.products` / `stripe.prices`
// tables. That schema name is only an artifact of the migration helper that
// creates the tables (`runMigrations` from `stripe-replit-sync`, used purely as
// local storage) — there is NO live Stripe integration and no Stripe account is
// ever contacted. The catalog is populated by `ensureCatalogData()` and
// payments run entirely through Square. This accessor just reads that local
// catalog; it replaces the removed Stripe-specific storage layer.
export class CatalogStorage {
  // Every active product joined to its active price, used to build the full
  // storefront listing.
  async listProductsWithPrices(active = true, limit = 500, offset = 0) {
    const result = await db.execute(
      sql`
        WITH paginated_products AS (
          SELECT id, name, description, metadata, active, images
          FROM stripe.products
          WHERE active = ${active}
          ORDER BY name
          LIMIT ${limit} OFFSET ${offset}
        )
        SELECT
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          p.images as product_images,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.active as price_active
        FROM paginated_products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        ORDER BY p.name, pr.unit_amount
      `,
    );
    return result.rows;
  }

  // Active products of a single productType (e.g. apparel, accessory), joined
  // to their active price.
  async getProductsWithPricesByType(productType: string) {
    const result = await db.execute(
      sql`
        SELECT
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          p.images as product_images,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.active as price_active
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true
          AND p.metadata->>'productType' = ${productType}
        ORDER BY p.name, pr.unit_amount
      `,
    );
    return result.rows;
  }

  // Authoritative price lookup by price id, joined to its product for the
  // display name/metadata. Used server-side so checkout never trusts a
  // client-sent amount.
  async getPriceWithProduct(priceId: string) {
    const result = await db.execute(
      sql`
        SELECT
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.active as price_active,
          p.name as product_name,
          p.description as product_description,
          p.metadata as product_metadata
        FROM stripe.prices pr
        JOIN stripe.products p ON p.id = pr.product
        WHERE pr.id = ${priceId}
          AND pr.active = true
          AND p.active = true
        LIMIT 1
      `,
    );
    return result.rows[0] || null;
  }
}

export const catalogStorage = new CatalogStorage();
