import { useMemo, useState } from "react";
import CustomDesignUpload from "@/components/CustomDesignUpload";
import LogoPickerTile from "@/components/LogoPickerTile";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { allLogos, LOGO_SECTIONS, logoIdByAlt, logoSectionGroups } from "@/lib/logoCatalog";
import { placementSurchargeDollars } from "@shared/customization";
import {
  encodeFootwearSize,
  FOOTWEAR_ALL_OVER_PLACEMENT,
  FOOTWEAR_CUSTOMIZATION_DISCLAIMER,
  FOOTWEAR_GENDERS,
  FOOTWEAR_LEAD_TIME_NOTE,
  FOOTWEAR_PLACEMENT_OPTIONS,
  footwearPlacementLabel,
  footwearSizesForGender,
  type FootwearGender,
  type FootwearPlacementId,
} from "@shared/footwear";

interface FootwearCustomizerProps {
  soldOut?: boolean;
  selectedLogo: string;
  onLogoChange: (logo: string) => void;
  selectedSize: string;
  onSizeChange: (size: string) => void;
  customDesignUrl: string;
  onCustomDesignChange: (url: string) => void;
  selectedPlacements: FootwearPlacementId[];
  onPlacementsChange: (placements: FootwearPlacementId[]) => void;
  onError: (message: string) => void;
}

