import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function Elements() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products/type/elements"],
  });

  const allProducts = (products as any[]) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
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
            Premium supplements and body care to support your wellness inside and
            out. Supplement bottles are 60 count.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12" data-testid="text-elements-loading">
            Loading products...
          </div>
        ) : allProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground" data-testid="text-elements-empty">
            Products coming soon.
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
        )}

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
