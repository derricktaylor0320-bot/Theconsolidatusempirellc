import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

const PAGE_TITLE = "The Meaning of the Number Three — Khomplete Khemistri";
const PAGE_DESCRIPTION =
  "The number three is the heartbeat of Khomplete Khemistri — harmony, balance, and complete alignment of mind, body, and spirit. Discover the story and shop the Number Three Tees.";
const PAGE_IMAGE = "/assets/kk_founders_tee_three_meaning_black.jpg";

const founderTees = [
  {
    src: "/assets/kk_founders_tee_three_meaning_black.jpg",
    label: "Black",
  },
  {
    src: "/assets/kk_founders_tee_three_meaning_silver.jpg",
    label: "Silver",
  },
  {
    src: "/assets/kk_founders_tee_three_meaning_white.jpg",
    label: "White",
  },
];

const numberThreePillars = [
  {
    title: "Harmony",
    copy: "Mind, body, and spirit moving as one — the calm that comes from being fully in tune with yourself.",
  },
  {
    title: "Balance",
    copy: "Steady footing in every season. The number three holds the center so you can build without burning out.",
  },
  {
    title: "Alignment",
    copy: "Your creativity, expression, and inner strength manifesting into reality. You are fully supported.",
  },
];

function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const [name, val] = attr.split("=");
    el.setAttribute(name, val.replace(/"/g, ""));
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

export default function NumberThree() {
  const { data: allProducts } = useQuery({
    queryKey: ["/api/products"],
  });

  const numberThreeTees =
    (allProducts as any[])?.filter(
      (p) =>
        typeof p.title === "string" &&
        p.title.startsWith("The Number Three Tee"),
    ) || [];

  useEffect(() => {
    const previousTitle = document.title;
    document.title = PAGE_TITLE;

    setMeta('meta[property="og:title"]', 'property="og:title"', PAGE_TITLE);
    setMeta(
      'meta[property="og:description"]',
      'property="og:description"',
      PAGE_DESCRIPTION,
    );
    setMeta('meta[property="og:image"]', 'property="og:image"', PAGE_IMAGE);
    setMeta('meta[property="og:type"]', 'property="og:type"', "article");
    setMeta(
      'meta[name="twitter:title"]',
      'name="twitter:title"',
      PAGE_TITLE,
    );
    setMeta(
      'meta[name="twitter:description"]',
      'name="twitter:description"',
      PAGE_DESCRIPTION,
    );
    setMeta(
      'meta[name="twitter:image"]',
      'name="twitter:image"',
      PAGE_IMAGE,
    );
    setMeta('meta[name="description"]', 'name="description"', PAGE_DESCRIPTION);

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        {/* Hero */}
        <section
          className="relative overflow-hidden py-24 md:py-32 bg-secondary text-secondary-foreground border-b border-primary/20"
          data-testid="section-number-three-hero"
        >
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute right-0 top-0 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
            <div className="absolute left-0 bottom-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center"
            >
              <span
                className="text-xs font-medium uppercase tracking-[0.3em] text-primary"
                data-testid="text-number-three-eyebrow"
              >
                The Story Behind the Design
              </span>
              <div className="flex items-center justify-center gap-6 mt-8 mb-8">
                <span
                  className="font-display font-bold text-8xl md:text-9xl text-primary leading-none"
                  data-testid="text-number-three-numeral"
                >
                  3
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tight leading-tight mb-6">
                The Meaning of the Number Three
              </h1>
              <p className="text-lg md:text-xl text-secondary-foreground/80 leading-relaxed">
                The number three is the heartbeat of Khomplete Khemistri — a
                symbol of harmony, balance, and complete alignment.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Story */}
        <section className="py-20 md:py-24 container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6 text-lg md:text-xl font-light leading-relaxed text-foreground/90">
            <p data-testid="text-story-paragraph-1">
              The number three is the heartbeat of Khomplete Khemistri. It
              represents harmony, balance, and complete alignment — bringing
              together your mind, body, and spirit to create something
              powerful. It is a symbol of growth and expansion, a reminder that
              your creativity, expression, and inner strength are naturally
              manifesting into reality.
            </p>
            <p data-testid="text-story-paragraph-2">
              Three is also where our story begins. The brand was forged from a
              bond between three bandmates who shared a single vision for both
              music and self-made success. The trident — three points moving as
              one — became the emblem of that brotherhood: loyalty, creativity,
              and the drive to build something that lasts.
            </p>
            <p data-testid="text-story-paragraph-3">
              Wear the three and carry that intention with you. You are fully
              supported in building exactly what you envision.
            </p>
          </div>
        </section>

        {/* Pillars */}
        <section className="py-16 bg-secondary text-secondary-foreground border-y border-primary/20">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-tight text-center mb-12 text-primary">
              Three Pillars
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {numberThreePillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-lg border border-primary/20 bg-background/40 p-6 text-center"
                  data-testid={`card-pillar-${pillar.title.toLowerCase()}`}
                >
                  <h3 className="font-display font-semibold uppercase tracking-wider text-primary mb-3 text-lg">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-secondary-foreground/70 leading-relaxed">
                    {pillar.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Founder tee imagery */}
        <section className="py-20 md:py-24 container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-tight mb-3">
              The Founders' Tee
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The full meaning, worn on your chest. Available in three classic
              colorways.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {founderTees.map((tee) => (
              <div
                key={tee.label}
                className="group"
                data-testid={`img-founder-tee-${tee.label.toLowerCase()}`}
              >
                <div className="aspect-square overflow-hidden rounded-lg border border-primary/20 group-hover:border-primary/60 transition-colors bg-secondary">
                  <img
                    src={tee.src}
                    alt={`Number Three founders tee — ${tee.label}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mt-3 text-sm font-display font-semibold uppercase tracking-wide text-center">
                  {tee.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Shop the tees */}
        <section className="py-20 md:py-24 bg-secondary text-secondary-foreground border-y border-primary/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-primary">
                Carry the Intention
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tight mt-4">
                Shop the Number Three Tees
              </h2>
            </div>

            {numberThreeTees.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-4xl mx-auto">
                {numberThreeTees.map((tee: any) => (
                  <Link
                    key={tee.id}
                    href={tee.priceId ? `/product/${tee.priceId}` : "/apparel"}
                    className="group block"
                    data-testid={`link-number-three-${tee.title
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    <div className="aspect-square overflow-hidden rounded-lg border border-primary/20 group-hover:border-primary/60 transition-colors bg-background/40">
                      <img
                        src={tee.imageUrl}
                        alt={tee.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        data-testid={`img-number-three-${tee.title
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      />
                    </div>
                    <p className="mt-3 text-sm font-display font-semibold uppercase tracking-wide text-center group-hover:text-primary transition-colors">
                      {tee.title.replace("The Number Three Tee — ", "")}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-secondary-foreground/60">
                Loading the collection…
              </p>
            )}

            <div className="mt-12 text-center">
              <Link href="/apparel">
                <Button
                  className="bg-primary text-black hover:bg-white hover:text-black font-display uppercase tracking-wider px-8"
                  data-testid="button-shop-number-three"
                >
                  Shop All Apparel
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
