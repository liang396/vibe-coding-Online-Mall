import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchProduct } from "../api/productApi";
import { getStoredCart, saveStoredCart } from "../utils/storage";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(getStoredCart());

  useEffect(() => {
    saveStoredCart(items);
  }, [items]);

  const addItem = async (productId, quantity = 1) => {
    const product = await fetchProduct(productId);
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.productId,
          name: product.name,
          price: product.price,
          stock: product.stock,
          quantity
        }
      ];
    });
  };

  const updateQuantity = (productId, quantity) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId ? { ...item, quantity: Math.max(quantity, 1) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => setItems([]);

  const value = useMemo(
    () => ({
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
      addItem,
      updateQuantity,
      removeItem,
      clearCart
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
