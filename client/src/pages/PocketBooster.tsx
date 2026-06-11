import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmbedAuthBanner from "@/components/EmbedAuthBanner";
import { useEmbedSso } from "@/hooks/useEmbedSso";

const POCKET_BOOSTER_ORIGIN = "https://pocket-lift.replit.app";

export default function PocketBooster() {
  const src = useEmbedSso(POCKET_BOOSTER_ORIGIN, POCKET_BOOSTER_ORIGIN);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow flex flex-col h-[calc(100vh-80px)]">
        <EmbedAuthBanner appName="Pocket Booster" />
        <div className="bg-secondary text-secondary-foreground py-4 text-center">
          <h1 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wider text-primary">
            Pocket Booster
          </h1>
        </div>
        <div className="flex-grow w-full relative">
          <iframe
            src={src}
            title="Pocket Booster"
            className="absolute inset-0 w-full h-full border-0"
            data-testid="iframe-pocket-booster"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
