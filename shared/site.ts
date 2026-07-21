/**
 * Public site identity for The Consolidatus Empire Holdings (TCE Holdings).
 *
 * Custom domain on Railway: tceholdings.org
 * ("TCE" = The Consolidatus Empire)
 *
 * Until Railway finishes DNS/SSL verification, the app may still be reached
 * via the Railway default hostname. Prefer APP_URL / PUBLIC_URL in production
 * so emails, checkout redirects, and Open Graph tags use the custom domain.
 */

export const SITE_BRAND = "The Consolidatus Empire LLC";
export const SITE_HOLDINGS_NAME = "The Consolidatus Empire Holdings";
export const SITE_DOMAIN = "tceholdings.org";
export const SITE_URL = `https://${SITE_DOMAIN}`;

/**
 * Resolve the configured public origin for absolute links (emails, OG, redirects).
 * Returns null when nothing is configured so callers can fall back to the
 * incoming request host (important while Railway is still verifying DNS/SSL
 * for tceholdings.org — keep using the Railway hostname until APP_URL is set).
 */
export function resolvePublicSiteUrl(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const explicit = env.APP_URL || env.PUBLIC_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const replitDomain = env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (replitDomain) return `https://${replitDomain}`;

  return null;
}
