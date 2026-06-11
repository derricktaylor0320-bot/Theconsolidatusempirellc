import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

// Fetch a short-lived SSO handoff token for the signed-in hub user.
async function fetchSsoToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/sso/token", { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Wires up the cross-app SSO handoff for an embedded (iframe) app.
 *
 * When the hub user is signed in, this hook:
 *   1. Appends the handoff token to the iframe URL (as a `#kk_sso=` hash), so an
 *      embedded app can read the hub identity on first load.
 *   2. Answers `KK_SSO_REQUEST` postMessage calls from the embedded app with a
 *      fresh token, so the app can refresh the identity without a reload.
 *
 * Embedded apps verify the token via the hub's `/api/auth/sso/verify` endpoint
 * (see SSO_INTEGRATION.md). Apps that haven't adopted SSO yet simply ignore the
 * extra hash/messages and keep working as before.
 */
export function useEmbedSso(baseSrc: string, allowedOrigin: string) {
  const { isAuthenticated, isLoading } = useAuth();
  const [src, setSrc] = useState(baseSrc);
  const tokenRef = useRef<string | null>(null);

  // Build the initial iframe src with a handoff token in the hash.
  useEffect(() => {
    let cancelled = false;

    if (isLoading) return;

    if (!isAuthenticated) {
      tokenRef.current = null;
      setSrc(baseSrc);
      return;
    }

    fetchSsoToken().then((token) => {
      if (cancelled) return;
      tokenRef.current = token;
      if (token) {
        const sep = baseSrc.includes("#") ? "&" : "#";
        setSrc(`${baseSrc}${sep}kk_sso=${encodeURIComponent(token)}`);
      } else {
        setSrc(baseSrc);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [baseSrc, isAuthenticated, isLoading]);

  // Answer token-refresh requests from the embedded app.
  useEffect(() => {
    if (!isAuthenticated) return;

    async function handleMessage(event: MessageEvent) {
      if (allowedOrigin !== "*" && event.origin !== allowedOrigin) return;
      const data = event.data;
      if (!data || data.type !== "KK_SSO_REQUEST") return;

      const token = (await fetchSsoToken()) ?? tokenRef.current;
      if (!token) return;

      const target = event.source as Window | null;
      target?.postMessage(
        { type: "KK_SSO_TOKEN", token },
        allowedOrigin === "*" ? "*" : allowedOrigin,
      );
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isAuthenticated, allowedOrigin]);

  return src;
}
