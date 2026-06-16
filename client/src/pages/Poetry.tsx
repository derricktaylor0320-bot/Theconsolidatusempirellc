import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import plaqueShowcase from "@assets/poetry_plaques_showcase.jpg";
import glassFrameShowcase from "@assets/glass_frame_showcase.jpg";

const categories = [
  { id: "all", name: "All Collections" },
  { id: "seasons", name: "Four Seasons" },
  { id: "mental-health", name: "Mental Health" },
  { id: "love", name: "Enchanted Love" },
  { id: "inspiration", name: "Inspired Motivations" },
  { id: "grief", name: "Landscapes of Lost" },
  { id: "spiritual", name: "Spirit Meets Verse" },
];

interface PoetryProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  priceId: string;
  category: string;
  format: string;
  image: string;
}

export default function Poetry() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery<PoetryProduct[]>({
    queryKey: ["/api/products/type/poetry"],
    queryFn: async () => {
      const res = await fetch("/api/products/type/poetry");
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((p: any) => ({
        id: p.id,
        title: p.title || p.name,
        description: p.description,
        price: p.price,
        priceId: p.priceId,
        category: p.category || "seasons",
        format: p.format || (p.title?.includes("Plaque") ? "plaque" : "glass"),
        image: p.image || (p.title?.includes("Plaque") ? plaqueShowcase : glassFrameShowcase),
      }));
    },
  });

  const filteredProducts = selectedCategory === "all" 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const handleBuyNow = async (product: PoetryProduct) => {
    if (!product.priceId) return;
    
    setLoadingProductId(product.id);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId: product.priceId,
          productName: product.title,
          productImage: product.format === 'plaque' ? plaqueShowcase : glassFrameShowcase,
          productDescription: product.description
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: "There was a problem starting checkout. Please try again.",
        variant: "destructive",
      });
      setLoadingProductId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <section className="py-20 bg-secondary text-secondary-foreground relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute right-0 top-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute left-0 bottom-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 tracking-tight uppercase">
                Poetry <span className="text-primary">on a Plaque</span>
              </h1>
              <p className="text-xl text-secondary-foreground/70 max-w-3xl mx-auto mb-8">
                Original poetry by Derrick Taylor, beautifully crafted and displayed on premium wooden plaques or elegant glass frames. The perfect meaningful gift for any occasion.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <img 
                  src={plaqueShowcase} 
                  alt="Poetry on Wooden Plaques" 
                  className="w-full h-80 object-cover rounded-lg shadow-xl"
                  data-testid="img-plaque-showcase"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur p-4 rounded-lg">
                  <h3 className="font-display text-xl font-bold text-primary">Wooden Plaque</h3>
                  <p className="text-2xl font-bold">$40.00</p>
                  <p className="text-sm text-muted-foreground">Premium wood with elegant finish</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <img 
                  src={glassFrameShowcase} 
                  alt="Poetry in Glass Frames" 
                  className="w-full h-80 object-cover rounded-lg shadow-xl"
                  data-testid="img-glass-showcase"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur p-4 rounded-lg">
                  <h3 className="font-display text-xl font-bold text-primary">Glass Frame</h3>
                  <p className="text-2xl font-bold">$30.00</p>
                  <p className="text-sm text-muted-foreground">Elegant silver glass frame</p>
                </div>
              </motion.div>
            </div>

            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold mb-4 uppercase">Choose Your <span className="text-primary">Collection</span></h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Select from six unique poetry collections, each designed to touch the heart and soul. Whether you seek inspiration, comfort, love, or spiritual connection.
              </p>
            </div>

            <div className="mb-8 overflow-x-auto">
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent h-auto p-0">
                  {categories.map((cat) => (
                    <TabsTrigger 
                      key={cat.id} 
                      value={cat.id}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-full border border-border"
                      data-testid={`tab-${cat.id}`}
                    >
                      {cat.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Products coming soon...</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="h-full flex flex-col overflow-hidden hover:shadow-xl transition-shadow" data-testid={`card-poetry-${product.id}`}>
                      <div className="relative h-48 bg-secondary overflow-hidden">
                        <img 
                          src={product.format === 'plaque' ? plaqueShowcase : glassFrameShowcase}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${product.format === 'plaque' ? 'bg-amber-800 text-white' : 'bg-gray-400 text-white'}`}>
                            {product.format === 'plaque' ? 'Wooden Plaque' : 'Glass Frame'}
                          </span>
                        </div>
                      </div>
                      <CardContent className="flex-grow p-4">
                        <h3 className="font-display text-lg font-bold mb-2">{product.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                        <p className="text-xl font-bold text-primary" data-testid={`text-price-poetry-${product.id}`}>${Number(product.price).toFixed(2)}</p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <Button 
                          className="w-full" 
                          data-testid={`button-buy-poetry-${product.id}`}
                          onClick={() => handleBuyNow(product)}
                          disabled={loadingProductId === product.id}
                        >
                          {loadingProductId === product.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            "Buy Now"
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="mt-16 bg-secondary rounded-2xl p-8 text-center">
              <h3 className="font-display text-2xl font-bold mb-4">Custom Poetry Available</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                Looking for something personal? I can create custom poetry for weddings, anniversaries, memorials, birthdays, or any special occasion. Each piece is crafted with care to capture your unique story.
              </p>
              <Button variant="outline" size="lg" data-testid="button-custom-poetry">
                Request Custom Poetry
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
