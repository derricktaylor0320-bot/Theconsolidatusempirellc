import { useMemo, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import LogoPickerTile from "@/components/LogoPickerTile";
import { allLogos, LOGO_SECTIONS, logoIdByAlt, logoSectionGroups } from "@/lib/logoCatalog";
import {
  encodeFootwearSize,
  FOOTWEAR_CUSTOMIZATION_DISCLAIMER,
  FOOTWEAR_GENDERS,
  FOOTWEAR_LEAD_TIME_NOTE,
  footwearSizesForGender,
  type FootwearGender,
} from "@shared/footwear";

interface FootwearCustomizerProps {
  soldOut?: boolean;
  selectedLogo: string;
  onLogoChange: (logo: string) => void;
  selectedSize: string;
  onSizeChange: (size: string) => void;
  customDesignUrl: string;
  onCustomDesignChange: (url: string) => void;
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
  onError,
}: FootwearCustomizerProps) {
  const [gender, setGender] = useState<FootwearGender>("Men");
  const [sizeValue, setSizeValue] = useState("");
  const [logoCollection, setLogoCollection] = useState("All");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUpload = async (file: File) => {
    setUploading(true);
    onError("");
    try {
      const form = new FormData();
      form.append("design", file);
      const res = await fetch("/api/footwear/custom-design", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }
      onCustomDesignChange(data.url);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
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

      <div className="space-y-2" data-testid="picker-footwear-custom-design">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Upload your logo or design (optional)
        </p>
        <p className="text-xs text-muted-foreground">
          Share your artwork so our team can incorporate your vision. You must still select one of our brand logos below.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
        {customDesignUrl ? (
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-muted/20 p-3">
            <img
              src={customDesignUrl}
              alt="Your uploaded design"
              className="h-16 w-16 rounded object-contain bg-white"
              data-testid="img-footwear-custom-design"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Design uploaded</p>
              <p className="text-xs text-muted-foreground">Ready for customization</p>
            </div>
            <button
              type="button"
              disabled={soldOut}
              onClick={() => onCustomDesignChange("")}
              className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Remove uploaded design"
              data-testid="button-remove-custom-design"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={soldOut || uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 disabled:opacity-50"
            data-testid="button-upload-custom-design"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload your logo or design"}
          </button>
        )}
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
