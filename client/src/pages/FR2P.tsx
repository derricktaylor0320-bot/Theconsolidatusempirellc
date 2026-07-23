import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmbedAuthBanner from "@/components/EmbedAuthBanner";
import { useEmbedSso } from "@/hooks/useEmbedSso";

const FR2P_ORIGIN = "https://fr2p-club-production.up.railway.app";

export default function FR2P() {
  const src = useEmbedSso(FR2P_ORIGIN, FR2P_ORIGIN);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow flex flex-col h-[calc(100vh-80px)]">
        <EmbedAuthBanner appName="The FR2P Club" />
        <div className="bg-secondary text-secondary-foreground py-4 text-center">
          <h1 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wider text-primary">
            Financial Roadway 2 Prosperity Club
          </h1>
          <p className="mt-2 text-xs md:text-sm text-secondary-foreground/70">
            Pocket Booster&apos;s eight program tabs (S1–S8) live on{" "}
            <Link
              href="/pocket-booster#program-codes"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
              data-testid="link-fr2p-pathway"
            >
              Pocket Booster
            </Link>
            .
          </p>
        </div>
        <div className="flex-grow w-full relative">
          <iframe
            src={src}
            title="The FR2P Club"
            className="absolute inset-0 w-full h-full border-0"
            data-testid="iframe-fr2p"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
