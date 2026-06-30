import { Link } from "wouter";
import { Instagram, Twitter, Facebook } from "lucide-react";
import logo from "@assets/Screenshot_20251126_202749_Photos_1764207404143.jpg";

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
               <img src={logo} alt="Logo" className="h-12 w-12 rounded-full border border-primary/20" />
               <h3 className="font-display text-xl font-bold uppercase tracking-wider text-primary">
                 The Consolidatus Empire
               </h3>
            </div>
            <p className="text-sm text-secondary-foreground/70">
              Khomplete Khemistri Mgmt LLC. <br/>
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
            <h4 className="font-display font-semibold mb-4 uppercase tracking-wider">Support</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><a href="mailto:support@khompletekhemistri.com" className="hover:text-primary transition-colors">Contact Us</a></li>
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
          <p>&copy; {new Date().getFullYear()} Khomplete Khemistri Mgmt LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
