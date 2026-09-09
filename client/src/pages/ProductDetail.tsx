import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ReviewsSection } from "@/components/Reviews";
import CaseCustomizer from "@/components/CaseCustomizer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useRecentlyViewed, readRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { allLogos, LOGO_SECTIONS, logoSectionGroups, logoIdByAlt, recommendedLogoIdsForColor } from "@/lib/logoCatalog";
import LogoPickerTile from "@/components/LogoPickerTile";
import { sizeUpchargeDollars } from "@shared/customization";
import { getSupplementInfo } from "@shared/supplementBenefits";
import {
  deodorantPricingLabel,
  deodorantTotalDollars,
  deodorantUnitPriceDollars,
  isElementsDeodorantProduct,
} from "@shared/elementsDeodorant";
import {
  BODY_BUTTER_LINE_NAME,
  BODY_BUTTER_SCENT_CATEGORY_ORDER,
  bodyButterBundlePitch,
  bodyButterPricingLabel,
  bodyButterScentCategoryLabel,
  bodyButterScentNotes,
  bodyButterScentsByCategory,
  bodyButterTotalDollars,
  bodyButterUnitPriceDollars,
  isElementsBodyButterProduct,
} from "@shared/elementsBodyButter";
import {
  CARE_BASKET_BODY_OIL_OPTIONS,
  CARE_BASKET_DEODORANT_OPTIONS,
  elementsCareBasketPriceDollars,
  elementsCareBasketSavingsDollars,
  elementsCareBasketSeparateDollars,
  encodeElementsCareBasketSelection,
  isElementsCareBasketProduct,
} from "@shared/elementsCareBasket";
import {
  ELEMENTS_DUO_WASH_OPTIONS,
  elementsDuoPriceDollars,
  elementsDuoSavingsDollars,
  elementsDuoSeparateDollars,
  encodeElementsDuoSelection,
  isElementsBodyButterTitle,
  isElementsBodyWashTitle,
  isElementsDuoProduct,
} from "@shared/elementsDuo";
import { BODY_BUTTER_IMAGE, resolveStorefrontImageUrl } from "@shared/productImages";
import { trackViewItem } from "@/lib/analytics";
import { isAirGenesisProduct } from "@shared/airGenesis";
import AirGenesisEmailCapture from "@/components/AirGenesisEmailCapture";
import FootwearCustomizer from "@/components/FootwearCustomizer";
import { isFootwearCustomizable } from "@shared/footwear";

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
  comingSoon?: boolean;
  price: string;
  priceId: string | null;
  logoOptions?: string | null;
  handleColors?: string | null;
  caseType?: string | null;
  sizes?: string | null;
  apparelSizes?: string | null;
  colors?: string | null;
  soldOutColors?: string | null;
  scents?: string | null;
  variantGroup?: string | null;
  variantLabel?: string | null;
}

