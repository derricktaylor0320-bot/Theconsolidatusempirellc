import { useState } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { ShoppingBag, Trash2, Minus, Plus, ArrowLeft } from "lucide-react";

export default function Cart() {
  const { items, total, updateQuantity, removeItem } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/create-cart-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            priceId: i.priceId,
            quantity: i.quantity,
            selectedLogo: i.selectedLogo,
            selectedColor: i.selectedColor,
            selectedSize: i.selectedSize,
            selectedScent: i.selectedScent,
          })),
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage(data.error || "Something went wrong. Please try again.");
        setIsLoading(false);
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1
          className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight mb-8"
          data-testid="text-cart-title"
        >
          Your Cart
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20" data-testid="empty-cart">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
            <p className="text-lg text-muted-foreground mb-8">
              Your cart is empty.
            </p>
            <Link href="/accessories">
              <Button
                className="bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display"
                data-testid="button-start-shopping"
              >
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const slug = `${item.priceId}-${(item.selectedLogo || "")
                  .toLowerCase()
                  .replace(/\s+/g, "-")}-${(item.selectedColor || "")
                  .toLowerCase()
                  .replace(/\s+/g, "-")}-${(item.selectedSize || "")
                  .toLowerCase()
                  .replace(/\s+/g, "-")}-${(item.selectedScent || "")
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`;
                return (
                  <div
                    key={slug}
                    className="flex gap-4 border border-border rounded-xl p-4"
                    data-testid={`cart-item-${slug}`}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-24 w-24 rounded-lg object-cover bg-muted flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <h3
                          className="font-display font-semibold uppercase truncate"
                          data-testid={`text-cart-title-${slug}`}
                        >
                          {item.title}
                        </h3>
                        <button
                          onClick={() =>
                            removeItem(item.priceId, item.selectedLogo, item.selectedColor, item.selectedSize, item.selectedScent)
                          }
                          className="text-muted-foreground hover:text-red-500 shrink-0"
                          data-testid={`button-remove-${slug}`}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {item.selectedLogo && (
                        <p
                          className="text-xs text-muted-foreground mt-1"
                          data-testid={`text-cart-logo-${slug}`}
                        >
                          {item.category === "Bedding" ? "Size" : "Logo"}: {item.selectedLogo}
                        </p>
                      )}
                      {item.selectedColor && (
                        <p
                          className="text-xs text-muted-foreground mt-1"
                          data-testid={`text-cart-color-${slug}`}
                        >
                          Color: {item.selectedColor}
                        </p>
                      )}
                      {item.selectedSize && (
                        <p
                          className="text-xs text-muted-foreground mt-1"
                          data-testid={`text-cart-size-${slug}`}
                        >
                          Size: {item.selectedSize}
                        </p>
                      )}
                      {item.selectedScent && (
                        <p
                          className="text-xs text-muted-foreground mt-1"
                          data-testid={`text-cart-scent-${slug}`}
                        >
                          Scent: {item.selectedScent}
                        </p>
                      )}
                      <p className="text-sm text-primary mt-1">
                        ${item.unitPrice.toFixed(2)}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(
                                item.priceId,
                                item.selectedLogo,
                                item.quantity - 1,
                                item.selectedColor,
                                item.selectedSize,
                                item.selectedScent,
                              )
                            }
                            disabled={item.quantity <= 1}
                            data-testid={`button-decrease-${slug}`}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span
                            className="w-8 text-center font-medium"
                            data-testid={`text-qty-${slug}`}
                          >
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(
                                item.priceId,
                                item.selectedLogo,
                                item.quantity + 1,
                                item.selectedColor,
                                item.selectedSize,
                                item.selectedScent,
                              )
                            }
                            data-testid={`button-increase-${slug}`}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span
                          className="font-medium"
                          data-testid={`text-line-total-${slug}`}
                        >
                          ${(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <Link href="/accessories">
                <Button
                  variant="ghost"
                  className="gap-2 uppercase tracking-wider font-display"
                  data-testid="button-continue-shopping"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Continue Shopping
                </Button>
              </Link>
            </div>

            <div className="lg:col-span-1">
              <div className="border border-primary/20 rounded-xl p-6 sticky top-24">
                <h2 className="font-display font-bold uppercase text-xl mb-4">
                  Order Summary
                </h2>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span data-testid="text-cart-subtotal">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Shipping calculated at checkout.
                </p>
                <Button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display h-11"
                  data-testid="button-checkout"
                >
                  {isLoading ? "Processing..." : "Checkout"}
                </Button>
                {errorMessage && (
                  <p
                    className="text-xs text-red-500 mt-3"
                    data-testid="text-cart-error"
                  >
                    {errorMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
