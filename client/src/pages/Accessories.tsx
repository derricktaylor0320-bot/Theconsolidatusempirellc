import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import accessoriesBanner from "@assets/generated_images/accessories_section_gold_banner.png";
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

export default function Accessories() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products/type/accessory"],
  });

  const allProducts = (products as any[]) || [];
  const beddingProducts = allProducts.filter(
    (p) => p.category === "Bedding",
  );
  const otherProducts = allProducts.filter((p) => p.category !== "Bedding");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <img
            src={accessoriesBanner}
            alt="Khomplete Khemistri Accessories"
            className="w-full max-w-4xl mx-auto h-auto object-contain rounded-lg shadow-2xl mb-8"
            data-testid="img-accessories-banner"
          />
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Branded essentials for your lifestyle. Tumblers, umbrellas, candles, and more.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12">Loading products...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {otherProducts.map(renderProduct)}
            </div>

            {beddingProducts.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-20"
                data-testid="section-bedding"
              >
                <div className="text-center mb-10">
                  <img
                    src={beddingEmblem}
                    alt="Sleep and Dream in Luxury — Khomplete Khemistri Accessories Bedding"
                    className="w-full max-w-md mx-auto h-auto object-contain rounded-lg shadow-2xl mb-6"
                    data-testid="img-bedding-emblem"
                  />
                  <h2 className="font-display text-3xl md:text-4xl uppercase tracking-wider text-primary mb-3">
                    Bedding
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Sleep and dream in luxury. Premium chocolate-brown comforter and
                    sheet sets, embroidered in gold. Choose your size at checkout.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                  {beddingProducts.map(renderProduct)}
                </div>
              </motion.section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
