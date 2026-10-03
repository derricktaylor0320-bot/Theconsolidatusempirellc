import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText } from "lucide-react";
import {
  SITE_BRAND,
  SITE_SUPPORT_EMAIL,
  SITE_SUPPORT_PHONE,
  SITE_SUPPORT_PHONE_TEL,
  SITE_SMS_CARRIER_DISCLOSURE,
} from "@shared/site";
import { Link } from "wouter";

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <h1
              className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter text-center mb-4"
              data-testid="text-terms-title"
            >
              Terms of <span className="text-primary">Service</span>
            </h1>
            <p className="text-center text-muted-foreground mb-12">
              Last updated: October 3, 2026 · {SITE_BRAND}
            </p>

            <div className="space-y-8 text-muted-foreground">
              <p className="leading-relaxed">
                These Terms of Service (&quot;Terms&quot;) govern your use of the website and services
                offered by {SITE_BRAND}. By using our site or purchasing products, you agree to
                these Terms.
              </p>

              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-full shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-3 text-foreground">
                      Orders &amp; Products
                    </h2>
                    <p className="leading-relaxed">
                      Product descriptions, pricing, and availability may change. Custom and
                      print-on-demand items are made to order; see our{" "}
                      <Link href="/policies" className="text-primary hover:underline">
                        Shipping &amp; Policies
                      </Link>{" "}
                      page for fulfillment and return information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-3 text-foreground">
                  SMS / Text Messaging Program
                </h2>
                <p className="leading-relaxed mb-3">
                  When you opt in on our public{" "}
                  <Link href="/contact" className="text-primary hover:underline">
                    Contact &amp; Text Consent
                  </Link>{" "}
                  form, you authorize {SITE_BRAND} to send SMS/text messages to the mobile number
                  you provide. Consent is not a condition of purchase.
                </p>
                <p className="leading-relaxed">{SITE_SMS_CARRIER_DISCLOSURE}</p>
                <p className="leading-relaxed mt-3">
                  Our use of your information, including mobile opt-in data, is described in our{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-3 text-foreground">
                  Limitation of Liability
                </h2>
                <p className="leading-relaxed">
                  To the fullest extent permitted by law, {SITE_BRAND} is not liable for indirect
                  or consequential damages arising from your use of the site or products. Our
                  total liability for any claim related to an order is limited to the amount you
                  paid for that order.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-3 text-foreground">
                  Contact
                </h2>
                <p className="leading-relaxed">
                  Questions about these Terms:{" "}
                  <a href={`mailto:${SITE_SUPPORT_EMAIL}`} className="text-primary hover:underline">
                    {SITE_SUPPORT_EMAIL}
                  </a>{" "}
                  ·{" "}
                  <a href={`tel:${SITE_SUPPORT_PHONE_TEL}`} className="text-primary hover:underline">
                    {SITE_SUPPORT_PHONE}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
