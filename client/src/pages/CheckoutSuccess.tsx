import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle, ShoppingBag, Mail, Loader2, PenLine, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useQuery } from "@tanstack/react-query";

interface OrderItem {
  name: string;
  quantity: number;
  amountCents: number;
  note?: string;
}

interface Order {
  id?: string;
  status: string;
  items: OrderItem[];
  totalCents: number;
}

interface CatalogProduct {
  title: string;
  imageUrl: string;
  priceId: string | null;
}

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default function CheckoutSuccess() {
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: products } = useQuery<CatalogProduct[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) return [];
      return (await res.json()) as CatalogProduct[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const catalogByName = useMemo(() => {
    const map = new Map<string, CatalogProduct>();
    for (const p of products || []) {
      map.set(p.title.trim().toLowerCase(), p);
    }
    return map;
  }, [products]);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // After a completed checkout, Square redirects here with the order id in
    // `orderId`. We pass that to the server to verify payment and fetch the
    // purchased items. (`ref` is kept as a fallback in case it's ever set.)
    const ref = params.get("orderId") || params.get("ref");
    if (!ref) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/orders/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ref,
            discountCode: params.get("discount") || undefined,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as Order;
          if (!cancelled) setOrder(data);
        }
      } catch {
        /* fall back to the generic confirmation message */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-24 flex items-center justify-center">
        <motion.div
          className="max-w-lg w-full text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
          </div>

          <h1
            className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight mb-4"
            data-testid="text-success-title"
          >
            {order && order.status !== "paid" ? "Thanks!" : "Order Confirmed"}
          </h1>

          <p
            className="text-lg text-muted-foreground mb-8"
            data-testid="text-success-message"
          >
            {order && order.status !== "paid"
              ? "We're still confirming your payment with Square. If it went through, you'll receive a confirmation email shortly."
              : "Thank you for your purchase! Your order has been placed successfully."}
          </p>

          {loading ? (
            <div
              className="flex items-center justify-center gap-3 text-muted-foreground mb-8"
              data-testid="status-order-loading"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading your order details…</span>
            </div>
          ) : order && order.items.length > 0 ? (
            <div
              className="bg-muted/30 rounded-xl p-6 mb-8 border border-primary/10 text-left"
              data-testid="order-summary"
            >
              <h2 className="font-display uppercase tracking-wider text-sm text-primary mb-4">
                Order Summary
              </h2>
              <ul className="divide-y divide-primary/10">
                {order.items.map((item, idx) => {
                  const match = catalogByName.get(item.name.trim().toLowerCase());
                  return (
                    <li
                      key={idx}
                      className="flex gap-4 py-4"
                      data-testid={`row-order-item-${idx}`}
                    >
                      <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-muted border border-primary/15">
                        {match?.imageUrl ? (
                          <img
                            src={match.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            data-testid={`img-success-item-${idx}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p
                              className="font-medium"
                              data-testid={`text-item-name-${idx}`}
                            >
                              {item.name}
                            </p>
                            <p
                              className="text-sm text-muted-foreground"
                              data-testid={`text-item-quantity-${idx}`}
                            >
                              Qty {item.quantity}
                              {item.note ? ` · ${item.note}` : ""}
                            </p>
                          </div>
                          <p
                            className="font-medium whitespace-nowrap"
                            data-testid={`text-item-total-${idx}`}
                          >
                            {formatCents(item.amountCents * item.quantity)}
                          </p>
                        </div>
                        {match?.priceId ? (
                          <Link href={`/product/${match.priceId}#reviews`}>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-3 uppercase tracking-wider font-display text-xs"
                              data-testid={`button-success-add-review-${idx}`}
                            >
                              <PenLine className="w-3.5 h-3.5 mr-1.5" />
                              Add Review
                            </Button>
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="flex justify-between items-center pt-4 mt-2 border-t border-primary/20">
                <span className="font-display uppercase tracking-wider text-sm">
                  Total
                </span>
                <span
                  className="text-lg font-display font-bold text-primary"
                  data-testid="text-order-total"
                >
                  {formatCents(order.totalCents)}
                </span>
              </div>
            </div>
          ) : null}

          <div className="bg-muted/30 rounded-xl p-6 mb-8 border border-primary/10">
            <div className="flex items-center gap-3 text-left">
              <Mail className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                A confirmation email with your order details will be sent to you
                shortly. Sign in with the same email to see this order under My
                Orders and leave reviews anytime.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apparel">
              <Button
                className="w-full sm:w-auto bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display"
                data-testid="button-continue-shopping"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
            <Link href="/my-orders">
              <Button
                variant="outline"
                className="w-full sm:w-auto uppercase tracking-wider font-display border-primary/20"
                data-testid="button-view-my-orders"
              >
                My Orders
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                className="w-full sm:w-auto uppercase tracking-wider font-display border-primary/20"
                data-testid="button-return-home"
              >
                Return Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
