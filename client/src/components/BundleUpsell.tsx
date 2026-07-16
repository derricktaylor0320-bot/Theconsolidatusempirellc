import { useEffect, useState } from "react";
import { Gift, Sparkles, Wallet } from "lucide-react";
import {
  BUNDLE_CONFIG,
  type BundleDefinition,
  shouldShowLighterBundleUpsell,
} from "@shared/bundlePricing";
import type { CartItem } from "@/hooks/useCart";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const UPSELL_DISMISSED_KEY = "kk_lighter_bundle_upsell_dismissed_v1";

const BUNDLE_ICONS: Record<string, typeof Gift> = {
  luxury_gift_set: Gift,
  kicks_and_spark_pack: Sparkles,
  executive_carry_pack: Wallet,
};

function formatUpcharge(amount: number): string {
  return `+$${amount.toFixed(2)}`;
}

function accessorySummary(bundle: BundleDefinition): string {
  const lighterCost =
    BUNDLE_CONFIG.base_products.premium_lighter.base_cost_usd;
  return bundle.components
    .filter((c) => Math.abs(c.base_cost - lighterCost) > 0.001)
    .map((c) => c.item)
    .join(" · ");
}

interface BundleUpsellProps {
  items: CartItem[];
  selectedBundleId: string | null;
  onSelectBundle: (bundleId: string | null) => void;
}

/**
 * Cart Upsell Hook UI — shown when the cart contains only a Premium Lighter.
 * Offers mutually exclusive accessory-bundle toggles plus a one-time modal.
 */
export default function BundleUpsell({
  items,
  selectedBundleId,
  onSelectBundle,
}: BundleUpsellProps) {
  const visible = shouldShowLighterBundleUpsell(items);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!visible) {
      setModalOpen(false);
      return;
    }
    try {
      if (sessionStorage.getItem(UPSELL_DISMISSED_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    // Defer open so the cart paints first.
    const t = window.setTimeout(() => setModalOpen(true), 400);
    return () => window.clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  const bundles = BUNDLE_CONFIG.bundle_definitions;

  const dismissModal = () => {
    setModalOpen(false);
    try {
      sessionStorage.setItem(UPSELL_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const selectAndClose = (bundleId: string) => {
    onSelectBundle(bundleId);
    dismissModal();
  };

  return (
    <>
      <section
        className="border border-primary/30 rounded-xl p-5 space-y-4 bg-primary/5"
        data-testid="bundle-upsell-panel"
        aria-label="Lighter accessory bundles"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-display mb-1">
            Complete Your Lighter
          </p>
          <h2 className="font-display font-bold uppercase text-lg tracking-tight">
            Add a Matching Bundle
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pair your premium lighter with higher-margin accessories. Toggle one
            upgrade below — or continue with the lighter alone.
          </p>
        </div>

        <ul className="space-y-3">
          {bundles.map((bundle) => {
            const Icon = BUNDLE_ICONS[bundle.bundle_id] || Gift;
            const checked = selectedBundleId === bundle.bundle_id;
            const id = `bundle-${bundle.bundle_id}`;
            return (
              <li key={bundle.bundle_id}>
                <label
                  htmlFor={id}
                  className={`flex gap-3 items-start rounded-lg border p-3 cursor-pointer transition-colors ${
                    checked
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40"
                  }`}
                  data-testid={`bundle-option-${bundle.bundle_id}`}
                >
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(state) => {
                      onSelectBundle(state === true ? bundle.bundle_id : null);
                    }}
                    className="mt-1"
                    data-testid={`checkbox-bundle-${bundle.bundle_id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-display font-semibold uppercase text-sm flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        {bundle.display_name}
                      </span>
                      <span className="text-sm font-medium text-primary shrink-0">
                        {formatUpcharge(bundle.suggested_upcharge_add_on)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {bundle.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 mt-1 truncate">
                      Includes: {accessorySummary(bundle)}
                    </p>
                    <p className="text-xs text-foreground/80 mt-2 italic">
                      {bundle.upsell_prompt}
                    </p>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>

        {selectedBundleId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="uppercase tracking-wider font-display text-xs"
            onClick={() => onSelectBundle(null)}
            data-testid="button-clear-bundle"
          >
            Keep lighter only
          </Button>
        )}
      </section>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) dismissModal();
          else setModalOpen(true);
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          data-testid="bundle-upsell-modal"
        >
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-tight">
              Upgrade Your Lighter?
            </DialogTitle>
            <DialogDescription>
              Your cart has a premium lighter. Add a matching accessory pack
              before checkout — tin & pouch, kicks charms, or EDC multi-tool.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {bundles.map((bundle) => {
              const Icon = BUNDLE_ICONS[bundle.bundle_id] || Gift;
              return (
                <button
                  key={bundle.bundle_id}
                  type="button"
                  onClick={() => selectAndClose(bundle.bundle_id)}
                  className="w-full text-left rounded-lg border border-border hover:border-primary/50 p-3 transition-colors"
                  data-testid={`modal-bundle-${bundle.bundle_id}`}
                >
                  <div className="flex justify-between gap-2 items-center">
                    <span className="font-display font-semibold uppercase text-sm flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      {bundle.display_name}
                    </span>
                    <span className="text-sm text-primary font-medium">
                      {formatUpcharge(bundle.suggested_upcharge_add_on)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {bundle.upsell_prompt}
                  </p>
                </button>
              );
            })}
          </div>

          <DialogFooter className="sm:justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={dismissModal}
              className="uppercase tracking-wider font-display"
              data-testid="button-dismiss-bundle-modal"
            >
              No thanks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
