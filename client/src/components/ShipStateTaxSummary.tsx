import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { STATE_SALES_TAX, estimateTaxCents, stateTaxInfo } from "@shared/salesTax";

// The buyer's ship-to state must be chosen on OUR site before checkout —
// Square only asks for the address on its hosted page, too late to add tax.
// The estimate here is display-only; the server derives the authoritative tax
// percentage from the same shared state table.

const STORAGE_KEY = "kk-ship-state";

/** Ship-to state remembered across pages/visits so the buyer picks it once. */
export function useShipToState() {
  const [state, setState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || "";
      return stateTaxInfo(saved) ? saved : "";
    } catch {
      return "";
    }
  });
  const update = (code: string) => {
    setState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Storage unavailable — the in-memory value still works for this page.
    }
  };
  return [state, update] as const;
}

interface ShipStateTaxSummaryProps {
  /** Order subtotal in dollars. */
  subtotal: number;
  state: string;
  onStateChange: (code: string) => void;
}

export default function ShipStateTaxSummary({
  subtotal,
  state,
  onStateChange,
}: ShipStateTaxSummaryProps) {
  const info = stateTaxInfo(state);
  const tax = estimateTaxCents(Math.round(subtotal * 100), state) / 100;
  const total = subtotal + tax;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Shipping To (State)
        </Label>
        <Select value={state} onValueChange={onStateChange}>
          <SelectTrigger data-testid="select-ship-state">
            <SelectValue placeholder="Select your state" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {STATE_SALES_TAX.map((s) => (
              <SelectItem key={s.code} value={s.code} data-testid={`option-state-${s.code}`}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span data-testid="text-tax-subtotal">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-primary font-medium" data-testid="text-shipping-free">
            FREE
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Sales Tax{info ? ` (${info.code}${info.ratePercent > 0 ? ` ${info.ratePercent}%` : ""})` : ""}
          </span>
          <span data-testid="text-tax-estimate">
            {info ? `$${tax.toFixed(2)}` : "Select state"}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-semibold">
          <span>Total</span>
          <span data-testid="text-order-total">
            {info ? `$${total.toFixed(2)}` : `$${subtotal.toFixed(2)} + tax`}
          </span>
        </div>
      </div>
    </div>
  );
}
