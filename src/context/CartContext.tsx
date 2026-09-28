import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import type { CartItem } from "../types/cart";

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalBuyNow: number;
  totalMonthly: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = "lumina_cart_items";

function canUseWebStorage() {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function loadStoredCartItems(): CartItem[] {
  if (!canUseWebStorage()) {
    return [];
  }

  try {
    const storedItems = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!storedItems) {
      return [];
    }

    const parsedItems = JSON.parse(storedItems);

    if (!Array.isArray(parsedItems)) {
      return [];
    }

    return parsedItems as CartItem[];
  } catch (error) {
    console.error("Failed to load Lumina cart:", error);
    return [];
  }
}

function saveStoredCartItems(items: CartItem[]) {
  if (!canUseWebStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save Lumina cart:", error);
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  useEffect(() => {
    const storedItems = loadStoredCartItems();

    setItems(storedItems);
    setCartLoaded(true);

    console.log("LUMINA CART LOADED:", storedItems);
  }, []);

  useEffect(() => {
    if (!cartLoaded) {
      return;
    }

    saveStoredCartItems(items);

    console.log("LUMINA CART SAVED:", items);
  }, [items, cartLoaded]);

  function addItem(item: CartItem) {
    setItems((currentItems) => {
      const updatedItems = [...currentItems, item];

      console.log("LUMINA ADD ITEM:", item);
      console.log("LUMINA UPDATED CART:", updatedItems);

      return updatedItems;
    });
  }

  function removeItem(id: string) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== id)
    );
  }

  function clearCart() {
    setItems([]);
  }

  const value = useMemo(() => {
    const totalItems = items.reduce((sum, item) => {
      return sum + item.quantity;
    }, 0);

    const totalBuyNow = items.reduce((sum, item) => {
      if (item.paymentMode === "buy") {
        return sum + item.unitPrice * item.quantity;
      }

      return sum;
    }, 0);

    /*
     * monthlyPrice is the FINAL recurring monthly amount.
     *
     * Examples:
     * - lease + insurance
     * - financing + insurance
     * - outright purchase + monthly insurance
     *
     * Therefore we intentionally do NOT exclude "buy" items.
     */
    const totalMonthly = items.reduce((sum, item) => {
      if (item.monthlyPrice > 0) {
        return sum + item.monthlyPrice * item.quantity;
      }

      return sum;
    }, 0);

    return {
      items,
      addItem,
      removeItem,
      clearCart,
      totalItems,
      totalBuyNow,
      totalMonthly,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);

  if (!value) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return value;
}
