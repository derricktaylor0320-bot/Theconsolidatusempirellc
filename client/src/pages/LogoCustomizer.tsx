import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingCart, Check, AlertCircle } from "lucide-react";
import { allLogos } from "@/lib/logoCatalog";
import ShipStateTaxSummary, { useShipToState } from "@/components/ShipStateTaxSummary";

const garmentTypes = [
  { id: "short-sleeve", name: "Short Sleeve T-Shirt", basePrice: 30, category: "tops" },
  { id: "long-sleeve", name: "Long Sleeve T-Shirt", basePrice: 35, category: "tops" },
  { id: "pullover-hoodie", name: "Pullover Hoodie", basePrice: 50, category: "tops" },
  { id: "full-zip-hoodie", name: "Full-Zip Hoodie", basePrice: 60, category: "tops" },
  { id: "mens-jacket", name: "Men's Softshell Jacket", basePrice: 60, category: "tops" },
  { id: "jacket", name: "Women's Softshell Jacket", basePrice: 60, category: "tops" },
  { id: "jeans", name: "Personalized Custom Logo Jeans", basePrice: 57.48, category: "bottoms" },
  { id: "tumbler-20oz", name: "20oz Insulated Travel Tumbler", basePrice: 34.99, category: "accessories" },
  { id: "tumbler-30oz", name: "30oz Insulated Travel Tumbler", basePrice: 39.99, category: "accessories" },
  { id: "tumbler-40oz", name: "40oz Insulated Travel Tumbler", basePrice: 45, category: "accessories" },
];

const topPlacementOptions = [
  { id: "front-left-chest", name: "Left Chest", price: 0, dimensions: '3.5" – 4" wide' },
  { id: "front-right-chest", name: "Right Chest", price: 0, dimensions: '3.5" – 4" wide' },
  { id: "front-center-chest", name: "Center Chest", price: 0, dimensions: '10" – 12" wide' },
  { id: "left-sleeve", name: "Left Sleeve", price: 0, dimensions: '2.5" – 3.5" wide (icon size)' },
  { id: "right-sleeve", name: "Right Sleeve", price: 0, dimensions: '2.5" – 3.5" wide (icon size)' },
  { id: "back-large", name: "Large Back Print", price: 0, dimensions: '11" – 14" wide' },
];

const bottomPlacementOptions = [
  { id: "front-right-leg", name: "Right Leg (Front)", price: 0, dimensions: '4" – 5" wide' },
  { id: "front-left-leg", name: "Left Leg (Front)", price: 0, dimensions: '4" – 5" wide' },
  { id: "left-back-pocket", name: "Left Back Pocket", price: 0, dimensions: '3" – 3.5" wide' },
  { id: "right-back-pocket", name: "Right Back Pocket", price: 0, dimensions: '3" – 3.5" wide' },
];

const accessoryPlacementOptions = [
  { id: "tumbler-wrap", name: "Laser-Etched Logo", price: 0, dimensions: 'up to 3" wide' },
];

const TUMBLER_FEATURES = [
  "Double-wall vacuum insulation — keeps drinks cold 24+ hrs or hot 12 hrs",
  "Premium stainless steel with a scuff-resistant powder-coated finish",
  "Matching straw included",
  "Permanent, high-end laser-etched custom logo",
  "FREE shipping included",
];

const TUMBLER_40_FEATURES = [
  "Double-wall vacuum insulation — keeps drinks cold 24+ hrs or hot 12 hrs",
  "Premium stainless steel with a scuff-resistant powder-coated finish",
  "Ergonomic handle and matching straw",
  "Permanent, high-end laser-etched custom logo",
  "FREE shipping included",
];

const accessoryFeatures: Record<string, string[]> = {
  "tumbler-20oz": TUMBLER_FEATURES,
  "tumbler-30oz": TUMBLER_FEATURES,
  "tumbler-40oz": TUMBLER_40_FEATURES,
};

