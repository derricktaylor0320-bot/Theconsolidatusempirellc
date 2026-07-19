import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useCart } from "@/hooks/useCart";
import CaseCustomizer from "@/components/CaseCustomizer";
import { allLogos, LOGO_SECTIONS, recommendedLogoIdsForColor } from "@/lib/logoCatalog";
import { sizeUpchargeDollars } from "@shared/customization";
import type { ProductVariant } from "@/lib/productVariants";
import { Check, Minus, Plus, PenLine } from "lucide-react";

const MAX_QTY = 99;

interface ProductCardProps {
  image: string;
  title: string;
  price: number;
  category: string;
  priceId?: string;
  soldOut?: boolean;
  description?: string;
  logoOptions?: string;
  handleColors?: string;
  caseType?: string;
  sizes?: string;
  apparelSizes?: string;
  colors?: string;
  soldOutColors?: string;
  scents?: string;
  imageFit?: "cover" | "contain";
  variants?: ProductVariant[];
}

export default function ProductCard({ image: baseImage, title: baseTitle, price: basePrice, category, priceId: basePriceId, soldOut: baseSoldOut, description, logoOptions, handleColors: _handleColors, caseType, sizes, apparelSizes, colors, soldOutColors, scents, imageFit = "cover", variants }: ProductCardProps) {
  const hasVariants = !!variants && variants.length > 1;
  const [variantIdx, setVariantIdx] = useState(0);
  const activeVariant = hasVariants ? variants![Math.min(variantIdx, variants!.length - 1)] : undefined;
  const image = activeVariant?.image || baseImage;
  const title = activeVariant?.title ?? baseTitle;
  const price = activeVariant ? activeVariant.price : basePrice;
  const priceId = activeVariant ? (activeVariant.priceId ?? undefined) : basePriceId;
  const soldOut = activeVariant ? activeVariant.soldOut : baseSoldOut;
  // Wide multi-item shots (e.g. four lighters) get cropped by cover in the
  // square card frame — prefer contain when the catalog image needs the full perimeter.
  const autoContain =
    typeof image === "string" && image.includes("kk_branded_logo_lighter");
  const fitClass =
    imageFit === "contain" || autoContain ? "object-contain p-2" : "object-cover";
  const { addItem } = useCart();
  const usesCaseType = !!caseType && caseType.trim().length > 0;
  const logoChoices = logoOptions
    ? logoOptions.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const needsLogo = logoChoices.length > 0;
  const sizeChoices = sizes
    ? sizes.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const needsSize = sizeChoices.length > 0;
  const apparelSizeChoices = apparelSizes
    ? apparelSizes.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const needsApparelSize = apparelSizeChoices.length > 0;
  const colorChoices = colors
    ? colors.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const needsColor = colorChoices.length >= 2 && colorChoices.length <= 60;
  const scentChoices = scents
    ? scents.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const needsScent = scentChoices.length > 0;
  // Sea moss gel (and similar jar products) reuse the scent picker for flavor
  // varieties — label the UI as "flavor" so checkout copy stays accurate.
  const scentNoun = /\bgel\b/i.test(baseTitle) ? "flavor" : "scent";
  const soldOutColorSet = new Set(
    (soldOutColors
      ? soldOutColors.split(",").map((s) => s.trim()).filter(Boolean)
      : []
    ).map((c) => c.toLowerCase()),
  );
  const isColorSoldOut = (c: string) => soldOutColorSet.has(c.toLowerCase());
  const [selectedLogo, setSelectedLogo] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedApparelSize, setSelectedApparelSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedScent, setSelectedScent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [logoCollection, setLogoCollection] = useState("All");
  const logoCollectionTabs = useMemo(
    () => ["All", ...LOGO_SECTIONS.map((s) => s.name)],
    [],
  );

  const recommendedLogoIds = useMemo(
    () => (selectedColor ? recommendedLogoIdsForColor(selectedColor).slice(0, 8) : []),
    [selectedColor],
  );

  const sizeUpcharge = needsApparelSize ? sizeUpchargeDollars(selectedApparelSize) : 0;
  const effectiveUnitPrice = price + sizeUpcharge;

  const clampQty = (n: number) => Math.max(1, Math.min(MAX_QTY, Math.round(n)));

  const handleAddToCart = () => {
    if (!priceId) return;
    if (needsLogo && !selectedLogo) {
      setErrorMessage("Please select a logo variation.");
      return;
    }
    if (needsSize && !selectedSize) {
      setErrorMessage("Please select a size.");
      return;
    }
    if (needsApparelSize && !selectedApparelSize) {
      setErrorMessage("Please select a size.");
      return;
    }
    if (needsColor && !selectedColor) {
      setErrorMessage("Please select a color.");
      return;
    }
    if (needsColor && selectedColor && isColorSoldOut(selectedColor)) {
      setErrorMessage("That color is sold out. Please choose another.");
      return;
    }
    if (needsScent && !selectedScent) {
      setErrorMessage(`Please select a ${scentNoun}.`);
      return;
    }

    addItem(
      {
        priceId,
        title,
        image,
        category,
        unitPrice: effectiveUnitPrice,
        selectedLogo: needsLogo ? selectedLogo : needsSize ? selectedSize : undefined,
        selectedColor: needsColor ? selectedColor : undefined,
        selectedSize: needsApparelSize ? selectedApparelSize : undefined,
        selectedScent: needsScent ? selectedScent : undefined,
      },
      quantity,
    );

    setErrorMessage("");
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 1800);
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
          {priceId ? (
            <Link href={`/product/${priceId}`} aria-label={`View ${title}`}>
              <img 
                src={image} 
                alt={title}
                className={`${fitClass} w-full h-full transition-transform duration-500 group-hover:scale-105 cursor-pointer`}
                data-testid={`img-product-${title.toLowerCase().replace(/\s+/g, '-')}`}
              />
            </Link>
          ) : (
            <img 
              src={image} 
              alt={title}
              className={`${fitClass} w-full h-full transition-transform duration-500 group-hover:scale-105`}
              data-testid={`img-product-${title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
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
            {priceId ? (
              <Link href={`/product/${priceId}`} className="min-w-0 pr-4">
                <h3 
                  className="font-display font-semibold text-lg uppercase truncate hover:text-primary transition-colors cursor-pointer"
                  data-testid={`text-title-${title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {title}
                </h3>
              </Link>
            ) : (
              <h3 
                className="font-display font-semibold text-lg uppercase truncate pr-4"
                data-testid={`text-title-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {title}
              </h3>
            )}
            <span 
              className="font-medium text-primary"
              data-testid={`text-price-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              ${effectiveUnitPrice.toFixed(2)}
            </span>
          </div>
          {hasVariants && (
            <div className="w-full mt-1 space-y-1.5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pick your size — the photo and price update to match.
              </p>
              <div
                className="flex flex-wrap gap-2"
                data-testid={`picker-variant-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {variants!.map((v, i) => {
                  const isSelected = i === Math.min(variantIdx, variants!.length - 1);
                  return (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => setVariantIdx(i)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      } ${v.soldOut ? "opacity-50" : ""}`}
                      data-testid={`button-variant-${v.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {v.label} — ${v.price.toFixed(2)}
                      {v.soldOut ? " (Sold out)" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {usesCaseType ? (
            <>
              <p
                className="text-xs text-muted-foreground leading-relaxed w-full mt-1"
                data-testid={`text-custom-note-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                Note: Custom branded. Pick your phone model and the brand logo to print on your case.
              </p>
              <CaseCustomizer
                title={title}
                image={image}
                category={category}
                unitPrice={price}
                priceId={priceId}
                soldOut={soldOut}
                caseType={caseType as string}
              />
            </>
          ) : (
            <>
              {needsLogo && (
                <div className="w-full mt-1 space-y-2">
                  <p
                    className="text-xs text-muted-foreground leading-relaxed"
                    data-testid={`text-custom-note-${title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    Note: All items are custom branded. Tap the logo you want from the full Branded Logo Collection below to complete your order.
                  </p>
                  {needsColor && selectedColor && recommendedLogoIds.length > 0 && (
                    <div
                      className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-2"
                      data-testid={`picker-recommended-${title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <p className="text-[10px] font-medium uppercase tracking-widest text-primary">
                        Recommended for {selectedColor}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {recommendedLogoIds.map((id) => {
                          const logo = allLogos[id];
                          if (!logo) return null;
                          const isSelected = selectedLogo === logo.alt;
                          return (
                            <button
                              key={`rec-${id}`}
                              type="button"
                              disabled={soldOut}
                              onClick={() => { setSelectedLogo(logo.alt); setErrorMessage(""); }}
                              className={`relative rounded-md border-2 overflow-hidden bg-muted transition-colors disabled:opacity-50 ${isSelected ? "border-primary" : "border-transparent hover:border-border"}`}
                              data-testid={`button-recommended-logo-${id}`}
                              title={logo.alt}
                            >
                              <img src={logo.src} alt={logo.alt} className="aspect-square object-contain w-full h-full p-0.5" loading="lazy" />
                              {isSelected && (
                                <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <Check className="h-5 w-5 text-primary" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        These pair well with {selectedColor}. You can still pick any logo below.
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5" data-testid={`tabs-logo-collection-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                    {logoCollectionTabs.map((name) => (
                      <button
                        key={name}
                        type="button"
                        disabled={soldOut}
                        onClick={() => setLogoCollection(name)}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide transition-colors disabled:opacity-50 ${logoCollection === name ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                        data-testid={`tab-logo-${name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <div
                    className="logo-picker-scroll max-h-[min(50vh,380px)] rounded-lg border border-primary/10 bg-muted/20 p-2 pr-1.5"
                    data-testid={`picker-logo-${title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="space-y-4">
                      {LOGO_SECTIONS.filter((section) => logoCollection === "All" || section.name === logoCollection).map((section) => (
                        <div key={section.name} className="space-y-2">
                          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                            {section.name}
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {section.ids.map((id) => {
                              const logo = allLogos[id];
                              if (!logo) return null;
                              const isSelected = selectedLogo === logo.alt;
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  disabled={soldOut}
                                  onClick={() => { setSelectedLogo(logo.alt); setErrorMessage(""); }}
                                  className={`relative rounded-md border-2 overflow-hidden bg-background/80 transition-colors disabled:opacity-50 ${isSelected ? "border-primary" : "border-transparent hover:border-border"}`}
                                  data-testid={`button-logo-${id}`}
                                  title={logo.alt}
                                >
                                  <img src={logo.src} alt={logo.alt} className="aspect-square object-contain w-full h-full p-0.5" loading="lazy" />
                                  {isSelected && (
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                                      <Check className="h-5 w-5 text-primary" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedLogo && (
                    <p className="text-xs" data-testid={`text-logo-selection-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <span className="text-muted-foreground">Selected logo: </span>
                      <span className="font-medium">{selectedLogo}</span>
                    </p>
                  )}
                </div>
              )}
              {needsColor && (
                <div className="w-full mt-1 space-y-2">
                  <p
                    className="text-xs text-muted-foreground leading-relaxed"
                    data-testid={`text-color-note-${title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    Choose your color to complete your order.
                  </p>
                  <Select value={selectedColor} onValueChange={(v) => { setSelectedColor(v); setErrorMessage(""); }} disabled={soldOut}>
                    <SelectTrigger
                      className="w-full"
                      data-testid={`select-color-${title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <SelectValue placeholder="Choose your color *" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorChoices.map((choice) => {
                        const out = isColorSoldOut(choice);
                        return (
                          <SelectItem
                            key={choice}
                            value={choice}
                            disabled={out}
                            data-testid={`option-color-${choice.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {choice}{out ? " \u2014 Sold out" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {needsScent && (
                <div className="w-full mt-1 space-y-2">
                  <p
                    className="text-xs text-muted-foreground leading-relaxed"
                    data-testid={`text-scent-note-${title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    Choose your {scentNoun} to complete your order.
                  </p>
                  <Select value={selectedScent} onValueChange={(v) => { setSelectedScent(v); setErrorMessage(""); }} disabled={soldOut}>
                    <SelectTrigger
                      className="w-full"
                      data-testid={`select-scent-${title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <SelectValue placeholder={`Choose your ${scentNoun} *`} />
                    </SelectTrigger>
                    <SelectContent>
                      {scentChoices.map((choice) => (
                        <SelectItem
                          key={choice}
                          value={choice}
                          data-testid={`option-scent-${choice.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {choice}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {needsSize && (
                <div className="w-full mt-1 space-y-2">
                  <p
                    className="text-xs text-muted-foreground leading-relaxed"
                    data-testid={`text-size-note-${title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    Choose your size to complete your order.
                  </p>
                  <Select value={selectedSize} onValueChange={(v) => { setSelectedSize(v); setErrorMessage(""); }} disabled={soldOut}>
                    <SelectTrigger
                      className="w-full"
                      data-testid={`select-size-${title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <SelectValue placeholder="Choose your size *" />
                    </SelectTrigger>
                    <SelectContent>
                      {sizeChoices.map((choice) => (
                        <SelectItem
                          key={choice}
                          value={choice}
                          data-testid={`option-size-${choice.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {choice}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {needsApparelSize && (
                <div className="w-full mt-1 space-y-2">
                  <p
                    className="text-xs text-muted-foreground leading-relaxed"
                    data-testid={`text-apparel-size-note-${title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    Choose your size. Extended sizes (2XL+) cost a little more.
                  </p>
                  <Select value={selectedApparelSize} onValueChange={(v) => { setSelectedApparelSize(v); setErrorMessage(""); }} disabled={soldOut}>
                    <SelectTrigger
                      className="w-full"
                      data-testid={`select-apparel-size-${title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <SelectValue placeholder="Choose your size *" />
                    </SelectTrigger>
                    <SelectContent>
                      {apparelSizeChoices.map((choice) => {
                        const up = sizeUpchargeDollars(choice);
                        return (
                          <SelectItem
                            key={choice}
                            value={choice}
                            data-testid={`option-apparel-size-${choice.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {choice}{up > 0 ? ` (+$${up})` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center gap-3 w-full mt-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  Qty
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity((q) => clampQty(q - 1))}
                    disabled={soldOut || quantity <= 1}
                    data-testid={`button-qty-decrease-${title.toLowerCase().replace(/\s+/g, '-')}`}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span
                    className="w-8 text-center font-medium"
                    data-testid={`text-qty-${title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {quantity}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity((q) => clampQty(q + 1))}
                    disabled={soldOut || quantity >= MAX_QTY}
                    data-testid={`button-qty-increase-${title.toLowerCase().replace(/\s+/g, '-')}`}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Button 
                onClick={handleAddToCart}
                disabled={!priceId || soldOut || (needsLogo && !selectedLogo) || (needsSize && !selectedSize) || (needsApparelSize && !selectedApparelSize) || (needsColor && (!selectedColor || isColorSoldOut(selectedColor))) || (needsScent && !selectedScent)}
                className={`w-full mt-2 transition-colors uppercase tracking-wider font-display text-sm h-10 disabled:opacity-50 ${
                  soldOut 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : added
                    ? 'bg-primary text-black'
                    : 'bg-black text-white hover:bg-primary hover:text-black'
                }`}
                data-testid={`button-add-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {soldOut ? 'Sold Out' : added ? 'Added \u2713' : needsLogo && !selectedLogo ? 'Select a Logo' : (needsSize && !selectedSize) || (needsApparelSize && !selectedApparelSize) ? 'Select a Size' : needsColor && !selectedColor ? 'Select a Color' : needsScent && !selectedScent ? `Select a ${scentNoun === "flavor" ? "Flavor" : "Scent"}` : 'Add to Cart'}
              </Button>
              {errorMessage && (
                <p
                  className="text-xs text-red-500 mt-1"
                  data-testid={`text-error-${title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {errorMessage}
                </p>
              )}
            </>
          )}
          {priceId && (
            <Link href={`/product/${priceId}#reviews`} className="w-full">
              <Button
                type="button"
                variant="outline"
                className="w-full mt-1 uppercase tracking-wider font-display text-sm h-10"
                data-testid={`button-add-review-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <PenLine className="w-4 h-4 mr-2" />
                Add Review
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
