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
const MOTIVATIONS_OVERLAY = path.join(ROOT, "fr2p-overlays", "motivations");
const HUB_MOTIVATIONS_ASSETS = path.join(
  ROOT,
  "attached_assets",
  "motivations",
);

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

function appendFile(relPath, suffix) {
  const filePath = path.join(BUILD_DIR, relPath);
  const content = readFileSync(filePath, "utf8");
  if (content.includes(suffix.trim())) return;
  writeFileSync(filePath, `${content.trimEnd()}\n\n${suffix.trimStart()}\n`);
}

/**
 * Move Empire Motivations (scroll + gallery) into The FR2P Club embed.
 * Overlay sources live in fr2p-overlays/motivations; poster PNGs stay in hub
 * attached_assets/motivations and are copied into the FR2P public tree.
 */
function applyMotivationsOverlay() {
  if (!existsSync(MOTIVATIONS_OVERLAY)) {
    throw new Error(`Missing motivations overlay at ${MOTIVATIONS_OVERLAY}`);
  }
  if (!existsSync(HUB_MOTIVATIONS_ASSETS)) {
    throw new Error(
      `Missing hub motivations assets at ${HUB_MOTIVATIONS_ASSETS}`,
    );
  }

  cpSync(
    path.join(MOTIVATIONS_OVERLAY, "shared", "motivationalPosters.ts"),
    path.join(BUILD_DIR, "shared", "motivationalPosters.ts"),
  );
  cpSync(
    path.join(
      MOTIVATIONS_OVERLAY,
      "client",
      "src",
      "components",
      "MotivationalScroll.tsx",
    ),
    path.join(BUILD_DIR, "client", "src", "components", "MotivationalScroll.tsx"),
  );
  cpSync(
    path.join(
      MOTIVATIONS_OVERLAY,
      "client",
      "src",
      "pages",
      "motivations.tsx",
    ),
    path.join(BUILD_DIR, "client", "src", "pages", "motivations.tsx"),
  );

  // Vite publicDir is client/public (ends up in dist/public). Also copy to
  // repo-root public so root-public static mount serves the same assets.
  for (const publicRoot of [
    path.join(BUILD_DIR, "client", "public"),
    path.join(BUILD_DIR, "public"),
  ]) {
    const publicMotivations = path.join(
      publicRoot,
      "attached_assets",
      "motivations",
    );
    mkdirSync(publicMotivations, { recursive: true });
    cpSync(HUB_MOTIVATIONS_ASSETS, publicMotivations, { recursive: true });
  }

  // App route (after embed WouterRouter patch has already run).
  patchFile("client/src/App.tsx", [
    [
      `import EmpireBackOffice from "@/pages/empire-back-office";`,
      `import EmpireBackOffice from "@/pages/empire-back-office";
import Motivations from "@/pages/motivations";`,
    ],
    [
      `      <Route path="/collection" component={Collection} />
      {/* Fallback to 404 */}`,
      `      <Route path="/collection" component={Collection} />
      <Route path="/motivations" component={Motivations} />
      {/* Fallback to 404 */}`,
    ],
  ]);

  // Sidebar entry.
  patchFile("client/src/components/ui/sidebar-nav.tsx", [
    [
      `  LayoutDashboard
} from "lucide-react";`,
      `  LayoutDashboard,
  Sparkles
} from "lucide-react";`,
    ],
    [
      `  { name: "Dashboard", href: "/", icon: Home },
  { name: "Prospect Manager", href: "/prospects", icon: Target },`,
      `  { name: "Dashboard", href: "/", icon: Home },
  { name: "Empire Motivations", href: "/motivations", icon: Sparkles, highlight: true },
  { name: "Prospect Manager", href: "/prospects", icon: Target },`,
    ],
  ]);

  // Dashboard motivational quote scroll (loading / empty / ready).
  patchFile("client/src/pages/dashboard.tsx", [
    [
      `import { EmblemShowcase } from "@/components/EmblemShowcase";`,
      `import { EmblemShowcase } from "@/components/EmblemShowcase";
import MotivationalScroll from "@/components/MotivationalScroll";`,
    ],
    [
      `  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary flex">
        <SidebarNav />
        <div className="flex-1 md:ml-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">`,
      `  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary flex">
        <SidebarNav />
        <div className="flex-1 md:ml-64">
          <MotivationalScroll />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">`,
    ],
    [
      `  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-secondary flex">
        <SidebarNav />
        <div className="flex-1 md:ml-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-card-foreground">No data available</h2>`,
      `  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-secondary flex">
        <SidebarNav />
        <div className="flex-1 md:ml-64">
          <MotivationalScroll />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-card-foreground">No data available</h2>`,
    ],
    [
      `  return (
    <div className="min-h-screen bg-secondary flex">
      <SidebarNav />
      <div className="flex-1 md:ml-64">
        {/* Top Header with User Info */}`,
      `  return (
    <div className="min-h-screen bg-secondary flex">
      <SidebarNav />
      <div className="flex-1 md:ml-64">
        <MotivationalScroll />
        {/* Top Header with User Info */}`,
    ],
  ]);

  appendFile(
    "client/src/index.css",
    `
@keyframes motivational-marquee-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

.motivational-marquee-track {
  animation: motivational-marquee-scroll 120s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .motivational-marquee {
    overflow-x: auto;
  }
  .motivational-marquee-track {
    animation: none;
    flex-wrap: wrap;
    white-space: normal;
    width: 100%;
    justify-content: center;
    gap: 0.5rem 1rem;
    padding-bottom: 0.25rem;
  }
}
`,
  );

  console.log("[fr2p] Empire Motivations overlay applied");
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
  applyMotivationsOverlay();

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
