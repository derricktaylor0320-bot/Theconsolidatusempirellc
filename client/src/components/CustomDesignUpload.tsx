import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

interface CustomDesignUploadProps {
  customDesignUrl: string;
  onCustomDesignChange: (url: string) => void;
  onError: (message: string) => void;
  soldOut?: boolean;
  description?: string;
  testIdPrefix?: string;
}

export default function CustomDesignUpload({
  customDesignUrl,
  onCustomDesignChange,
  onError,
  soldOut = false,
  description = "Share your artwork so our team can incorporate your vision. You must still select one of our brand logos below to complete your order.",
  testIdPrefix = "custom-design",
}: CustomDesignUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="space-y-2" data-testid={`picker-${testIdPrefix}`}>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Upload your logo or design (optional)
      </p>
      <p className="text-xs text-muted-foreground">{description}</p>
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
            data-testid={`img-${testIdPrefix}`}
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
            data-testid={`button-remove-${testIdPrefix}`}
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
          data-testid={`button-upload-${testIdPrefix}`}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading…" : "Upload your logo or design"}
        </button>
      )}
    </div>
  );
}
