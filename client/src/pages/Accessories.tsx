import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import BrandSectionBanner from "@/components/BrandSectionBanner";
import { useQuery } from "@tanstack/react-query";
import { groupProductVariants } from "@/lib/productVariants";

export default function Accessories() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products/type/accessory"],
  });

  const allProducts = (products as any[]) || [];
  const visibleProducts = groupProductVariants(
    allProducts.filter(
      (p) =>
        p.category !== "Bedding" &&
        p.category !== "Sleepwear" &&
        p.category !== "Intimates" &&
        p.category !== "Body Care",
    ),
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <BrandSectionBanner caption="Branded essentials for your lifestyle. Tumblers, umbrellas, candles, and more." />

        {isLoading ? (
          <div className="text-center py-12">Loading products...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {visibleProducts.map((product: any) => (
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
                variants={product.variants}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
