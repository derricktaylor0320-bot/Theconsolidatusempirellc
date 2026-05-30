import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmbedAuthBanner from "@/components/EmbedAuthBanner";
import { Button } from "@/components/ui/button";
import { Shield, MapPin, Briefcase, Clock, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function GuardConnect() {
  const handleLaunchApp = () => {
    window.open('https://guard-connect-derricktaylor03.replit.app', '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <EmbedAuthBanner appName="GuardConnect" />
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shield className="w-12 h-12 text-primary" />
                </div>
              </div>
              
              <h1 
                className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tight mb-6"
                data-testid="text-guardconnect-title"
              >
                Guard<span className="text-primary">Connect</span>
              </h1>
              
              <p 
                className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto"
                data-testid="text-guardconnect-tagline"
              >
                Find Security Jobs in the DMV Area
              </p>
              
              <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
                Connect with top security companies across Washington DC, Maryland, and Virginia. 
                Browse immediate openings with transparent pay rates.
              </p>
              
              <Button
                onClick={handleLaunchApp}
                size="lg"
                className="bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display text-lg px-8 py-6 h-auto"
                data-testid="button-launch-guardconnect"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Launch GuardConnect
              </Button>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display font-bold uppercase text-center mb-16">
              Why GuardConnect?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-background p-8 rounded-xl border border-primary/10 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-display font-bold uppercase mb-4">DMV Coverage</h3>
                <p className="text-muted-foreground">
                  Serving Washington DC, Maryland, and Virginia with comprehensive job listings.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-background p-8 rounded-xl border border-primary/10 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-display font-bold uppercase mb-4">Quality Jobs</h3>
                <p className="text-muted-foreground">
                  Verified security companies with transparent pay rates and professional operations.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-background p-8 rounded-xl border border-primary/10 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-display font-bold uppercase mb-4">Easy Tracking</h3>
                <p className="text-muted-foreground">
                  GPS-verified work locations and integrated time tracking for accurate payroll.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-display font-bold uppercase mb-6">
              Ready to Find Your Next Security Position?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Whether you're a security guard looking for work or a company seeking qualified professionals, 
              GuardConnect is your one-stop platform.
            </p>
            <Button
              onClick={handleLaunchApp}
              size="lg"
              className="bg-black text-white hover:bg-primary hover:text-black uppercase tracking-wider font-display"
              data-testid="button-guardconnect-cta"
            >
              Get Started Now
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
