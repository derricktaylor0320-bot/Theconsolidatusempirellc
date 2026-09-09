import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/useCart";
import { trackBeginCheckout, toGaItemFromCart } from "@/lib/analytics";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingBag, Trash2, Minus, Plus, ArrowLeft } from "lucide-react";
import ShipStateTaxSummary, { useShipToState } from "@/components/ShipStateTaxSummary";
import BundleUpsell from "@/components/BundleUpsell";
import { getBundleById } from "@shared/bundlePricing";
import { DISCOUNT_CODES, parseDiscountCode } from "@shared/discounts";
import { readReturnVisitorDiscountEmail } from "@/hooks/useSiteVisits";
import {
  elementsCareBasketSavingsDollars,
  isElementsCareBasketProduct,
  parseElementsCareBasketSelection,
} from "@shared/elementsCareBasket";
import {
  elementsDuoSavingsDollars,
  isElementsDuoProduct,
  parseElementsDuoSelection,
} from "@shared/elementsDuo";
import {
  deodorantPricingLabel,
  deodorantTotalDollars,
  isElementsDeodorantProduct,
} from "@shared/elementsDeodorant";
import {
  bodyButterBundlePitch,
  bodyButterPricingLabel,
  bodyButterTotalDollars,
  isElementsBodyButterProduct,
} from "@shared/elementsBodyButter";

type DiscountEligibility = {
  paidOrders: number;
  frequentShopperMinOrders: number;
  codes: Record<
    string,
    { eligible: boolean; percent: number; description: string }
  >;
};

