import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import BrandSectionBanner from "@/components/BrandSectionBanner";
import ProductCard from "@/components/ProductCard";
import { RecentReviewsPanel } from "@/components/Reviews";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Rocket } from "lucide-react";
import customer1 from "@assets/Screenshot_20241031_133807_1764213200371.jpg";
import customer2 from "@assets/Screenshot_20241031_134111_1764213200405.jpg";
import customer3 from "@assets/Screenshot_20240625_095453_1764213200413.jpg";
import customer4 from "@assets/Screenshot_20240625_095500_1764213200425.jpg";
export default function Home() {
  const { data: allProducts } = useQuery({
    queryKey: ["/api/products"],
  });

  // Pick Latest Drops: Number Three meaning tees first, then the Infinity tee
  const latestDropTitles = [
    "The Number Three Tee \u2014 Black",
    "The Number Three Tee \u2014 White",
    "The Number Three Tee \u2014 Silver",
    "The Number Three Infinity Tee \u2014 Cream",
  ];
  const featuredProducts = latestDropTitles
    .map((title) => (allProducts as any[])?.find((p) => p.title === title))
    .filter(Boolean);

  // The three "Number Three" tees for the story section
  const numberThreeTees = (allProducts as any[])?.filter((p) =>
    typeof p.title === "string" && p.title.startsWith("The Number Three Tee"),
  ) || [];

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <Hero />

        <section className="pt-16 pb-8 container mx-auto px-4">
          <BrandSectionBanner compact />
        </section>
        
        <section className="py-24 container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-display font-bold uppercase tracking-tight mb-2">Latest Drops</h2>
              <p className="text-muted-foreground">Fresh from the Khomplete Khemistri Apparel lab. Limited quantities.</p>
            </div>
            <Link href="/apparel">
              <Button variant="link" className="hidden md:flex text-primary uppercase tracking-widest hover:no-underline hover:text-foreground transition-colors">
                View All Apparel
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product: any) => (
              <ProductCard 
                key={product.id} 
                title={product.title}
                price={parseFloat(product.price)}
                category={product.category}
                image={product.imageUrl}
                priceId={product.priceId}
                soldOut={product.soldOut}
                description={product.description}
                logoOptions={product.logoOptions}
                handleColors={product.handleColors}
                caseType={product.caseType}
                sizes={product.sizes}
                apparelSizes={product.apparelSizes}
                colors={product.colors}
                soldOutColors={product.soldOutColors}
                scents={product.scents}
              />
            ))}
          </div>
          
          <div className="mt-12 text-center md:hidden">
            <Link href="/apparel">
              <Button variant="outline" className="w-full uppercase tracking-widest">View All</Button>
            </Link>
          </div>
        </section>

        {/* The Meaning of the Number Three */}
        <section className="py-24 bg-secondary text-secondary-foreground border-y border-primary/20" data-testid="section-number-three">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <span className="text-xs font-medium uppercase tracking-[0.3em] text-primary" data-testid="text-number-three-eyebrow">
                  The Story Behind the Design
                </span>
                <div className="flex items-center gap-6 mt-6 mb-8">
                  <span className="font-display font-bold text-7xl md:text-8xl text-primary leading-none" data-testid="text-number-three-numeral">
                    3
                  </span>
                  <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tight leading-tight">
                    The Meaning of the Number Three
                  </h2>
                </div>
                <p className="text-lg text-secondary-foreground/80 leading-relaxed mb-6">
                  The number three is the heartbeat of Khomplete Khemistri. It represents harmony, balance, and complete
                  alignment — bringing together your mind, body, and spirit to create something powerful. It is a symbol of
                  growth and expansion, a reminder that your creativity, expression, and inner strength are naturally
                  manifesting into reality.
                </p>
                <p className="text-lg text-secondary-foreground/80 leading-relaxed mb-6">
                  Wear the three and carry that intention with you. You are fully supported in building exactly what you envision.
                </p>

                <Link href="/number-three">
                  <Button variant="link" className="px-0 mb-8 text-primary uppercase tracking-widest hover:no-underline hover:text-foreground transition-colors" data-testid="link-read-number-three-story">
                    Read the Full Story →
                  </Button>
                </Link>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {numberThreePillars.map((pillar) => (
                    <div
                      key={pillar.title}
                      className="rounded-lg border border-primary/20 bg-background/40 p-5"
                      data-testid={`card-pillar-${pillar.title.toLowerCase()}`}
                    >
                      <h3 className="font-display font-semibold uppercase tracking-wider text-primary mb-2">
                        {pillar.title}
                      </h3>
                      <p className="text-sm text-secondary-foreground/70 leading-relaxed">
                        {pillar.copy}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary mb-6 text-center lg:text-left" data-testid="text-number-three-tees-label">
                  Shop the Number Three Tees
                </p>
                {numberThreeTees.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {numberThreeTees.map((tee: any) => (
                      <Link
                        key={tee.id}
                        href={tee.priceId ? `/product/${tee.priceId}` : "/apparel"}
                        className="group block"
                        data-testid={`link-number-three-${tee.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className="aspect-square overflow-hidden rounded-lg border border-primary/20 group-hover:border-primary/60 transition-colors bg-background/40">
                          <img
                            src={tee.imageUrl}
                            alt={tee.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            data-testid={`img-number-three-${tee.title.toLowerCase().replace(/\s+/g, '-')}`}
                          />
                        </div>
                        <p className="mt-3 text-sm font-display font-semibold uppercase tracking-wide text-center group-hover:text-primary transition-colors">
                          {tee.title.replace("The Number Three Tee — ", "")}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary-foreground/60">Loading the collection…</p>
                )}
                <div className="mt-8 text-center lg:text-left">
                  <Link href="/apparel">
                    <Button className="bg-primary text-black hover:bg-white hover:text-black font-display uppercase tracking-wider px-8" data-testid="button-shop-number-three">
                      Shop All Apparel
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tight text-primary">
                The Khemistri Family
              </h2>
              <p className="text-secondary-foreground/80 mt-4 max-w-2xl mx-auto">
                To our day ones and co-workers who supported the vision from the very beginning—thank you. 
                You are the foundation of this empire.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
               {[customer1, customer2, customer3, customer4].map((img, i) => (
                 <div key={i} className="aspect-[3/4] overflow-hidden rounded-lg border border-primary/20 hover:border-primary/50 transition-colors group relative">
                   <img 
                     src={img} 
                     alt={`Khemistri Family Member ${i+1}`}
                     className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                 </div>
               ))}
            </div>
          </div>
        </section>

        <RecentReviewsPanel />

        <section
          className="relative overflow-hidden border-y border-primary/20"
          data-testid="section-pocket-booster-open"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.14),_transparent_60%),linear-gradient(180deg,_hsl(25_40%_12%)_0%,_hsl(var(--background))_100%)]" />
          <div className="relative container mx-auto px-4 py-24 text-center max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs md:text-sm uppercase tracking-[0.35em] text-primary font-display mb-5"
              data-testid="text-home-pocket-booster-status"
            >
              Now Open
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="inline-flex items-center justify-center rounded-full p-4 mb-6 border border-primary/40 bg-primary/10"
            >
              <Rocket className="h-8 w-8 text-primary" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight text-primary mb-5"
              data-testid="text-home-pocket-booster-title"
            >
              Pocket Booster
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="text-lg text-foreground/85 mb-10 leading-relaxed"
            >
              Cash cushions with automated payday repayment — subscription-powered
              funding is live on the Consolidatus Empire website.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.14 }}
            >
              <Link href="/pocket-booster">
                <Button
                  className="bg-primary text-black hover:bg-white hover:text-black font-display uppercase tracking-wider text-lg px-8 py-6 h-auto"
                  data-testid="button-home-open-pocket-booster"
                >
                  Open Pocket Booster
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="py-24 bg-secondary text-secondary-foreground">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight mb-6">
              Build Your Empire
            </h2>
            <p className="text-lg text-secondary-foreground/80 mb-10 leading-relaxed">
              The Consolidatus Empire represents more than just commerce; it's about ownership, creativity, and self-determination. From Khomplete Khemistri Apparel to our creative ventures, we are building a legacy.
            </p>
            <Link href="/hub">
              <Button className="bg-primary text-black hover:bg-white hover:text-black font-display uppercase tracking-wider text-lg px-8 py-6 h-auto">
                Explore The Hub
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
