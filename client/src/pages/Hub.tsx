import { useLocation } from "wouter";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrandSectionBanner from "@/components/BrandSectionBanner";
import EmpireDirectory from "@/components/EmpireDirectory";
import EmpireNavigationGrid from "@/components/EmpireNavigationGrid";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, CheckCircle2, LayoutDashboard } from "lucide-react";
import { getSiteLinkNumber, SITE_LINKS } from "@/lib/siteNavigation";
import CustomerFeedbackForm from "@/components/CustomerFeedbackForm";

export default function Hub() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const apparelNumber = getSiteLinkNumber("/apparel");
  const elementsNumber = getSiteLinkNumber("/elements");
  const accessoriesNumber = getSiteLinkNumber("/accessories");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
        <div className="container mx-auto px-4 py-12 relative z-10 text-center">
          <BrandSectionBanner compact />
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-3xl md:text-5xl font-bold uppercase tracking-tight"
            data-testid="text-hub-title"
          >
            The Consolidatus <span className="text-primary">Empire</span>
          </motion.h1>
          <p
            className="text-muted-foreground mt-3 mb-6 uppercase tracking-[0.3em] text-xs md:text-sm"
            data-testid="text-hub-subtitle"
          >
            Centralized Hub — pick a numbered destination below
          </p>

          {!isLoading && (
            <div className="mb-8 flex flex-col items-center gap-3">
              {isAuthenticated ? (
                <>
                  <div
                    className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm"
                    data-testid="status-hub-signed-in"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>
                      Signed in as{" "}
                      <span className="font-semibold text-primary">
                        {user?.displayName || user?.email}
                      </span>{" "}
                      — your session carries across the hub
                    </span>
                  </div>
                  {user?.isOwner && (
                    <Button
                      size="sm"
                      onClick={() => setLocation("/back-office")}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider font-display gap-2"
                      data-testid="button-hub-back-office"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Open Empire Back Office
                    </Button>
                  )}
                </>
              ) : (
                <div
                  className="inline-flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-primary/20 bg-background/60 px-5 py-3"
                  data-testid="status-hub-signed-out"
                >
                  <span className="text-sm text-muted-foreground">
                    Sign in once to unlock a connected experience across every
                    app.
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setLocation("/auth")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider font-display gap-2"
                    data-testid="button-hub-signin"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </div>
              )}
            </div>
          )}

          <section
            className="mx-auto mb-10 max-w-6xl rounded-2xl border border-primary/35 bg-background/60 p-4 text-left sm:p-6"
            aria-labelledby="hub-quick-directory-title"
            data-testid="section-hub-quick-directory"
          >
            <div className="mb-4 text-center">
              <h2
                id="hub-quick-directory-title"
                className="font-display text-xl font-bold uppercase tracking-wide text-primary sm:text-2xl"
              >
                Quick Site Directory
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Every Empire destination is numbered {SITE_LINKS.length} ways —
                no waiting for anything to spin around. Shop clothing at{" "}
                <span className="font-semibold text-foreground">
                  {apparelNumber}. Apparel
                </span>
                , accessories at{" "}
                <span className="font-semibold text-foreground">
                  {accessoriesNumber}. Accessories
                </span>
                , and lotion or skin care at{" "}
                <span className="font-semibold text-foreground">
                  {elementsNumber}. Elements Health &amp; Skincare
                </span>
                .
              </p>
            </div>
            <EmpireNavigationGrid variant="rows" showCategories />
          </section>

          <EmpireDirectory />

          <p className="text-muted-foreground text-sm mt-6 max-w-3xl mx-auto">
            One command center for every Khomplete Khemistri app. Use the
            numbered buttons above for direct access, or open the detailed
            directory cards for descriptions of each section.
          </p>

          <section
            className="mx-auto mt-10 max-w-2xl text-left"
            aria-labelledby="hub-feedback-title"
            data-testid="section-hub-feedback"
          >
            <h2
              id="hub-feedback-title"
              className="mb-4 text-center font-display text-xl font-bold uppercase tracking-wide text-primary"
            >
              Customer Voice
            </h2>
            <CustomerFeedbackForm />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
