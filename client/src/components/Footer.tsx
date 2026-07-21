import { Link } from "wouter";
import { Instagram, Twitter, Facebook } from "lucide-react";
import logo from "@assets/badge_consolidatus_empire_standalone_218.png";

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
               <img src={logo} alt="The Consolidatus Empire LLC Logo" className="h-12 w-12 object-contain drop-shadow-md" data-testid="img-footer-logo" />
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
              <li><Link href="/accessories" className="hover:text-primary transition-colors">Accessories</Link></li>
              <li><Link href="/hub" className="hover:text-primary transition-colors">Centralized Hub</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 uppercase tracking-wider">Apps</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link href="/pathway" className="hover:text-primary transition-colors" data-testid="link-footer-pathway">Pocket Booster Stages</Link></li>
              <li><Link href="/pocket-booster" className="hover:text-primary transition-colors">Pocket Booster</Link></li>
              <li><Link href="/fr2p" className="hover:text-primary transition-colors">FR2P Club</Link></li>
              <li><Link href="/invest" className="hover:text-primary transition-colors">Empire Invest</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 uppercase tracking-wider">Support</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><a href="mailto:theconsolidatusempire@gmail.com" className="hover:text-primary transition-colors">Contact Us</a></li>
              <li><a href="tel:+18445612444" className="hover:text-primary transition-colors" data-testid="link-footer-phone">Toll-Free: 844-561-2444</a></li>
              <li><a href="mailto:theconsolidatusempire@gmail.com" className="hover:text-primary transition-colors" data-testid="link-footer-email">theconsolidatusempire@gmail.com</a></li>
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
