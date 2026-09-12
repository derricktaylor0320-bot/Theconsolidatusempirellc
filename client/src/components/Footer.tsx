import { Link } from "wouter";
import { Instagram, Twitter, Facebook } from "lucide-react";
import logo from "@assets/brand/consolidatus_empire_crest_blue_silver.jpg";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-primary/25 bg-secondary/95 py-12 text-secondary-foreground">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
               <img src={logo} alt="The Consolidatus Empire LLC Logo" className="brand-crest-glow h-12 w-12 rounded-full object-contain" data-testid="img-footer-logo" />
               <h3 className="font-display text-xl font-bold uppercase tracking-wider text-primary">
                 The Consolidatus Empire LLC
               </h3>
            </div>
            <p className="text-sm text-secondary-foreground/70">
              The Consolidatus Empire LLC. <br/>
              Merging urban culture with premium quality. Designed for those who create their own formula for success.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link href="/canvas" className="hover:text-primary transition-colors">Our Story</Link></li>
              <li><Link href="/number-three" className="hover:text-primary transition-colors">The Number Three</Link></li>
              <li><Link href="/apparel" className="hover:text-primary transition-colors">Apparel</Link></li>
              <li><Link href="/football-teams" className="hover:text-primary transition-colors">Football Sports Edition</Link></li>
              <li><Link href="/feminine" className="hover:text-primary transition-colors">Feminine Collection</Link></li>
              <li><Link href="/masculine" className="hover:text-primary transition-colors">Masculine Collection</Link></li>
              <li><Link href="/accessories" className="hover:text-primary transition-colors">Accessories</Link></li>
              <li><Link href="/wine" className="hover:text-primary transition-colors">Founder's Signature Wine</Link></li>
              <li><Link href="/hub" className="hover:text-primary transition-colors">Centralized Hub</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 uppercase tracking-wider">Apps</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link href="/pocket-booster" className="hover:text-primary transition-colors">Pocket Booster</Link></li>
              <li><Link href="/expense-relief" className="hover:text-primary transition-colors">TCE Expense Advantage</Link></li>
              <li><Link href="/fr2p" className="hover:text-primary transition-colors">The FR2P Club</Link></li>
              <li><Link href="/fuel-perks" className="hover:text-primary transition-colors">FR2P Fuel Rewards</Link></li>
              <li><Link href="/invest" className="hover:text-primary transition-colors">Empire Invest</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 uppercase tracking-wider">Support</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li>
                <span className="font-medium text-secondary-foreground">Contact Us</span>
                <ul className="mt-2 space-y-2">
                  <li>
                    <a href="mailto:theconsolidatusempirellc@gmail.com" className="hover:text-primary transition-colors break-all">
                      theconsolidatusempirellc@gmail.com
                    </a>
                  </li>
                  <li>
                    <a href="tel:+18445612444" className="hover:text-primary transition-colors">
                      844-561-2444
                    </a>
                    <span className="text-secondary-foreground/50"> (Toll Free)</span>
                  </li>
                  <li>Hours: 10 AM – 6 PM ET</li>
                  <li className="text-xs text-secondary-foreground/50 leading-relaxed">
                    Our toll-free line is available 24 hours a day, but there is no guarantee you will reach us after 6:00 PM Eastern Time.
                  </li>
                </ul>
              </li>
              <li><Link href="/policies" className="hover:text-primary transition-colors">Shipping & Policies</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 uppercase tracking-wider">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
        <div className="border-t border-secondary-foreground/10 mt-12 pt-8 text-center text-xs text-secondary-foreground/50">
          <p>&copy; {new Date().getFullYear()} The Consolidatus Empire LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
