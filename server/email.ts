// Lightweight, host-agnostic transactional email helper.
//
// Resolves a Resend API key from (in order):
//   1. RESEND_API_KEY env var (works anywhere: Railway, local, etc.)
//   2. The Replit "resend" connector (when running on Replit with the
//      integration connected)
// If no key is available we fall back to logging the message to the server
// console so the flow still works end-to-end in development/testing.
//
// We call Resend's REST API directly with fetch so there is no extra npm
// dependency and nothing to break portability across hosts.

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function getResendApiKey(): Promise<string | null> {
  // Prefer a plain environment variable (portable across all hosts).
  if (process.env.RESEND_API_KEY) {
    return process.env.RESEND_API_KEY;
  }

  // Fall back to the Replit Resend connector when running on Replit.
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    return null;
  }

  try {
    const url = new URL(`https://${hostname}/api/v2/connection`);
    url.searchParams.set("include_secrets", "true");
    url.searchParams.set("connector_names", "resend");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        X_REPLIT_TOKEN: xReplitToken,
      },
    });

    const data = await response.json();
    const settings = data.items?.[0]?.settings;
    if (!settings) return null;

    // Be defensive about the exact field name the connector exposes.
    return (
      settings.api_key ||
      settings.apiKey ||
      settings.secret ||
      settings.secret_key ||
      null
    );
  } catch (err) {
    console.error("Failed to load Resend connector credentials:", err);
    return null;
  }
}

function getFromAddress(): string {
  // Override with a verified domain in production via RESEND_FROM.
  // onboarding@resend.dev works out of the box but only delivers to the
  // Resend account owner's email until a domain is verified.
  return process.env.RESEND_FROM || "Consolidatus Empire <onboarding@resend.dev>";
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const apiKey = await getResendApiKey();

  if (!apiKey) {
    console.warn(
      "[email] No Resend API key configured (set RESEND_API_KEY or connect the Resend integration). Logging email instead:",
    );
    console.warn(`[email] To: ${params.to}`);
    console.warn(`[email] Subject: ${params.subject}`);
    console.warn(`[email] ${params.text || params.html}`);
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[email] Resend API error (${response.status}): ${body}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[email] Failed to send email via Resend:", err);
    return false;
  }
}

