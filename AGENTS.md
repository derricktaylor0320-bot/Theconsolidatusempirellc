# AGENTS.md

## Cursor Cloud specific instructions

This is a full-stack TypeScript e-commerce app (React + Vite frontend, Express
backend, PostgreSQL via Drizzle). One service runs everything: `npm run dev`
starts the Express server which also serves the Vite dev client in middleware
mode on the same port. Standard scripts live in `package.json` (`dev`, `build`,
`check`, `db:push`); this section only covers the non-obvious startup caveats.

### Required runtime setup (do this before `npm run dev`)

- **PostgreSQL must be running.** It is installed in the VM image but is not
  started automatically. Start it with:
  `sudo pg_ctlcluster 16 main start`
- **`DATABASE_URL` and `SESSION_SECRET` must be set.** These are exported from
  `~/.bashrc` for interactive shells (DB is a local Postgres:
  `postgresql://postgres:postgres@localhost:5432/kkmgllc?sslmode=disable`). If a
  non-login shell doesn't have them, export them manually — the server throws at
  import time in `server/db.ts` if `DATABASE_URL` is missing.
- The local database `kkmgllc` and its seeded catalog/users persist in the VM
  snapshot, so you normally do not need to reseed.

### Run / build / check

- Dev (server + client, port 5000): `npm run dev`
- Type-check (lint equivalent — there is no ESLint config): `npm run check`
- Production build: `npm run build` (also needs `DATABASE_URL` in the env).
- There is no automated test suite (`package.json` has no `test` script).

### Catalog seeding gotcha (non-obvious)

The storefront reads products from the Stripe-mirror tables (`stripe.products` /
`stripe.prices`), which are normally populated by live Stripe sync (Replit) or a
migrated DB snapshot (Railway prod). `server/ensureCatalogData.ts` runs on every
startup and builds a large synthetic catalog, **but it no-ops if the
`stripe.products` table has zero rows** (it needs at least one existing product
with an `_account_id` to bootstrap — logs `no _account_id found; skipped`).

If `GET /api/products` returns `[]` on a fresh/empty database, seed one Stripe
account + a bootstrap product/price row (dev only), then restart the server so
`ensureCatalogData()` can expand the full catalog. A working bootstrap seed was
used during setup; the minimal requirement is a row in `stripe.accounts` plus at
least one `stripe.products` row (with a matching `stripe.prices` row) tied to
that account's id via `_account_id`.

### Payments / integrations

Stripe/Square/Resend/SSO are all optional for local dev and gated behind env
vars (`SQUARE_ACCESS_TOKEN`, `RESEND_API_KEY`, `SSO_SHARED_SECRET`, etc.). The
storefront, cart, and email/password hub auth (`/api/auth/*`) all work without
them.
