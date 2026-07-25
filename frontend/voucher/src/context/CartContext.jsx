import { createContext, useContext, useState, useEffect } from "react";
import { DELIVERY_FEE, CARD_SHIPPING_FEE } from "../data/data.js";

const CartContext = createContext(null);
const STORAGE_KEY = "ve_cart";

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { restaurant: null, restaurantId: null, deliveryItems: [], cardItems: [] };
    } catch {
      return { restaurant: null, restaurantId: null, deliveryItems: [], cardItems: [] };
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addDeliveryItems = (restaurantName, restaurantId, items) => {
    setCart((prev) => {
      if (prev.restaurantId && prev.restaurantId !== restaurantId && prev.deliveryItems.length > 0) {
        const confirmed = window.confirm(
          `السلة فيها طلب من "${prev.restaurant}" بالفعل.\nهل تريد استبداله بطلب "${restaurantName}"؟`
        );
        if (!confirmed) return prev;
      }
      return {
        ...prev,
        restaurant: restaurantName,
        restaurantId,
        deliveryItems: items,
      };
    });
  };

  const removeDeliveryItems = () => {
    setCart((prev) => ({ ...prev, restaurant: null, restaurantId: null, deliveryItems: [] }));
  };

  const addCard = (card) => {
    setCart((prev) => {
      const existing = prev.cardItems.find((c) => c.id === card.id);
      if (existing) {
        return {
          ...prev,
          cardItems: prev.cardItems.map((c) =>
            c.id === card.id ? { ...c, qty: c.qty + 1 } : c
          ),
        };
      }
      return { ...prev, cardItems: [...prev.cardItems, { ...card, qty: 1 }] };
    });
  };

  const updateCardQty = (cardId, delta) => {
    setCart((prev) => ({
      ...prev,
      cardItems: prev.cardItems
        .map((c) => (c.id === cardId ? { ...c, qty: Math.max(0, c.qty + delta) } : c))
        .filter((c) => c.qty > 0),
    }));
  };

  const removeCard = (cardId) => {
    setCart((prev) => ({ ...prev, cardItems: prev.cardItems.filter((c) => c.id !== cardId) }));
  };

  const clearCart = () => {
    setCart({ restaurant: null, restaurantId: null, deliveryItems: [], cardItems: [] });
  };

  const deliverySubtotalBefore = cart.deliveryItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const deliverySubtotalAfter = cart.deliveryItems.reduce((sum, i) => sum + i.discounted_price * i.qty, 0);
  const hasDelivery = cart.deliveryItems.length > 0;
  const deliveryFeeTotal = hasDelivery ? DELIVERY_FEE : 0;

  const cardsSubtotal = cart.cardItems.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cardsShippingTotal = cart.cardItems.reduce((sum, c) => sum + CARD_SHIPPING_FEE * c.qty, 0);

  const grandTotal = deliverySubtotalAfter + deliveryFeeTotal + cardsSubtotal + cardsShippingTotal;

  const itemsCount =
    cart.deliveryItems.reduce((sum, i) => sum + i.qty, 0) +
    cart.cardItems.reduce((sum, c) => sum + c.qty, 0);

  const value = {
    cart,
    addDeliveryItems,
    removeDeliveryItems,
    addCard,
    updateCardQty,
    removeCard,
    clearCart,
    deliverySubtotalBefore,
    deliverySubtotalAfter,
    hasDelivery,
    deliveryFeeTotal,
    cardsSubtotal,
    cardsShippingTotal,
    grandTotal,
    itemsCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart لازم يتستخدم جوه CartProvider");
  return ctx;
}
