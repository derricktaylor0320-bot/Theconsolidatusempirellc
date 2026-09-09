import { motion } from "framer-motion";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { allLogos, FEMININE_LOGO_IDS } from "@/lib/logoCatalog";
import { isLuxurySpaBasketProduct } from "@shared/luxurySpaBaskets";

type StorefrontProduct = {
  id: string;
  title: string;
  price: string | null;
  category: string;
  imageUrl: string;
  priceId: string | null;
  soldOut: boolean;
  description: string | null;
  gender: string | null;
  logoOptions: string | null;
  handleColors: string | null;
  caseType: string | null;
  sizes: string | null;
  apparelSizes: string | null;
  colors: string | null;
  soldOutColors: string | null;
  scents: string | null;
};

const FEMININE_LOGO_COPY: Record<
  (typeof FEMININE_LOGO_IDS)[number],
  { name: string; label: string; description: string }
> = {
  "131": {
    name: "Feminine Eagle — Electric Blue & Silver",
    label: "Royalty Badge · Female",
    description:
      "Crowned eagle crest in electric blue and silver with values banners — feminine Royalty Badge edition for apparel and accessories.",
  },
  "132": {
    name: "Pearl Griffin — Blue Denim",
    label: "Royalty Badge · Female",
    description:
      "Pearl-crowned griffin crest on classic blue denim — polished silver and gold feminine presentation for apparel and accessories.",
  },
  "133": {
    name: "Pearl Griffin — Grey",
    label: "Royalty Badge · Female",
    description:
      "Silver and gold griffin crest with pearl crown detailing on grey — soft, polished feminine presentation.",
  },
  "134": {
    name: "Pearl Griffin — Tie-Dye",
    label: "Royalty Badge · Female",
    description:
      "Pearl-crowned griffin crest on vibrant tie-dye — colorful feminine energy with crossed swords.",
  },
  "135": {
    name: "Pearl Griffin — Cotton Candy",
    label: "Royalty Badge · Female",
    description:
      "Shiny gold griffin crest with pearl crown on soft cotton-candy pink — feminine colorway for apparel and loungewear.",
  },
  "136": {
    name: "Pearl Griffin — Purple",
    label: "Royalty Badge · Female",
    description:
      "Gold and navy griffin crest with pearl crown on purple — regal feminine edition.",
  },
  "137": {
    name: "Pearl Griffin — Navy",
    label: "Royalty Badge · Female",
    description:
      "All-gold griffin crest with pearl crown on navy — classic feminine Apparel & Accessories mark.",
  },
  "138": {
    name: "Pearl Griffin — Red & Gold",
    label: "Royalty Badge · Female",
    description:
      "Crisp red-and-gold griffin crest with pearl crown — the bold successor to the earlier dark fuchsia colorway.",
  },
  "139": {
    name: "Feminine Ornate Eagle — Ed Hardy Style",
    label: "Royalty Badge · Female",
    description:
      "Bold tattoo-luxe feminine crest — crowned eagle, heart-ruby shield, roses, and ornate scrollwork in vibrant Ed Hardy energy.",
  },
  "146": {
    name: "Feminine Crowned Eagle — Hot Pink",
    label: "Royalty Badge · Female",
    description:
      "Crowned eagle crest with heart-gem shield, crossed axe and trident, and ornate scrollwork in vibrant hot pink and polished silver.",
  },
  "147": {
    name: "Feminine Crowned Eagle — Purple",
    label: "Royalty Badge · Female",
    description:
      "Regal crowned eagle crest with heart-gem shield, crossed axe and trident, and ornate scrollwork in rich purple and polished silver.",
  },
};

function productImageFit(product: StorefrontProduct) {
  const containImages = [
    "kk_custom_logo_bikini",
    "kk_custom_logo_jeans",
    "kk_custom_logo_shorts",
    "kk_air_genesis",
    "kk_air_spectrum",
  ];

  return containImages.some((name) => product.imageUrl.includes(name))
    ? "contain"
    : "cover";
}

