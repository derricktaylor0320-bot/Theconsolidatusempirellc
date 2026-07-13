import { motion } from "framer-motion";
import brandBadge from "@assets/1781697764383_1781711765541.png";

type BrandSectionBannerProps = {
  /** Optional page-specific caption under the badge */
  caption?: string;
  className?: string;
  /** Slightly tighter for dense pages */
  compact?: boolean;
};

/**
 * Site-wide intro for Khomplete Khemistri Apparel & Accessories —
 * the new business-name royalty badge, stretched across the section.
 */
export default function BrandSectionBanner({
  caption,
  className = "",
  compact = false,
}: BrandSectionBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center ${compact ? "mb-8" : "mb-12"} ${className}`}
      data-testid="brand-section-banner"
    >
      <img
        src={brandBadge}
        alt="Khomplete Khemistri Apparel & Accessories — Royalty Badge of Honor"
        className={`w-full ${compact ? "max-w-2xl" : "max-w-4xl"} mx-auto h-auto object-contain drop-shadow-2xl ${compact ? "mb-4" : "mb-6"}`}
        data-testid="img-brand-section-banner"
      />
      {caption ? (
        <p className="text-muted-foreground max-w-2xl mx-auto">{caption}</p>
      ) : null}
    </motion.div>
  );
}
