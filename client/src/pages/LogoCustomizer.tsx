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

import logoGold3D from "@assets/Screenshot_20251126_202749_Photos_1764207404143.jpg";
import logoBlueWhite from "@assets/Screenshot_20251126_202727_Photos_1764207404154.jpg";
import logoBlackWhite from "@assets/Screenshot_20251126_202703_Photos_1764207404162.jpg";
import logoRedBlack from "@assets/image000004_1764207404172.jpg";
import logoBWInverted from "@assets/image000005_1764207404180.jpg";
import logoPinkBlack from "@assets/image000006_1764207404188.jpg";
import logoGoldWhite from "@assets/Screenshot_20250423_101841_Drive_1764207404197.jpg";
import logoLightBlue from "@assets/image000008_1764207404205.jpg";
import logoGreyWhite from "@assets/image000007_1764207404213.jpg";
import logoForestGreen from "@assets/logo_forest_green.jpg";
import logoDeepPurple from "@assets/logo_deep_purple.jpg";
import logoBlackGoldCircle from "@assets/logo_black_gold.jpg";
import logoOrange from "@assets/logo_orange.jpg";
import logoBrownGold from "@assets/logo_brown_gold.jpg";
import logoTeal from "@assets/logo_teal.jpg";
import logoLimeGreen from "@assets/logo_lime_green.jpg";
import logoCircleText from "@assets/logo_circle_text.jpg";
import medallionCorePrinciples from "@assets/copilot_image_1781210586301_1781211927468.jpeg";

import shieldBlackWhite from "@assets/Screenshot_20251126_205145_Photos_1764208360832.jpg";
import shieldBlueGold from "@assets/Screenshot_20251126_205125_Photos_1764208373884.jpg";
import crestBlueValuesSwords from "@assets/image000009_1781214860404.jpg";
import shieldGoldBrown from "@assets/Screenshot_20251126_205108_Photos_1764208382966.jpg";
import shieldCyanGold from "@assets/Screenshot_20251126_204843_Photos_1764208390801.jpg";
import badgeBlueValues from "@assets/copilot_image_1781211230575_1781211851159.jpeg";
import crestGoldApparel from "@assets/1781208988886_1781211764006.png";
import shieldSilver from "@assets/Screenshot_20251126_205037_Photos_1764217995547.jpg";
import badgeBrownGoldOrnate from "@assets/badge_brown_gold_ornate.jpg";
import badgePurpleOrnate from "@assets/badge_purple_ornate.jpg";
import badgeNavySilver from "@assets/badge_navy_silver.jpg";
import badgePurpleSwords from "@assets/badge_purple_swords.jpg";
import badgeGreenSwords from "@assets/badge_green_swords.jpg";
import badgeRedGoldSwords from "@assets/badge_red_gold_swords.jpg";

import honorBrownGold from "@assets/1764209713521_1764218036651.jpg";
import honorSilverGold from "@assets/1764210798224_1764211139124.jpg";
import honorNavyGold from "@assets/1764210111747_1764211158691.jpg";
import honorBlackGold from "@assets/1764209965710_1764211158709.jpg";
import honorMaroonGold from "@assets/1764209907665_1764211158717.jpg";
import honorNavySilver from "@assets/1764209634941_1764211158726.jpg";
import honorAllGold from "@assets/1764210327974_1764211486802.jpg";
import honorPurpleGold from "@assets/shield_purple_gold.jpg";
import honorWhiteGold from "@assets/shield_white_gold.jpg";
import kkmgLogo from "@assets/1764816327136_1764816411764.jpg";

import logoAccessoriesEagle from "@assets/generated_images/kk_accessories_standalone_logo.png";
import logoCrossedSwords from "@assets/generated_images/crossed_swords_kk_logo.png";
import logoKKShieldSwords from "@assets/generated_images/kk_shield_with_swords.png";
import logoKKACrossedSwords from "@assets/generated_images/kka_crossed_swords_logo.png";
import logoBeddingLuxury from "@assets/kk_accessories_bedding_logo.jpg";
import logoKKAShield from "@assets/kka_shield_apparel_logo.jpg";

