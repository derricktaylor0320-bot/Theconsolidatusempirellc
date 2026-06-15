import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { allLogos } from "@/lib/logoCatalog";
import { PHONE_MODELS_BY_TYPE, PHONE_MODEL_LABEL } from "@shared/phoneModels";

interface CaseCustomizerProps {
  title: string;
  image: string;
  category: string;
  unitPrice: number;
  priceId?: string;
  soldOut?: boolean;
  caseType: string;
}

export default function CaseCustomizer({
  title,
  image,
  category,
  unitPrice,
  priceId,
  soldOut,
  caseType,
}: CaseCustomizerProps) {
  const { addItem } = useCart();
  const models = PHONE_MODELS_BY_TYPE[caseType] || [];
  const modelLabel = PHONE_MODEL_LABEL[caseType] || "Phone Model";

  const [open, setOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedLogoId, setSelectedLogoId] = useState<string>("");
  const [added, setAdded] = useState(false);

  const logoIds = Object.keys(allLogos);
  const canConfirm = !!priceId && !!selectedModel && !!selectedLogoId;

  const handleConfirm = () => {
    if (!priceId || !selectedModel || !selectedLogoId) return;
    const logo = allLogos[selectedLogoId];
    const selectedLogo = `${selectedModel} \u2014 ${logo.alt}`;

    addItem({
      priceId,
      title,
      image,
      category,
      unitPrice,
      selectedLogo,
    });

    setOpen(false);
    setSelectedModel("");
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
            Pick your phone model, then choose the Khomplete Khemistri logo you
            want printed on your case.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            1. {modelLabel}
          </p>
          <Select
            value={selectedModel}
            onValueChange={setSelectedModel}
          >
            <SelectTrigger className="w-full" data-testid="select-case-model">
              <SelectValue placeholder={`Choose your ${modelLabel.toLowerCase()} *`} />
            </SelectTrigger>
            <SelectContent className="max-h-[40vh]">
              {models.map((model) => (
                <SelectItem
                  key={model}
                  value={model}
                  data-testid={`option-case-model-${model.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                >
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 flex-1 min-h-0 flex flex-col">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            2. Choose Your Logo
          </p>
          <ScrollArea className="flex-1 min-h-0 max-h-[42vh] pr-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {logoIds.map((id) => {
                const logo = allLogos[id];
                if (!logo) return null;
                const isSelected = selectedLogoId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedLogoId(id)}
                    className={`relative rounded-lg border-2 overflow-hidden bg-muted transition-colors ${
                      isSelected ? "border-primary" : "border-transparent hover:border-border"
                    }`}
                    data-testid={`button-caselogo-${id}`}
                    title={logo.alt}
                  >
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      className="aspect-square object-cover w-full h-full"
                      loading="lazy"
                    />
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
          <p className="text-sm text-muted-foreground" data-testid="text-case-selection">
            {selectedModel && selectedLogoId
              ? `${selectedModel} \u2014 ${allLogos[selectedLogoId].alt}`
              : "Choose a phone model and a logo to continue."}
          </p>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="uppercase tracking-wider font-display text-sm bg-black text-white hover:bg-primary hover:text-black disabled:opacity-50"
            data-testid="button-confirm-case"
          >
            Add to Cart — ${unitPrice.toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
