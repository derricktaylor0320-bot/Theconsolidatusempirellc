/**
 * Clone The FR2P Club app, patch it for hub embed at /fr2p/embed, and build.
 * Output lands in fr2p-club-dist/ for the hub server to mount.
 */
import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const BUILD_DIR = path.join(ROOT, ".build", "fr2p-club");
const OUT_DIR = path.join(ROOT, "fr2p-club-dist");
const REPO = "https://github.com/derricktaylor0320-bot/fr2p-club.git";
const EMBED_BASE = "/fr2p/embed";

function run(cmd, cwd = BUILD_DIR) {
  execSync(cmd, { cwd, stdio: "inherit" });
}

function patchFile(relPath, replacers) {
  const filePath = path.join(BUILD_DIR, relPath);
  let content = readFileSync(filePath, "utf8");
  for (const [from, to] of replacers) {
    if (!content.includes(from)) {
      if (to === "" && !content.includes(from.trim())) {
        continue;
      }
      throw new Error(`Patch target not found in ${relPath}: ${from.slice(0, 80)}`);
    }
    content = content.replace(from, to);
  }
  writeFileSync(filePath, content);
}

function applyEmbedPatches() {
  patchFile("vite.config.ts", [
    [
      `export default defineConfig({`,
      `export default defineConfig({
  base: process.env.VITE_EMBED_BASE || "/",`,
    ],
  ]);

  patchFile("client/index.html", [
    [
      `    <!-- Frame-buster: if FR2P is embedded inside another site's iframe, break out to full page -->
    <script>
      if (window.self !== window.top) {
        try { window.top.location.href = window.self.location.href; } catch(e) {}
      }
    </script>
`,
      "",
    ],
  ]);

  patchFile("client/src/App.tsx", [
    [
      `import { Switch, Route } from "wouter";`,
      `import { Switch, Route, Router as WouterRouter } from "wouter";`,
    ],
    [
      `function Router() {
  return (
    <Switch>`,
      `const embedBase = (import.meta.env.BASE_URL || "/").replace(/\\/$/, "");

function Router() {
  return (
    <WouterRouter base={embedBase}>
    <Switch>`,
    ],
    [
      `    </Switch>
  );
}

function App() {`,
      `    </Switch>
    </WouterRouter>
  );
}

function App() {`,
    ],
  ]);

  patchFile("client/src/lib/queryClient.ts", [
    [
      `async function throwIfResNotOk(res: Response) {`,
      `const apiBase = (import.meta.env.BASE_URL || "/").replace(/\\/$/, "");

function withApiBase(url: string): string {
  if (!url.startsWith("/api")) return url;
  return apiBase ? \`\${apiBase}\${url}\` : url;
}

async function throwIfResNotOk(res: Response) {`,
    ],
    [
      `  const res = await fetch(url, {`,
      `  const res = await fetch(withApiBase(url), {`,
    ],
    [
      `    const res = await fetch(queryKey.join("/") as string, {`,
      `    const res = await fetch(withApiBase(queryKey.join("/") as string), {`,
    ],
  ]);

  patchFile("server/services/email.ts", [
    [
      `const resend = new Resend(process.env.RESEND_API_KEY);`,
      `const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;`,
    ],
    [
      `export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const { email, firstName, lastName, username, memberNumber, isFoundingMember, referralLink } = data;`,
      `export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  if (!resend) {
    console.warn("[fr2p-club] RESEND_API_KEY not set — skipping welcome email");
    return;
  }
  const { email, firstName, lastName, username, memberNumber, isFoundingMember, referralLink } = data;`,
    ],
    [
      `export async function sendMagazineWelcomeEmail(data: MagazineWelcomeEmailData): Promise<void> {
  const { email, firstName } = data;`,
      `export async function sendMagazineWelcomeEmail(data: MagazineWelcomeEmailData): Promise<void> {
  if (!resend) {
    console.warn("[fr2p-club] RESEND_API_KEY not set — skipping magazine welcome email");
    return;
  }
  const { email, firstName } = data;`,
    ],
  ]);

  // Allow boot when Stripe is configured on the hub (don't hard-fail import).
  patchFile("server/routes.ts", [
    [
      `if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}`,
      `if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[fr2p-club] STRIPE_SECRET_KEY is not set — payment routes will fail.");
}`,
    ],
    [
      `const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});`,
      `const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_missing", {
  apiVersion: "2025-06-30.basil",
});`,
    ],
    [
      `  const httpServer = createServer(app);
  
  // WebSocket Server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });`,
      `  const parentServer = (app as express.Express & { __httpServer?: Server }).__httpServer;
  const httpServer = parentServer ?? createServer(app);
  const wsPath = parentServer ? "/fr2p/embed/ws" : "/ws";

  // WebSocket Server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: wsPath });`,
    ],
  ]);
}

function cloneOrUpdateRepo() {
  mkdirSync(path.join(ROOT, ".build"), { recursive: true });
  if (existsSync(BUILD_DIR)) {
    rmSync(BUILD_DIR, { recursive: true, force: true });
  }
  run(`git clone --depth 1 ${REPO} "${BUILD_DIR}"`, ROOT);
}

function bundleRoutes() {
  const entry = path.join(BUILD_DIR, "server", "routes.ts");
  const outfile = path.join(OUT_DIR, "routes.cjs");
  const external = [
    "express",
    "multer",
    "ws",
    "stripe",
    "pg",
    "drizzle-orm",
    "drizzle-zod",
    "zod",
    "@neondatabase/serverless",
    "@replit/object-storage",
    "pdfkit",
    "resend",
  ];
  run(
    `npx esbuild "${entry}" --bundle --platform=node --format=cjs --outfile="${outfile}" ` +
      `--external:${external.join(" --external:")} ` +
      `--alias:@shared=${path.join(BUILD_DIR, "shared")} ` +
      `--alias:@=${path.join(BUILD_DIR, "client", "src")}`,
    ROOT,
  );
}

function main() {
  console.log("Building The FR2P Club embed for /fr2p/embed …");
  cloneOrUpdateRepo();
  applyEmbedPatches();

  run("npm ci");
  run(`VITE_EMBED_BASE=${EMBED_BASE}/ npm run build`);

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });
  cpSync(path.join(BUILD_DIR, "dist", "public"), path.join(OUT_DIR, "public"), {
    recursive: true,
  });
  cpSync(
    path.join(BUILD_DIR, "client", "public"),
    path.join(OUT_DIR, "client-public"),
    { recursive: true },
  );
  cpSync(path.join(BUILD_DIR, "public"), path.join(OUT_DIR, "root-public"), {
    recursive: true,
  });

  bundleRoutes();
  console.log("FR2P Club embed build complete:", OUT_DIR);
}

main();
