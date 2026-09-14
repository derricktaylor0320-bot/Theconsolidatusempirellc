import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function FuelPerks() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow flex flex-col h-[calc(100vh-80px)]">
        <div className="bg-secondary text-secondary-foreground py-4 text-center">
          <h1 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wider text-primary">
            FR2P Fuel Rewards
          </h1>
          <p className="mt-2 text-xs md:text-sm text-secondary-foreground/70">
            A standalone fuel rewards sub-brand under The Consolidatus Empire LLC
            &amp; The FR2P Club — plans from $19.99/mo with Fleet Pro at $29.99/mo most popular.
          </p>
        </div>
        <div className="flex-grow w-full relative">
          <iframe
            src="/fuel-perks/embed/"
            title="FR2P Fuel Rewards"
            className="absolute inset-0 w-full h-full border-0"
            data-testid="iframe-fuel-perks"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