export default function Cart() {
  const {
    items,
    total,
    updateQuantity,
    removeItem,
    setLighterBundle,
    lighterBundleId,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [shipToState, setShipToState] = useShipToState();
  const [discountInput, setDiscountInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [discountMessage, setDiscountMessage] = useState("");

  const { data: eligibility } = useQuery<DiscountEligibility>({
    queryKey: ["/api/discounts/eligibility"],
    enabled: isAuthenticated,
  });

  const returnVisitorEmail = readReturnVisitorDiscountEmail();

  useEffect(() => {
    if (returnVisitorEmail && !appliedCode) {
      setAppliedCode(DISCOUNT_CODES.RETURN_VISITOR);
      setDiscountInput(DISCOUNT_CODES.RETURN_VISITOR);
      setDiscountMessage("Return Visitor — $5 off will be applied at checkout.");
    }
  }, [returnVisitorEmail, appliedCode]);

  const appliedDef = parseDiscountCode(appliedCode);
  const discountPercent = appliedDef?.percent || 0;
  const fixedDiscountDollars = (appliedDef?.fixedAmountCents || 0) / 100;
  const discountAmount =
    fixedDiscountDollars > 0
      ? Math.min(fixedDiscountDollars, total)
      : total * (discountPercent / 100);
  const discountedSubtotal = Math.max(0, total - discountAmount);

  const handleApplyDiscount = () => {
    setErrorMessage("");
    const parsed = parseDiscountCode(discountInput);
    if (!parsed) {
      setAppliedCode("");
      setDiscountMessage(
        "That code isn't recognized. Try Discount10%, Discount15%, or ReturnVisitor5.",
      );
      return;
    }
    if (parsed.requiresAuth && !isAuthenticated) {
      setAppliedCode("");
      setDiscountMessage("Please sign in to apply a discount code.");
      return;
    }
    if (parsed.requiresSubscriberEmail && !returnVisitorEmail) {
      setAppliedCode("");
      setDiscountMessage(
        "Join the Air Genesis email list on the product page to unlock ReturnVisitor5.",
      );
      return;
    }
    if (parsed.requiresAuth) {
      const status = eligibility?.codes?.[parsed.code];
      if (status && !status.eligible) {
        setAppliedCode("");
        setDiscountMessage(status.description);
        return;
      }
    }
    setAppliedCode(parsed.code);
    setDiscountInput(parsed.code);
    setDiscountMessage(`${parsed.label} will be applied at checkout.`);
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!shipToState) {
      setErrorMessage("Please select the state your order ships to so we can calculate sales tax.");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/create-cart-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          shipToState,
          discountCode: appliedCode || undefined,
          discountEmail:
            appliedCode === DISCOUNT_CODES.RETURN_VISITOR
              ? returnVisitorEmail || undefined
              : undefined,
          items: items.map((i) => ({
            priceId: i.priceId,
            quantity: i.quantity,
            selectedLogo: i.selectedLogo,
            selectedColor: i.selectedColor,
            selectedSize: i.selectedSize,
            selectedScent: i.selectedScent,
            bundleId: i.bundleId,
          })),
        }),
      });
      const data = await response.json();
      if (data.url) {
        trackBeginCheckout(
          items.map((item) => toGaItemFromCart(item)),
          total,
        );
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
                className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider font-display"
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
                const isCareBasketLine = isElementsCareBasketProduct(item.priceId, item.title);
                const careBasketSelection = isCareBasketLine
                  ? parseElementsCareBasketSelection(item.selectedScent)
                  : null;
                const isDuoLine = isElementsDuoProduct(item.priceId, item.title);
                const duoSelection = isDuoLine
                  ? parseElementsDuoSelection(item.selectedScent)
                  : null;
                const isDeodorantLine = isElementsDeodorantProduct(
                  item.priceId,
                  item.title,
                );
                const isBodyButterLine = isElementsBodyButterProduct(
                  item.priceId,
                  item.title,
                );
                const lineTotal = isDeodorantLine
                  ? deodorantTotalDollars(item.quantity)
                  : isBodyButterLine
                    ? bodyButterTotalDollars(item.quantity)
                    : item.unitPrice * item.quantity;
                return (
                  <div
                    key={slug}
                    className="flex gap-4 border border-border rounded-xl p-4"
                    data-testid={`cart-item-${slug}`}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className={`h-24 w-24 rounded-lg bg-muted flex-shrink-0 ${item.image?.includes("kk_branded_logo_lighter") ? "object-contain p-1" : "object-cover"}`}
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
                      {careBasketSelection && (
                        <>
                          <p
                            className="text-xs text-muted-foreground mt-1"
                            data-testid={`text-cart-wash-${slug}`}
                          >
                            3-in-1 wash: {careBasketSelection.wash}
                          </p>
                          <p
                            className="text-xs text-muted-foreground mt-1"
                            data-testid={`text-cart-butter-${slug}`}
                          >
                            Body butter: {careBasketSelection.butterScent}
                          </p>
                          <p
                            className="text-xs text-muted-foreground mt-1"
                            data-testid={`text-cart-deodorant-${slug}`}
                          >
                            Deodorant: {careBasketSelection.deodorant}
                          </p>
                          <p
                            className="text-xs text-muted-foreground mt-1"
                            data-testid={`text-cart-body-oil-1-${slug}`}
                          >
                            Body oil 1: {careBasketSelection.bodyOil1}
                          </p>
                          <p
                            className="text-xs text-muted-foreground mt-1"
                            data-testid={`text-cart-body-oil-2-${slug}`}
                          >
                            Body oil 2: {careBasketSelection.bodyOil2}
                          </p>
                        </>
                      )}
                      {duoSelection && (
                        <>
                          <p
                            className="text-xs text-muted-foreground mt-1"
                            data-testid={`text-cart-wash-${slug}`}
                          >
                            3-in-1 wash: {duoSelection.wash}
                          </p>
                          <p
                            className="text-xs text-muted-foreground mt-1"
                            data-testid={`text-cart-scent-${slug}`}
                          >
                            Body butter: {duoSelection.butterScent}
                          </p>
                        </>
                      )}
                      {item.selectedScent && !duoSelection && !careBasketSelection && (
                        <p
                          className="text-xs text-muted-foreground mt-1"
                          data-testid={`text-cart-scent-${slug}`}
                        >
                          {/\bgel\b/i.test(item.title) ? "Flavor" : "Scent"}: {item.selectedScent}
                        </p>
                      )}
                      {isCareBasketLine && (
                        <p
                          className="text-xs text-primary mt-1"
                          data-testid={`text-cart-care-basket-savings-${slug}`}
                        >
                          Save ${elementsCareBasketSavingsDollars()} vs buying separately
                        </p>
                      )}
                      {isDuoLine && (
                        <p
                          className="text-xs text-primary mt-1"
                          data-testid={`text-cart-duo-savings-${slug}`}
                        >
                          Save ${elementsDuoSavingsDollars()} vs buying separately
                        </p>
                      )}
                      {item.bundleId && getBundleById(item.bundleId) && (
                        <p
                          className="text-xs text-primary mt-1"
                          data-testid={`text-cart-bundle-${slug}`}
                        >
                          Bundle: {getBundleById(item.bundleId)!.display_name}
                        </p>
                      )}
                      <p className="text-sm text-primary mt-1">
                        {isDeodorantLine
                          ? deodorantPricingLabel()
                          : isBodyButterLine
                            ? `${bodyButterPricingLabel()} · ${bodyButterBundlePitch()}`
                            : `$${item.unitPrice.toFixed(2)}`}
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
                          ${lineTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <BundleUpsell
                items={items}
                selectedBundleId={lighterBundleId}
                onSelectBundle={setLighterBundle}
              />

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
              <div className="border border-primary/20 rounded-xl p-6 sticky top-24 space-y-4">
                <h2 className="font-display font-bold uppercase text-xl">
                  Order Summary
                </h2>
                <div>
                  <ShipStateTaxSummary
                    subtotal={discountedSubtotal}
                    state={shipToState}
                    onStateChange={(code) => {
                      setShipToState(code);
                      setErrorMessage("");
                    }}
                  />
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <Label htmlFor="discount-code" className="text-sm font-medium">
                    Apply Discount Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="discount-code"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      placeholder="Discount10%, Discount15%, or ReturnVisitor5"
                      className="flex-1"
                      data-testid="input-discount-code"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyDiscount}
                      className="uppercase tracking-wider font-display shrink-0"
                      data-testid="button-apply-discount"
                    >
                      Apply
                    </Button>
                  </div>
                  {discountMessage && (
                    <p
                      className={`text-xs ${appliedCode ? "text-primary" : "text-muted-foreground"}`}
                      data-testid="text-discount-message"
                    >
                      {discountMessage}
                    </p>
                  )}
                  {appliedCode && (
                    <p className="text-sm text-primary" data-testid="text-discount-applied">
                      {appliedCode}: −${discountAmount.toFixed(2)}
                    </p>
                  )}
                  {!isAuthenticated && (
                    <p className="text-xs text-muted-foreground">
                      <Link href="/auth" className="underline text-primary">
                        Sign in
                      </Link>{" "}
                      to use {DISCOUNT_CODES.PHOTO_REVIEW} or {DISCOUNT_CODES.FREQUENT_SHOPPER}.
                      {returnVisitorEmail
                        ? ` ${DISCOUNT_CODES.RETURN_VISITOR} is ready with your subscribed email.`
                        : ` ${DISCOUNT_CODES.RETURN_VISITOR} unlocks after you join the Air Genesis email list.`}
                    </p>
                  )}
                  {isAuthenticated && eligibility && (
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>
                        {DISCOUNT_CODES.PHOTO_REVIEW}:{" "}
                        {eligibility.codes[DISCOUNT_CODES.PHOTO_REVIEW]?.eligible
                          ? "ready to apply"
                          : "upload review photos to unlock"}
                      </li>
                      <li>
                        {DISCOUNT_CODES.FREQUENT_SHOPPER}:{" "}
                        {eligibility.codes[DISCOUNT_CODES.FREQUENT_SHOPPER]?.eligible
                          ? "ready to apply"
                          : `${eligibility.paidOrders}/${eligibility.frequentShopperMinOrders} purchase visits`}
                      </li>
                    </ul>
                  )}
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider font-display h-11"
                  data-testid="button-checkout"
                >
                  {isLoading ? "Processing..." : "Checkout"}
                </Button>
                {errorMessage && (
                  <p
                    className="text-xs text-red-500"
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
