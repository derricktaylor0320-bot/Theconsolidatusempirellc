import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, LogIn } from "lucide-react";

/**
 * Slim status strip shown above an embedded (iframe / external) app.
 * The embedded apps are separate deployments and can't share our session,
 * so we clearly indicate the hub login status and that the app opens
 * with its own sign-in where required.
 */
export default function EmbedAuthBanner({ appName }: { appName: string }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated) {
    const who = user?.displayName || user?.email;
    return (
      <div
        className="flex items-center justify-center gap-2 bg-primary/10 border-b border-primary/20 px-4 py-2 text-xs md:text-sm text-foreground/90"
        data-testid="banner-embed-signed-in"
      >
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
        <span>
          Signed in to the hub as{" "}
          <span className="font-semibold text-primary">{who}</span>. {appName}{" "}
          opens with its own sign-in where required.
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 bg-muted/40 border-b border-border px-4 py-2 text-xs md:text-sm text-muted-foreground"
      data-testid="banner-embed-signed-out"
    >
      <LogIn className="w-4 h-4 shrink-0" />
      <span>You're browsing {appName} as a guest.</span>
      <Link
        href="/auth"
        className="font-semibold text-primary hover:underline"
        data-testid="link-embed-signin"
      >
        Sign in to the hub
      </Link>
    </div>
  );
}