const allLogos: Record<string, { src: string; alt: string; color: string; section: string }> = {
  "100": { src: logoGold3D, alt: "Gold 3D Emblem", color: "Gold 3D", section: "Circular Logos" },
  "101": { src: logoGoldWhite, alt: "Gold & White Emblem", color: "Gold & White", section: "Circular Logos" },
  "102": { src: logoBlackWhite, alt: "Classic Black & White", color: "Black & White", section: "Circular Logos" },
  "103": { src: logoBWInverted, alt: "Inverted Black & White", color: "Inverted B&W", section: "Circular Logos" },
  "104": { src: logoRedBlack, alt: "Red & Black Strike", color: "Red & Black", section: "Circular Logos" },
  "105": { src: logoBlueWhite, alt: "Royal Blue Emblem", color: "Royal Blue", section: "Circular Logos" },
  "106": { src: logoLightBlue, alt: "Sky Blue Emblem", color: "Sky Blue", section: "Circular Logos" },
  "107": { src: logoPinkBlack, alt: "Neon Pink Emblem", color: "Neon Pink", section: "Circular Logos" },
  "108": { src: logoGreyWhite, alt: "Slate Grey Emblem", color: "Slate Grey", section: "Circular Logos" },
  "109": { src: logoForestGreen, alt: "Forest Green Emblem", color: "Forest Green", section: "Circular Logos" },
  "110": { src: logoDeepPurple, alt: "Deep Purple Emblem", color: "Deep Purple", section: "Circular Logos" },
  "111": { src: logoBlackGoldCircle, alt: "Black & Gold Emblem", color: "Black & Gold", section: "Circular Logos" },
  "112": { src: logoOrange, alt: "Orange Emblem", color: "Orange", section: "Circular Logos" },
  "113": { src: logoBrownGold, alt: "Brown & Gold Emblem", color: "Brown & Gold", section: "Circular Logos" },
  "114": { src: logoTeal, alt: "Teal Emblem", color: "Teal", section: "Circular Logos" },
  "115": { src: logoLimeGreen, alt: "Lime Green Emblem", color: "Lime Green", section: "Circular Logos" },
  "116": { src: logoCircleText, alt: "Circular Text Logo", color: "Circle Text", section: "Circular Logos" },
  "117": { src: medallionCorePrinciples, alt: "10 Core Principles Medallion", color: "Core Principles Medallion", section: "Circular Logos" },
  "200": { src: badgeBlueValues, alt: "Blue & Gold Values Crest - Friendship, Trust, Harmony", color: "Blue Values Crest", section: "Badge of Honor" },
  "201": { src: shieldBlueGold, alt: "Royal Blue & Gold Crest", color: "Royal Blue & Gold", section: "Badge of Honor" },
  "202": { src: crestBlueValuesSwords, alt: "Khomplete Khemistri Apparel Crest - Unity, Strength, Brotherhood, Entrepreneurship, Harmony", color: "Blue Apparel Crest", section: "Badge of Honor" },
  "203": { src: shieldGoldBrown, alt: "Classic Gold Crest", color: "Classic Gold", section: "Badge of Honor" },
  "204": { src: shieldSilver, alt: "Silver Elite Crest", color: "Silver Elite", section: "Badge of Honor" },
  "205": { src: shieldCyanGold, alt: "Cyan & Gold Crest", color: "Cyan & Gold", section: "Badge of Honor" },
  "206": { src: shieldBlackWhite, alt: "Monochrome Crest", color: "Monochrome", section: "Badge of Honor" },
  "207": { src: badgeBrownGoldOrnate, alt: "Brown & Gold Ornate Crest", color: "Brown & Gold Ornate", section: "Badge of Honor" },
  "208": { src: badgePurpleOrnate, alt: "Purple Ornate Crest", color: "Purple Ornate", section: "Badge of Honor" },
  "209": { src: badgeNavySilver, alt: "Navy & Silver Crest", color: "Navy & Silver", section: "Badge of Honor" },
  "210": { src: badgePurpleSwords, alt: "Purple with Swords", color: "Purple Swords", section: "Badge of Honor" },
  "211": { src: badgeGreenSwords, alt: "Green with Swords", color: "Emerald Swords", section: "Badge of Honor" },
  "212": { src: badgeRedGoldSwords, alt: "Red & Gold with Swords", color: "Red & Gold Swords", section: "Badge of Honor" },
  "213": { src: crestGoldApparel, alt: "Khomplete Khemistri Apparel Gold Crest", color: "Gold Apparel Crest", section: "Badge of Honor" },
  "300": { src: honorAllGold, alt: "The Golden Eagle Shield", color: "All Gold", section: "Shield of Honor" },
  "301": { src: honorNavyGold, alt: "Navy & Gold Eagle Shield", color: "Navy & Gold", section: "Shield of Honor" },
  "302": { src: honorSilverGold, alt: "Silver & Gold Eagle Shield", color: "Silver & Gold", section: "Shield of Honor" },
  "303": { src: honorBlackGold, alt: "Black & Gold Eagle Shield", color: "Black & Gold", section: "Shield of Honor" },
  "304": { src: honorMaroonGold, alt: "Maroon & Gold Eagle Shield", color: "Maroon & Gold", section: "Shield of Honor" },
  "305": { src: honorNavySilver, alt: "Navy & Silver Eagle Shield", color: "Navy & Silver", section: "Shield of Honor" },
  "306": { src: honorBrownGold, alt: "Brown & Gold Eagle Shield", color: "Brown & Gold", section: "Shield of Honor" },
  "307": { src: honorPurpleGold, alt: "Purple & Gold Eagle Shield", color: "Purple & Gold", section: "Shield of Honor" },
  "308": { src: honorWhiteGold, alt: "White & Gold Eagle Shield", color: "White & Gold", section: "Shield of Honor" },
  "309": { src: kkmgLogo, alt: "KKMG LLC Eagle Crest", color: "KKMG LLC", section: "Shield of Honor" },
  "400": { src: logoAccessoriesEagle, alt: "Khomplete Khemistri Accessories Eagle", color: "Accessories Eagle", section: "2nd Generation" },
  "401": { src: logoCrossedSwords, alt: "Crossed Swords with Khomplete Khemistri", color: "Crossed Swords", section: "2nd Generation" },
  "402": { src: logoKKShieldSwords, alt: "KK Shield with Swords", color: "KK Shield & Swords", section: "2nd Generation" },
  "403": { src: logoKKACrossedSwords, alt: "KKA Crossed Swords Logo", color: "KKA Swords", section: "2nd Generation" },
  "404": { src: logoBeddingLuxury, alt: "Khomplete Khemistri Accessories - Sleep and Dream in Luxury", color: "Bedding Luxury", section: "2nd Generation" },
  "405": { src: logoKKAShield, alt: "KKA Shield with Eagle - Khomplete Khemistri Apparel", color: "KKA Shield", section: "2nd Generation" },
};

