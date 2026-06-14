import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import {
  allLogos,
  handleColorRecommendations,
  orderedLogosForColor,
} from "@/lib/logoCatalog";

interface MugCustomizerProps {
  title: string;
  image: string;
  category: string;
  unitPrice: number;
  priceId?: string;
  soldOut?: boolean;
  handleColors: string;
}

export default function MugCustomizer({
  title,
  image,
  category,
  unitPrice,
  priceId,
  soldOut,
  handleColors,
}: MugCustomizerProps) {
  const { addItem } = useCart();
  const colors = handleColors
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedLogoId, setSelectedLogoId] = useState<string>("");
  const [added, setAdded] = useState(false);

  const orderedIds = useMemo(
    () => (selectedColor ? orderedLogosForColor(selectedColor) : Object.keys(allLogos)),
    [selectedColor],
  );
  const recommendedSet = useMemo(
    () => new Set(selectedColor ? handleColorRecommendations[selectedColor] || [] : []),
    [selectedColor],
  );

  const canConfirm = !!priceId && !!selectedColor && !!selectedLogoId;

  const handleConfirm = () => {
    if (!priceId || !selectedColor || !selectedLogoId) return;
    const logo = allLogos[selectedLogoId];
    const selectedLogo = `${selectedColor} handle \u2014 ${logo.alt}`;

    addItem({
      priceId,
      title,
      image,
      category,
      unitPrice,
      selectedLogo,
    });

    setOpen(false);
    setSelectedColor("");
    setSelectedLogoId("");
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={!priceId || soldOut}
          className={`w-full mt-2 transition-colors uppercase tracking-wider font-display text-sm h-10 disabled:opacity-50 ${
            soldOut
              ? "bg-gray-400 text-white cursor-not-allowed"
              : added
              ? "bg-primary text-black"
              : "bg-black text-white hover:bg-primary hover:text-black"
          }`}
          data-testid={`button-customize-${title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {soldOut ? "Sold Out" : added ? "Added \u2713" : "Customize & Add"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">
            Customize Your {title}
          </DialogTitle>
          <DialogDescription>
            Pick your handle color first — we'll highlight the logos that match it best.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            1. Handle Color
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setSelectedColor(color);
                  setSelectedLogoId("");
                }}
                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  selectedColor === color
                    ? "bg-primary text-black border-primary font-semibold"
                    : "bg-transparent border-border hover:border-primary"
                }`}
                data-testid={`button-mugcolor-${color.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 flex-1 min-h-0 flex flex-col">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            2. Choose Your Logo
            {!selectedColor && (
              <span className="ml-2 normal-case font-normal text-muted-foreground/80">
                (select a handle color to see matching logos first)
              </span>
            )}
          </p>
          <ScrollArea className="flex-1 min-h-0 max-h-[42vh] pr-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {orderedIds.map((id) => {
                const logo = allLogos[id];
                if (!logo) return null;
                const isRecommended = recommendedSet.has(id);
                const isSelected = selectedLogoId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedLogoId(id)}
                    className={`relative rounded-lg border-2 overflow-hidden bg-muted transition-colors ${
                      isSelected ? "border-primary" : "border-transparent hover:border-border"
                    }`}
                    data-testid={`button-muglogo-${id}`}
                    title={logo.alt}
                  >
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      className="aspect-square object-cover w-full h-full"
                      loading="lazy"
                    />
                    {isRecommended && (
                      <span className="absolute top-1 left-1 bg-primary text-black text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                        Match
                      </span>
                    )}
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Check className="h-6 w-6 text-primary" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground" data-testid="text-mug-selection">
            {selectedColor && selectedLogoId
              ? `${selectedColor} handle — ${allLogos[selectedLogoId].alt}`
              : "Choose a color and a logo to continue."}
          </p>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="uppercase tracking-wider font-display text-sm bg-black text-white hover:bg-primary hover:text-black disabled:opacity-50"
            data-testid="button-confirm-mug"
          >
            Add to Cart — ${unitPrice.toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
