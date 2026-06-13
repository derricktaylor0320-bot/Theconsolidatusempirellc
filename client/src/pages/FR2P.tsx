import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmbedAuthBanner from "@/components/EmbedAuthBanner";
import { useEmbedSso } from "@/hooks/useEmbedSso";

const FR2P_ORIGIN =
  "https://fr-2-p-financial-roadway-2-prosperity-club-derricktaylor03.replit.app";
const PROSPECT_IDENTITY_ORIGIN = "https://fr2p-club-production.up.railway.app";

type Tab = "fr2p" | "prospect";

export default function FR2P() {
  const fr2pSrc = useEmbedSso(FR2P_ORIGIN, FR2P_ORIGIN);
  const prospectSrc = useEmbedSso(PROSPECT_IDENTITY_ORIGIN, PROSPECT_IDENTITY_ORIGIN);
  const [tab, setTab] = useState<Tab>("fr2p");

  const tabClass = (active: boolean) =>
    `px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-wider transition-colors ${
      active
        ? "bg-primary text-primary-foreground"
        : "bg-transparent text-primary border border-primary/40 hover:bg-primary/10"
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow flex flex-col h-[calc(100vh-80px)]">
        <EmbedAuthBanner appName="The FR2P Club" />
        <div className="bg-secondary text-secondary-foreground py-4 text-center">
          <h1 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wider text-primary">
            Financial Roadway 2 Prosperity Club
          </h1>
        </div>

        <div className="bg-secondary/60 border-b border-primary/20 px-4 py-3 flex flex-col items-center gap-2">
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setTab("fr2p")}
              className={tabClass(tab === "fr2p")}
              data-testid="tab-fr2p"
            >
              FR2P Club
            </button>
            <button
              type="button"
              onClick={() => setTab("prospect")}
              className={tabClass(tab === "prospect")}
              data-testid="tab-prospect-identity"
            >
              Prospect Identity
            </button>
          </div>
          {tab === "prospect" && (
            <p
              className="text-xs md:text-sm text-secondary-foreground/80 text-center max-w-2xl"
              data-testid="text-prospect-identity-description"
            >
              Marketing tool — check social media accounts and public profiles to
              identify potential prospects looking for business opportunities.
            </p>
          )}
        </div>

        <div className="flex-grow w-full relative">
          {tab === "fr2p" ? (
            <iframe
              src={fr2pSrc}
              title="FR2P Club"
              className="absolute inset-0 w-full h-full border-0"
              data-testid="iframe-fr2p"
            />
          ) : (
            <iframe
              src={prospectSrc}
              title="Prospect Identity"
              className="absolute inset-0 w-full h-full border-0"
              data-testid="iframe-prospect-identity"
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
