import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Rocket } from "lucide-react";

export default function PocketBooster() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="bg-primary/10 rounded-full p-6 mb-8 border border-primary/30">
          <Rocket className="h-12 w-12 text-primary" />
        </div>
        <h1
          className="font-display text-4xl md:text-5xl font-bold uppercase tracking-wider text-primary mb-4"
          data-testid="text-pocket-booster-title"
        >
          Pocket Booster
        </h1>
        <p className="text-2xl md:text-3xl font-display font-bold mb-6" data-testid="text-coming-soon">
          Coming Soon
        </p>
        <p className="text-muted-foreground max-w-xl text-lg" data-testid="text-coming-soon-description">
          Pocket Booster is our microloan company — community-focused lending to
          help fund and grow your business. Check back soon.
        </p>
      </main>
      <Footer />
    </div>
  );
}