const garmentTypes = [
  { id: "short-sleeve", name: "Short Sleeve T-Shirt", basePrice: 30, category: "tops" },
  { id: "long-sleeve", name: "Long Sleeve T-Shirt", basePrice: 35, category: "tops" },
  { id: "pullover-hoodie", name: "Pullover Hoodie", basePrice: 50, category: "tops" },
  { id: "full-zip-hoodie", name: "Full-Zip Hoodie", basePrice: 60, category: "tops" },
  { id: "jacket", name: "Jacket/Coat", basePrice: 75, category: "tops" },
  { id: "jeans", name: "Jeans", basePrice: 65, category: "bottoms" },
  { id: "sweatpants", name: "Sweatpants", basePrice: 55, category: "bottoms" },
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

export default function LogoCustomizer() {
  const { logoId } = useParams<{ logoId: string }>();
  const [, setLocation] = useLocation();
  const [selectedGarment, setSelectedGarment] = useState<string>("");
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>(["front-left-chest"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const logo = logoId ? allLogos[logoId] : null;
  
  const selectedGarmentData = garmentTypes.find(g => g.id === selectedGarment);
  const isBottoms = selectedGarmentData?.category === "bottoms";
  const placementOptions = isBottoms ? bottomPlacementOptions : topPlacementOptions;

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
                    onValueChange={(value) => {
                      const newGarment = garmentTypes.find(g => g.id === value);
                      const wasBottoms = selectedGarmentData?.category === "bottoms";
                      const isNowBottoms = newGarment?.category === "bottoms";
                      setSelectedGarment(value);
                      if (wasBottoms !== isNowBottoms) {
                        setSelectedPlacements(isNowBottoms ? ["front-right-leg"] : ["front-left-chest"]);
                      }
                    }}
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
                  <p className="text-sm text-muted-foreground mb-3 font-semibold uppercase tracking-wide">Bottoms</p>
                  <RadioGroup 
                    value={selectedGarment} 
                    onValueChange={(value) => {
                      const newGarment = garmentTypes.find(g => g.id === value);
                      const wasBottoms = selectedGarmentData?.category === "bottoms";
                      const isNowBottoms = newGarment?.category === "bottoms";
                      setSelectedGarment(value);
                      if (wasBottoms !== isNowBottoms) {
                        setSelectedPlacements(isNowBottoms ? ["front-right-leg"] : ["front-left-chest"]);
                      }
                    }}
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
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-display font-bold uppercase">
                  2. Select Logo Placement
                </h3>
                <p className="text-sm text-muted-foreground">
                  Select one or both placements. Additional placement adds $10.
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
