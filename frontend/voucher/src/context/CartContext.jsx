import { createContext, useContext, useState, useEffect } from "react";
import { DELIVERY_FEE, CARD_SHIPPING_FEE } from "../data/data.js";

const CartContext = createContext(null);
const STORAGE_KEY = "ve_cart";

const EMPTY_CART = {
  restaurant: null,
  restaurantId: null,
  deliveryItems: [],
  cardItems: [],
  pointsRequired: 0, // النقاط اللي المحل ده بيطلبها لتفعيل خصمه (0 = الخصم شغال من غير نقاط)
  usePoints: false, // العميل اختار يستخدم النقاط ويفعّل الخصم
};

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...EMPTY_CART, ...JSON.parse(saved) } : EMPTY_CART;
    } catch {
      return EMPTY_CART;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // meta: { pointsRequired }. بترجّع false لو العميل رفض استبدال سلة مطعم تاني.
  const addDeliveryItems = (restaurantName, restaurantId, items, meta = {}) => {
    if (cart.restaurantId && cart.restaurantId !== restaurantId && cart.deliveryItems.length > 0) {
      const confirmed = window.confirm(
        `السلة فيها طلب من "${cart.restaurant}" بالفعل.\nهل تريد استبداله بطلب "${restaurantName}"؟`
      );
      if (!confirmed) return false;
    }
    setCart((prev) => ({
      ...prev,
      restaurant: restaurantName,
      restaurantId,
      deliveryItems: items,
      pointsRequired: Number(meta.pointsRequired) || 0,
      usePoints: false,
    }));
    return true;
  };

  const removeDeliveryItems = () => {
    setCart((prev) => ({
      ...prev,
      restaurant: null,
      restaurantId: null,
      deliveryItems: [],
      pointsRequired: 0,
      usePoints: false,
    }));
  };

  const setUsePoints = (value) => {
    setCart((prev) => ({ ...prev, usePoints: !!value }));
  };

  const addCard = (card) => {
    setCart((prev) => {
      const existing = prev.cardItems.find((c) => c.id === card.id);
      if (existing) {
        return {
          ...prev,
          cardItems: prev.cardItems.map((c) => (c.id === card.id ? { ...c, qty: c.qty + 1 } : c)),
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
    setCart(EMPTY_CART);
  };

  // الخصم شغال لو المحل مش بيطلب نقاط، أو لو العميل اختار يستخدمها
  const discountActive = cart.pointsRequired > 0 ? cart.usePoints : true;
  const unitPrice = (item) => (discountActive ? item.discounted_price : item.price);

  const deliverySubtotalBefore = cart.deliveryItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const deliverySubtotalAfter = cart.deliveryItems.reduce((sum, i) => sum + unitPrice(i) * i.qty, 0);
  // كام هيوفّر لو فعّل الخصم (بيتعرض للعميل لما الخصم مش مفعّل)
  const potentialSaving = cart.deliveryItems.reduce((sum, i) => sum + (i.price - i.discounted_price) * i.qty, 0);
  const hasDelivery = cart.deliveryItems.length > 0;
  const deliveryFeeTotal = hasDelivery ? DELIVERY_FEE : 0;

  const cardsSubtotal = cart.cardItems.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cardsShippingTotal = cart.cardItems.length > 0 ? CARD_SHIPPING_FEE : 0;

  const grandTotal = deliverySubtotalAfter + deliveryFeeTotal + cardsSubtotal + cardsShippingTotal;

  const itemsCount =
    cart.deliveryItems.reduce((sum, i) => sum + i.qty, 0) + cart.cardItems.reduce((sum, c) => sum + c.qty, 0);

  const value = {
    cart,
    addDeliveryItems,
    removeDeliveryItems,
    setUsePoints,
    addCard,
    updateCardQty,
    removeCard,
    clearCart,
    discountActive,
    unitPrice,
    deliverySubtotalBefore,
    deliverySubtotalAfter,
    potentialSaving,
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
