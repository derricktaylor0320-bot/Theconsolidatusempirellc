import { Link, useLocation } from "wouter";
import { ShoppingCart, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import CompassNavigation from "@/components/CompassNavigation";
import { useCompassNavigation } from "@/hooks/useCompassNavigation";

import logo from "@assets/brand/consolidatus_empire_crest_blue_silver.jpg";

export default function Navbar() {
  const [, setLocation] = useLocation();
  const { isOpen, setIsOpen } = useCompassNavigation();
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

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/50 bg-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-secondary/85 shadow-[0_0_2rem_hsl(219_96%_54%/0.35)]">
      <div className="container mx-auto flex h-20 items-center justify-between gap-2 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 font-display text-2xl font-bold uppercase tracking-tighter transition-colors hover:text-primary"
        >
          <img src={logo} alt="The Consolidatus Empire LLC crest" className="brand-crest-glow h-12 w-12 rounded-full object-contain ring-1 ring-primary/70" />
          <span className="hidden silver-shine lg:inline">The Consolidatus Empire LLC</span>
          <span className="silver-shine text-lg lg:hidden">TCE</span>
        </Link>

        <div className="flex min-w-0 flex-1 justify-center px-1 sm:px-2">
          <CompassNavigation
            accountName={accountName}
            isAuthenticated={isAuthenticated}
            isOpen={isOpen}
            onLogout={handleLogout}
            onOpenChange={setIsOpen}
            variant="centered"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover shrink-0 border border-primary/40"
                        data-testid="img-navbar-avatar"
                      />
                    ) : (
                      <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/20 text-primary shrink-0">
                        <UserIcon className="h-4 w-4" />
                      </span>
                    )}
                    <span className="truncate text-sm">{accountName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate" data-testid="text-account-email">
                    {user?.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" data-testid="link-menu-profile">
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/hub" data-testid="link-menu-hub">
                      Centralized Hub
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/invest" data-testid="link-menu-invest">
                      Investor Back Office
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" data-testid="link-menu-orders">
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  {user?.isOwner && (
                    <DropdownMenuItem asChild>
                      <Link href="/back-office" data-testid="link-menu-back-office">
                        Empire Back Office
                      </Link>
                    </DropdownMenuItem>
                  )}
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
                  className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider font-display gap-2"
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
                  className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center"
                  data-testid="text-cart-count"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
