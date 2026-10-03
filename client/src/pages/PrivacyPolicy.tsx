import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield } from "lucide-react";
import {
  SITE_BRAND,
  SITE_SUPPORT_EMAIL,
  SITE_SUPPORT_PHONE,
  SITE_SUPPORT_PHONE_TEL,
  SITE_SMS_MOBILE_OPT_IN_PRIVACY,
} from "@shared/site";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <h1
              className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter text-center mb-4"
              data-testid="text-privacy-title"
            >
              Privacy <span className="text-primary">Policy</span>
            </h1>
            <p className="text-center text-muted-foreground mb-12">
              Last updated: October 3, 2026 · {SITE_BRAND}
            </p>

            <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
              <p className="leading-relaxed">
                {SITE_BRAND} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This
                Privacy Policy describes how we collect, use, and protect personal information when you
                visit our website, place orders, or contact us.
              </p>

              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-3 text-foreground">
                  Information We Collect
                </h2>
                <p className="leading-relaxed">
                  We may collect your name, email address, phone number, shipping and billing details,
                  order history, and messages you send through our contact forms. We also collect
                  standard technical data such as browser type and pages visited to operate and improve
                  our site.
                </p>
              </div>

              <div className="bg-card border border-primary/30 rounded-lg p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-full shrink-0">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2
                      className="font-display text-xl font-bold uppercase tracking-wide mb-3 text-foreground"
                      data-testid="text-sms-opt-in-privacy"
                    >
                      SMS / Text Messaging &amp; Mobile Opt-In
                    </h2>
                    <p className="leading-relaxed mb-3">
                      If you opt in on our{" "}
                      <Link href="/contact" className="text-primary hover:underline">
                        Contact &amp; Text Consent
                      </Link>{" "}
                      page, we use your mobile number only to send SMS/text messages you requested
                      (for example, responses to your inquiries or service-related updates). You may
                      opt out at any time by replying STOP.
                    </p>
                    <p className="leading-relaxed font-medium text-foreground">
                      {SITE_SMS_MOBILE_OPT_IN_PRIVACY}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-3 text-foreground">
                  How We Use Information
                </h2>
                <p className="leading-relaxed">
                  We use personal information to fulfill orders, provide customer support, send
                  communications you have requested (including SMS where you have opted in),
                  prevent fraud, and improve our products and services. We do not sell personal
                  information to data brokers.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-3 text-foreground">
                  Sharing With Service Providers
                </h2>
                <p className="leading-relaxed">
                  We may share information with trusted vendors who help us operate our business
                  (for example, payment processors, email delivery, or shipping partners) under
                  contracts that limit their use of your data. This does not include selling or
                  sharing mobile opt-in consent for third-party marketing, as stated above.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-3 text-foreground">
                  Your Choices &amp; Contact
                </h2>
                <p className="leading-relaxed">
                  You may request access or correction of your personal information by emailing{" "}
                  <a href={`mailto:${SITE_SUPPORT_EMAIL}`} className="text-primary hover:underline">
                    {SITE_SUPPORT_EMAIL}
                  </a>{" "}
                  or calling{" "}
                  <a href={`tel:${SITE_SUPPORT_PHONE_TEL}`} className="text-primary hover:underline">
                    {SITE_SUPPORT_PHONE}
                  </a>
                  . For SMS, reply STOP to cancel or HELP for help.
                </p>
                <p className="leading-relaxed mt-3">
                  See also our{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>
                  .
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