export default function FootwearCustomizer({
  soldOut = false,
  selectedLogo,
  onLogoChange,
  selectedSize,
  onSizeChange,
  customDesignUrl,
  onCustomDesignChange,
  selectedPlacements,
  onPlacementsChange,
  onError,
}: FootwearCustomizerProps) {
  const [gender, setGender] = useState<FootwearGender>("Men");
  const [sizeValue, setSizeValue] = useState("");
  const [logoCollection, setLogoCollection] = useState("All");

  const sizeOptions = useMemo(() => footwearSizesForGender(gender), [gender]);
  const logoCollectionTabs = useMemo(
    () => ["All", ...LOGO_SECTIONS.map((s) => s.name)],
    [],
  );

  const handleGenderChange = (next: FootwearGender) => {
    setGender(next);
    setSizeValue("");
    onSizeChange("");
  };

  const handleSizeSelect = (size: string) => {
    const next = sizeValue === size ? "" : size;
    setSizeValue(next);
    onSizeChange(next ? encodeFootwearSize(gender, next) : "");
  };

  const handlePlacementChange = (placementId: FootwearPlacementId, checked: boolean) => {
    if (placementId === FOOTWEAR_ALL_OVER_PLACEMENT) {
      onPlacementsChange(checked ? [FOOTWEAR_ALL_OVER_PLACEMENT] : ["tongue", "side"]);
      return;
    }

    const withoutAllOver = selectedPlacements.filter((p) => p !== FOOTWEAR_ALL_OVER_PLACEMENT);
    if (checked) {
      onPlacementsChange([...withoutAllOver, placementId]);
      return;
    }

    const next = withoutAllOver.filter((p) => p !== placementId);
    onPlacementsChange(next.length > 0 ? next : ["tongue", "side"]);
  };

  return (
    <div className="space-y-5" data-testid="footwear-customizer">
      <div
        className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2"
        data-testid="text-footwear-disclaimer"
      >
        <p className="text-sm text-secondary-foreground/90 leading-relaxed">
          {FOOTWEAR_CUSTOMIZATION_DISCLAIMER}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {FOOTWEAR_LEAD_TIME_NOTE}
        </p>
      </div>

      <div className="space-y-2" data-testid="picker-footwear-gender">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Choose gender
        </p>
        <div className="flex flex-wrap gap-2">
          {FOOTWEAR_GENDERS.map((g) => (
            <button
              key={g}
              type="button"
              disabled={soldOut}
              onClick={() => handleGenderChange(g)}
              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium uppercase tracking-wider transition-colors disabled:opacity-50 ${
                gender === g
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
              data-testid={`button-footwear-gender-${g.toLowerCase()}`}
            >
              {g === "Men" ? "Men's" : "Women's"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2" data-testid="picker-footwear-size">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Choose your size (US {gender === "Men" ? "4–14" : "5.5–15.5"})
        </p>
        <div className="flex flex-wrap gap-2">
          {sizeOptions.map((size) => {
            const active = sizeValue === size;
            return (
              <button
                key={size}
                type="button"
                disabled={soldOut}
                onClick={() => handleSizeSelect(size)}
                className={`min-w-[3rem] px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
                data-testid={`button-footwear-size-${size.replace(".", "-")}`}
              >
                {size}
              </button>
            );
          })}
        </div>
        <p className="text-sm" data-testid="text-footwear-size-selection">
          {selectedSize ? (
            <>
              <span className="text-muted-foreground">Selected: </span>
              <span className="font-medium">{selectedSize}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Choose a size to continue.</span>
          )}
        </p>
      </div>

      <CustomDesignUpload
        customDesignUrl={customDesignUrl}
        onCustomDesignChange={onCustomDesignChange}
        onError={onError}
        soldOut={soldOut}
        testIdPrefix="footwear-custom-design"
      />

      <div className="space-y-3" data-testid="picker-footwear-placement">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Choose where your design appears
        </p>
        <p className="text-xs text-muted-foreground">
          By default your logo prints on the tongue and side panel. Select all over for a full-shoe print, or add heel and back placements.
        </p>
        <div className="space-y-2">
          {FOOTWEAR_PLACEMENT_OPTIONS.map((placement) => (
            <div
              key={placement.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                selectedPlacements.includes(placement.id)
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <Checkbox
                id={`footwear-placement-${placement.id}`}
                checked={selectedPlacements.includes(placement.id)}
                disabled={soldOut}
                onCheckedChange={(checked) =>
                  handlePlacementChange(placement.id, checked === true)
                }
                data-testid={`checkbox-footwear-placement-${placement.id}`}
              />
              <Label
                htmlFor={`footwear-placement-${placement.id}`}
                className="flex-grow cursor-pointer text-sm font-medium"
              >
                {placement.name}
              </Label>
            </div>
          ))}
        </div>
        {selectedPlacements.length > 1 && !selectedPlacements.includes(FOOTWEAR_ALL_OVER_PLACEMENT) && (
          <p className="text-xs text-muted-foreground" data-testid="text-footwear-placement-fee">
            +${placementSurchargeDollars(selectedPlacements.length).toFixed(0)} multiple-placement fee
          </p>
        )}
        <p className="text-sm" data-testid="text-footwear-placement-selection">
          <span className="text-muted-foreground">Selected: </span>
          <span className="font-medium">
            {selectedPlacements.map(footwearPlacementLabel).join(", ")}
          </span>
        </p>
      </div>

      <div className="space-y-3" data-testid="picker-footwear-logo">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Select one of our brand logos (required)
        </p>
        <div className="flex flex-wrap gap-2" data-testid="tabs-footwear-logo-collection">
          {logoCollectionTabs.map((name) => (
            <button
              key={name}
              type="button"
              disabled={soldOut}
              onClick={() => setLogoCollection(name)}
              className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide transition-colors disabled:opacity-50 ${
                logoCollection === name
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
              data-testid={`tab-footwear-logo-${name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {name}
            </button>
          ))}
        </div>
        <div
          className="logo-picker-scroll max-h-[min(55vh,420px)] rounded-lg border border-primary/10 bg-muted/20 p-3 pr-2"
        >
          <div className="space-y-5">
            {LOGO_SECTIONS.filter((section) => {
              if (logoCollection === "All") {
                return (
                  section.name !== "Feminine Collection" &&
                  section.name !== "Masculine Collection"
                );
              }
              return section.name === logoCollection;
            }).flatMap((section) =>
              logoSectionGroups(section).map((group) => (
                <div key={`${section.name}-${group.label}`} className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {group.ids.map((id) => {
                      const logo = allLogos[id];
                      if (!logo) return null;
                      return (
                        <LogoPickerTile
                          key={id}
                          logoId={id}
                          isSelected={selectedLogo === logo.alt}
                          disabled={soldOut}
                          onSelect={() => onLogoChange(logo.alt)}
                          testId={`button-footwear-logo-${id}`}
                        />
                      );
                    })}
                  </div>
                </div>
              )),
            )}
          </div>
        </div>
        <p className="text-sm" data-testid="text-footwear-logo-selection">
          {selectedLogo ? (
            <>
              <span className="text-muted-foreground">Selected logo: </span>
              {logoIdByAlt(selectedLogo) && (
                <span className="font-mono text-primary">
                  #{logoIdByAlt(selectedLogo)}{" "}
                </span>
              )}
              <span className="font-medium">{selectedLogo}</span>
            </>
          ) : (
            <span className="text-muted-foreground">
              Choose one of our brand logos to complete your order.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