export function buildPasswordResetEmail(resetUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Reset your Consolidatus Empire password";
  const text =
    `We received a request to reset your password.\n\n` +
    `Use this link to choose a new password (it expires in 1 hour and can only be used once):\n${resetUrl}\n\n` +
    `If you didn't request this, you can safely ignore this email — your password won't change.`;

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#1a0d12; padding:32px; color:#f5f5f5;">
    <div style="max-width:480px; margin:0 auto; background:#221017; border:1px solid #4a2b1a; border-radius:12px; padding:32px;">
      <h1 style="font-size:20px; margin:0 0 16px; color:#e6b94d; text-transform:uppercase; letter-spacing:1px;">Reset your password</h1>
      <p style="font-size:15px; line-height:1.6; margin:0 0 24px; color:#d9d2cc;">
        We received a request to reset the password for your Consolidatus Empire account.
        Click the button below to choose a new password. This link expires in 1 hour and can only be used once.
      </p>
      <a href="${resetUrl}"
        style="display:inline-block; background:#e6b94d; color:#1a0d12; text-decoration:none; font-weight:bold; padding:12px 24px; border-radius:8px; text-transform:uppercase; letter-spacing:1px;">
        Reset password
      </a>
      <p style="font-size:13px; line-height:1.6; margin:24px 0 0; color:#9c9089;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${resetUrl}" style="color:#e6b94d; word-break:break-all;">${resetUrl}</a>
      </p>
      <p style="font-size:13px; line-height:1.6; margin:24px 0 0; color:#9c9089;">
        If you didn't request a password reset, you can safely ignore this email — your password won't change.
      </p>
    </div>
  </div>`;

  return { subject, html, text };
}

interface ReceiptItem {
  name: string;
  quantity: number;
  amountCents: number; // per-unit price in cents
  note?: string;
}

function formatUsd(cents: number): string {
  return `$${(Math.max(0, Math.round(cents)) / 100).toFixed(2)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Email sent to the customer when the owner marks their order shipped. Includes
// the carrier + tracking number (and a clickable tracking link when one is
// available for that carrier).
export function buildShippingNotificationEmail(input: {
  items: { name: string; quantity: number }[];
  orderRef?: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}): { subject: string; html: string; text: string } {
  const subject = "Your Consolidatus Empire order has shipped";

  const itemLines = input.items.map((it) => `- ${it.name} x${it.quantity}`);
  const refLine = input.orderRef ? `Order reference: ${input.orderRef}\n` : "";
  const carrierLine = input.carrier ? `Carrier: ${input.carrier}\n` : "";
  const trackingLine = input.trackingNumber
    ? `Tracking number: ${input.trackingNumber}\n`
    : "";
  const trackingUrlLine = input.trackingUrl
    ? `Track your package: ${input.trackingUrl}\n`
    : "";

  const text =
    `Good news — your order is on its way!\n\n` +
    refLine +
    carrierLine +
    trackingLine +
    trackingUrlLine +
    `\nItems:\n${itemLines.join("\n")}\n\n` +
    `If you have any questions about your order, just reply to this email.`;

  const itemsHtml = input.items
    .map(
      (it) =>
        `<li style="padding:4px 0; color:#d9d2cc; font-size:14px;">${escapeHtml(
          it.name,
        )} <span style="color:#9c9089;">&times; ${it.quantity}</span></li>`,
    )
    .join("");

  const refHtml = input.orderRef
    ? `<p style="font-size:13px; line-height:1.6; margin:0 0 16px; color:#9c9089;">Order reference: <span style="color:#d9d2cc;">${escapeHtml(
        input.orderRef,
      )}</span></p>`
    : "";

  const carrierHtml = input.carrier
    ? `<p style="font-size:14px; line-height:1.6; margin:0 0 4px; color:#d9d2cc;">Carrier: <strong style="color:#f5f5f5;">${escapeHtml(
        input.carrier,
      )}</strong></p>`
    : "";

  const trackingHtml = input.trackingNumber
    ? `<p style="font-size:14px; line-height:1.6; margin:0 0 16px; color:#d9d2cc;">Tracking number: <strong style="color:#f5f5f5;">${escapeHtml(
        input.trackingNumber,
      )}</strong></p>`
    : "";

  const trackButtonHtml = input.trackingUrl
    ? `<a href="${escapeHtml(input.trackingUrl)}"
        style="display:inline-block; background:#e6b94d; color:#1a0d12; text-decoration:none; font-weight:bold; padding:12px 24px; border-radius:8px; text-transform:uppercase; letter-spacing:1px; margin:8px 0 8px;">
        Track your package
      </a>`
    : "";

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#1a0d12; padding:32px; color:#f5f5f5;">
    <div style="max-width:520px; margin:0 auto; background:#221017; border:1px solid #4a2b1a; border-radius:12px; padding:32px;">
      <h1 style="font-size:20px; margin:0 0 8px; color:#e6b94d; text-transform:uppercase; letter-spacing:1px;">Your order has shipped</h1>
      <p style="font-size:15px; line-height:1.6; margin:0 0 16px; color:#d9d2cc;">
        Good news — your order from the Consolidatus Empire is on its way.
      </p>
      ${refHtml}
      ${carrierHtml}
      ${trackingHtml}
      ${trackButtonHtml}
      <p style="font-size:14px; line-height:1.6; margin:16px 0 8px; color:#e6b94d; font-weight:bold;">What's shipping</p>
      <ul style="margin:0 0 16px; padding-left:18px;">${itemsHtml}</ul>
      <p style="font-size:13px; line-height:1.6; margin:24px 0 0; color:#9c9089;">
        If you have any questions about your order, just reply to this email.
      </p>
    </div>
  </div>`;

  return { subject, html, text };
}

export function buildOrderReceiptEmail(input: {
  items: ReceiptItem[];
  totalCents: number;
  orderRef?: string;
}): { subject: string; html: string; text: string } {
  const subject = "Your Consolidatus Empire order receipt";

  const refLine = input.orderRef ? `Order reference: ${input.orderRef}\n` : "";
  const textLines = input.items.map((it) => {
    const lineTotal = formatUsd(it.amountCents * it.quantity);
    const noteSuffix = it.note ? ` (${it.note})` : "";
    return `- ${it.name}${noteSuffix} x${it.quantity} — ${lineTotal}`;
  });
  const text =
    `Thanks for your order!\n\n` +
    refLine +
    `\nItems:\n${textLines.join("\n")}\n\n` +
    `Total: ${formatUsd(input.totalCents)}\n\n` +
    `If you have any questions about your order, just reply to this email.`;

  const rows = input.items
    .map((it) => {
      const lineTotal = formatUsd(it.amountCents * it.quantity);
      const unit = formatUsd(it.amountCents);
      const note = it.note
        ? `<div style="font-size:13px; color:#9c9089; margin-top:4px;">${it.note}</div>`
        : "";
      return `
      <tr>
        <td style="padding:12px 0; border-bottom:1px solid #4a2b1a; color:#d9d2cc; font-size:14px;">
          ${it.name}${note}
        </td>
        <td style="padding:12px 0; border-bottom:1px solid #4a2b1a; color:#d9d2cc; font-size:14px; text-align:center; white-space:nowrap;">
          ${it.quantity} &times; ${unit}
        </td>
        <td style="padding:12px 0; border-bottom:1px solid #4a2b1a; color:#f5f5f5; font-size:14px; text-align:right; white-space:nowrap;">
          ${lineTotal}
        </td>
      </tr>`;
    })
    .join("");

  const refHtml = input.orderRef
    ? `<p style="font-size:13px; line-height:1.6; margin:0 0 16px; color:#9c9089;">Order reference: <span style="color:#d9d2cc;">${input.orderRef}</span></p>`
    : "";

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#1a0d12; padding:32px; color:#f5f5f5;">
    <div style="max-width:520px; margin:0 auto; background:#221017; border:1px solid #4a2b1a; border-radius:12px; padding:32px;">
      <h1 style="font-size:20px; margin:0 0 8px; color:#e6b94d; text-transform:uppercase; letter-spacing:1px;">Thanks for your order</h1>
      <p style="font-size:15px; line-height:1.6; margin:0 0 16px; color:#d9d2cc;">
        Here's a receipt for your purchase from the Consolidatus Empire. We'll be in touch as your order is prepared.
      </p>
      ${refHtml}
      <table style="width:100%; border-collapse:collapse; margin:8px 0 0;">
        <tbody>
          ${rows}
          <tr>
            <td style="padding:16px 0 0; color:#e6b94d; font-size:15px; font-weight:bold;" colspan="2">Total</td>
            <td style="padding:16px 0 0; color:#e6b94d; font-size:15px; font-weight:bold; text-align:right;">${formatUsd(input.totalCents)}</td>
          </tr>
        </tbody>
      </table>
      <p style="font-size:13px; line-height:1.6; margin:24px 0 0; color:#9c9089;">
        If you have any questions about your order, just reply to this email.
      </p>
    </div>
  </div>`;

  return { subject, html, text };
}

// Email sent to a subscriber when a product they signed up for is back in stock.
export function buildRestockNotificationEmail(productTitle: string, storeUrl = "https://khomplete-khemistri-apparel.up.railway.app"): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Back in Stock: ${productTitle} — Khomplete Khemistri Apparel`;
  const text =
    `Great news! "${productTitle}" is back in stock at Khomplete Khemistri Apparel.\n\n` +
    `Head over to the store to grab it before it's gone again:\n${storeUrl}/apparel\n\n` +
    `Thank you for your patience. — The Khomplete Khemistri Team`;

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#1a0d12; padding:32px; color:#f5f5f5;">
    <div style="max-width:520px; margin:0 auto; background:#221017; border:1px solid #4a2b1a; border-radius:12px; padding:32px;">
      <h1 style="font-size:20px; margin:0 0 8px; color:#e6b94d; text-transform:uppercase; letter-spacing:1px;">Back in Stock!</h1>
      <p style="font-size:15px; line-height:1.6; margin:0 0 16px; color:#d9d2cc;">
        Great news — <strong style="color:#f5f5f5;">${escapeHtml(productTitle)}</strong> is back in stock at Khomplete Khemistri Apparel.
      </p>
      <p style="font-size:14px; line-height:1.6; margin:0 0 24px; color:#9c9089;">
        Don't wait — popular items sell out fast. Grab yours now before it's gone again.
      </p>
      <a href="${storeUrl}/apparel"
        style="display:inline-block; background:#e6b94d; color:#1a0d12; text-decoration:none; font-weight:bold; padding:12px 28px; border-radius:8px; text-transform:uppercase; letter-spacing:1px;">
        Shop Now
      </a>
      <p style="font-size:13px; line-height:1.6; margin:28px 0 0; color:#9c9089;">
        You're receiving this because you asked to be notified when this item returned to stock.
      </p>
    </div>
  </div>`;

  return { subject, html, text };
}

// Email blast sent to all subscribers when new products are added to the store.
export function buildNewArrivalsEmail(
  newItems: Array<{ title: string; price: string }>,
  storeUrl = "https://khomplete-khemistri-apparel.up.railway.app",
): { subject: string; html: string; text: string } {
  const subject = "New Arrivals Just Dropped — Khomplete Khemistri Apparel";

  const itemListText = newItems.map((p) => `• ${p.title} — $${parseFloat(p.price).toFixed(2)}`).join("\n");
  const text =
    `New items just dropped at Khomplete Khemistri Apparel!\n\n` +
    itemListText +
    `\n\nShop the full collection:\n${storeUrl}/apparel\n\n` +
    `Something for everyone — kids, adults, and the whole family.\n\n` +
    `— The Khomplete Khemistri Team`;

  const itemRowsHtml = newItems
    .map(
      (p) =>
        `<li style="padding:6px 0; border-bottom:1px solid #4a2b1a; color:#d9d2cc; font-size:14px;">
          <span style="color:#f5f5f5; font-weight:bold;">${escapeHtml(p.title)}</span>
          <span style="color:#e6b94d; margin-left:8px;">$${parseFloat(p.price).toFixed(2)}</span>
        </li>`,
    )
    .join("");

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#1a0d12; padding:32px; color:#f5f5f5;">
    <div style="max-width:520px; margin:0 auto; background:#221017; border:1px solid #4a2b1a; border-radius:12px; padding:32px;">
      <h1 style="font-size:22px; margin:0 0 6px; color:#e6b94d; text-transform:uppercase; letter-spacing:1px;">New Arrivals Just Dropped 🔥</h1>
      <p style="font-size:14px; color:#9c9089; margin:0 0 20px;">Khomplete Khemistri Apparel — something for everyone</p>
      <ul style="margin:0 0 24px; padding:0; list-style:none;">
        ${itemRowsHtml}
      </ul>
      <p style="font-size:14px; line-height:1.6; color:#d9d2cc; margin:0 0 24px;">
        From kids' gear to adults' fashion — the whole family is covered. Limited quantities, so shop early.
      </p>
      <a href="${storeUrl}/apparel"
        style="display:inline-block; background:#e6b94d; color:#1a0d12; text-decoration:none; font-weight:bold; padding:12px 28px; border-radius:8px; text-transform:uppercase; letter-spacing:1px;">
        Shop New Arrivals
      </a>
      <p style="font-size:12px; line-height:1.6; margin:28px 0 0; color:#9c9089;">
        You're receiving this because you subscribed to updates from the Consolidatus Empire.
        <a href="${storeUrl}" style="color:#e6b94d;">Visit our store</a>
      </p>
    </div>
  </div>`;

  return { subject, html, text };
}