export default function LogoCustomizer() {
  const { logoId } = useParams<{ logoId: string }>();
  const [, setLocation] = useLocation();
  const [selectedGarment, setSelectedGarment] = useState<string>("");
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>(["front-left-chest"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipToState, setShipToState] = useShipToState();
  const { toast } = useToast();

  const logo = logoId ? allLogos[logoId] : null;
  
  const selectedGarmentData = garmentTypes.find(g => g.id === selectedGarment);
  const placementOptions =
    selectedGarmentData?.category === "bottoms"
      ? bottomPlacementOptions
      : selectedGarmentData?.category === "accessories"
        ? accessoryPlacementOptions
        : topPlacementOptions;

  if (!logo) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-display font-bold mb-4">Logo Not Found</h1>
            <Button onClick={() => setLocation("/canvas")} data-testid="button-back-to-canvas">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Logo Collection
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handlePlacementChange = (placementId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlacements([...selectedPlacements, placementId]);
    } else {
      if (selectedPlacements.length > 1) {
        setSelectedPlacements(selectedPlacements.filter(p => p !== placementId));
      }
    }
  };

  const calculatePrice = () => {
    const garment = garmentTypes.find(g => g.id === selectedGarment);
    if (!garment) return 0;
    
    let price = garment.basePrice;
    if (selectedPlacements.length > 1) {
      price += 10;
    }
    return price;
  };

  const defaultPlacementFor = (category?: string) => {
    if (category === "bottoms") return "front-right-leg";
    if (category === "accessories") return "tumbler-wrap";
    return "front-left-chest";
  };

  const handleGarmentChange = (value: string) => {
    const newGarment = garmentTypes.find((g) => g.id === value);
    const prevCategory = selectedGarmentData?.category;
    const nextCategory = newGarment?.category;
    setSelectedGarment(value);
    if (prevCategory !== nextCategory) {
      setSelectedPlacements([defaultPlacementFor(nextCategory)]);
    }
  };

  const handleCheckout = async () => {
    setError(null);
    
    if (!selectedGarment) {
      setError("Please select a garment type");
      toast({
        title: "Selection Required",
        description: "Please choose a garment type before proceeding to checkout.",
        variant: "destructive",
      });
      return;
    }

    if (!shipToState) {
      setError("Please select the state your order ships to so we can calculate sales tax.");
      toast({
        title: "Shipping State Required",
        description: "Choose the state your order ships to so we can calculate sales tax.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const garment = garmentTypes.find(g => g.id === selectedGarment);
      const placements = selectedPlacements.map(p => {
        const opt = placementOptions.find(opt => opt.id === p);
        return opt ? `${opt.name} (${opt.dimensions})` : "";
      }).filter(Boolean).join(" + ");
      
      const response = await fetch("/api/create-custom-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoId,
          logoName: logo.color,
          garmentType: garment?.name,
          garmentId: selectedGarment,
          placements: selectedPlacements,
          placementDescription: placements,
          totalPrice: calculatePrice() * 100,
          shipToState,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to create checkout session");
      }
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMessage);
      toast({
        title: "Checkout Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Checkout error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/canvas")}
            className="mb-8"
            data-testid="button-back-to-collection"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Logo Collection
          </Button>

          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card className="overflow-hidden bg-secondary">
                <CardContent className="p-8">
                  <div className="aspect-square relative bg-black/20 rounded-lg overflow-hidden">
                    <img 
                      src={logo.src} 
                      alt={logo.alt}
                      className="w-full h-full object-contain p-4"
                      data-testid={`img-selected-logo-${logoId}`}
                    />
                  </div>
                </CardContent>
              </Card>
              <div className="text-center">
                <span className="text-primary font-mono text-sm">#{logoId}</span>
                <h2 className="text-2xl font-display font-bold uppercase mt-1">{logo.color}</h2>
                <p className="text-muted-foreground">{logo.section}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-4xl font-display font-bold uppercase mb-2">
                  Customize Your <span className="text-primary">Apparel</span>
                </h1>
                <p className="text-muted-foreground">
                  Select your garment type and placement options below.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-display font-bold uppercase">
                  1. Choose Your Garment
                </h3>
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-3 font-semibold uppercase tracking-wide">Tops</p>
                  <RadioGroup 
                    value={selectedGarment} 
                    onValueChange={handleGarmentChange}
                    className="grid gap-3"
                  >
                    {garmentTypes.filter(g => g.category === "tops").map((garment) => (
                      <div key={garment.id} className="flex items-center">
                        <RadioGroupItem 
                          value={garment.id} 
                          id={garment.id}
                          className="peer sr-only"
                          data-testid={`radio-garment-${garment.id}`}
                        />
                        <Label
                          htmlFor={garment.id}
                          className="flex items-center justify-between w-full p-4 bg-secondary rounded-lg border-2 border-transparent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all hover:bg-secondary/80"
                        >
                          <span className="font-medium">{garment.name}</span>
                          <span className="text-primary font-bold">${garment.basePrice}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-3 font-semibold uppercase tracking-wide">Jeans</p>
                  <RadioGroup 
                    value={selectedGarment} 
                    onValueChange={handleGarmentChange}
                    className="grid gap-3"
                  >
                    {garmentTypes.filter(g => g.category === "bottoms").map((garment) => (
                      <div key={garment.id} className="flex items-center">
                        <RadioGroupItem 
                          value={garment.id} 
                          id={garment.id}
                          className="peer sr-only"
                          data-testid={`radio-garment-${garment.id}`}
                        />
                        <Label
                          htmlFor={garment.id}
                          className="flex items-center justify-between w-full p-4 bg-secondary rounded-lg border-2 border-transparent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all hover:bg-secondary/80"
                        >
                          <span className="font-medium">{garment.name}</span>
                          <span className="text-primary font-bold">${garment.basePrice}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-3 font-semibold uppercase tracking-wide">Accessories</p>
                  <RadioGroup
                    value={selectedGarment}
                    onValueChange={handleGarmentChange}
                    className="grid gap-3"
                  >
                    {garmentTypes.filter(g => g.category === "accessories").map((garment) => (
                      <div key={garment.id} className="flex items-center">
                        <RadioGroupItem
                          value={garment.id}
                          id={garment.id}
                          className="peer sr-only"
                          data-testid={`radio-garment-${garment.id}`}
                        />
                        <Label
                          htmlFor={garment.id}
                          className="flex items-center justify-between w-full p-4 bg-secondary rounded-lg border-2 border-transparent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all hover:bg-secondary/80"
                        >
                          <span className="font-medium">{garment.name}</span>
                          <span className="text-primary font-bold">${garment.basePrice}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              {selectedGarment && accessoryFeatures[selectedGarment] && (
                <div className="space-y-2 rounded-lg bg-secondary p-4" data-testid="accessory-features">
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">Premium Features</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                    {accessoryFeatures[selectedGarment].map((feature, i) => (
                      <li key={i} data-testid={`feature-${i}`}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-xl font-display font-bold uppercase">
                  2. Select Logo Placement
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedGarmentData?.category === "accessories"
                    ? "Your logo will be laser-etched in the position shown below."
                    : "Select one or both placements. Additional placement adds $10."}
                </p>
                <div className="space-y-3">
                  {placementOptions.map((placement) => (
                    <div 
                      key={placement.id}
                      className={`flex items-center space-x-3 p-4 bg-secondary rounded-lg border-2 transition-all ${
                        selectedPlacements.includes(placement.id) 
                          ? 'border-primary bg-primary/10' 
                          : 'border-transparent'
                      }`}
                    >
                      <Checkbox
                        id={placement.id}
                        checked={selectedPlacements.includes(placement.id)}
                        onCheckedChange={(checked) => handlePlacementChange(placement.id, checked as boolean)}
                        data-testid={`checkbox-placement-${placement.id}`}
                      />
                      <Label htmlFor={placement.id} className="flex-grow cursor-pointer">
                        <span className="block font-medium">{placement.name}</span>
                        <span className="block text-xs text-muted-foreground" data-testid={`text-dimensions-${placement.id}`}>
                          Print size: {placement.dimensions}
                        </span>
                      </Label>
                      {selectedPlacements.includes(placement.id) && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
                {selectedPlacements.length > 1 && (
                  <p className="text-sm text-primary font-medium">
                    +$10 for dual placement
                  </p>
                )}
              </div>

              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-medium">Your Custom Order</span>
                    <span className="text-3xl font-display font-bold text-primary">
                      ${calculatePrice()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1 mb-6">
                    <p>Logo: #{logoId} - {logo.color}</p>
                    {selectedGarment && (
                      <p>Garment: {garmentTypes.find(g => g.id === selectedGarment)?.name}</p>
                    )}
                    <p>Placement: {selectedPlacements.map(p => 
                      placementOptions.find(opt => opt.id === p)?.name
                    ).join(" + ")}</p>
                    {selectedPlacements.map(p => {
                      const opt = placementOptions.find(opt => opt.id === p);
                      return opt ? (
                        <p key={p} className="text-xs pl-2" data-testid={`summary-dimensions-${opt.id}`}>
                          • {opt.name}: {opt.dimensions}
                        </p>
                      ) : null;
                    })}
                  </div>
                  <div className="mb-6">
                    <ShipStateTaxSummary
                      subtotal={calculatePrice()}
                      state={shipToState}
                      onStateChange={(code) => {
                        setShipToState(code);
                        setError(null);
                      }}
                    />
                  </div>
                  {!selectedGarment && (
                    <div className="flex items-center gap-2 text-amber-500 text-sm mb-4" data-testid="warning-select-garment">
                      <AlertCircle className="h-4 w-4" />
                      <span>Please select a garment type above</span>
                    </div>
                  )}
                  {error && (
                    <div className="flex items-center gap-2 text-destructive text-sm mb-4" data-testid="error-message">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed" data-testid="text-customization-disclaimer">
                    Please note that the final product's appearance, especially for custom
                    embroidery or logos, may vary slightly from the digital representation
                    due to the customization process.
                  </p>
                  <Button 
                    className="w-full" 
                    size="lg"
                    disabled={!selectedGarment || isSubmitting}
                    onClick={handleCheckout}
                    data-testid="button-proceed-to-checkout"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {isSubmitting ? "Processing..." : "Proceed to Checkout"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
