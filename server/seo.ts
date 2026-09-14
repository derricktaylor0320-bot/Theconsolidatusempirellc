import type { Express } from "express";
import { SITE_DOMAIN, SITE_URL, resolvePublicSiteUrl } from "@shared/site";

/** Public storefront paths Google should crawl (keep in sync with site directory). */
const INDEXABLE_PATHS = [
  "/",
  "/hub",
  "/about",
  "/number-three",
  "/canvas",
  "/apparel",
  "/football-teams",
  "/feminine",
  "/masculine",
  "/accessories",
  "/bedding",
  "/elements",
  "/vintage",
  "/wine",
  "/poetry",
  "/hot-dogs",
  "/media",
  "/fr2p",
  "/pocket-booster",
  "/expense-relief",
  "/invest",
  "/fuel-perks",
  "/policies",
  "/vip",
];

function sitemapBaseUrl(): string {
  return resolvePublicSiteUrl() || SITE_URL;
}

function buildSitemapXml(): string {
  const base = sitemapBaseUrl();
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = INDEXABLE_PATHS.map(
    (path) => `  <url>
    <loc>${base}${path === "/" ? "/" : path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${path === "/" ? "1.0" : path === "/hub" ? "0.9" : "0.7"}</priority>
  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

function buildRobotsTxt(): string {
  const base = sitemapBaseUrl();
  return `User-agent: *
Allow: /

# Empire storefront — help Google find every public destination
Sitemap: ${base}/sitemap.xml

# Private owner tools (still reachable when signed in; not priority for search)
Disallow: /back-office
Disallow: /orders
Disallow: /api/
`;
}

export function registerSeoRoutes(app: Express): void {
  app.get("/sitemap.xml", (_req, res) => {
    res.type("application/xml").send(buildSitemapXml());
  });

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(buildRobotsTxt());
  });
}

export function getGoogleSetupStatus() {
  const gaMeasurementId = process.env.GA_MEASUREMENT_ID?.trim() || null;
  const googleSiteVerification =
    process.env.GOOGLE_SITE_VERIFICATION?.trim() || null;
  const baseUrl = sitemapBaseUrl();

  return {
    gaMeasurementId,
    gaConfigured: Boolean(gaMeasurementId),
    googleSiteVerificationConfigured: Boolean(googleSiteVerification),
    publicSiteUrl: baseUrl,
    sitemapUrl: `${baseUrl}/sitemap.xml`,
    robotsUrl: `${baseUrl}/robots.txt`,
    searchConsoleUrl: "https://search.google.com/search-console",
    analyticsUrl: gaMeasurementId
      ? `https://analytics.google.com/`
      : "https://analytics.google.com/analytics/web/provision/",
    brandName: "The Consolidatus Empire LLC",
    domain: SITE_DOMAIN,
  };
}
