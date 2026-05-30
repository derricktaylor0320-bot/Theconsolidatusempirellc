import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmbedAuthBanner from "@/components/EmbedAuthBanner";

export default function FR2P() {
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
        <div className="flex-grow w-full relative">
          <iframe 
            src="https://fr-2-p-financial-roadway-2-prosperity-club-derricktaylor03.replit.app" 
            title="FR2P Club"
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
