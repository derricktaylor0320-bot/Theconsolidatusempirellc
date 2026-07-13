import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import {
  Loader2,
  Package,
  PenLine,
  Truck,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";

const PAGE_SIZE = 25;

type MyOrderItem = {
  name: string;
  quantity: number;
  amountCents: number;
  note?: string;
  imageUrl: string | null;
  priceId: string | null;
};

type MyOrder = {
  id: string;
  status: string;
  fulfillmentStatus: string;
  totalCents: number;
  carrier: string | null;
  trackingNumber: string | null;
  shippedAt: string | Date | null;
  createdAt: string | Date | null;
  items: MyOrderItem[];
};

type MyOrdersResponse = {
  orders: MyOrder[];
  total: number;
  limit: number;
  offset: number;
};

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MyOrders() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const { data, isLoading, isFetching, error } = useQuery<MyOrdersResponse>({
    queryKey: ["/api/orders/mine", page],
    queryFn: async () => {
      const offset = page * PAGE_SIZE;
      const res = await fetch(
        `/api/orders/mine?limit=${PAGE_SIZE}&offset=${offset}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to load your orders");
      return (await res.json()) as MyOrdersResponse;
    },
    enabled: isAuthenticated,
    retry: false,
    placeholderData: keepPreviousData,
  });

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-10">
          <h1
            className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary"
            data-testid="text-my-orders-title"
          >
            My Orders
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Every completed purchase under your account email — with a photo of
            what you ordered and a quick path to leave a review.
          </p>
        </div>

        {isLoading ? (
          <div
            className="flex items-center justify-center gap-3 py-24 text-muted-foreground"
            data-testid="status-my-orders-loading"
          >
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading your orders…</span>
          </div>
        ) : error ? (
          <div
            className="rounded-lg border border-destructive/40 bg-destructive/5 p-8 text-center"
            data-testid="status-my-orders-error"
          >
            <p className="text-destructive mb-4">
              We couldn't load your order history. Please try again.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              data-testid="button-retry-my-orders"
            >
              Retry
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div
            className="rounded-xl border border-primary/20 bg-muted/20 p-12 text-center"
            data-testid="status-my-orders-empty"
          >
            <Package className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold uppercase tracking-wider mb-2">
              No orders yet
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              When you complete a purchase with this email, your items will show
              up here with photos so you can leave a review.
            </p>
            <Link href="/apparel">
              <Button
                className="bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display"
                data-testid="button-shop-from-my-orders"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Shop Apparel
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => {
              const fulfilled = order.fulfillmentStatus === "fulfilled";
              return (
                <article
                  key={order.id}
                  className="rounded-xl border border-primary/20 bg-background/60 overflow-hidden"
                  data-testid={`card-my-order-${order.id}`}
                >
                  <header className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 border-b border-primary/15 bg-muted/20">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-primary" />
                      <span
                        className="font-medium"
                        data-testid={`text-my-order-date-${order.id}`}
                      >
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider rounded-full px-2.5 py-1 border ${
                        fulfilled
                          ? "border-primary/40 text-primary bg-primary/10"
                          : "border-border text-muted-foreground"
                      }`}
                      data-testid={`badge-fulfillment-${order.id}`}
                    >
                      {fulfilled ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Truck className="w-3.5 h-3.5" />
                      )}
                      {fulfilled ? "Shipped" : "Processing"}
                    </span>
                    <span
                      className="ml-auto font-display font-semibold text-primary"
                      data-testid={`text-my-order-total-${order.id}`}
                    >
                      {formatCents(order.totalCents)}
                    </span>
                  </header>

                  <ul className="divide-y divide-primary/10">
                    {order.items.map((item, idx) => (
                      <li
                        key={`${order.id}-${idx}`}
                        className="flex flex-col sm:flex-row gap-4 p-5"
                        data-testid={`row-my-order-item-${order.id}-${idx}`}
                      >
                        <div className="w-full sm:w-28 shrink-0 aspect-square rounded-lg overflow-hidden bg-muted border border-primary/15">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              data-testid={`img-my-order-item-${order.id}-${idx}`}
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-muted-foreground"
                              data-testid={`img-my-order-placeholder-${order.id}-${idx}`}
                            >
                              <Package className="w-8 h-8 opacity-40" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-3">
                          <div>
                            <h3
                              className="font-display font-semibold uppercase tracking-wide text-base"
                              data-testid={`text-my-order-item-name-${order.id}-${idx}`}
                            >
                              {item.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Qty {item.quantity}
                              {item.note ? ` · ${item.note}` : ""}
                              {" · "}
                              {formatCents(item.amountCents * item.quantity)}
                            </p>
                          </div>
                          {item.priceId ? (
                            <Link
                              href={`/product/${item.priceId}#reviews`}
                              className="w-full sm:w-auto"
                            >
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto uppercase tracking-wider font-display text-sm h-10"
                                data-testid={`button-add-review-order-${order.id}-${idx}`}
                              >
                                <PenLine className="w-4 h-4 mr-2" />
                                Add Review
                              </Button>
                            </Link>
                          ) : (
                            <p
                              className="text-xs text-muted-foreground"
                              data-testid={`text-review-unavailable-${order.id}-${idx}`}
                            >
                              This item is no longer in the catalog for reviews.
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <Button
                  variant="outline"
                  disabled={page <= 0 || isFetching}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  data-testid="button-my-orders-prev"
                >
                  Previous
                </Button>
                <span
                  className="text-sm text-muted-foreground"
                  data-testid="text-my-orders-page"
                >
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page + 1 >= totalPages || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  data-testid="button-my-orders-next"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
