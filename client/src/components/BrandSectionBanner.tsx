import { motion } from "framer-motion";
import consolidatusBadge from "@assets/badge_consolidatus_empire_standalone_218.png";

type BrandSectionBannerProps = {
  /** Optional page-specific caption under the badge */
  caption?: string;
  className?: string;
  /** Slightly tighter for dense pages */
  compact?: boolean;
  /** Override the default Consolidatus Empire badge */
  imageSrc?: string;
  imageAlt?: string;
};

/**
 * Site-wide intro for The Consolidatus Empire —
 * the royalty badge stretched across the section.
 */
export default function BrandSectionBanner({
  caption,
  className = "",
  compact = false,
  imageSrc = consolidatusBadge,
  imageAlt = "The Consolidatus Empire LLC — Royalty Badge of Honor",
}: BrandSectionBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center ${compact ? "mb-8" : "mb-12"} ${className}`}
      data-testid="brand-section-banner"
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        className={`w-full ${compact ? "max-w-2xl" : "max-w-4xl"} mx-auto h-auto object-contain drop-shadow-2xl ${compact ? "mb-4" : "mb-6"}`}
        data-testid="img-brand-section-banner"
      />
      {caption ? (
        <p className="text-muted-foreground max-w-2xl mx-auto">{caption}</p>
      ) : null}
    </motion.div>
  );
}
