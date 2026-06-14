import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import vintageBanner from "@assets/generated_images/vintage_baltimore_gold_banner.png";

export default function Vintage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products/type/vintage"],
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
          <div className="mb-8">
            <img 
              src={vintageBanner} 
              alt="Vintage Baltimore" 
              className="w-full max-w-4xl mx-auto h-auto object-contain rounded-lg shadow-2xl mb-8"
              data-testid="img-vintage-banner"
            />
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
              A nostalgic tribute to Baltimore's treasured past. Celebrating the establishments that shaped our city - 
              from the beloved spots that live on in our memories to the hidden gems still standing today. 
              Wear your Baltimore pride and keep these stories alive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card p-6 rounded-lg border border-primary/20"
            >
              <div className="text-4xl mb-3">🏛️</div>
              <h3 className="font-display font-bold text-lg uppercase mb-2">Legacy Spots</h3>
              <p className="text-sm text-muted-foreground">Honoring the iconic establishments that defined Baltimore's character</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card p-6 rounded-lg border border-primary/20"
            >
              <div className="text-4xl mb-3">💎</div>
              <h3 className="font-display font-bold text-lg uppercase mb-2">Hidden Gems</h3>
              <p className="text-sm text-muted-foreground">Spotlighting the treasures that locals know and love</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card p-6 rounded-lg border border-primary/20"
            >
              <div className="text-4xl mb-3">🖤</div>
              <h3 className="font-display font-bold text-lg uppercase mb-2">Baltimore Pride</h3>
              <p className="text-sm text-muted-foreground">Wear your city's story with pride and nostalgia</p>
            </motion.div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12">Loading products...</div>
        ) : (products as any[] || []).length > 0 ? (
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
              />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-16 bg-card rounded-lg border border-primary/10"
          >
            <div className="text-6xl mb-4">🏙️</div>
            <h2 className="font-display font-bold text-2xl uppercase mb-3">Coming Soon</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Our Vintage Baltimore collection is in development. Stay tuned for nostalgic memorabilia 
              celebrating the places and memories that make Baltimore special.
            </p>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}
