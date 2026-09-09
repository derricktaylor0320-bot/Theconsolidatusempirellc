import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import BrandSectionBanner from "@/components/BrandSectionBanner";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import elementsHealthSectionArt from "@assets/brand/khomplete_khemistri_elements_health_section.png";
import {
  elementsCareBasketPriceDollars,
  elementsCareBasketSavingsDollars,
  elementsCareBasketSeparateDollars,
  isElementsCareBasketProduct,
} from "@shared/elementsCareBasket";
import {
  elementsDuoPriceDollars,
  elementsDuoSavingsDollars,
  elementsDuoSeparateDollars,
  isElementsDuoProduct,
} from "@shared/elementsDuo";
import {
  FLEA_MARKET_ELEMENTS_LINES,
  fleaMarketSquareSummary,
} from "@shared/inPersonSales";
import { groupProductVariants } from "@/lib/productVariants";
import { Card, CardContent } from "@/components/ui/card";
import { Store } from "lucide-react";

export default function Elements() {
  const { data: products, isLoading: loadingElements } = useQuery({
    queryKey: ["/api/products/type/elements"],
  });
  const { data: accessory, isLoading: loadingAccessory } = useQuery({
    queryKey: ["/api/products/type/accessory"],
  });

  const isLoading = loadingElements || loadingAccessory;
  const bodyCare = ((accessory as any[]) || []).filter(
    (p) => p.category === "Body Care",
  );
  const allProducts = groupProductVariants(
    [...((products as any[]) || []), ...bodyCare].sort((a: any, b: any) => {
      const aCareBasket = isElementsCareBasketProduct(a.priceId, a.title) ? 0 : 1;
      const bCareBasket = isElementsCareBasketProduct(b.priceId, b.title) ? 0 : 1;
      if (aCareBasket !== bCareBasket) return aCareBasket - bCareBasket;
      const aDuo = isElementsDuoProduct(a.priceId, a.title) ? 0 : 1;
      const bDuo = isElementsDuoProduct(b.priceId, b.title) ? 0 : 1;
      if (aDuo !== bDuo) return aDuo - bDuo;
      const aSort = typeof a.sortOrder === "number" ? a.sortOrder : 99;
      const bSort = typeof b.sortOrder === "number" ? b.sortOrder : 99;
      if (aSort !== bSort) return aSort - bSort;
      return String(a.title || "").localeCompare(String(b.title || ""));
    }),
  );
  const hasCareBasket = allProducts.some((p: any) =>
    isElementsCareBasketProduct(p.priceId, p.title),
  );
  const hasDuo = allProducts.some((p: any) =>
    isElementsDuoProduct(p.priceId, p.title),
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <BrandSectionBanner
          imageSrc={elementsHealthSectionArt}
          imageAlt="Khomplete Khemistri Elements — The Skin Care | Health Section"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="font-display text-4xl md:text-5xl uppercase tracking-wider text-primary mb-4">
            Khomplete Khemistri Elements
          </h1>
          <p className="text-2xl font-display uppercase tracking-widest text-foreground mb-4">
            Health &amp; Skin Care
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Premium supplements, 3-in-1 body wash, natural deodorant, and body care to support your
            wellness inside and out. Supplement bottles are 60 count.
          </p>
          {hasCareBasket && (
            <div
              className="mt-8 mx-auto max-w-xl rounded-xl border border-primary/40 bg-primary/5 px-5 py-4"
              data-testid="banner-elements-care-basket"
            >
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-1">
                Our store bundle
              </p>
              <p className="font-display font-bold uppercase tracking-tight text-lg">
                Elements Care Basket — ${elementsCareBasketPriceDollars().toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                3-in-1 wash, whipped body butter, deodorant, and 2 body oils. Usually ${elementsCareBasketSeparateDollars().toFixed(2)}
                separately — save ${elementsCareBasketSavingsDollars()} when you bundle.
              </p>
            </div>
          )}
          {hasDuo && (
            <div
              className="mt-8 mx-auto max-w-xl rounded-xl border border-primary/40 bg-primary/5 px-5 py-4"
              data-testid="banner-elements-duo"
            >
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-1">
                New bundle
              </p>
              <p className="font-display font-bold uppercase tracking-tight text-lg">
                Elements Duo — ${elementsDuoPriceDollars().toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Any 3-in-1 wash bottle plus a whipped body butter jar. Usually ${elementsDuoSeparateDollars().toFixed(2)}
                separately — save ${elementsDuoSavingsDollars()} when you bundle.
              </p>
            </div>
          )}
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12" data-testid="text-elements-loading">
            Loading products...
          </div>
        ) : allProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground" data-testid="text-elements-empty">
            Products are temporarily unavailable. Please refresh this page.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {allProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                title={product.title}
                price={parseFloat(product.price)}
                category={product.category}
                image={product.imageUrl}
                priceId={product.priceId}
                soldOut={product.soldOut}
                comingSoon={product.comingSoon}
                description={product.description}
                logoOptions={product.logoOptions}
                handleColors={product.handleColors}
                caseType={product.caseType}
                sizes={product.sizes}
                apparelSizes={product.apparelSizes}
                colors={product.colors}
                soldOutColors={product.soldOutColors}
                scents={product.scents}
                variants={product.variants}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <Card className="border-primary/40" data-testid="card-flea-market">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 text-center sm:text-left">
                <span className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/15 text-primary border border-primary/40 shrink-0">
                  <Store className="w-7 h-7" />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-bold uppercase tracking-tight">
                    Local Flea Markets
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {fleaMarketSquareSummary()}
                  </p>
                </div>
              </div>
              <ul className="grid gap-3 sm:grid-cols-3">
                {FLEA_MARKET_ELEMENTS_LINES.map((line) => (
                  <li
                    key={line.name}
                    className="rounded-lg border border-border/50 px-4 py-3 text-sm"
                    data-testid={`text-flea-market-${line.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  >
                    <p className="font-medium text-foreground">{line.name}</p>
                    <p className="text-muted-foreground mt-1">{line.detail}</p>
                    <p className="text-primary font-medium mt-2">{line.pricing}</p>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground text-center mt-6">
                Online orders on this site checkout with Stripe. In-person flea market
                and hot dog sales use Square.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <p className="text-xs text-muted-foreground max-w-3xl mx-auto text-center mt-16">
          These statements have not been evaluated by the Food and Drug
          Administration. These products are not intended to diagnose, treat,
          cure, or prevent any disease.
        </p>
      </main>
      <Footer />
    </div>
  );
}
