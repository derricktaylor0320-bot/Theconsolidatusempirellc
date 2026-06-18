import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useCart } from "@/hooks/useCart";

import logo from "@assets/generated_images/consolidatus_empire_logo_2020.png";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch {}
    queryClient.setQueryData(["/api/auth/user"], null);
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    setLocation("/");
  };

  const accountName = user?.displayName || user?.email || "";

  const links = [
    { href: "/", label: "Home" },
    { href: "/hub", label: "Centralized Hub" },
    { href: "/about", label: "About Us" },
    { href: "/canvas", label: "Branded Logo Collection" },
    { href: "/apparel", label: "Apparel" },
    { href: "/accessories", label: "Accessories" },
    { href: "/bedding", label: "Bedding & Intimates" },
    { href: "/vintage", label: "Vintage Baltimore" },
    { href: "/poetry", label: "Poetry on a Plaque" },
    { href: "/hot-dogs", label: "Premium Choice Hot Dogs" },
    { href: "/media", label: "Media & Music" },
    { href: "/fr2p", label: "The FR2P Club" },
    { href: "/pocket-booster", label: "Pocket Booster" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-display font-bold text-2xl tracking-tighter uppercase hover:text-primary transition-colors">
          <img src={logo} alt="Khomplete Khemistri Logo" className="h-12 w-12 object-contain drop-shadow-md" />
          <span>The Consolidatus <span className="gold-shine">Empire</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 mx-6 flex-1 min-w-0 overflow-x-auto">
          {links.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary uppercase tracking-widest whitespace-nowrap shrink-0 ${
                location === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Auth control (desktop) */}
          <div className="hidden md:block">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 max-w-[180px]"
                    data-testid="button-account-menu"
                  >
                    <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/20 text-primary shrink-0">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <span className="truncate text-sm">{accountName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate" data-testid="text-account-email">
                    {user?.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/hub" data-testid="link-menu-hub">
                      Centralized Hub
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" data-testid="link-menu-orders">
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button
                  size="sm"
                  className="bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display gap-2"
                  data-testid="button-signin"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          <Link href="/cart" data-testid="link-cart">
            <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 rounded-full bg-primary text-black text-[10px] font-bold flex items-center justify-center"
                  data-testid="text-cart-count"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  {links.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      className={`text-lg font-medium transition-colors hover:text-primary uppercase tracking-widest ${
                        location === link.href ? "text-primary" : "text-muted-foreground"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}

                  <div className="border-t border-border pt-4 mt-2">
                    {isAuthenticated ? (
                      <div className="flex flex-col gap-3">
                        <div
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                          data-testid="text-account-email-mobile"
                        >
                          <UserIcon className="h-4 w-4 text-primary" />
                          <span className="truncate">{accountName}</span>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsOpen(false);
                            handleLogout();
                          }}
                          className="uppercase tracking-widest gap-2"
                          data-testid="button-logout-mobile"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <Link
                        href="/auth"
                        onClick={() => setIsOpen(false)}
                      >
                        <Button
                          className="w-full bg-primary text-black hover:bg-primary/90 uppercase tracking-widest gap-2 font-display"
                          data-testid="button-signin-mobile"
                        >
                          <LogIn className="h-4 w-4" />
                          Sign In
                        </Button>
                      </Link>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
