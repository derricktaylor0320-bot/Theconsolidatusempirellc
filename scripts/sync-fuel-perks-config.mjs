/**
 * Sync shared/fuelPerks.ts program config into tce-fuel-perks/programConfig.js
 * for the standalone Express server.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const { getFuelPerksProgramConfig } = await import(
  path.join(ROOT, "shared", "fuelPerks.ts")
);

const outPath = path.join(ROOT, "tce-fuel-perks", "programConfig.js");
const config = getFuelPerksProgramConfig();

writeFileSync(
  outPath,
  `/** Auto-generated from shared/fuelPerks.ts — run: npx tsx scripts/sync-fuel-perks-config.mjs */\nmodule.exports = ${JSON.stringify(config, null, 2)};\n`,
);

console.log("Wrote", outPath);
