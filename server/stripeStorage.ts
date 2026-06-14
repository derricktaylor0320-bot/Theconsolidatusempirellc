import { sql } from 'drizzle-orm';
import { db } from './db';

export class StripeStorage {
  async listProducts(active = true, limit = 100, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE active = ${active} ORDER BY name LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

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
      `
    );
    return result.rows;
  }

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
      `
    );
    return result.rows;
  }

  async getProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return result.rows[0] || null;
  }

  async getPricesForProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE product = ${productId} AND active = true`
    );
    return result.rows;
  }

  // Authoritative price lookup by price id, joined to its product for the display name.
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
      `
    );
    return result.rows[0] || null;
  }
}

export const stripeStorage = new StripeStorage();
