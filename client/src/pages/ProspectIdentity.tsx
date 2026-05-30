import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmbedAuthBanner from "@/components/EmbedAuthBanner";

export default function ProspectIdentity() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow flex flex-col h-[calc(100vh-80px)]">
        <EmbedAuthBanner appName="Prospect Identity" />
        <div className="bg-secondary text-secondary-foreground py-4 text-center">
          <h1 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wider text-primary">
            Prospect Identity
          </h1>
        </div>
        <div className="flex-grow w-full relative">
          <iframe
            src="https://prospect-identifier.replit.app"
            title="Prospect Identity"
            className="absolute inset-0 w-full h-full border-0"
            data-testid="iframe-prospect-identity"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
