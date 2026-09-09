import { motion } from "framer-motion";
import { ArrowRight, Shield, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { allLogos, MASCULINE_LOGO_IDS } from "@/lib/logoCatalog";

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

const MASCULINE_LOGO_COPY: Record<
  (typeof MASCULINE_LOGO_IDS)[number],
  { name: string; label: string; description: string }
> = {
  "114": {
    name: "Red & Gold with Swords",
    label: "Bold sword crest",
    description:
      "A striking red shield with crossed gold swords — classic masculine Badge of Honor energy.",
  },
  "101": {
    name: "Apparel Leather Swords Crest",
    label: "Leather sword crest",
    description:
      "The Khomplete Khemistri Apparel leather swords crest built for strong custom gear.",
  },
  "115": {
    name: "Crossed Swords",
    label: "Crossed swords emblem",
    description:
      "A direct crossed-swords mark that reads clean on jackets, tees, and accessories.",
  },
  "116": {
    name: "KKA Crossed Swords",
    label: "KKA sword mark",
    description:
      "The KKA crossed-swords logo — sharp, compact, and ready for masculine apparel.",
  },
  "119": {
    name: "Maroon & Gold Eagle Crest",
    label: "Eagle crest",
    description:
      "A maroon and gold apparel eagle crest with brotherhood presence.",
  },
  "300": {
    name: "The Golden Eagle Shield",
    label: "Golden eagle shield",
    description:
      "The all-gold eagle Shield of Honor — a signature masculine empire crest.",
  },
};

function productImageFit(product: StorefrontProduct) {
  const containImages = [
    "kk_custom_logo_bikini",
    "kk_custom_logo_jeans",
    "kk_custom_logo_shorts",
    "kk_air_genesis",
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

export default function Masculine() {
  const { data: apparel, isLoading: apparelLoading } = useQuery({
    queryKey: ["/api/products/type/apparel"],
  });
  const { data: accessories, isLoading: accessoriesLoading } = useQuery({
    queryKey: ["/api/products/type/accessory"],
  });

  const apparelProducts =
    (apparel as StorefrontProduct[] | undefined) ?? [];
  const groomingProducts =
    ((accessories as StorefrontProduct[] | undefined) ?? []).filter(
      (product) =>
        product.gender === "Men" &&
        (product.category === "Grooming" ||
          /beard grooming/i.test(product.title)),
    );
  const mensProducts = apparelProducts.filter(
    (product) => product.gender === "Men",
  );
  const customizableFavorites = mensProducts.filter(
    (product) => product.logoOptions,
  );
  const mensApparel = mensProducts.filter((product) => !product.logoOptions);
  const isLoading = apparelLoading || accessoriesLoading;
  const hasProducts =
    customizableFavorites.length + mensApparel.length + groomingProducts.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-primary/20 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.14),transparent_34%),radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.22),transparent_38%),linear-gradient(145deg,hsl(var(--background)),hsl(var(--secondary)))] px-4 py-20 md:py-28">
          <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true">
            <div className="absolute -left-16 top-12 h-40 w-40 rounded-full border border-primary/30" />
            <div className="absolute -left-6 top-24 h-40 w-40 rounded-full border border-blue-300/20" />
            <div className="absolute -right-12 bottom-8 h-56 w-56 rounded-full border border-primary/20" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mx-auto max-w-4xl text-center"
          >
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">
              <Shield className="h-4 w-4" />
              Curated with him in mind
            </span>
            <h1
              className="font-brand text-5xl font-bold tracking-wide text-primary md:text-7xl"
              data-testid="heading-masculine-collection"
            >
              Masculine Collection
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-secondary-foreground/80 md:text-lg">
              Masculine apparel and sword-and-eagle crests in one place. Choose a
              ready-to-wear design or make a piece your own. Every style is open
              to everyone.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="#masculine-logos">
                <Button className="w-full bg-primary text-primary-foreground sm:w-auto">
                  Choose a masculine crest
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="#masculine-products">
                <Button variant="outline" className="w-full sm:w-auto">
                  Shop masculine styles
                </Button>
              </a>
            </div>
          </motion.div>
        </section>

        <div className="container mx-auto px-4 py-16">
          <section
            id="masculine-logos"
            className="scroll-mt-28"
            aria-labelledby="masculine-logo-heading"
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
                id="masculine-logo-heading"
                className="font-display text-3xl font-bold uppercase tracking-wider text-primary md:text-4xl"
              >
                Masculine Crest Options
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                These masculine sword and eagle crests live in the masculine
                folder so you can pick them all in one place — on this page or
                in any logo picker under Masculine Collection.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
              {MASCULINE_LOGO_IDS.map((id, index) => {
                const logo = allLogos[id];
                const copy = MASCULINE_LOGO_COPY[id];

                return (
                  <motion.article
                    key={id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="overflow-hidden rounded-2xl border border-primary/30 bg-card/80 shadow-2xl"
                    data-testid={`card-masculine-logo-${id}`}
                  >
                    <div className="aspect-square bg-[radial-gradient(circle,hsl(var(--primary)/0.15),transparent_68%)] p-7">
                      <img
                        src={logo.src}
                        alt={logo.alt}
                        className="h-full w-full object-contain drop-shadow-2xl"
                      />
                    </div>
                    <div className="border-t border-primary/20 p-6">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary/80">
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
                        data-testid={`link-customize-masculine-logo-${id}`}
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

          <div id="masculine-products" className="scroll-mt-28 space-y-16 pt-20">
            {isLoading ? (
              <div className="py-16 text-center text-muted-foreground">
                Loading masculine styles...
              </div>
            ) : hasProducts ? (
              <>
                <ProductSection
                  id="mens-grooming"
                  eyebrow="Grooming essentials"
                  title="Beard & Grooming"
                  description="Complete grooming kits built for beard care — cleanse, condition, shape, and maintain."
                  products={groomingProducts}
                />
                <ProductSection
                  id="customizable-favorites"
                  eyebrow="Make it yours"
                  title="Customizable Favorites"
                  description="Pair a sword or eagle crest from the masculine folder with these styles."
                  products={customizableFavorites}
                />
                <ProductSection
                  id="mens-apparel"
                  eyebrow="Ready-to-wear suggestions"
                  title="Men's Apparel"
                  description="Graphic tees and clothing designed with masculine color, artwork, and fit in mind."
                  products={mensApparel}
                />
              </>
            ) : (
              <div className="rounded-xl border border-primary/20 bg-card/50 px-6 py-12 text-center">
                <h2 className="text-2xl font-bold text-primary">
                  More masculine styles are coming
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
