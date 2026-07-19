# Cross-App SSO — Integration Guide for Embedded Apps

The hub (Consolidatus Empire) owns the login. Embedded apps (Pocket Booster,
Prospect Identity, FR2P Club) are separate deployments and cannot
read the hub's session cookie. To "log in once and have it carry into all the
apps", the hub hands each app a short-lived **signed handoff token** that the app
exchanges for the hub identity, then uses to bootstrap its own session.

This file is the contract the embedded apps implement. The hub side is already
done — see `server/sso.ts`, the `/api/auth/sso/*` routes, and the live demo at
`/sso-demo`.

## How the handoff reaches your app

The hub gives your app the token in one of two ways:

1. **URL hash** — when the hub loads your app (iframe `src` or `window.open`), it
   appends `#kk_sso=<token>` to your URL. Read it from `location.hash`.
2. **postMessage** (iframes only) — post `{ type: "KK_SSO_REQUEST" }` to
   `window.parent`. The hub replies with `{ type: "KK_SSO_TOKEN", token }`. Use
   this to refresh the identity without a reload.

The token is one-time and expires in ~2 minutes. Verify it immediately and
create your own session; don't store the raw token.

## Verifying the token

### Option A — call the hub (no shared secret, recommended)

`POST https://tceholdings.org/api/auth/sso/verify`
(or `https://<hub-domain>/api/auth/sso/verify` while the custom domain is still verifying on Railway)
Body: `{ "token": "<token>" }`

Response on success (`200`):

```json
{ "valid": true, "user": { "id": "...", "email": "...", "displayName": "..." } }
```

On failure (`401`): `{ "valid": false, "error": "Token expired" }`

CORS is open on this endpoint, so you can call it from the browser or your
backend. Do the verification server-side when you can.

### Option B — verify locally (HS256)

The token is a standard JWT signed with HS256. Share the same secret on both
sides via the `SSO_SHARED_SECRET` env var (if unset on the hub, the signing key
is derived from `SESSION_SECRET`). Verify the signature, then check `iss` is
`consolidatus-hub` and `exp` is in the future. Claims: `sub` (user id), `email`,
`name`, `iss`, `iat`, `exp`.

## Drop-in browser client

```js
// On your embedded app's load:
async function adoptHubIdentity() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const token = params.get("kk_sso");
  if (!token) return null;

  const res = await fetch("https://<hub-domain>/api/auth/sso/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) return null;

  const { user } = await res.json();
  // Create YOUR app's session for `user` here (match on email or id).
  history.replaceState(null, "", location.pathname + location.search); // drop token from URL
  return user;
}
```

## Notes

- Match hub users to your app's accounts by `email` (stable) or `id`.
- Keep verifying expiry — the token is a handoff, not a long-lived credential.
- Set `SSO_SHARED_SECRET` to the same value on the hub and any app using Option B,
  and rotate it there if needed.
