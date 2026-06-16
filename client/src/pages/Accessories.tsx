import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import accessoriesBanner from "@assets/generated_images/accessories_section_gold_banner.png";

export default function Accessories() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products/type/accessory"],
  });

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {(products as any[] || []).map((product: any) => (
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
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
