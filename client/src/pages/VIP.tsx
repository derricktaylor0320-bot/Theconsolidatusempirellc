import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Gift, Tag, Bell, Star, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import BrandSectionBanner from "@/components/BrandSectionBanner";

export default function VIP() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "vip" }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsSubscribed(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    { icon: Tag, title: "Exclusive Discounts", desc: "Members-only sales and early access to promotions" },
    { icon: Bell, title: "New Arrivals First", desc: "Be the first to know about new products and collections" },
    { icon: Gift, title: "Special Offers", desc: "Birthday rewards and surprise gifts throughout the year" },
    { icon: Star, title: "VIP Events", desc: "Invitations to exclusive launches and pop-up events" },
  ];

  if (isSubscribed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <CheckCircle className="w-20 h-20 text-gold mx-auto mb-6" />
          <h1 className="text-3xl font-display text-gold mb-4">Welcome to the Empire!</h1>
          <p className="text-foreground/80 mb-6">
            You're now a VIP member! Get ready for exclusive deals, early access to new products, and special rewards.
          </p>
          <Button asChild className="bg-gold text-background hover:bg-gold/90">
            <a href="/">Start Shopping</a>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/10 to-transparent" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <BrandSectionBanner compact />
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-12"
          >
            <Crown className="w-16 h-16 text-gold mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-display text-gold mb-4">
              Join the Empire VIP Club
            </h1>
            <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
              Become a VIP member and unlock exclusive benefits, early access to sales, and special rewards.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card/50 border border-gold/20 rounded-lg p-6 flex items-start gap-4"
              >
                <benefit.icon className="w-8 h-8 text-gold flex-shrink-0" />
                <div>
                  <h3 className="font-display text-lg text-gold mb-1">{benefit.title}</h3>
                  <p className="text-foreground/70 text-sm">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="max-w-md mx-auto"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Your Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-card border-gold/30 text-foreground placeholder:text-foreground/50"
                  data-testid="input-vip-name"
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Your Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-card border-gold/30 text-foreground placeholder:text-foreground/50"
                  data-testid="input-vip-email"
                />
              </div>
              
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gold text-background hover:bg-gold/90 font-display text-lg py-6"
                data-testid="button-vip-submit"
              >
                {isSubmitting ? "Joining..." : "Join the VIP Club"}
              </Button>
              
              <p className="text-xs text-foreground/50 text-center">
                By joining, you agree to receive promotional emails. Unsubscribe anytime.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
