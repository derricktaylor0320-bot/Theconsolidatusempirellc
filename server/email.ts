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
