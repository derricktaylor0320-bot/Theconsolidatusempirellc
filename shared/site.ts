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
export const SITE_SUPPORT_EMAIL = "theconsolidatusempirellc@gmail.com";
export const SITE_SUPPORT_PHONE = "+1-844-561-2444";
export const SITE_SUPPORT_PHONE_TEL = "18445612444";

export const SITE_SMS_CONSENT_TEXT = `${SITE_BRAND} would like your consent to send text message communications from ${SITE_SUPPORT_PHONE} in response to your questions or to provide information related to your relationship with us.`;

/** Carrier-required SMS disclosure (STOP/HELP, rates). */
export const SITE_SMS_CARRIER_DISCLOSURE =
  "Message and data rates may apply. Message frequency varies. Reply STOP to cancel at any time or HELP for assistance.";

/** Checkbox label fragment — links to legal pages are rendered in the contact form UI. */
export const SITE_SMS_OPT_IN_CHECKBOX_LABEL = `I agree to receive SMS/text messages from ${SITE_BRAND} at the mobile number I provide. I understand I am not required to consent as a condition of purchase.`;

/** Privacy Policy — mobile opt-in (required for SMS program registration). */
export const SITE_SMS_MOBILE_OPT_IN_PRIVACY =
  "Mobile opt-in information and consent for SMS/text messaging will not be shared with or sold to third parties for their marketing or promotional purposes.";

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

  const legacyHostedDomain = env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (legacyHostedDomain) return `https://${legacyHostedDomain}`;

  return null;
}
