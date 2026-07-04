import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { runMigrations } from 'stripe-replit-sync';
import { ensureTablesExist, dbSsl } from "./db";
import * as fs from 'fs';

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function getDatabaseUrl(): string {
  try {
    const replitDbPath = '/tmp/replitdb';
    if (fs.existsSync(replitDbPath)) {
      const url = fs.readFileSync(replitDbPath, 'utf-8').trim();
      if (url) {
        console.log('Using database URL from /tmp/replitdb for production');
        return url;
      }
    }
  } catch (e) {}
  
  if (process.env.DATABASE_URL) {
    console.log('Using database URL from environment variable');
    return process.env.DATABASE_URL;
  }
  
  throw new Error('DATABASE_URL not found');
}

async function initCatalogSchema() {
  const databaseUrl = getDatabaseUrl();

  try {
    // Ensure the product catalog tables exist. This only creates the database
    // schema the storefront reads from — it does NOT connect to any Stripe
    // account, sync from Stripe, or handle any payments. Payments run entirely
    // through Square, and the catalog is populated by ensureCatalogData().
    console.log('Initializing catalog schema...');
    await runMigrations({
      databaseUrl,
      ssl: dbSsl,
    });
    console.log('Catalog schema ready');
  } catch (error) {
    console.error('Failed to initialize catalog schema:', error);
    throw error;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

(async () => {
  // Ensure database tables exist (important for production)
  await ensureTablesExist();
  
  // Ensure the catalog schema exists in the background (don't block startup)
  initCatalogSchema().catch(err => {
    console.error('Catalog schema initialization error (non-blocking):', err);
  });

  // Apply JSON middleware for all routes
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        log(logLine);
      }
    });

    next();
  });

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    // Serve attached_assets in development mode
    const path = await import("path");
    app.use("/attached_assets", express.static(path.resolve(process.cwd(), "attached_assets")));
    
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
