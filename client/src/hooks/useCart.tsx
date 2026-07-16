import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  bundleUpchargeUsd,
  isPremiumLighterProduct,
  lighterUnitPriceWithBundle,
} from "@shared/bundlePricing";

export interface CartItem {
  priceId: string;
  title: string;
  image: string;
  category: string;
  /** Base unit price before any bundle upcharge (lighter retail, etc.). */
  unitPrice: number;
  quantity: number;
  selectedLogo?: string;
  selectedColor?: string;
  selectedSize?: string;
  selectedScent?: string;
  /** Optional lighter accessory bundle id from bundle_config.json */
  bundleId?: string;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (
    priceId: string,
    selectedLogo?: string,
    selectedColor?: string,
    selectedSize?: string,
    selectedScent?: string,
  ) => void;
  updateQuantity: (
    priceId: string,
    selectedLogo: string | undefined,
    quantity: number,
    selectedColor?: string,
    selectedSize?: string,
    selectedScent?: string,
  ) => void;
  /**
   * Apply (or clear) a lighter accessory bundle on every Premium Lighter
   * line in the cart. Non-lighter lines are left unchanged.
   */
  setLighterBundle: (bundleId: string | null) => void;
  /** Currently selected lighter bundle id across lighter lines (if uniform). */
  lighterBundleId: string | null;
  clearCart: () => void;
}

const CART_KEY = "kk_cart_v1";
const MAX_QTY = 99;

const CartContext = createContext<CartContextValue | undefined>(undefined);

function lineKey(
  priceId: string,
  selectedLogo?: string,
  selectedColor?: string,
  selectedSize?: string,
  selectedScent?: string,
) {
  return `${priceId}__${selectedLogo || ""}__${selectedColor || ""}__${selectedSize || ""}__${selectedScent || ""}`;
}

/** Strip a previously baked-in bundle upcharge so we can re-apply cleanly. */
function baseUnitPrice(item: CartItem): number {
  if (!item.bundleId) return item.unitPrice;
  const upcharge = bundleUpchargeUsd(item.bundleId);
  return Math.max(0, Math.round((item.unitPrice - upcharge) * 100) / 100);
}

function withBundle(item: CartItem, bundleId: string | null): CartItem {
  const base = baseUnitPrice(item);
  if (!bundleId) {
    const { bundleId: _drop, ...rest } = item;
    return { ...rest, unitPrice: base };
  }
  return {
    ...item,
    bundleId,
    unitPrice: lighterUnitPriceWithBundle(base, bundleId),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* ignore storage failures */
    }
  }, [items]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      const qty = Math.max(1, Math.min(MAX_QTY, Math.round(quantity)));
      setItems((prev) => {
        const key = lineKey(item.priceId, item.selectedLogo, item.selectedColor, item.selectedSize, item.selectedScent);
        const existing = prev.find(
          (i) => lineKey(i.priceId, i.selectedLogo, i.selectedColor, i.selectedSize, i.selectedScent) === key,
        );
        if (existing) {
          return prev.map((i) =>
            lineKey(i.priceId, i.selectedLogo, i.selectedColor, i.selectedSize, i.selectedScent) === key
              ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + qty) }
              : i,
          );
        }
        return [...prev, { ...item, quantity: qty }];
      });
    },
    [],
  );

  const removeItem = useCallback(
    (priceId: string, selectedLogo?: string, selectedColor?: string, selectedSize?: string, selectedScent?: string) => {
      const key = lineKey(priceId, selectedLogo, selectedColor, selectedSize, selectedScent);
      setItems((prev) =>
        prev.filter((i) => lineKey(i.priceId, i.selectedLogo, i.selectedColor, i.selectedSize, i.selectedScent) !== key),
      );
    },
    [],
  );

  const updateQuantity = useCallback(
    (
      priceId: string,
      selectedLogo: string | undefined,
      quantity: number,
      selectedColor?: string,
      selectedSize?: string,
      selectedScent?: string,
    ) => {
      const key = lineKey(priceId, selectedLogo, selectedColor, selectedSize, selectedScent);
      const qty = Math.max(1, Math.min(MAX_QTY, Math.round(quantity)));
      setItems((prev) =>
        prev.map((i) =>
          lineKey(i.priceId, i.selectedLogo, i.selectedColor, i.selectedSize, i.selectedScent) === key
            ? { ...i, quantity: qty }
            : i,
        ),
      );
    },
    [],
  );

  const setLighterBundle = useCallback((bundleId: string | null) => {
    setItems((prev) =>
      prev.map((item) =>
        isPremiumLighterProduct(item.priceId, item.title)
          ? withBundle(item, bundleId)
          : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const lighterLines = items.filter((i) =>
    isPremiumLighterProduct(i.priceId, i.title),
  );
  const lighterBundleIds = new Set(
    lighterLines.map((i) => i.bundleId || "").filter(Boolean),
  );
  const lighterBundleId =
    lighterBundleIds.size === 1
      ? (Array.from(lighterBundleIds)[0] as string)
      : lighterLines.some((i) => i.bundleId)
        ? (lighterLines.find((i) => i.bundleId)?.bundleId ?? null)
        : null;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        addItem,
        removeItem,
        updateQuantity,
        setLighterBundle,
        lighterBundleId,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
