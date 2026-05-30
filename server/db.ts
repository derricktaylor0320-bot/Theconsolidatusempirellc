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

    console.log("Database tables verified/created");
  } catch (error) {
    console.error("Error ensuring tables exist:", error);
  }
}
