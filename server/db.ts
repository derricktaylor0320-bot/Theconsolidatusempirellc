import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import * as fs from "fs";
import { sql } from "drizzle-orm";

const { Pool } = pg;

function getDatabaseUrl(): string {
  // For Replit production deployments, check /tmp/replitdb first
  try {
    const replitDbPath = "/tmp/replitdb";
    if (fs.existsSync(replitDbPath)) {
      const url = fs.readFileSync(replitDbPath, "utf-8").trim();
      if (url) {
        console.log("Using database URL from /tmp/replitdb");
        return url;
      }
    }
  } catch (e) {
    // Ignore errors reading the file
  }

  // Fall back to environment variable (Railway, Neon, local, etc.)
  if (process.env.DATABASE_URL) {
    console.log("Using database URL from environment variable");
    return process.env.DATABASE_URL;
  }

  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Decide whether to use SSL based on the connection target.
// Internal/local hosts (Railway private network, localhost) don't use SSL;
// hosted providers (Neon, Replit, Railway public proxy) require it.
function shouldUseSSL(url: string): boolean {
  if (/sslmode=disable/.test(url)) return false;
  try {
    const host = new URL(url).hostname;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".railway.internal")
    ) {
      return false;
    }
  } catch (e) {
    // If parsing fails, default to SSL for safety with hosted databases
  }
  return true;
}

const databaseUrl = getDatabaseUrl();

// Shared SSL config so the main pool, Stripe migrations, and Stripe sync
// all connect the same way (important for hosted Postgres like Railway/Neon).
export const dbSsl = shouldUseSSL(databaseUrl)
  ? { rejectUnauthorized: false }
  : undefined;

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: dbSsl,
});

export const db = drizzle({ client: pool, schema });

export async function ensureTablesExist() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscribers (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        source VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Single-use, expiring tokens for the "forgot password" flow.
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_password_reset_tokens_user"
      ON password_reset_tokens (user_id)
    `);

    // Paid orders captured at checkout (only recorded after Square confirms
    // payment on the buyer's return).
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        status TEXT NOT NULL DEFAULT 'pending',
        fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled',
        items JSONB NOT NULL,
        total_cents INTEGER NOT NULL,
        square_order_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    // Backfill the fulfillment column on databases created before it was added,
    // so existing deployments don't error on "column does not exist".
    await db.execute(sql`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled'
    `);
    // Buyer contact + ship-to details and tracking info. Added later, so we
    // backfill on existing deployments (Railway prod has no migration step).
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier TEXT`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP`);
    // One stored order per Square order id (lets us upsert idempotently when a
    // buyer refreshes the success page).
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_orders_square_order_id"
      ON orders (square_order_id)
    `);

    // Media gallery items (singing video clips + audio projects). Created here
    // so the table exists on both Replit dev and the Railway prod snapshot
    // (which has no migration step).
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS media_items (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        collection TEXT NOT NULL,
        media_type TEXT NOT NULL,
        source_type TEXT NOT NULL,
        url TEXT NOT NULL,
        file_name TEXT,
        description TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Profile photo + location shown next to a user's reviews.
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT`);

    // Customer product reviews. Keyed by product name (the storefront dedupes
    // catalog rows by name, so the name is the stable product identity). One
    // review per user per product, enforced by the unique index.
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        product_name TEXT NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        reviewer_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        verified BOOLEAN NOT NULL DEFAULT FALSE,
        location TEXT,
        photo_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_reviews_user_product"
      ON reviews (user_id, product_name)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_reviews_product_name"
      ON reviews (product_name)
    `);
    // Backfill columns added after the original reviews table shipped.
    await db.execute(sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS location TEXT`);
    await db.execute(sql`
      ALTER TABLE reviews
      ADD COLUMN IF NOT EXISTS photo_urls JSONB NOT NULL DEFAULT '[]'::jsonb
    `);

    // One-time discount redemptions (Discount10% from photo reviews).
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS discount_redemptions (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        code TEXT NOT NULL,
        square_order_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_discount_redemptions_user_code"
      ON discount_redemptions (user_id, code)
    `);

    // Session store table used by connect-pg-simple for shared hub sessions.
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" VARCHAR NOT NULL COLLATE "default",
        "sess" JSON NOT NULL,
        "expire" TIMESTAMP(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
    `);

    // Pocket Booster — subscription tiers, cushions, repayment schedules,
    // and Pay-to-Learn educational milestones.
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL UNIQUE,
        tier_level INTEGER NOT NULL,
        monthly_subscription DECIMAL(10, 2) NOT NULL,
        max_cushion_limit DECIMAL(10, 2) NOT NULL,
        next_billing_amount DECIMAL(10, 2) NOT NULL,
        subscription_status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_user_subscriptions_status"
      ON user_subscriptions (user_id, subscription_status)
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cash_advances (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        amount_borrowed DECIMAL(10, 2) NOT NULL,
        repayment_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_cash_advances_user"
      ON cash_advances (user_id)
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS repayment_schedules (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        advance_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        deduction_amount DECIMAL(10, 2) NOT NULL,
        scheduled_date TIMESTAMP NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_repayment_schedules_advance"
      ON repayment_schedules (advance_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_repayment_schedules_user_date"
      ON repayment_schedules (user_id, scheduled_date)
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS educational_milestones (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        module_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_educational_milestones_user"
      ON educational_milestones (user_id)
    `);
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_educational_milestones_user_module"
      ON educational_milestones (user_id, module_name)
    `);

    console.log("Database tables verified/created");
  } catch (error) {
    console.error("Error ensuring tables exist:", error);
  }
}
