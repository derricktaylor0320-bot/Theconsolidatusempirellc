import { createHmac, timingSafeEqual } from "crypto";
import type { PublicUser } from "@shared/schema";

// ---------------------------------------------------------------------------
// Cross-app Single Sign-On (SSO) handoff tokens.
//
// The hub owns the login. The embedded apps (Prospect Identity, FR2P Club)
// are separate deployments that can't read the hub's
// session cookie. To share the hub identity we mint a short-lived, signed token
// the embedded app can either:
//   1. POST to the hub's `/api/auth/sso/verify` endpoint (no secret needed), or
//   2. Verify locally with the shared secret (HS256), see SSO_INTEGRATION.md.
//
// The token is a compact JWT (HS256). It is intentionally short-lived: it's a
// one-time handoff so the embedded app can bootstrap its own session, not a
// long-term credential.
// ---------------------------------------------------------------------------

const TOKEN_TTL_SECONDS = 120; // 2 minutes — handoff window only
const ISSUER = "consolidatus-hub";

// The signing secret. Prefer a dedicated SSO secret so it can be rotated and
// shared with embedded apps independently of the session secret. Fall back to a
// value derived from SESSION_SECRET so the feature works without extra setup.
function getSigningSecret(): string {
  const dedicated = process.env.SSO_SHARED_SECRET;
  if (dedicated) return dedicated;

  const sessionSecret =
    process.env.SESSION_SECRET || "khomplete-khemistri-hub-dev-secret";
  return `sso:${sessionSecret}`;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlToBuffer(input: string): Buffer {
  const padded = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64");
}

function sign(data: string): string {
  return base64url(createHmac("sha256", getSigningSecret()).update(data).digest());
}

export interface SsoTokenPayload {
  sub: string; // user id
  email: string;
  name: string | null;
  iss: string;
  iat: number;
  exp: number;
}

// Mint a signed handoff token for a logged-in hub user.
export function createSsoToken(user: PublicUser): {
  token: string;
  expiresIn: number;
} {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload: SsoTokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.displayName ?? null,
    iss: ISSUER,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(signingInput);

  return {
    token: `${signingInput}.${signature}`,
    expiresIn: TOKEN_TTL_SECONDS,
  };
}

export type VerifyResult =
  | { valid: true; payload: SsoTokenPayload }
  | { valid: false; reason: string };

// Verify a handoff token: structure, signature, issuer, and expiry.
export function verifySsoToken(token: string): VerifyResult {
  if (!token || typeof token !== "string") {
    return { valid: false, reason: "Missing token" };
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, reason: "Malformed token" };
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expected = sign(signingInput);

  // Constant-time comparison to avoid signature timing attacks.
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, reason: "Invalid signature" };
  }

  let payload: SsoTokenPayload;
  try {
    payload = JSON.parse(base64urlToBuffer(encodedPayload).toString("utf-8"));
  } catch {
    return { valid: false, reason: "Unreadable payload" };
  }

  if (payload.iss !== ISSUER) {
    return { valid: false, reason: "Unexpected issuer" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp < now) {
    return { valid: false, reason: "Token expired" };
  }

  return { valid: true, payload };
}
