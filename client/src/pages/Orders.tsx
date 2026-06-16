import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Loader2, Package, Lock, Truck, CheckCircle2, Undo2 } from "lucide-react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import type { Order, FulfillmentStatus } from "@shared/schema";

const PAGE_SIZE = 25;

type OrdersResponse = {
  orders: Order[];
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
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Orders() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useQuery<OrdersResponse>({
    queryKey: ["/api/orders", page],
    queryFn: async () => {
      const offset = page * PAGE_SIZE;
      const res = await fetch(
        `/api/orders?limit=${PAGE_SIZE}&offset=${offset}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to load orders");
      return (await res.json()) as OrdersResponse;
    },
    enabled: isAuthenticated,
    retry: false,
    placeholderData: keepPreviousData,
  });

  const fulfillmentMutation = useMutation({
    mutationFn: async ({
      id,
      fulfillmentStatus,
    }: {
      id: string;
      fulfillmentStatus: FulfillmentStatus;
    }) => {
      const res = await fetch(`/api/orders/${id}/fulfillment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fulfillmentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update order");
      return (await res.json()) as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
  });

  const orders = data?.orders;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(total, page * PAGE_SIZE + PAGE_SIZE);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-24 flex items-center justify-center">
          <div className="max-w-md w-full text-center" data-testid="orders-locked">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-display font-bold uppercase tracking-tight mb-4">
              Owner Access Only
            </h1>
            <p className="text-muted-foreground mb-8">
              Please sign in to view your store's orders.
            </p>
            <Button
              className="bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display"
              onClick={() => navigate("/auth")}
              data-testid="button-sign-in"
            >
              Sign In
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Package className="w-8 h-8 text-primary" />
            <h1
              className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight"
              data-testid="text-orders-title"
            >
              Orders
            </h1>
          </div>

          {isLoading ? (
            <div
              className="flex items-center justify-center gap-3 text-muted-foreground py-24"
              data-testid="status-orders-loading"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading orders…</span>
            </div>
          ) : error ? (
            <div
              className="text-center text-muted-foreground py-24"
              data-testid="status-orders-error"
            >
              Something went wrong loading your orders. Please try again.
            </div>
          ) : !orders || orders.length === 0 ? (
            <div
              className="text-center text-muted-foreground py-24 border border-dashed border-primary/20 rounded-xl"
              data-testid="status-orders-empty"
            >
              <Package className="w-10 h-10 mx-auto mb-4 opacity-50" />
              <p>No orders yet. Sales will appear here once customers check out.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isPaid = order.status === "paid";
                const isFulfilled = order.fulfillmentStatus === "fulfilled";
                const isUpdating =
                  fulfillmentMutation.isPending &&
                  fulfillmentMutation.variables?.id === order.id;
                return (
                  <div
                    key={order.id}
                    className={`rounded-xl p-6 border ${
                      isFulfilled
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : isPaid
                        ? "bg-muted/30 border-primary/10"
                        : "bg-yellow-500/5 border-yellow-500/30 opacity-90"
                    }`}
                    data-testid={`card-order-${order.id}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <p
                          className="text-sm text-muted-foreground"
                          data-testid={`text-order-date-${order.id}`}
                        >
                          {formatDate(order.createdAt)}
                        </p>
                        {order.squareOrderId ? (
                          <p
                            className="text-xs text-muted-foreground/70 font-mono mt-1"
                            data-testid={`text-order-square-id-${order.id}`}
                          >
                            Square ID: {order.squareOrderId}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs uppercase tracking-wider font-display px-3 py-1 rounded-full ${
                            isPaid
                              ? "bg-primary/20 text-primary"
                              : "bg-yellow-500/20 text-yellow-500"
                          }`}
                          data-testid={`status-order-${order.id}`}
                        >
                          {isPaid ? "Paid" : "Pending"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs uppercase tracking-wider font-display px-3 py-1 rounded-full ${
                            isFulfilled
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                          data-testid={`status-fulfillment-${order.id}`}
                        >
                          {isFulfilled ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Truck className="w-3 h-3" />
                          )}
                          {isFulfilled ? "Fulfilled" : "Unfulfilled"}
                        </span>
                      </div>
                    </div>

                    <ul className="divide-y divide-primary/10">
                      {order.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between gap-4 py-3"
                          data-testid={`row-order-item-${order.id}-${idx}`}
                        >
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty {item.quantity}
                              {item.note ? ` · ${item.note}` : ""}
                            </p>
                          </div>
                          <p className="font-medium whitespace-nowrap">
                            {formatCents(item.amountCents * item.quantity)}
                          </p>
                        </li>
                      ))}
                    </ul>

                    <div className="flex justify-between items-center pt-4 mt-2 border-t border-primary/20">
                      <span className="font-display uppercase tracking-wider text-sm">
                        Total
                      </span>
                      <span
                        className="text-lg font-display font-bold text-primary"
                        data-testid={`text-order-total-${order.id}`}
                      >
                        {formatCents(order.totalCents)}
                      </span>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        variant={isFulfilled ? "outline" : "default"}
                        size="sm"
                        disabled={isUpdating}
                        className={
                          isFulfilled
                            ? "uppercase tracking-wider font-display border-primary/20"
                            : "uppercase tracking-wider font-display bg-emerald-600 text-white hover:bg-emerald-600/90"
                        }
                        onClick={() =>
                          fulfillmentMutation.mutate({
                            id: order.id,
                            fulfillmentStatus: isFulfilled
                              ? "unfulfilled"
                              : "fulfilled",
                          })
                        }
                        data-testid={`button-toggle-fulfillment-${order.id}`}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isFulfilled ? (
                          <>
                            <Undo2 className="w-4 h-4" />
                            Mark Unfulfilled
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Mark Fulfilled
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && !error && total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-4 mt-8">
              <p
                className="text-sm text-muted-foreground"
                data-testid="text-orders-range"
              >
                Showing {rangeStart}–{rangeEnd} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="uppercase tracking-wider font-display border-primary/20"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || isFetching}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <span
                  className="text-sm text-muted-foreground px-2"
                  data-testid="text-page-indicator"
                >
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  className="uppercase tracking-wider font-display border-primary/20"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1 || isFetching}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-10">
            <Link href="/hub">
              <Button
                variant="outline"
                className="uppercase tracking-wider font-display border-primary/20"
                data-testid="button-back-hub"
              >
                Back to Hub
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
