import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useState } from "react";

interface ProductCardProps {
  image: string;
  title: string;
  price: number;
  category: string;
  priceId?: string;
  soldOut?: boolean;
  description?: string;
  logoOptions?: string;
}

export default function ProductCard({ image, title, price, category, priceId, soldOut, description, logoOptions }: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const logoChoices = logoOptions
    ? logoOptions.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const needsLogo = logoChoices.length > 0;
  const [selectedLogo, setSelectedLogo] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleBuyNow = async () => {
    if (!priceId) return;
    if (needsLogo && !selectedLogo) return;

    setIsLoading(true);
    try {
      const baseDescription = description || category;
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          priceId,
          productName: title,
          productImage: image,
          selectedLogo: needsLogo ? selectedLogo : undefined,
          productDescription: needsLogo
            ? `Logo: ${selectedLogo} | ${baseDescription}`
            : baseDescription
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage(data.error || 'Something went wrong. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border-none shadow-none group">
        <CardContent className="p-0 relative aspect-square overflow-hidden bg-muted">
          <img 
            src={image} 
            alt={title}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            data-testid={`img-product-${title.toLowerCase().replace(/\s+/g, '-')}`}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          {soldOut && (
            <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded shadow-lg">
              Sold Out
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start p-4 gap-2">
          <span 
            className="text-xs font-medium text-muted-foreground uppercase tracking-widest"
            data-testid={`text-category-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {category}
          </span>
          <div className="flex justify-between items-center w-full">
            <h3 
              className="font-display font-semibold text-lg uppercase truncate pr-4"
              data-testid={`text-title-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {title}
            </h3>
            <span 
              className="font-medium text-primary"
              data-testid={`text-price-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              ${price.toFixed(2)}
            </span>
          </div>
          {needsLogo && (
            <div className="w-full mt-1 space-y-2">
              <p
                className="text-xs text-muted-foreground leading-relaxed"
                data-testid={`text-custom-note-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                Note: All items are custom branded. Please select your preferred logo variation below to complete your order.
              </p>
              <Select value={selectedLogo} onValueChange={(v) => { setSelectedLogo(v); setErrorMessage(""); }} disabled={soldOut}>
                <SelectTrigger
                  className="w-full"
                  data-testid={`select-logo-${title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <SelectValue placeholder="Choose your logo *" />
                </SelectTrigger>
                <SelectContent>
                  {logoChoices.map((choice) => (
                    <SelectItem
                      key={choice}
                      value={choice}
                      data-testid={`option-logo-${choice.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {choice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button 
            onClick={handleBuyNow}
            disabled={isLoading || !priceId || soldOut || (needsLogo && !selectedLogo)}
            className={`w-full mt-2 transition-colors uppercase tracking-wider font-display text-sm h-10 disabled:opacity-50 ${
              soldOut 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-black text-white hover:bg-primary hover:text-black'
            }`}
            data-testid={`button-buy-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {soldOut ? 'Sold Out' : isLoading ? 'Processing...' : needsLogo && !selectedLogo ? 'Select a Logo' : 'Buy Now'}
          </Button>
          {errorMessage && (
            <p
              className="text-xs text-red-500 mt-1"
              data-testid={`text-error-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {errorMessage}
            </p>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
