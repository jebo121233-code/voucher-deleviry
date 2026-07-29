import { useState, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import "./auth.css";
import "./Delivery.css";
import { shops as fakeStores, DELIVERY_FEE } from "../data/data.js";
import { useCart } from "../context/CartContext.jsx";

export default function Delivery() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const placeName = searchParams.get("place") || "";
  const storeId = searchParams.get("id") || "";

  const store = fakeStores.find((s) => String(s.id) === String(storeId));
  const hasMenu = store?.menu?.length > 0;

  const { addDeliveryItems } = useCart();
  const [quantities, setQuantities] = useState({});

  const updateQty = (itemName, delta) => {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[itemName] || 0) + delta);
      return { ...prev, [itemName]: next };
    });
  };

  const { orderedItems, subtotalBefore, subtotalAfter } = useMemo(() => {
    if (!hasMenu) return { orderedItems: [], subtotalBefore: 0, subtotalAfter: 0 };

    const items = store.menu
      .map((item) => ({ ...item, qty: quantities[item.name] || 0 }))
      .filter((item) => item.qty > 0);

    const before = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const after = items.reduce((sum, i) => sum + i.discounted_price * i.qty, 0);

    return { orderedItems: items, subtotalBefore: before, subtotalAfter: after };
  }, [quantities, hasMenu, store]);

  const total = subtotalAfter + DELIVERY_FEE;

  const handleAddToCart = () => {
    if (orderedItems.length === 0) return;
    const restaurant = placeName ? decodeURIComponent(placeName) : "";
    addDeliveryItems(restaurant, storeId, orderedItems);
    navigate("/cart");
  };

  if (!hasMenu) {
    return (
      <div className="auth-container delivery-container">
        <h2>اطلب دليفري</h2>
        <p>متاح حاليا شحن كروت االخصم فقط و خدمة توصيل المطاعم ستتاح قريبا .</p>
      </div>
    );
  }

  return (
    <div className="auth-container delivery-container">
      <h2>اطلب دليفري</h2>

      {placeName && (
        <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
          بتطلب من: {decodeURIComponent(placeName)} 🛵
        </p>
      )}

      <div className="delivery-menu">
        {store.menu.map((item, index) => (
          <div className="delivery-menu-item" key={index}>
            <div className="delivery-menu-item-info">
              <span className="menu-item-name">{item.name}</span>
              <span className="menu-item-prices">
                <span className="price-before">{item.price} ج.م</span>
                <span className="price-after">{item.discounted_price} ج.م</span>
              </span>
            </div>
            <div className="qty-control">
              <button type="button" onClick={() => updateQty(item.name, -1)}>−</button>
              <span>{quantities[item.name] || 0}</span>
              <button type="button" onClick={() => updateQty(item.name, 1)}>+</button>
            </div>
          </div>
        ))}

        <div className="delivery-summary">
          <div><span>الإجمالي قبل الخصم</span><span>{subtotalBefore} ج.م</span></div>
          <div><span>الإجمالي بعد الخصم</span><span>{subtotalAfter} ج.م</span></div>
          <div><span>رسوم التوصيل</span><span>{DELIVERY_FEE} ج.م</span></div>
          <div className="delivery-total"><span>الإجمالي المتوقع</span><span>{total} ج.م</span></div>
        </div>
      </div>

      <button
        className="add-to-cart-btn"
        onClick={handleAddToCart}
        disabled={orderedItems.length === 0}
      >
        أضف للسلة 🛒
      </button>

      <p style={{ textAlign: "center", marginTop: 10 }}>
        <Link to="/cart">اذهب للسلة</Link>
      </p>
    </div>
  );
}
