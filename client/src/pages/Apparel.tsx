import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import apparelBanner from "@assets/generated_images/apparel_section_gold_banner.png";

export default function Apparel() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products/type/apparel"],
  });

  const allProducts = (products as any[] || []);
  
  const mensProducts = allProducts.filter((p: any) => p.gender === 'Men');
  const womensProducts = allProducts.filter((p: any) => p.gender === 'Women');
  const kidsProducts = allProducts.filter((p: any) => p.gender === 'Kids');
  const unisexProducts = allProducts.filter((p: any) => !p.gender || p.gender === 'Unisex');

  const renderProductGrid = (productList: any[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {productList.map((product: any) => (
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
          colors={product.colors}
          soldOutColors={product.soldOutColors}
        />
      ))}
    </div>
  );

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
            src={apparelBanner} 
            alt="Khomplete Khemistri Apparel" 
            className="w-full max-w-4xl mx-auto h-auto object-contain rounded-lg shadow-2xl mb-8"
            data-testid="img-apparel-banner"
          />
          <p className="text-xl text-primary font-display font-bold uppercase tracking-wide mb-6">
            If it's ours, it's branded — wear the recognition.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
            <div className="bg-card/50 p-4 rounded-lg border border-primary/20">
              <p className="text-sm text-primary/80 uppercase tracking-wider mb-1">Identity & Uniqueness</p>
              <p className="text-muted-foreground italic">"Don't Just Wear Clothes, Wear Your Mark."</p>
            </div>
            <div className="bg-card/50 p-4 rounded-lg border border-primary/20">
              <p className="text-sm text-primary/80 uppercase tracking-wider mb-1">Quality & Trust</p>
              <p className="text-muted-foreground italic">"The Standard is Branded."</p>
            </div>
            <div className="bg-card/50 p-4 rounded-lg border border-primary/20">
              <p className="text-sm text-primary/80 uppercase tracking-wider mb-1">Visibility & Attention</p>
              <p className="text-muted-foreground italic">"Engineered for the Eye. Designed for You."</p>
            </div>
            <div className="bg-card/50 p-4 rounded-lg border border-primary/20">
              <p className="text-sm text-primary/80 uppercase tracking-wider mb-1">Simplicity & Confidence</p>
              <p className="text-muted-foreground italic">"Just Our Logo. Just Your Style."</p>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12">Loading products...</div>
        ) : (
          <div className="space-y-16 mb-24">
            {unisexProducts.length > 0 && (
              <section>
                <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-center mb-8 text-primary" data-testid="section-unisex">
                  Unisex Collection
                </h2>
                <p className="text-center text-muted-foreground mb-8">For Everyone</p>
                {renderProductGrid(unisexProducts)}
              </section>
            )}

            {mensProducts.length > 0 && (
              <section>
                <div className="border-t border-primary/20 pt-12">
                  <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-center mb-8 text-primary" data-testid="section-mens">
                    Men's Collection
                  </h2>
                  <p className="text-center text-muted-foreground mb-8">Designed for Him</p>
                  {renderProductGrid(mensProducts)}
                </div>
              </section>
            )}

            {womensProducts.length > 0 && (
              <section>
                <div className="border-t border-primary/20 pt-12">
                  <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-center mb-8 text-primary" data-testid="section-womens">
                    Women's Collection
                  </h2>
                  <p className="text-center text-muted-foreground mb-8">Designed for Her</p>
                  {renderProductGrid(womensProducts)}
                </div>
              </section>
            )}

            {kidsProducts.length > 0 && (
              <section>
                <div className="border-t border-primary/20 pt-12">
                  <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-center mb-8 text-primary" data-testid="section-kids">
                    Kids Collection
                  </h2>
                  <p className="text-center text-muted-foreground mb-8">For the Little Ones</p>
                  {renderProductGrid(kidsProducts)}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Pricing Disclaimers Section */}
        <div className="max-w-4xl mx-auto bg-muted/30 p-8 md:p-12 rounded-xl border border-primary/10">
          <h3 className="text-2xl font-display font-bold uppercase tracking-wide text-primary mb-6 text-center">
            Important Pricing Disclaimers
          </h3>
          <div className="space-y-4 text-secondary-foreground/80 leading-relaxed">
            <p>
              <span className="font-bold text-primary">Please Note:</span> The prices listed above are retail starting prices for our standard garment materials and sizes (Small–X-Large).
            </p>
            <p>
              <span className="font-bold text-primary">Extended Sizing:</span> Garments in sizes XXL and larger may incur an additional charge due to material costs.
            </p>
            <p>
              <span className="font-bold text-primary">Premium Finishes:</span> Prices may vary slightly for items utilizing premium materials (e.g., specialized blends, heavyweight fabric) or for complex customization requests.
            </p>
            <p>
              <span className="font-bold text-primary">Shipping & Tax:</span> All prices are exclusive of applicable state and local sales tax and final shipping/handling fees.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
