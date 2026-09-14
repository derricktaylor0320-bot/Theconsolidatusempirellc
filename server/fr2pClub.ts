import express, { type Express, type Router } from "express";
import type { Server } from "http";
import fs from "fs";
import path from "path";

const EMBED_PREFIX = "/fr2p/embed";

function distDir(): string {
  return path.resolve(process.cwd(), "fr2p-club-dist");
}

function embedAvailable(): boolean {
  return fs.existsSync(path.join(distDir(), "public", "index.html"));
}

export function isFr2pClubEmbedAvailable(): boolean {
  return embedAvailable();
}

/**
 * Mount The FR2P Club (affiliate platform) inside the hub at /fr2p/embed.
 * Replaces the dead external Railway iframe URL.
 */
export async function registerFr2pClubEmbed(
  app: Express,
  httpServer: Server,
): Promise<void> {
  if (!embedAvailable()) {
    console.warn(
      "[fr2p] fr2p-club-dist missing — run `node scripts/build-fr2p-club.mjs` during build. /fr2p/embed unavailable.",
    );
    return;
  }

  const router: Router = express.Router();
  const publicDir = path.join(distDir(), "public");
  const clientPublicDir = path.join(distDir(), "client-public");
  const rootPublicDir = path.join(distDir(), "root-public");

  const routesBundle = path.join(distDir(), "routes.cjs");
  if (fs.existsSync(routesBundle)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { registerRoutes } = require(routesBundle) as {
        registerRoutes: (subApp: Express) => Promise<Server>;
      };
      (router as Express & { __httpServer?: Server }).__httpServer = httpServer;
      await registerRoutes(router);
      console.log("[fr2p] API routes mounted under /fr2p/embed");
    } catch (error) {
      console.error("[fr2p] Failed to mount API routes:", error);
    }
  } else {
    console.warn("[fr2p] routes.cjs missing — serving static embed only");
  }

  router.use(express.static(publicDir));
  if (fs.existsSync(clientPublicDir)) {
    router.use(express.static(clientPublicDir));
  }
  if (fs.existsSync(rootPublicDir)) {
    router.use(express.static(rootPublicDir));
  }

  router.get("*", (_req, res, next) => {
    if (res.headersSent) return next();
    res.sendFile(path.join(publicDir, "index.html"));
  });

  app.use(EMBED_PREFIX, router);

  // Convenience redirect from /fr2p → full embed app (no hub chrome iframe).
  app.get("/fr2p", (_req, res) => {
    res.redirect(302, `${EMBED_PREFIX}/`);
  });

  console.log(`[fr2p] The FR2P Club available at ${EMBED_PREFIX}/`);
}
