import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

/**
 * Vite plugin that updates og:image / twitter:image (and og:url when present)
 * to absolute URLs on the public site origin (APP_URL, custom domain, or Replit).
 */
export function metaImagesPlugin(): Plugin {
  return {
    name: 'vite-plugin-meta-images',
    transformIndexHtml(html) {
      const baseUrl = getDeploymentUrl();
      if (!baseUrl) {
        log('[meta-images] no deployment domain found, skipping meta tag updates');
        return html;
      }

      // Check if opengraph image exists in public directory
      const publicDir = path.resolve(process.cwd(), 'client', 'public');
      const opengraphPngPath = path.join(publicDir, 'opengraph.png');
      const opengraphJpgPath = path.join(publicDir, 'opengraph.jpg');
      const opengraphJpegPath = path.join(publicDir, 'opengraph.jpeg');

      let imageExt: string | null = null;
      if (fs.existsSync(opengraphPngPath)) {
        imageExt = 'png';
      } else if (fs.existsSync(opengraphJpgPath)) {
        imageExt = 'jpg';
      } else if (fs.existsSync(opengraphJpegPath)) {
        imageExt = 'jpeg';
      }

      if (!imageExt) {
        log('[meta-images] OpenGraph image not found, skipping meta tag updates');
        return html;
      }

      const imageUrl = `${baseUrl}/opengraph.${imageExt}`;
      const siteUrl = `${baseUrl}/`;

      log('[meta-images] updating meta image tags to:', imageUrl);

      if (/property="og:image"/.test(html)) {
        html = html.replace(
          /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/g,
          `<meta property="og:image" content="${imageUrl}" />`
        );
      } else {
        html = html.replace(
          /<meta\s+property="og:type"\s+content="website"\s*\/>/,
          `<meta property="og:type" content="website" />\n    <meta property="og:image" content="${imageUrl}" />`
        );
      }

      if (/name="twitter:image"/.test(html)) {
        html = html.replace(
          /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/g,
          `<meta name="twitter:image" content="${imageUrl}" />`
        );
      } else {
        html = html.replace(
          /<meta\s+name="twitter:card"\s+content="summary_large_image"\s*\/>/,
          `<meta name="twitter:card" content="summary_large_image" />\n    <meta name="twitter:image" content="${imageUrl}" />`
        );
      }

      html = html.replace(
        /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/g,
        `<meta property="og:url" content="${siteUrl}" />`
      );
      html = html.replace(
        /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/g,
        `<link rel="canonical" href="${siteUrl}" />`
      );

      return html;
    },
  };
}

function getDeploymentUrl(): string | null {
  const explicit = process.env.APP_URL || process.env.PUBLIC_URL;
  if (explicit) {
    const url = explicit.replace(/\/$/, '');
    log('[meta-images] using APP_URL/PUBLIC_URL:', url);
    return url;
  }

  if (process.env.REPLIT_INTERNAL_APP_DOMAIN) {
    const url = `https://${process.env.REPLIT_INTERNAL_APP_DOMAIN}`;
    log('[meta-images] using internal app domain:', url);
    return url;
  }

  if (process.env.REPLIT_DEV_DOMAIN) {
    const url = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    log('[meta-images] using dev domain:', url);
    return url;
  }

  // Canonical public domain for TCE Holdings (The Consolidatus Empire Holdings).
  // Used so OG/canonical tags stay pointed at the custom domain even before
  // APP_URL is set on Railway; runtime redirects still use the request host
  // until APP_URL=https://tceholdings.org is configured.
  if (process.env.NODE_ENV === 'production') {
    const url = 'https://tceholdings.org';
    log('[meta-images] using production custom domain:', url);
    return url;
  }

  return null;
}

function log(...args: any[]): void {
  if (process.env.NODE_ENV === 'production') {
    console.log(...args);
  }
}