function listingForProduct(product: { productType?: string; category?: string }) {
  if (product.category === "Body Care") {
    return { href: "/elements", label: "Health & Skin Care" };
  }
  switch (product.productType) {
    case "accessory":
      return { href: "/accessories", label: "Accessories" };
    case "vintage":
      return { href: "/vintage", label: "Vintage" };
    case "poetry":
      return { href: "/poetry", label: "Poetry" };
    case "elements":
      return { href: "/elements", label: "Health & Skin Care" };
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
                className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider font-display"
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

function BodyButterScentGuideSection() {
  const bodyButterScentGuide = bodyButterScentsByCategory();

  return (
    <section className="max-w-4xl mx-auto mt-16" data-testid="section-body-butter-scents">
      <div className="rounded-xl border border-primary/25 bg-black/20 p-6 md:p-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-primary mb-4">
          {BODY_BUTTER_LINE_NAME}
        </h2>
        <p
          className="text-secondary-foreground/80 leading-relaxed mb-8"
          data-testid="text-body-butter-scent-intro"
        >
          Every jar is a 4 oz whipped body butter. Choose your scent at checkout — each fragrance
          is listed below with its notes so you know exactly what you are getting.
        </p>
        <div className="space-y-8">
          {BODY_BUTTER_SCENT_CATEGORY_ORDER.map((category) => {
            const scents = bodyButterScentGuide[category];
            const categoryLabel = bodyButterScentCategoryLabel(category);
            return (
              <div key={category} data-testid={`scent-group-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                {categoryLabel ? (
                  <h3 className="font-display text-lg font-semibold uppercase tracking-wider text-foreground mb-4">
                    {categoryLabel}
                  </h3>
                ) : null}
                <ul className="space-y-3">
                  {scents.map((scent) => (
                    <li
                      key={scent.name}
                      className="flex gap-3"
                      data-testid={`scent-${scent.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-secondary-foreground/80 leading-relaxed">
                        <span className="font-semibold text-foreground">{scent.name}:</span>{" "}
                        {scent.notes}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
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
  const listing = listingForProduct(product);
  const soldOut = !!product.soldOut;
  const comingSoon = !!product.comingSoon;
  const supplementInfo = getSupplementInfo(product.title);
  const isDeodorant = isElementsDeodorantProduct(product.priceId, product.title);
  const isAirGenesis = isAirGenesisProduct(product.priceId, product.title);
  const needsFootwear = isFootwearCustomizable({ category: product.category });
  const isBodyButter = isElementsBodyButterProduct(product.priceId, product.title);
  const hasTieredPricing = isDeodorant || isBodyButter;

  const usesCaseType = !!product.caseType && product.caseType.trim().length > 0;

  useEffect(() => {
    if (product.priceId) recordView(product.priceId);
  }, [product.priceId, recordView]);

  useEffect(() => {
    if (!product.priceId || soldOut || comingSoon) return;
    trackViewItem(
      {
        item_id: product.priceId,
        item_name: product.title,
        price: price,
        quantity: 1,
        item_category: product.category,
      },
      price,
    );
  }, [product.priceId, product.title, product.category, price, soldOut, comingSoon]);

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
        !p.comingSoon &&
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

  // When the whole item is sold out, offer in-stock items at the same price or
  // less — a real "shop these instead" substitute of equal-or-lesser value.
  const alternatives = useMemo(() => {
    if (!soldOut) return [];
    return allProducts
      .filter(
        (p) =>
          p.priceId &&
          p.priceId !== product.priceId &&
          !p.soldOut &&
          !p.comingSoon &&
          parseFloat(p.price) <= price,
      )
      .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
      .slice(0, 4);
  }, [soldOut, allProducts, product.priceId, price]);
  const logoChoices = product.logoOptions
    ? product.logoOptions.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const needsLogo = logoChoices.length > 0;
  const sizeChoices = product.sizes
    ? product.sizes.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const needsSize = sizeChoices.length > 0;
  const apparelSizeChoices = product.apparelSizes
    ? product.apparelSizes.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const needsApparelSize = apparelSizeChoices.length > 0;
  const colorChoices = product.colors
    ? product.colors.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const soldOutColorSet = new Set(
    (product.soldOutColors
      ? product.soldOutColors.split(",").map((s) => s.trim()).filter(Boolean)
      : []
    ).map((c) => c.toLowerCase()),
  );
  const isColorSoldOut = (c: string) => soldOutColorSet.has(c.toLowerCase());
  const needsColor = colorChoices.length >= 2 && colorChoices.length <= 60;
  const scentChoices = product.scents
    ? product.scents.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const isDuo = isElementsDuoProduct(product.priceId, product.title);
  const isCareBasket = isElementsCareBasketProduct(product.priceId, product.title);
  const needsScent = scentChoices.length > 0 && !isCareBasket;
  const needsWash = isDuo || isCareBasket;
  const needsButterScent = isCareBasket;
  const needsDeodorantPick = isCareBasket;
  const needsBodyOils = isCareBasket;
  const showScentNotes = isBodyButter || isDuo || isCareBasket;
  const variantSiblings = useMemo(() => {
    if (!product.variantGroup) return [];
    return allProducts
      .filter(
        (p) =>
          p.variantGroup === product.variantGroup &&
          p.priceId &&
          !p.soldOut &&
          !p.comingSoon,
      )
      .sort(
        (a, b) =>
          (parseFloat(a.variantLabel || a.title) || 0) -
          (parseFloat(b.variantLabel || b.title) || 0),
      );
  }, [allProducts, product.variantGroup]);
  const hasPackVariants = variantSiblings.length > 1;
  // Sea moss gel reuses the scent picker for Amazon flavor varieties.
  const scentNoun = isDuo || isCareBasket
    ? "body butter scent"
    : /\bgel\b/i.test(product.title)
      ? "flavor"
      : "scent";
  const scentNounTitle = isDuo || isCareBasket
    ? "Body Butter Scent"
    : scentNoun === "flavor"
      ? "Flavor"
      : "Scent";
  const duoSavings = elementsDuoSavingsDollars();
  const duoSeparate = elementsDuoSeparateDollars();
  const careBasketSavings = elementsCareBasketSavingsDollars();
  const careBasketSeparate = elementsCareBasketSeparateDollars();
  const duoProduct = allProducts.find((p) =>
    isElementsDuoProduct(p.priceId, p.title),
  );
  const showDuoUpsell =
    !isDuo &&
    !!duoProduct?.priceId &&
    (isElementsBodyWashTitle(product.title) ||
      isElementsBodyButterTitle(product.title));

  const [selectedLogo, setSelectedLogo] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [customDesignUrl, setCustomDesignUrl] = useState("");
  const [selectedApparelSize, setSelectedApparelSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedScent, setSelectedScent] = useState("");
  const [selectedButterScent, setSelectedButterScent] = useState("");
  const [selectedDeodorant, setSelectedDeodorant] = useState("");
  const [selectedBodyOil1, setSelectedBodyOil1] = useState("");
  const [selectedBodyOil2, setSelectedBodyOil2] = useState("");
  const [selectedWash, setSelectedWash] = useState("");
  const sizeUpcharge = needsApparelSize ? sizeUpchargeDollars(selectedApparelSize) : 0;
  const effectiveUnitPrice = price + sizeUpcharge;
  const recommendedIds = useMemo(
    () => (selectedColor ? recommendedLogoIdsForColor(selectedColor).slice(0, 12) : []),
    [selectedColor],
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [logoCollection, setLogoCollection] = useState("All");
  const logoCollectionTabs = useMemo(
    () => ["All", ...LOGO_SECTIONS.map((s) => s.name)],
    [],
  );

  const clampQty = (n: number) => Math.max(1, Math.min(MAX_QTY, Math.round(n)));

  const handleAddToCart = () => {
    if (!product.priceId || soldOut || comingSoon) return;
    if (needsFootwear) {
      if (!selectedSize) {
        setErrorMessage("Please select your gender and shoe size.");
        return;
      }
      if (!selectedLogo) {
        setErrorMessage("Please select one of our brand logos to complete your order.");
        return;
      }
    }
    if (!needsFootwear && needsLogo && !selectedLogo) {
      setErrorMessage("Please select a logo variation.");
      return;
    }
    if (!needsFootwear && needsSize && !selectedSize) {
      setErrorMessage("Please select a size.");
      return;
    }
    if (needsApparelSize && !selectedApparelSize) {
      setErrorMessage("Please select a size.");
      return;
    }
    if (needsColor && !selectedColor) {
      setErrorMessage("Please select a color.");
      return;
    }
    if (needsColor && selectedColor && isColorSoldOut(selectedColor)) {
      setErrorMessage("That color is sold out. Please choose another.");
      return;
    }
    if (needsWash && !selectedWash) {
      setErrorMessage("Please select a 3-in-1 body wash.");
      return;
    }
    if (needsButterScent && !selectedButterScent) {
      setErrorMessage("Please select a body butter scent.");
      return;
    }
    if (needsDeodorantPick && !selectedDeodorant) {
      setErrorMessage("Please select a deodorant scent.");
      return;
    }
    if (needsBodyOils && (!selectedBodyOil1 || !selectedBodyOil2)) {
      setErrorMessage("Please select both body oil scents.");
      return;
    }
    if (needsScent && !selectedScent) {
      setErrorMessage(`Please select a ${scentNoun}.`);
      return;
    }

    const cartScent = isCareBasket
      ? encodeElementsCareBasketSelection({
          wash: selectedWash,
          butterScent: selectedButterScent,
          deodorant: selectedDeodorant,
          bodyOil1: selectedBodyOil1,
          bodyOil2: selectedBodyOil2,
        })
      : isDuo
        ? encodeElementsDuoSelection(selectedWash, selectedScent)
        : needsScent
          ? selectedScent
          : undefined;
    const cartImage =
      (isDuo || isCareBasket) && selectedWash
        ? resolveStorefrontImageUrl("", selectedWash) || product.imageUrl
        : product.imageUrl;

    addItem(
      {
        priceId: product.priceId,
        title: product.title,
        image: cartImage,
        category: product.category,
        unitPrice: effectiveUnitPrice,
        selectedLogo: needsFootwear || needsLogo ? selectedLogo : needsSize ? selectedSize : undefined,
        selectedColor: needsColor ? selectedColor : undefined,
        selectedSize: needsFootwear ? selectedSize : needsApparelSize ? selectedApparelSize : undefined,
        selectedScent: cartScent,
        customDesignUrl: needsFootwear && customDesignUrl ? customDesignUrl : undefined,
      },
      quantity,
    );

    setErrorMessage("");
    setAdded(true);
    setQuantity(1);
    if (needsFootwear) {
      setCustomDesignUrl("");
    }
    setTimeout(() => setAdded(false), 1800);
  };

  if (comingSoon) {
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

        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted shadow-2xl">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="h-full w-full object-contain p-3"
              data-testid="img-product-detail"
            />
            <div
              className="absolute right-4 top-4 rounded bg-primary px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg"
              data-testid="badge-detail-coming-soon"
            >
              Coming Soon
            </div>
          </div>
          <div className="text-center lg:text-left">
            <span
              className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
              data-testid="text-detail-category"
            >
              {product.category}
            </span>
            <h1
              className="mt-2 font-display text-3xl font-bold uppercase tracking-tight md:text-4xl"
              data-testid="text-detail-title"
            >
              {product.title}
            </h1>
            <p
              className="mt-5 font-display text-2xl font-semibold uppercase tracking-wider text-primary"
              data-testid="text-detail-price"
            >
              Coming Soon
            </p>
            {isDeodorant && (
              <p
                className="mt-3 text-sm font-medium uppercase tracking-widest text-muted-foreground"
                data-testid="text-detail-deodorant-pricing"
              >
                {deodorantPricingLabel()}
              </p>
            )}
            {isBodyButter && (
              <p
                className="mt-3 text-sm font-medium uppercase tracking-widest text-muted-foreground"
                data-testid="text-detail-body-butter-pricing"
              >
                {bodyButterPricingLabel()} · {bodyButterBundlePitch()}
              </p>
            )}
            {product.description && (
              <p
                className="mt-6 text-secondary-foreground/80 leading-relaxed"
                data-testid="text-detail-description"
              >
                {product.description}
              </p>
            )}
          </div>
        </div>

        {supplementInfo && (
          <section className="max-w-4xl mx-auto mt-16" data-testid="section-supplement-benefits">
            <div className="rounded-xl border border-primary/25 bg-black/20 p-6 md:p-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-primary mb-4">
                {supplementInfo.heading || "Benefits"}
              </h2>
              {supplementInfo.intro && (
                <p
                  className="text-secondary-foreground/80 leading-relaxed mb-6"
                  data-testid="text-supplement-intro"
                >
                  {supplementInfo.intro}
                </p>
              )}
              <ul className="space-y-4">
                {supplementInfo.benefits.map((b) => (
                  <li key={b.label} className="flex gap-3" data-testid={`benefit-${b.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-secondary-foreground/80 leading-relaxed">
                      <span className="font-semibold text-foreground">{b.label}:</span> {b.text}
                    </p>
                  </li>
                ))}
              </ul>
              {supplementInfo.note && (
                <p
                  className="text-sm text-muted-foreground leading-relaxed mt-6 border-t border-primary/15 pt-4"
                  data-testid="text-supplement-note"
                >
                  {supplementInfo.note}
                </p>
              )}
            </div>
          </section>
        )}

        {showScentNotes && <BodyButterScentGuideSection />}
      </motion.div>
    );
  }

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
        {isDuo ? (
          <div className="grid grid-cols-2 gap-3" data-testid="duo-detail-images">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-muted shadow-2xl">
              <img
                src={
                  selectedWash
                    ? resolveStorefrontImageUrl("", selectedWash) || product.imageUrl
                    : product.imageUrl
                }
                alt={`${product.title} 3-in-1 body wash`}
                className="object-cover w-full h-full"
                data-testid="img-product-detail"
              />
              <p className="absolute bottom-2 left-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] uppercase tracking-widest text-white">
                3-in-1 wash
              </p>
            </div>
            <div className="relative aspect-square overflow-hidden rounded-xl bg-muted shadow-2xl">
              <img
                src={BODY_BUTTER_IMAGE}
                alt={`${product.title} whipped body butter`}
                className="object-cover w-full h-full"
                data-testid="img-product-detail-butter"
              />
              <p className="absolute bottom-2 left-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] uppercase tracking-widest text-white">
                {BODY_BUTTER_LINE_NAME}
              </p>
            </div>
          </div>
        ) : isCareBasket ? (
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted shadow-2xl">
            <img
              src={
                selectedWash
                  ? resolveStorefrontImageUrl("", selectedWash) || product.imageUrl
                  : product.imageUrl
              }
              alt={product.title}
              className="object-cover w-full h-full"
              data-testid="img-product-detail"
            />
            <p className="absolute bottom-2 left-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] uppercase tracking-widest text-white">
              Wash + butter + deodorant + 2 body oils
            </p>
          </div>
        ) : (
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted shadow-2xl">
          <img
            src={product.imageUrl}
            alt={product.title}
            className={`${product.productType === "vintage" || product.imageUrl?.includes("kk_sneaker") || product.imageUrl?.includes("kk_air_genesis") || product.imageUrl?.includes("kk_air_spectrum") || product.imageUrl?.includes("kk_air_nitrogen") || product.imageUrl?.includes("kk_signature_crest") || product.imageUrl?.includes("kk_custom_logo_jeans") || product.imageUrl?.includes("kk_custom_logo_shorts") || product.imageUrl?.includes("kk_custom_logo_bikini") || product.imageUrl?.includes("kk_branded_logo_lighter") || product.imageUrl?.includes("kk_his_hers_watch") ? "object-contain p-3" : "object-cover"} w-full h-full`}
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
        )}

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
            className={`text-2xl font-medium text-primary ${isDuo || isCareBasket || hasTieredPricing ? "mb-2" : "mb-6"}`}
            data-testid="text-detail-price"
          >
            {isCareBasket ? (
              <>
                <span className="mr-3 text-lg text-muted-foreground line-through font-normal">
                  ${careBasketSeparate.toFixed(2)}
                </span>
                ${effectiveUnitPrice.toFixed(2)}
              </>
            ) : isDuo ? (
              <>
                <span className="mr-3 text-lg text-muted-foreground line-through font-normal">
                  ${duoSeparate.toFixed(2)}
                </span>
                ${effectiveUnitPrice.toFixed(2)}
              </>
            ) : isDeodorant ? (
              <>${deodorantUnitPriceDollars().toFixed(2)}</>
            ) : isBodyButter ? (
              <>${bodyButterUnitPriceDollars().toFixed(2)}</>
            ) : (
              <>${effectiveUnitPrice.toFixed(2)}</>
            )}
          </p>
          {isDeodorant && (
            <p className="text-sm text-primary mb-6" data-testid="text-detail-deodorant-pricing">
              {deodorantPricingLabel()}
              {quantity > 1 && (
                <>
                  {" "}
                  · ${deodorantTotalDollars(quantity).toFixed(2)} for {quantity}
                </>
              )}
            </p>
          )}
          {isBodyButter && (
            <p className="text-sm text-primary mb-6" data-testid="text-detail-body-butter-pricing">
              {bodyButterPricingLabel()} · {bodyButterBundlePitch()}
              {quantity > 1 && (
                <>
                  {" "}
                  · ${bodyButterTotalDollars(quantity).toFixed(2)} for {quantity}
                </>
              )}
            </p>
          )}
          {isCareBasket && (
            <p className="text-sm text-primary mb-6" data-testid="text-detail-care-basket-savings">
              Save ${careBasketSavings} — 3-in-1 wash, body butter, deodorant, and 2 body oils (usually $62 separately).
            </p>
          )}
          {isDuo && (
            <p className="text-sm text-primary mb-6" data-testid="text-detail-duo-savings">
              Save ${duoSavings} — $15 for the 3-in-1 wash, $7 for the body butter (usually $15).
            </p>
          )}

          {product.description && (
            <p
              className="text-secondary-foreground/80 leading-relaxed whitespace-pre-line mb-8"
              data-testid="text-detail-description"
            >
              {product.description}
            </p>
          )}

          {isAirGenesis && (
            <AirGenesisEmailCapture showRepeatVisitorModal />
          )}

          {showDuoUpsell && duoProduct?.priceId && (
            <Link href={`/product/${duoProduct.priceId}`}>
              <div
                className="mb-8 rounded-xl border border-primary/40 bg-primary/5 p-4 hover:border-primary/70 transition-colors"
                data-testid="banner-elements-duo-upsell"
              >
                <p className="text-xs font-medium uppercase tracking-widest text-primary mb-1">
                  Bundle &amp; save ${duoSavings}
                </p>
                <p className="font-display font-semibold uppercase text-sm">
                  Get the Elements Duo for ${elementsDuoPriceDollars().toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pair any 3-in-1 wash with a whipped body butter for ${elementsDuoPriceDollars().toFixed(2)} instead of ${duoSeparate.toFixed(2)}.
                </p>
              </div>
            </Link>
          )}

          {usesCaseType ? (
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
              {hasPackVariants && (
                <div className="space-y-2" data-testid="picker-detail-pack-size">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Choose your pack size
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variantSiblings.map((sibling) => {
                      const isActive = sibling.priceId === product.priceId;
                      const siblingPrice = parseFloat(sibling.price || "0");
                      return isActive ? (
                        <span
                          key={sibling.priceId}
                          className="rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-primary"
                          data-testid={`button-pack-size-${(sibling.variantLabel || sibling.title).toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {sibling.variantLabel || sibling.title} — $
                          {siblingPrice.toFixed(2)}
                        </span>
                      ) : (
                        <Link key={sibling.priceId} href={`/product/${sibling.priceId}`}>
                          <button
                            type="button"
                            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:border-primary/40"
                            data-testid={`button-pack-size-${(sibling.variantLabel || sibling.title).toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            {sibling.variantLabel || sibling.title} — $
                            {siblingPrice.toFixed(2)}
                          </button>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
              {needsColor && (
                <div className="space-y-2" data-testid="picker-detail-color">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Choose your color
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {colorChoices.map((color) => {
                      const active = selectedColor === color;
                      const out = isColorSoldOut(color);
                      return (
                        <button
                          key={color}
                          type="button"
                          disabled={soldOut || out}
                          onClick={() => {
                            setSelectedColor(active ? "" : color);
                            setErrorMessage("");
                          }}
                          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors disabled:opacity-50 ${
                            out
                              ? "border-border text-muted-foreground line-through cursor-not-allowed"
                              : active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/60"
                          }`}
                          data-testid={`button-detail-color-${color.toLowerCase().replace(/\s+/g, "-")}`}
                          title={out ? `${color} is sold out` : color}
                        >
                          {color}{out ? " \u2014 Sold out" : ""}
                        </button>
                      );
                    })}
                  </div>
                  {selectedColor ? (
                    <p className="text-sm" data-testid="text-detail-color-selection">
                      <span className="text-muted-foreground">Selected color: </span>
                      <span className="font-medium" data-testid="text-detail-color-name">
                        {selectedColor}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Choose a color to continue.
                    </p>
                  )}
                </div>
              )}
              {needsWash && (
                <div className="space-y-2" data-testid="picker-detail-wash">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Choose your 3-in-1 body wash
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ELEMENTS_DUO_WASH_OPTIONS.map((wash) => {
                      const active = selectedWash === wash;
                      return (
                        <button
                          key={wash}
                          type="button"
                          disabled={soldOut}
                          onClick={() => {
                            setSelectedWash(active ? "" : wash);
                            setErrorMessage("");
                          }}
                          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors disabled:opacity-50 ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/60"
                          }`}
                          data-testid={`button-detail-wash-${wash.toLowerCase().replace(/\s+/g, "-")}`}
                          title={wash}
                        >
                          {wash}
                        </button>
                      );
                    })}
                  </div>
                  {selectedWash ? (
                    <p className="text-sm" data-testid="text-detail-wash-selection">
                      <span className="text-muted-foreground">Selected wash: </span>
                      <span className="font-medium" data-testid="text-detail-wash-name">
                        {selectedWash}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Choose a 3-in-1 wash to continue.
                    </p>
                  )}
                </div>
              )}
              {needsButterScent && (
                <div className="space-y-2" data-testid="picker-detail-butter">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Choose your body butter scent
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {scentChoices.map((scent) => {
                      const active = selectedButterScent === scent;
                      const notes = bodyButterScentNotes(scent);
                      return (
                        <button
                          key={scent}
                          type="button"
                          disabled={soldOut}
                          onClick={() => {
                            setSelectedButterScent(active ? "" : scent);
                            setErrorMessage("");
                          }}
                          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors disabled:opacity-50 ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/60"
                          }`}
                          data-testid={`button-detail-butter-${scent.toLowerCase().replace(/\s+/g, "-")}`}
                          title={notes ? `${scent} — ${notes}` : scent}
                        >
                          {scent}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {needsDeodorantPick && (
                <div className="space-y-2" data-testid="picker-detail-deodorant">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Choose your deodorant
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CARE_BASKET_DEODORANT_OPTIONS.map((choice) => {
                      const active = selectedDeodorant === choice;
                      return (
                        <button
                          key={choice}
                          type="button"
                          disabled={soldOut}
                          onClick={() => {
                            setSelectedDeodorant(active ? "" : choice);
                            setErrorMessage("");
                          }}
                          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors disabled:opacity-50 ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/60"
                          }`}
                          data-testid={`button-detail-deodorant-${choice.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {needsBodyOils && (
                <>
                  <div className="space-y-2" data-testid="picker-detail-body-oil-1">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      Choose body oil #1
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CARE_BASKET_BODY_OIL_OPTIONS.map((choice) => {
                        const active = selectedBodyOil1 === choice;
                        return (
                          <button
                            key={choice}
                            type="button"
                            disabled={soldOut}
                            onClick={() => {
                              setSelectedBodyOil1(active ? "" : choice);
                              setErrorMessage("");
                            }}
                            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors disabled:opacity-50 ${
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/60"
                            }`}
                            data-testid={`button-detail-body-oil-1-${choice.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2" data-testid="picker-detail-body-oil-2">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      Choose body oil #2
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CARE_BASKET_BODY_OIL_OPTIONS.map((choice) => {
                        const active = selectedBodyOil2 === choice;
                        return (
                          <button
                            key={choice}
                            type="button"
                            disabled={soldOut}
                            onClick={() => {
                              setSelectedBodyOil2(active ? "" : choice);
                              setErrorMessage("");
                            }}
                            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors disabled:opacity-50 ${
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/60"
                            }`}
                            data-testid={`button-detail-body-oil-2-${choice.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              {needsScent && (
                <div className="space-y-2" data-testid="picker-detail-scent">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Choose your {scentNoun}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {scentChoices.map((scent) => {
                      const active = selectedScent === scent;
                      const notes = showScentNotes ? bodyButterScentNotes(scent) : undefined;
                      return (
                        <button
                          key={scent}
                          type="button"
                          disabled={soldOut}
                          onClick={() => {
                            setSelectedScent(active ? "" : scent);
                            setErrorMessage("");
                          }}
                          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors disabled:opacity-50 ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/60"
                          }`}
                          data-testid={`button-detail-scent-${scent.toLowerCase().replace(/\s+/g, "-")}`}
                          title={notes ? `${scent} — ${notes}` : scent}
                        >
                          {scent}
                        </button>
                      );
                    })}
                  </div>
                  {selectedScent ? (
                    <div className="text-sm space-y-1" data-testid="text-detail-scent-selection">
                      <p>
                        <span className="text-muted-foreground">Selected {scentNoun}: </span>
                        <span className="font-medium" data-testid="text-detail-scent-name">
                          {selectedScent}
                        </span>
                      </p>
                      {showScentNotes && bodyButterScentNotes(selectedScent) ? (
                        <p className="text-muted-foreground" data-testid="text-detail-scent-notes">
                          {bodyButterScentNotes(selectedScent)}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Choose a {scentNoun} to continue.
                    </p>
                  )}
                </div>
              )}
              {needsFootwear && (
                <FootwearCustomizer
                  soldOut={soldOut}
                  selectedLogo={selectedLogo}
                  onLogoChange={(logo) => {
                    setSelectedLogo(logo);
                    setErrorMessage("");
                  }}
                  selectedSize={selectedSize}
                  onSizeChange={(size) => {
                    setSelectedSize(size);
                    setErrorMessage("");
                  }}
                  customDesignUrl={customDesignUrl}
                  onCustomDesignChange={setCustomDesignUrl}
                  onError={setErrorMessage}
                />
              )}

              {!needsFootwear && needsLogo && (
                <div className="space-y-3">
                  <p
                    className="text-sm text-muted-foreground leading-relaxed"
                    data-testid="text-detail-custom-note"
                  >
                    Note: All items are custom branded. Pick the logo you want from the full Branded Logo Collection below to complete your order.
                  </p>
                  {selectedColor && recommendedIds.length > 0 && (
                    <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3" data-testid="picker-detail-recommended">
                      <p className="text-xs font-medium uppercase tracking-widest text-primary">
                        Recommended for {selectedColor}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {recommendedIds.map((id) => {
                          const logo = allLogos[id];
                          if (!logo) return null;
                          return (
                            <LogoPickerTile
                              key={`rec-${id}`}
                              logoId={id}
                              isSelected={selectedLogo === logo.alt}
                              disabled={soldOut}
                              onSelect={() => {
                                setSelectedLogo(logo.alt);
                                setErrorMessage("");
                              }}
                              testId={`button-detail-recommended-${id}`}
                            />
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        These pair well with {selectedColor}. You can still pick any logo from the full collection below.
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2" data-testid="tabs-detail-logo-collection">
                    {logoCollectionTabs.map((name) => (
                      <button
                        key={name}
                        type="button"
                        disabled={soldOut}
                        onClick={() => setLogoCollection(name)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide transition-colors disabled:opacity-50 ${logoCollection === name ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                        data-testid={`tab-detail-logo-${name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <div
                    className="logo-picker-scroll max-h-[min(55vh,420px)] rounded-lg border border-primary/10 bg-muted/20 p-3 pr-2"
                    data-testid="picker-detail-logo"
                  >
                    <div className="space-y-5">
                      {LOGO_SECTIONS.filter((section) => {
                        // Gender folders are pick filters; skip them in "All" so logos aren't duplicated.
                        if (logoCollection === "All") {
                          return (
                            section.name !== "Feminine Collection" &&
                            section.name !== "Masculine Collection"
                          );
                        }
                        return section.name === logoCollection;
                      }).flatMap((section) =>
                        logoSectionGroups(section).map((group) => (
                        <div key={`${section.name}-${group.label}`} className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                            {group.label}
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {group.ids.map((id) => {
                              const logo = allLogos[id];
                              if (!logo) return null;
                              return (
                                <LogoPickerTile
                                  key={id}
                                  logoId={id}
                                  isSelected={selectedLogo === logo.alt}
                                  disabled={soldOut}
                                  onSelect={() => {
                                    setSelectedLogo(logo.alt);
                                    setErrorMessage("");
                                  }}
                                  testId={`button-detail-logo-${id}`}
                                />
                              );
                            })}
                          </div>
                        </div>
                        )),
                      )}
                    </div>
                  </div>
                  <p className="text-sm" data-testid="text-detail-logo-selection">
                    {selectedLogo ? (() => {
                      const selectedId = logoIdByAlt(selectedLogo);
                      return (
                        <>
                          <span className="text-muted-foreground">Selected logo: </span>
                          {selectedId && (
                            <span className="font-mono text-primary" data-testid="text-detail-logo-id">
                              #{selectedId}{" "}
                            </span>
                          )}
                          <span className="font-medium" data-testid="text-detail-logo-name">
                            {selectedLogo}
                          </span>
                        </>
                      );
                    })() : (
                      <span className="text-muted-foreground">
                        Choose a logo to continue.
                      </span>
                    )}
                  </p>
                </div>
              )}

              {!needsFootwear && needsSize && (
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

              {needsApparelSize && (
                <div className="space-y-3">
                  <p
                    className="text-sm text-muted-foreground leading-relaxed"
                    data-testid="text-detail-apparel-size-note"
                  >
                    Select your size. Extended sizes (2XL and up) cost a little more.
                  </p>
                  <div className="flex flex-wrap gap-2" data-testid="picker-detail-apparel-size">
                    {apparelSizeChoices.map((choice) => {
                      const isSelected = selectedApparelSize === choice;
                      const up = sizeUpchargeDollars(choice);
                      return (
                        <button
                          key={choice}
                          type="button"
                          disabled={soldOut}
                          onClick={() => {
                            setSelectedApparelSize(choice);
                            setErrorMessage("");
                          }}
                          className={`px-5 py-2.5 rounded-lg border-2 text-sm font-medium uppercase tracking-wider transition-colors disabled:opacity-50 ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                          data-testid={`button-detail-apparel-size-${choice.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {choice}{up > 0 ? ` (+$${up})` : ""}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-sm" data-testid="text-detail-apparel-size-selection">
                    {selectedApparelSize ? (
                      <>
                        <span className="text-muted-foreground">Selected size: </span>
                        <span className="font-medium" data-testid="text-detail-apparel-size-name">
                          {selectedApparelSize}
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
                disabled={!product.priceId || soldOut || (needsFootwear && (!selectedLogo || !selectedSize)) || (!needsFootwear && needsLogo && !selectedLogo) || (!needsFootwear && needsSize && !selectedSize) || (needsApparelSize && !selectedApparelSize) || (needsColor && (!selectedColor || isColorSoldOut(selectedColor))) || (needsWash && !selectedWash) || (needsButterScent && !selectedButterScent) || (needsDeodorantPick && !selectedDeodorant) || (needsBodyOils && (!selectedBodyOil1 || !selectedBodyOil2)) || (needsScent && !selectedScent)}
                className={`w-full transition-colors uppercase tracking-wider font-display text-sm h-12 disabled:opacity-50 ${
                  soldOut
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : added
                    ? "bg-primary text-primary-foreground"
                    : "bg-black text-white hover:bg-primary hover:text-primary-foreground"
                }`}
                data-testid="button-detail-add"
              >
                {soldOut ? "Sold Out" : added ? "Added \u2713" : needsFootwear && !selectedSize ? "Select a Size" : needsFootwear && !selectedLogo ? "Select a Brand Logo" : !needsFootwear && needsLogo && !selectedLogo ? "Select a Logo" : (!needsFootwear && needsSize && !selectedSize) || (needsApparelSize && !selectedApparelSize) ? "Select a Size" : needsColor && !selectedColor ? "Select a Color" : needsWash && !selectedWash ? "Select a Wash" : needsButterScent && !selectedButterScent ? "Select Body Butter" : needsDeodorantPick && !selectedDeodorant ? "Select Deodorant" : needsBodyOils && (!selectedBodyOil1 || !selectedBodyOil2) ? "Select Body Oils" : needsScent && !selectedScent ? `Select a ${scentNounTitle}` : "Add to Cart"}
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

      {supplementInfo && (
        <section className="max-w-4xl mx-auto mt-16" data-testid="section-supplement-benefits">
          <div className="rounded-xl border border-primary/25 bg-black/20 p-6 md:p-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-primary mb-4">
              {supplementInfo.heading || "Benefits"}
            </h2>
            {supplementInfo.intro && (
              <p
                className="text-secondary-foreground/80 leading-relaxed mb-6"
                data-testid="text-supplement-intro"
              >
                {supplementInfo.intro}
              </p>
            )}
            <ul className="space-y-4">
              {supplementInfo.benefits.map((b) => (
                <li key={b.label} className="flex gap-3" data-testid={`benefit-${b.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-secondary-foreground/80 leading-relaxed">
                    <span className="font-semibold text-foreground">{b.label}:</span> {b.text}
                  </p>
                </li>
              ))}
            </ul>
            {supplementInfo.note && (
              <p
                className="text-sm text-muted-foreground leading-relaxed mt-6 border-t border-primary/15 pt-4"
                data-testid="text-supplement-note"
              >
                {supplementInfo.note}
              </p>
            )}
          </div>
        </section>
      )}

      {showScentNotes && <BodyButterScentGuideSection />}

      {soldOut && alternatives.length > 0 && (
        <section className="max-w-6xl mx-auto mt-20" data-testid="section-alternatives">
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-center mb-3 text-primary">
            Sold Out — Shop These Instead
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            These in-stock items are the same price as "{product.title}" (${price.toFixed(2)}) or less.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {alternatives.map((alt) => (
              <ProductCard
                key={alt.id}
                title={alt.title}
                price={parseFloat(alt.price)}
                category={alt.category}
                image={alt.imageUrl}
                priceId={alt.priceId || undefined}
                soldOut={alt.soldOut}
                description={alt.description}
                logoOptions={alt.logoOptions || undefined}
                handleColors={alt.handleColors || undefined}
                caseType={alt.caseType || undefined}
                sizes={alt.sizes || undefined}
                apparelSizes={alt.apparelSizes || undefined}
                colors={alt.colors || undefined}
                soldOutColors={alt.soldOutColors || undefined}
                scents={alt.scents || undefined}
              />
            ))}
          </div>
        </section>
      )}

      <ReviewsSection productName={product.title} />

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
                apparelSizes={related.apparelSizes || undefined}
                scents={related.scents || undefined}
              />
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
