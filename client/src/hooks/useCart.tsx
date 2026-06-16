import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  priceId: string;
  title: string;
  image: string;
  category: string;
  unitPrice: number;
  quantity: number;
  selectedLogo?: string;
  selectedColor?: string;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (priceId: string, selectedLogo?: string, selectedColor?: string) => void;
  updateQuantity: (
    priceId: string,
    selectedLogo: string | undefined,
    quantity: number,
    selectedColor?: string,
  ) => void;
  clearCart: () => void;
}

const CART_KEY = "kk_cart_v1";
const MAX_QTY = 99;

const CartContext = createContext<CartContextValue | undefined>(undefined);

function lineKey(priceId: string, selectedLogo?: string, selectedColor?: string) {
  return `${priceId}__${selectedLogo || ""}__${selectedColor || ""}`;
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
        const key = lineKey(item.priceId, item.selectedLogo, item.selectedColor);
        const existing = prev.find(
          (i) => lineKey(i.priceId, i.selectedLogo, i.selectedColor) === key,
        );
        if (existing) {
          return prev.map((i) =>
            lineKey(i.priceId, i.selectedLogo, i.selectedColor) === key
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
    (priceId: string, selectedLogo?: string, selectedColor?: string) => {
      const key = lineKey(priceId, selectedLogo, selectedColor);
      setItems((prev) =>
        prev.filter((i) => lineKey(i.priceId, i.selectedLogo, i.selectedColor) !== key),
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
    ) => {
      const key = lineKey(priceId, selectedLogo, selectedColor);
      const qty = Math.max(1, Math.min(MAX_QTY, Math.round(quantity)));
      setItems((prev) =>
        prev.map((i) =>
          lineKey(i.priceId, i.selectedLogo, i.selectedColor) === key
            ? { ...i, quantity: qty }
            : i,
        ),
      );
    },
    [],
  );

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        addItem,
        removeItem,
        updateQuantity,
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
