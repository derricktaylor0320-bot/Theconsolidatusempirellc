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
            The FR2P Club — Financial Roadway to Prosperity
          </h1>
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
