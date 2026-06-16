import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import customer1 from "@assets/Screenshot_20241031_133807_1764213200371.jpg";
import customer2 from "@assets/Screenshot_20241031_134111_1764213200405.jpg";
import customer3 from "@assets/Screenshot_20240625_095453_1764213200413.jpg";
import customer4 from "@assets/Screenshot_20240625_095500_1764213200425.jpg";
export default function Home() {
  const { data: allProducts } = useQuery({
    queryKey: ["/api/products"],
  });

  // Pick 3 featured products for homepage
  const featuredProducts = (allProducts as any[])?.slice(0, 3) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product: any) => (
              <ProductCard 
                key={product.id} 
                title={product.title}
                price={parseFloat(product.price)}
                category={product.category}
                image={product.imageUrl}
                priceId={product.priceId}
                description={product.description}
                logoOptions={product.logoOptions}
                handleColors={product.handleColors}
                caseType={product.caseType}
                sizes={product.sizes}
              />
            ))}
          </div>
          
          <div className="mt-12 text-center md:hidden">
            <Link href="/apparel">
              <Button variant="outline" className="w-full uppercase tracking-widest">View All</Button>
            </Link>
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
