import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";

/**
 * Hub entry point for The FR2P Club. The full club app is self-hosted at
 * /fr2p/embed (no external Railway iframe). Use a full page navigation so the
 * hub SPA router does not swallow the embed path.
 */
export default function FR2P() {
  useEffect(() => {
    window.location.replace("/fr2p/embed/");
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="text-center space-y-3" data-testid="fr2p-redirecting">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <h1 className="font-display text-xl font-bold uppercase tracking-wider text-primary">
            Opening The FR2P Club
          </h1>
          <p className="text-sm text-muted-foreground">
            Taking you to the Financial Roadway 2 Prosperity experience…
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
