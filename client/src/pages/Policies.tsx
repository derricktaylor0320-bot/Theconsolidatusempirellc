import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Package, Clock, Mail, AlertCircle } from "lucide-react";

export default function Policies() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter text-center mb-4" data-testid="text-policies-title">
              Shipping & <span className="text-primary">Policies</span>
            </h1>
            <p className="text-center text-muted-foreground mb-12">
              Important information about orders, shipping, and returns
            </p>

            <div className="space-y-8">
              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-3" data-testid="text-shipping-title">
                      Shipping Information
                    </h2>
                    <p className="text-muted-foreground leading-relaxed" data-testid="text-shipping-info">
                      Most orders are processed and shipped within <strong className="text-foreground">5-7 business days</strong>. 
                      All items are fulfilled through our trusted print-on-demand partners including Amazon, Printful, and Printify 
                      to ensure high-quality products with your chosen logo design.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-3" data-testid="text-delivery-title">
                      Delivery Times
                    </h2>
                    <p className="text-muted-foreground leading-relaxed" data-testid="text-delivery-info">
                      Please allow <strong className="text-foreground">up to 2 weeks</strong> for delivery before reaching out about your order. 
                      Due to current mail service delays, packages may sometimes arrive later than expected. 
                      We understand this can be frustrating, and we appreciate your patience during these times.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <AlertCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-3" data-testid="text-returns-title">
                      Returns & Refunds
                    </h2>
                    <p className="text-muted-foreground leading-relaxed" data-testid="text-returns-info">
                      At this time, <strong className="text-foreground">all sales are final</strong> and we do not offer refunds. 
                      Each item is custom-made with your selected logo design specifically for you. 
                      We are committed to quality and will work with you if there are any issues with your order.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mt-3 text-sm italic">
                      This policy may be updated in the future as we continue to grow and improve our services.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-3" data-testid="text-issues-title">
                      Order Issues
                    </h2>
                    <p className="text-muted-foreground leading-relaxed" data-testid="text-issues-info">
                      If you have not received your order after <strong className="text-foreground">2 weeks</strong>, please contact us 
                      so we can investigate the status of your shipment. We will look into what may have caused the delay and 
                      communicate any updates to you via email. Our goal is to ensure every customer receives their order 
                      and is satisfied with their purchase.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground text-sm">
                Questions? Contact us at <a href="mailto:supporttheconsolidatusempire@gmail.com" className="text-primary hover:underline">supporttheconsolidatusempire@gmail.com</a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
