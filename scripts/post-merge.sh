#!/bin/bash
set -e

# Post-merge reconciliation for the Khomplete Khemistri app.
# - Installs any dependencies added by a merged task.
# Database schema is created automatically at server startup
# (ensureTablesExist in server/db.ts + Stripe runMigrations), so no
# separate, potentially-interactive migration step is needed here.

npm install --no-audit --no-fund
