# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single full-stack TypeScript app ("The Consolidatus Empire" e-commerce hub):
an Express backend (`server/`) that also serves the Vite React client (`client/`) as
middleware in development. See `replit.md` for the full architecture overview and
`package.json` for the canonical scripts.

### Running the app (dev)

- Dependencies are installed by the startup update script (`npm install`). No extra install steps.
- The app needs a PostgreSQL database via the `DATABASE_URL` env var. There is **no `.env`
  loading** in the code — env vars must be present in the shell. `DATABASE_URL` and
  `SESSION_SECRET` are exported from `~/.bashrc` (added during setup), so a normal login shell
  already has them. If they're missing, export:
  `export DATABASE_URL="postgres://postgres:postgres@localhost:5432/khomplete?sslmode=disable"`
- PostgreSQL 16 is installed as a system service but is **not started automatically**. Start it
  each session before running the app:
  `sudo pg_ctlcluster 16 main start`
  The dev database is `khomplete` (role `postgres` / password `postgres`). If it doesn't exist:
  `sudo -u postgres psql -c "CREATE DATABASE khomplete;"`
- Start the dev server (Express + Vite on port 5000): `npm run dev`
  All app tables are created automatically at boot (`ensureTablesExist` in `server/db.ts`), so no
  manual migration step is needed. `npm run db:push` (drizzle-kit) exists but is not required.

### Lint / typecheck / test / build

- Typecheck / "lint": `npm run check` (runs `tsc`). There is no ESLint config and no automated
  test suite in this repo.
- Build (production bundle): `npm run build`; run built output with `npm start`. Not needed for
  development.

### Non-obvious caveats

- **Startup log noise is normal.** On boot you may see `ensureCatalogData failed: ... stripe.products
  does not exist` or `column pr._raw_data does not exist`. These are a harmless race between the
  Stripe-schema migration (`runMigrations` from `stripe-replit-sync`, run non-blocking) and
  `ensureCatalogData`. They self-heal on subsequent boots once the `stripe` schema is fully created.
- **The storefront catalog is empty without Stripe/Square credentials.** Product rows live in the
  Stripe-synced `stripe.*` schema and `ensureCatalogData` only augments an existing catalog that
  already has a synced account (`_account_id`). With no Stripe credentials it logs
  `no _account_id found; skipped catalog product inserts` and `/api/products` returns `[]`. This is
  expected locally, not a bug. Square/Stripe/email integrations are all optional and guarded
  (`squareConfigured()`), so the rest of the app runs fine without them.
- **Catalog reads go through `server/catalogStorage.ts` (`catalogStorage`).** The old Stripe-specific
  storage layer was removed; `catalogStorage` reads the product catalog from the `stripe.products` /
  `stripe.prices` tables. That schema name is only an artifact of the migration helper that creates
  the tables (`stripe-replit-sync`) used purely for local storage — there is no live Stripe
  integration and payments run through Square.
- Optional env vars (see `server/`): `OWNER_EMAILS` (admin allowlist), `APP_URL`/`PUBLIC_URL`
  (public origin for redirects/emails), `SQUARE_ACCESS_TOKEN`/`SQUARE_LOCATION_ID` (payments),
  `MEDIA_DIR` (persistent uploads volume in prod).
