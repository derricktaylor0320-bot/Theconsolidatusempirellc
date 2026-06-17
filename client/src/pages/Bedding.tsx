import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import beddingEmblem from "@assets/1781696898016_1781711718659.png";

function renderProduct(product: any) {
  return (
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
  );
}

function renderGrid(productList: any[]) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {productList.map(renderProduct)}
    </div>
  );
}

export default function Bedding() {
  const { data: apparel, isLoading: loadingApparel } = useQuery({
    queryKey: ["/api/products/type/apparel"],
  });
  const { data: accessory, isLoading: loadingAccessory } = useQuery({
    queryKey: ["/api/products/type/accessory"],
  });

  const isLoading = loadingApparel || loadingAccessory;
  const all = [...((apparel as any[]) || []), ...((accessory as any[]) || [])];

  const bedding = all.filter((p) => p.category === "Bedding");
  const sleepwear = all.filter((p) => p.category === "Sleepwear");
  const intimates = all.filter((p) => p.category === "Intimates");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14 text-center"
        >
          <img
            src={beddingEmblem}
            alt="Sleep and Dream in Luxury — Khomplete Khemistri Accessories"
            className="w-full max-w-2xl mx-auto h-auto object-contain rounded-lg shadow-2xl mb-8"
            data-testid="img-bedding-emblem"
          />
          <h1 className="font-display text-4xl md:text-5xl uppercase tracking-wider text-primary mb-4">
            Bedding &amp; Intimates
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Sleep and dream in luxury. Premium bedding sets, pajamas, and intimates —
            all carrying the Khomplete Khemistri mark.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12">Loading products...</div>
        ) : (
          <div className="space-y-16 mb-24">
            {bedding.length > 0 && (
              <section>
                <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-center mb-8 text-primary" data-testid="section-bedding">
                  Bedding
                </h2>
                <p className="text-center text-muted-foreground mb-8">Comforter &amp; Sheet Sets</p>
                {renderGrid(bedding)}
              </section>
            )}

            {sleepwear.length > 0 && (
              <section>
                <div className="border-t border-primary/20 pt-12">
                  <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-center mb-8 text-primary" data-testid="section-sleepwear">
                    Sleepwear &amp; Loungewear
                  </h2>
                  <p className="text-center text-muted-foreground mb-8">Pajamas &amp; Comfort</p>
                  {renderGrid(sleepwear)}
                </div>
              </section>
            )}

            {intimates.length > 0 && (
              <section>
                <div className="border-t border-primary/20 pt-12">
                  <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-center mb-8 text-primary" data-testid="section-intimates">
                    Intimates
                  </h2>
                  <p className="text-center text-muted-foreground mb-8">Panties &amp; Underwear</p>
                  {renderGrid(intimates)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
