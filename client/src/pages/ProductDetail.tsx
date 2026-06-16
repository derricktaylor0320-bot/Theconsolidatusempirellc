import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MugCustomizer from "@/components/MugCustomizer";
import CaseCustomizer from "@/components/CaseCustomizer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useRecentlyViewed, readRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { allLogos, LOGO_SECTIONS, recommendedLogoIdsForColor } from "@/lib/logoCatalog";

const MAX_QTY = 99;

interface ApiProduct {
  id: string;
  title: string;
  description?: string;
  category: string;
  imageUrl: string;
  productType?: string;
  gender?: string | null;
  soldOut?: boolean;
  price: string;
  priceId: string | null;
  logoOptions?: string | null;
  handleColors?: string | null;
  caseType?: string | null;
  sizes?: string | null;
  colors?: string | null;
}

function listingForType(productType?: string) {
  switch (productType) {
    case "accessory":
      return { href: "/accessories", label: "Accessories" };
    case "vintage":
      return { href: "/vintage", label: "Vintage" };
    case "poetry":
      return { href: "/poetry", label: "Poetry" };
    case "apparel":
    default:
      return { href: "/apparel", label: "Apparel" };
  }
}

export default function ProductDetail() {
  const params = useParams();
  const priceId = params.priceId;

  const { data: products, isLoading } = useQuery<ApiProduct[]>({
    queryKey: ["/api/products"],
  });

  const product = (products || []).find((p) => p.priceId === priceId);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center py-24 text-muted-foreground" data-testid="text-loading">
            Loading product...
          </div>
        ) : !product ? (
          <div className="text-center py-24">
            <h1 className="font-display text-3xl font-bold uppercase tracking-wider mb-4" data-testid="text-not-found">
              Product Not Found
            </h1>
            <p className="text-muted-foreground mb-8">
              We couldn't find the item you were looking for.
            </p>
            <Link href="/apparel">
              <Button
                className="bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display"
                data-testid="button-back-to-shop"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shop
              </Button>
            </Link>
          </div>
        ) : (
          <ProductDetailContent product={product} allProducts={products || []} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function ProductDetailContent({
  product,
  allProducts,
}: {
  product: ApiProduct;
  allProducts: ApiProduct[];
}) {
  const { addItem, items: cartItems } = useCart();
  const { recordView } = useRecentlyViewed();
  const price = parseFloat(product.price);
  const listing = listingForType(product.productType);
  const soldOut = !!product.soldOut;

  const usesHandleColors = !!product.handleColors && product.handleColors.trim().length > 0;
  const usesCaseType = !!product.caseType && product.caseType.trim().length > 0;

  useEffect(() => {
    if (product.priceId) recordView(product.priceId);
  }, [product.priceId, recordView]);

  const RELATED_LIMIT = 4;

  const relatedProducts = useMemo(() => {
    const inDepartment = (p: ApiProduct) =>
      product.productType
        ? p.productType === product.productType
        : p.category === product.category;

    // Only ever suggest items in the current product's department, never the
    // current product itself, and never sold-out items.
    const candidates = allProducts.filter(
      (p) =>
        p.priceId &&
        p.priceId !== product.priceId &&
        !p.soldOut &&
        inDepartment(p),
    );

    // Build interest signals from recently viewed history (most recent first)
    // and current cart contents, excluding the product being viewed.
    const recentViewed = readRecentlyViewed().filter(
      (id) => id !== product.priceId,
    );
    const cartPriceIds = cartItems
      .map((i) => i.priceId)
      .filter((id) => id !== product.priceId);

    const byPriceId = new Map(
      allProducts
        .filter((p) => p.priceId)
        .map((p) => [p.priceId as string, p]),
    );

    // Weight a product type / category by how strongly the shopper has shown
    // interest in it. Recent views are weighted by recency; cart items count
    // strongest because they signal real purchase intent.
    const categoryWeight = new Map<string, number>();
    const typeWeight = new Map<string, number>();
    const bump = (
      map: Map<string, number>,
      key: string | undefined | null,
      amount: number,
    ) => {
      if (!key) return;
      map.set(key, (map.get(key) || 0) + amount);
    };

    recentViewed.forEach((id, idx) => {
      const p = byPriceId.get(id);
      if (!p) return;
      const recencyWeight = Math.max(1, 6 - idx);
      bump(categoryWeight, p.category, recencyWeight);
      bump(typeWeight, p.productType, recencyWeight);
    });

    cartPriceIds.forEach((id) => {
      const p = byPriceId.get(id);
      if (!p) return;
      bump(categoryWeight, p.category, 8);
      bump(typeWeight, p.productType, 8);
    });

    const score = (p: ApiProduct) => {
      let s = 0;
      // Same-category items within the department are the closest match.
      if (p.category === product.category) s += 5;
      // Personalization: lean toward what the shopper has been browsing/buying.
      s += categoryWeight.get(p.category) || 0;
      s += typeWeight.get(p.productType || "") || 0;
      // Small random jitter so identical scores stay fresh on each visit.
      // Computed once per product (not per comparison) for stable ordering.
      s += Math.random();
      return s;
    };

    // Precompute one score per candidate, then sort — keeps ordering stable.
    const ranked = candidates
      .map((p) => ({ p, s: score(p) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.p);

    return ranked.slice(0, RELATED_LIMIT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.priceId, allProducts, cartItems]);
  const logoChoices = product.logoOptions
    ? product.logoOptions.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const needsLogo = logoChoices.length > 0;
  const sizeChoices = product.sizes
    ? product.sizes.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const needsSize = sizeChoices.length > 0;
  const colorChoices = product.colors
    ? product.colors.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const hasColorChoices = needsLogo && colorChoices.length > 0 && colorChoices.length <= 30;

  const [selectedLogo, setSelectedLogo] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const recommendedIds = useMemo(
    () => (selectedColor ? recommendedLogoIdsForColor(selectedColor).slice(0, 12) : []),
    [selectedColor],
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const clampQty = (n: number) => Math.max(1, Math.min(MAX_QTY, Math.round(n)));

  const handleAddToCart = () => {
    if (!product.priceId || soldOut) return;
    if (needsLogo && !selectedLogo) {
      setErrorMessage("Please select a logo variation.");
      return;
    }
    if (needsSize && !selectedSize) {
      setErrorMessage("Please select a size.");
      return;
    }

    addItem(
      {
        priceId: product.priceId,
        title: product.title,
        image: product.imageUrl,
        category: product.category,
        unitPrice: price,
        selectedLogo: needsLogo ? selectedLogo : needsSize ? selectedSize : undefined,
      },
      quantity,
    );

    setErrorMessage("");
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <Link href={listing.href}>
          <Button
            variant="ghost"
            className="uppercase tracking-wider font-display text-sm text-muted-foreground hover:text-primary px-0"
            data-testid="link-back-to-listing"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {listing.label}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted shadow-2xl">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="object-cover w-full h-full"
            data-testid="img-product-detail"
          />
          {soldOut && (
            <div
              className="absolute top-4 right-4 bg-red-600 text-white px-4 py-1.5 text-sm font-bold uppercase tracking-wider rounded shadow-lg"
              data-testid="badge-detail-sold-out"
            >
              Sold Out
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <span
            className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2"
            data-testid="text-detail-category"
          >
            {product.category}
            {product.gender && product.gender !== "Unisex" ? ` · ${product.gender}` : ""}
          </span>
          <h1
            className="font-display font-bold text-3xl md:text-4xl uppercase tracking-tight mb-3"
            data-testid="text-detail-title"
          >
            {product.title}
          </h1>
          <p
            className="text-2xl font-medium text-primary mb-6"
            data-testid="text-detail-price"
          >
            ${price.toFixed(2)}
          </p>

          {product.description && (
            <p
              className="text-secondary-foreground/80 leading-relaxed whitespace-pre-line mb-8"
              data-testid="text-detail-description"
            >
              {product.description}
            </p>
          )}

          {usesHandleColors ? (
            <div className="mt-auto">
              <p
                className="text-sm text-muted-foreground leading-relaxed mb-3"
                data-testid="text-detail-custom-note"
              >
                Note: Custom branded. Pick your handle color and matching logo to complete your order.
              </p>
              <MugCustomizer
                title={product.title}
                image={product.imageUrl}
                category={product.category}
                unitPrice={price}
                priceId={product.priceId || undefined}
                soldOut={soldOut}
                handleColors={product.handleColors as string}
              />
            </div>
          ) : usesCaseType ? (
            <div className="mt-auto">
              <p
                className="text-sm text-muted-foreground leading-relaxed mb-3"
                data-testid="text-detail-custom-note"
              >
                Note: Custom branded. Pick your phone model and the brand logo to print on your case.
              </p>
              <CaseCustomizer
                title={product.title}
                image={product.imageUrl}
                category={product.category}
                unitPrice={price}
                priceId={product.priceId || undefined}
                soldOut={soldOut}
                caseType={product.caseType as string}
              />
            </div>
          ) : (
            <div className="mt-auto space-y-4">
              {needsLogo && (
                <div className="space-y-3">
                  <p
                    className="text-sm text-muted-foreground leading-relaxed"
                    data-testid="text-detail-custom-note"
                  >
                    Note: All items are custom branded. Pick the logo you want from the full Branded Logo Collection below to complete your order.
                  </p>
                  {hasColorChoices && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Your product color (for logo suggestions)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {colorChoices.map((color) => {
                          const active = selectedColor === color;
                          return (
                            <button
                              key={color}
                              type="button"
                              disabled={soldOut}
                              onClick={() => setSelectedColor(active ? "" : color)}
                              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors disabled:opacity-50 ${
                                active
                                  ? "border-primary bg-primary text-black"
                                  : "border-border hover:border-primary/60"
                              }`}
                              data-testid={`button-detail-color-${color.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                              {color}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {selectedColor && recommendedIds.length > 0 && (
                    <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3" data-testid="picker-detail-recommended">
                      <p className="text-xs font-medium uppercase tracking-widest text-primary">
                        Recommended for {selectedColor}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {recommendedIds.map((id) => {
                          const logo = allLogos[id];
                          if (!logo) return null;
                          const isSelected = selectedLogo === logo.alt;
                          return (
                            <button
                              key={`rec-${id}`}
                              type="button"
                              disabled={soldOut}
                              onClick={() => {
                                setSelectedLogo(logo.alt);
                                setErrorMessage("");
                              }}
                              className={`relative rounded-lg border-2 overflow-hidden bg-muted transition-colors disabled:opacity-50 ${
                                isSelected ? "border-primary" : "border-transparent hover:border-border"
                              }`}
                              data-testid={`button-detail-recommended-${id}`}
                              title={logo.alt}
                            >
                              <img
                                src={logo.src}
                                alt={logo.alt}
                                className="aspect-square object-cover w-full h-full"
                                loading="lazy"
                              />
                              {isSelected && (
                                <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <Check className="h-6 w-6 text-primary" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        These pair well with {selectedColor}. You can still pick any logo from the full collection below.
                      </p>
                    </div>
                  )}
                  <ScrollArea className="max-h-[360px] rounded-lg border border-primary/10 bg-muted/20 p-3 pr-4" data-testid="picker-detail-logo">
                    <div className="space-y-5">
                      {LOGO_SECTIONS.map((section) => (
                        <div key={section.name} className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                            {section.name}
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {section.ids.map((id) => {
                              const logo = allLogos[id];
                              if (!logo) return null;
                              const isSelected = selectedLogo === logo.alt;
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  disabled={soldOut}
                                  onClick={() => {
                                    setSelectedLogo(logo.alt);
                                    setErrorMessage("");
                                  }}
                                  className={`relative rounded-lg border-2 overflow-hidden bg-muted transition-colors disabled:opacity-50 ${
                                    isSelected
                                      ? "border-primary"
                                      : "border-transparent hover:border-border"
                                  }`}
                                  data-testid={`button-detail-logo-${id}`}
                                  title={logo.alt}
                                >
                                  <img
                                    src={logo.src}
                                    alt={logo.alt}
                                    className="aspect-square object-cover w-full h-full"
                                    loading="lazy"
                                  />
                                  {isSelected && (
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                                      <Check className="h-6 w-6 text-primary" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <p className="text-sm" data-testid="text-detail-logo-selection">
                    {selectedLogo ? (
                      <>
                        <span className="text-muted-foreground">Selected logo: </span>
                        <span className="font-medium" data-testid="text-detail-logo-name">
                          {selectedLogo}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        Choose a logo to continue.
                      </span>
                    )}
                  </p>
                </div>
              )}

              {needsSize && (
                <div className="space-y-3">
                  <p
                    className="text-sm text-muted-foreground leading-relaxed"
                    data-testid="text-detail-size-note"
                  >
                    Select your size to complete your order.
                  </p>
                  <div className="flex flex-wrap gap-2" data-testid="picker-detail-size">
                    {sizeChoices.map((choice) => {
                      const isSelected = selectedSize === choice;
                      return (
                        <button
                          key={choice}
                          type="button"
                          disabled={soldOut}
                          onClick={() => {
                            setSelectedSize(choice);
                            setErrorMessage("");
                          }}
                          className={`px-5 py-2.5 rounded-lg border-2 text-sm font-medium uppercase tracking-wider transition-colors disabled:opacity-50 ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                          data-testid={`button-detail-size-${choice.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-sm" data-testid="text-detail-size-selection">
                    {selectedSize ? (
                      <>
                        <span className="text-muted-foreground">Selected size: </span>
                        <span className="font-medium" data-testid="text-detail-size-name">
                          {selectedSize}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        Choose a size to continue.
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  Qty
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setQuantity((q) => clampQty(q - 1))}
                    disabled={soldOut || quantity <= 1}
                    data-testid="button-detail-qty-decrease"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span
                    className="w-10 text-center font-medium text-lg"
                    data-testid="text-detail-qty"
                  >
                    {quantity}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setQuantity((q) => clampQty(q + 1))}
                    disabled={soldOut || quantity >= MAX_QTY}
                    data-testid="button-detail-qty-increase"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={!product.priceId || soldOut || (needsLogo && !selectedLogo) || (needsSize && !selectedSize)}
                className={`w-full transition-colors uppercase tracking-wider font-display text-sm h-12 disabled:opacity-50 ${
                  soldOut
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : added
                    ? "bg-primary text-black"
                    : "bg-black text-white hover:bg-primary hover:text-black"
                }`}
                data-testid="button-detail-add"
              >
                {soldOut ? "Sold Out" : added ? "Added \u2713" : needsLogo && !selectedLogo ? "Select a Logo" : needsSize && !selectedSize ? "Select a Size" : "Add to Cart"}
              </Button>

              {errorMessage && (
                <p className="text-sm text-red-500" data-testid="text-detail-error">
                  {errorMessage}
                </p>
              )}

              <Link href="/cart">
                <Button
                  variant="outline"
                  className="w-full uppercase tracking-wider font-display text-sm border-primary/20"
                  data-testid="button-detail-view-cart"
                >
                  View Cart
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="max-w-6xl mx-auto mt-20" data-testid="section-related-products">
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-center mb-10 text-primary">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {relatedProducts.map((related) => (
              <ProductCard
                key={related.id}
                title={related.title}
                price={parseFloat(related.price)}
                category={related.category}
                image={related.imageUrl}
                priceId={related.priceId || undefined}
                soldOut={related.soldOut}
                description={related.description}
                logoOptions={related.logoOptions || undefined}
                handleColors={related.handleColors || undefined}
                caseType={related.caseType || undefined}
                sizes={related.sizes || undefined}
              />
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