function renderProduct(product: StorefrontProduct) {
  return (
    <ProductCard
      key={product.id}
      title={product.title}
      price={Number.parseFloat(product.price ?? "0")}
      category={product.category}
      image={product.imageUrl}
      priceId={product.priceId ?? undefined}
      soldOut={product.soldOut}
      description={product.description ?? undefined}
      logoOptions={product.logoOptions ?? undefined}
      handleColors={product.handleColors ?? undefined}
      caseType={product.caseType ?? undefined}
      sizes={product.sizes ?? undefined}
      apparelSizes={product.apparelSizes ?? undefined}
      colors={product.colors ?? undefined}
      soldOutColors={product.soldOutColors ?? undefined}
      scents={product.scents ?? undefined}
      imageFit={productImageFit(product)}
    />
  );
}

function ProductSection({
  id,
  eyebrow,
  title,
  description,
  products,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  products: StorefrontProduct[];
}) {
  if (products.length === 0) return null;

  return (
    <section id={id} className="scroll-mt-28 border-t border-primary/20 pt-14">
      <div className="mb-9 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-primary/80">
          {eyebrow}
        </p>
        <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-primary md:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {products.map(renderProduct)}
      </div>
    </section>
  );
}

export default function Feminine() {
  const { data: apparel, isLoading: apparelLoading } = useQuery({
    queryKey: ["/api/products/type/apparel"],
  });
  const { data: accessories, isLoading: accessoriesLoading } = useQuery({
    queryKey: ["/api/products/type/accessory"],
  });

  const apparelProducts =
    (apparel as StorefrontProduct[] | undefined) ?? [];
  const accessoryProducts =
    (accessories as StorefrontProduct[] | undefined) ?? [];
  const spaGiftProducts = accessoryProducts.filter(
    (product) =>
      product.category === "Spa & Gifts" ||
      isLuxurySpaBasketProduct(product.priceId, product.title),
  );
  const beddingProducts = accessoryProducts.filter(
    (product) => product.category === "Bedding",
  );
  const womensProducts = apparelProducts.filter(
    (product) => product.gender === "Women",
  );
  const isLoungeCategory = (product: StorefrontProduct) =>
    product.category === "Sleepwear" || product.category === "Intimates";
  const customizableFavorites = womensProducts.filter(
    (product) => product.logoOptions && !isLoungeCategory(product),
  );
  const womensApparel = womensProducts.filter(
    (product) => !product.logoOptions && !isLoungeCategory(product),
  );
  const loungeAndIntimates = [...apparelProducts, ...accessoryProducts].filter(
    isLoungeCategory,
  );
  const isLoading = apparelLoading || accessoriesLoading;
  const hasProducts =
    customizableFavorites.length +
    womensApparel.length +
    loungeAndIntimates.length +
    spaGiftProducts.length +
    beddingProducts.length >
    0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-primary/20 bg-[radial-gradient(circle_at_20%_20%,rgba(244,114,182,0.18),transparent_34%),radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.2),transparent_38%),linear-gradient(145deg,hsl(var(--background)),hsl(var(--secondary)))] px-4 py-20 md:py-28">
          <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true">
            <div className="absolute -left-16 top-12 h-40 w-40 rounded-full border border-pink-300/30" />
            <div className="absolute -left-6 top-24 h-40 w-40 rounded-full border border-primary/25" />
            <div className="absolute -right-12 bottom-8 h-56 w-56 rounded-full border border-pink-200/20" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mx-auto max-w-4xl text-center"
          >
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-300/40 bg-pink-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-pink-200">
              <Heart className="h-4 w-4" />
              Curated with her in mind
            </span>
            <h1
              className="font-brand text-5xl font-bold tracking-wide text-primary md:text-7xl"
              data-testid="heading-feminine-collection"
            >
              Feminine Collection
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-secondary-foreground/80 md:text-lg">
              Feminine apparel, lounge essentials, and expressive crests in one
              place. Choose a ready-to-wear design or make a piece your own.
              Every style is open to everyone.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="#feminine-logos">
                <Button className="w-full bg-primary text-primary-foreground sm:w-auto">
                  Choose a feminine crest
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="#feminine-products">
                <Button variant="outline" className="w-full sm:w-auto">
                  Shop feminine styles
                </Button>
              </a>
            </div>
          </motion.div>
        </section>

        <div className="container mx-auto px-4 py-16">
          <section
            id="feminine-logos"
            className="scroll-mt-28"
            aria-labelledby="feminine-logo-heading"
          >
            <div className="mb-10 text-center">
              <div className="mb-3 flex items-center justify-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-[0.3em]">
                  Featured logo suggestions
                </span>
                <Sparkles className="h-5 w-5" />
              </div>
              <h2
                id="feminine-logo-heading"
                className="font-display text-3xl font-bold uppercase tracking-wider text-primary md:text-4xl"
              >
                Feminine Crest Options
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                These pearl-crown griffin crests are the Female Logos group
                within Our Royalty Badge of Honor — pick them here or under Badge
                of Honor / Feminine Collection in any logo picker.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
              {FEMININE_LOGO_IDS.map((id, index) => {
                const logo = allLogos[id];
                const copy = FEMININE_LOGO_COPY[id];

                return (
                  <motion.article
                    key={id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="overflow-hidden rounded-2xl border border-primary/30 bg-card/80 shadow-2xl"
                    data-testid={`card-feminine-logo-${id}`}
                  >
                    <div className="aspect-square bg-[radial-gradient(circle,hsl(var(--primary)/0.15),transparent_68%)] p-7">
                      <img
                        src={logo.src}
                        alt={logo.alt}
                        className="h-full w-full object-contain drop-shadow-2xl"
                      />
                    </div>
                    <div className="border-t border-primary/20 p-6">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-pink-200">
                        {copy.label}
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-primary">
                        {copy.name}
                      </h3>
                      <p className="mt-3 min-h-12 text-sm leading-relaxed text-muted-foreground">
                        {copy.description}
                      </p>
                      <Link
                        href={`/customize/${id}`}
                        className="mt-5 inline-flex w-full"
                        data-testid={`link-customize-feminine-logo-${id}`}
                      >
                        <Button className="w-full">
                          Customize with this crest
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </section>

          <div id="feminine-products" className="scroll-mt-28 space-y-16 pt-20">
            {isLoading ? (
              <div className="py-16 text-center text-muted-foreground">
                Loading feminine styles...
              </div>
            ) : hasProducts ? (
              <>
                <ProductSection
                  id="spa-and-gifts"
                  eyebrow="Relax & unwind"
                  title="Spa & Gift Baskets"
                  description="Aqua Elegante luxury spa gift sets — curated bath and body baskets in seven soothing scents, perfect for gifting."
                  products={spaGiftProducts}
                />
                <ProductSection
                  id="bedding"
                  eyebrow="Sleep in luxury"
                  title="Bedding Sets"
                  description="Royal blue comforter and sheet sets with the Khomplete Khemistri mark — a favorite gift for her."
                  products={beddingProducts}
                />
                <ProductSection
                  id="customizable-favorites"
                  eyebrow="Make it yours"
                  title="Customizable Favorites"
                  description="Pair a pearl-crown griffin crest with these feminine styles for a personalized look."
                  products={customizableFavorites}
                />
                <ProductSection
                  id="womens-apparel"
                  eyebrow="Ready-to-wear suggestions"
                  title="Women's Apparel"
                  description="Graphic tees and clothing designed with feminine color, artwork, and fit in mind."
                  products={womensApparel}
                />
                <ProductSection
                  id="lounge-and-intimates"
                  eyebrow="Comfort and confidence"
                  title="Lounge & Intimates"
                  description="Relaxed essentials and intimate styles gathered into the same easy-to-shop collection."
                  products={loungeAndIntimates}
                />
              </>
            ) : (
              <div className="rounded-xl border border-primary/20 bg-card/50 px-6 py-12 text-center">
                <h2 className="text-2xl font-bold text-primary">
                  More feminine styles are coming
                </h2>
                <p className="mt-3 text-muted-foreground">
                  New shirts and customized choices will appear here as they
                  join the collection.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
