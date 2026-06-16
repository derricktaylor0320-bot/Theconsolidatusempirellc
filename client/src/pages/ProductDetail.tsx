import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MugCustomizer from "@/components/MugCustomizer";
import CaseCustomizer from "@/components/CaseCustomizer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { logoOptionImage } from "@/lib/logoCatalog";

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
  const { addItem } = useCart();
  const price = parseFloat(product.price);
  const listing = listingForType(product.productType);
  const soldOut = !!product.soldOut;

  const usesHandleColors = !!product.handleColors && product.handleColors.trim().length > 0;
  const usesCaseType = !!product.caseType && product.caseType.trim().length > 0;

  const relatedProducts = allProducts
    .filter((p) => p.priceId && p.priceId !== product.priceId)
    .filter((p) =>
      product.productType
        ? p.productType === product.productType
        : p.category === product.category,
    )
    .sort((a, b) => {
      const aMatch = a.category === product.category ? 0 : 1;
      const bMatch = b.category === product.category ? 0 : 1;
      return aMatch - bMatch;
    })
    .slice(0, 4);
  const logoChoices = product.logoOptions
    ? product.logoOptions.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const needsLogo = logoChoices.length > 0;

  const [selectedLogo, setSelectedLogo] = useState("");
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

    addItem(
      {
        priceId: product.priceId,
        title: product.title,
        image: product.imageUrl,
        category: product.category,
        unitPrice: price,
        selectedLogo: needsLogo ? selectedLogo : undefined,
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
                <div className="space-y-2">
                  <p
                    className="text-sm text-muted-foreground leading-relaxed"
                    data-testid="text-detail-custom-note"
                  >
                    Note: All items are custom branded. Please select your preferred logo variation below to complete your order.
                  </p>
                  <Select
                    value={selectedLogo}
                    onValueChange={(v) => {
                      setSelectedLogo(v);
                      setErrorMessage("");
                    }}
                    disabled={soldOut}
                  >
                    <SelectTrigger className="w-full" data-testid="select-detail-logo">
                      <SelectValue placeholder="Choose your logo *" />
                    </SelectTrigger>
                    <SelectContent>
                      {logoChoices.map((choice) => (
                        <SelectItem
                          key={choice}
                          value={choice}
                          data-testid={`option-detail-logo-${choice.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {choice}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedLogo && logoOptionImage(selectedLogo) && (
                    <div
                      className="flex items-center gap-3 rounded-lg border border-primary/20 bg-muted/40 p-3"
                      data-testid="preview-detail-logo"
                    >
                      <img
                        src={logoOptionImage(selectedLogo)}
                        alt={`${selectedLogo} preview`}
                        className="h-16 w-16 rounded-md object-contain bg-black/80 p-1"
                        data-testid="img-detail-logo-preview"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-widest text-muted-foreground">
                          Your logo
                        </span>
                        <span
                          className="text-sm font-medium"
                          data-testid="text-detail-logo-name"
                        >
                          {selectedLogo}
                        </span>
                      </div>
                    </div>
                  )}
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
                disabled={!product.priceId || soldOut || (needsLogo && !selectedLogo)}
                className={`w-full transition-colors uppercase tracking-wider font-display text-sm h-12 disabled:opacity-50 ${
                  soldOut
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : added
                    ? "bg-primary text-black"
                    : "bg-black text-white hover:bg-primary hover:text-black"
                }`}
                data-testid="button-detail-add"
              >
                {soldOut ? "Sold Out" : added ? "Added \u2713" : needsLogo && !selectedLogo ? "Select a Logo" : "Add to Cart"}
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
              />
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
