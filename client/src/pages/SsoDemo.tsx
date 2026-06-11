import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, KeyRound, ArrowRight } from "lucide-react";

interface VerifiedUser {
  id: string;
  email: string;
  displayName: string | null;
}

type Status =
  | { state: "idle" }
  | { state: "verifying" }
  | { state: "verified"; user: VerifiedUser }
  | { state: "error"; message: string };

// Read the SSO handoff token an embedded app would receive in its URL hash.
function readTokenFromHash(): string | null {
  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  const token = params.get("kk_sso");
  return token ? decodeURIComponent(token) : null;
}

/**
 * Stand-in for an embedded app, used to demonstrate cross-app SSO end to end.
 *
 * It deliberately does NOT use the hub session/cookie. It only takes the SSO
 * handoff token (from its URL hash, exactly like a real embedded app receives
 * it) and exchanges it at `/api/auth/sso/verify` for the hub identity — proving
 * an external app can read who is signed in without a second login.
 */
export default function SsoDemo() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function verify(rawToken: string) {
    setStatus({ state: "verifying" });
    try {
      const res = await fetch("/api/auth/sso/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: rawToken }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setStatus({ state: "verified", user: data.user });
      } else {
        setStatus({
          state: "error",
          message: data.error || "Token could not be verified",
        });
      }
    } catch (err) {
      setStatus({ state: "error", message: "Network error verifying token" });
    }
  }

  // On load, pick up a handoff token from the hash and verify it.
  useEffect(() => {
    const t = readTokenFromHash();
    setToken(t);
    if (t) verify(t);
  }, []);

  // Simulate the hub handing this page a token (what the embed pages do for
  // real iframes). Fetches a token using the hub session, then verifies it as
  // if this were a separate app that just received it.
  async function simulateHandoff() {
    setStatus({ state: "verifying" });
    try {
      const res = await fetch("/api/auth/sso/token", { credentials: "include" });
      if (!res.ok) {
        setStatus({
          state: "error",
          message:
            "You are not signed in to the hub. Sign in first, then run the demo.",
        });
        return;
      }
      const { token: fresh } = (await res.json()) as { token: string };
      window.location.hash = `kk_sso=${encodeURIComponent(fresh)}`;
      setToken(fresh);
      verify(fresh);
    } catch {
      setStatus({ state: "error", message: "Could not fetch a handoff token" });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-16 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <KeyRound className="w-8 h-8 text-primary" />
          <h1
            className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight"
            data-testid="text-sso-demo-title"
          >
            Cross-App SSO Demo
          </h1>
        </div>

        <p className="text-muted-foreground mb-8">
          This page acts as a stand-in for one of the embedded apps. It does not
          use the hub login cookie. It only takes a one-time signed handoff token
          and asks the hub to verify it — exactly how Pocket Booster, Prospect
          Identity, and FR2P Club read the hub identity without a
          second login.
        </p>

        <Button
          onClick={simulateHandoff}
          className="bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display mb-10"
          data-testid="button-simulate-handoff"
        >
          Simulate hub handoff <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <div className="rounded-xl border border-border p-6 bg-muted/20">
          <h2 className="font-display uppercase text-lg font-bold mb-4">
            Result
          </h2>

          {status.state === "idle" && (
            <p className="text-muted-foreground" data-testid="status-sso-idle">
              No handoff token yet. Click “Simulate hub handoff” above (while
              signed in to the hub), or open this page with a{" "}
              <code className="text-primary">#kk_sso=…</code> token in the URL.
            </p>
          )}

          {status.state === "verifying" && (
            <p className="text-muted-foreground" data-testid="status-sso-verifying">
              Verifying handoff token…
            </p>
          )}

          {status.state === "verified" && (
            <div
              className="flex items-start gap-3 text-foreground"
              data-testid="status-sso-verified"
            >
              <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-500">
                  Hub identity resolved — no second login.
                </p>
                <p className="mt-2">
                  Signed in as{" "}
                  <span className="font-semibold text-primary">
                    {status.user.displayName || status.user.email}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {status.user.email} · id {status.user.id}
                </p>
              </div>
            </div>
          )}

          {status.state === "error" && (
            <div
              className="flex items-start gap-3"
              data-testid="status-sso-error"
            >
              <XCircle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
              <p className="text-destructive">{status.message}</p>
            </div>
          )}

          {token && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Handoff token
              </p>
              <code
                className="block break-all text-xs bg-background border border-border rounded p-3 text-muted-foreground"
                data-testid="text-sso-token"
              >
                {token}
              </code>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
