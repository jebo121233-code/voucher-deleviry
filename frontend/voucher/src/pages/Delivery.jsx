import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import "./auth.css";
import "./Delivery.css";
import { shops as fakeStores, MENU_STORE_KEYS, CART_SCRIPT_URL, DELIVERY_FEE } from "../data/data.js";
import { useCart } from "../context/CartContext.jsx";

export default function Delivery() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const placeName = searchParams.get("place") || "";
  const storeId = searchParams.get("id") || "";

  const store = fakeStores.find((s) => String(s.id) === String(storeId));

  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [pointsRequired, setPointsRequired] = useState(0);
  // التوصيل متاح للمطاعم والكافيهات بس. المحل التاني بيعرض منتجاته من غير سلة.
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const hasMenu = menuItems.length > 0;

  const { addDeliveryItems } = useCart();
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    const menuKey = MENU_STORE_KEYS[storeId];
    if (!menuKey) {
      setMenuItems([]);
      setMenuLoading(false);
      return;
    }

    const fetchMenu = async () => {
      setMenuLoading(true);
      try {
        const res = await fetch(CART_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "getMenu", storeId: menuKey }),
        });
        const data = await res.json();
        if (data.success) {
          setMenuItems(data.items);
          setPointsRequired(Number(data.pointsRequired) || 0);
          setDeliveryEnabled(data.deliveryEnabled !== false);
        } else {
          setMenuItems([]);
        }
      } catch (err) {
        console.error("فشل تحميل المنيو:", err);
        setMenuItems([]);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenu();
  }, [storeId]);

  // stock: null = من غير حد، رقم = المتاح (الصنف اللي خلص السيرفر مبيبعتوش أصلًا)
  const maxFor = (item) => (typeof item.stock === "number" ? item.stock : Infinity);

  const updateQty = (item, delta) => {
    setQuantities((prev) => {
      const next = Math.min(maxFor(item), Math.max(0, (prev[item.name] || 0) + delta));
      return { ...prev, [item.name]: next };
    });
  };

  const { orderedItems, subtotalBefore, subtotalAfter } = useMemo(() => {
    if (!hasMenu) return { orderedItems: [], subtotalBefore: 0, subtotalAfter: 0 };

    const items = menuItems
      .map((item) => ({ ...item, qty: quantities[item.name] || 0 }))
      .filter((item) => item.qty > 0);

    const before = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const after = items.reduce((sum, i) => sum + i.discounted_price * i.qty, 0);

    return { orderedItems: items, subtotalBefore: before, subtotalAfter: after };
  }, [quantities, hasMenu, menuItems]);

  const total = subtotalAfter + DELIVERY_FEE;

  const handleAddToCart = () => {
    if (orderedItems.length === 0) return;
    const restaurant = placeName ? decodeURIComponent(placeName) : store ? store.name : "";
    const added = addDeliveryItems(restaurant, storeId, orderedItems, { pointsRequired });
    if (added) navigate("/cart");
  };

  if (menuLoading) {
    return (
      <div className="auth-container delivery-container">
        <h2>اطلب دليفري</h2>
        <p style={{ textAlign: "center" }}>جارٍ تحميل المنيو...</p>
      </div>
    );
  }

  if (!hasMenu) {
    return (
      <div className="auth-container delivery-container">
        <h2>اطلب دليفري</h2>
        <p>متاح حاليا شحن كروت االخصم فقط و خدمة توصيل المطاعم ستتاح قريبا,يمكنك التواصل معنا من خلال الواتساب او عبر صفحتنا  .</p>
      </div>
    );
  }

  return (
    <div className="auth-container delivery-container">
      <h2>{deliveryEnabled ? "اطلب دليفري" : "المنتجات"}</h2>

      {placeName && (
        <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
          {deliveryEnabled ? "بتطلب من" : "منتجات"}: {decodeURIComponent(placeName)} {deliveryEnabled ? "🛵" : "🛍️"}
        </p>
      )}

      {!deliveryEnabled && (
        <p style={{ textAlign: "center", color: "#7a5c00", background: "#fff8e1", borderRadius: "8px", padding: "8px 12px" }}>
          التوصيل مش متاح للمحل ده، تقدر تشوف المنتجات والأسعار وتزور المحل.
        </p>
      )}

      {deliveryEnabled && pointsRequired > 0 && (
        <p style={{ textAlign: "center", color: "#7a5c00", background: "#fff8e1", borderRadius: "8px", padding: "8px 12px" }}>
          ⭐ خصم المحل ده بيتفعّل باستخدام {pointsRequired} نقطة من رصيدك وقت تأكيد الطلب.
        </p>
      )}

      <div className="delivery-menu">
        {menuItems.map((item, index) => {
          const qty = quantities[item.name] || 0;
          const lowStock = typeof item.stock === "number" && item.stock <= 5;
          return (
            <div className="delivery-menu-item" key={item.itemId || index}>
              <div className="delivery-menu-item-info">
                {item.images && item.images[0] && (
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    loading="lazy"
                    style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, marginInlineEnd: 10 }}
                  />
                )}
                <span className="menu-item-name">{item.name}</span>
                <span className="menu-item-prices">
                  {Number(item.price) > Number(item.discounted_price) && (
                    <span className="price-before">{item.price} ج.م</span>
                  )}
                  <span className="price-after">{item.discounted_price} ج.م</span>
                </span>
                {lowStock && <span style={{ color: "#c62828", fontSize: "0.85em" }}>متبقي {item.stock} بس</span>}
              </div>
              {deliveryEnabled && (
                <div className="qty-control">
                  <button type="button" onClick={() => updateQty(item, -1)}>−</button>
                  <span>{qty}</span>
                  <button type="button" onClick={() => updateQty(item, 1)} disabled={qty >= maxFor(item)}>+</button>
                </div>
              )}
            </div>
          );
        })}

        {deliveryEnabled && (
          <div className="delivery-summary">
            <div><span>الإجمالي قبل الخصم</span><span>{subtotalBefore} ج.م</span></div>
            <div><span>الإجمالي بعد الخصم</span><span>{subtotalAfter} ج.م</span></div>
            <div><span>رسوم التوصيل</span><span>{DELIVERY_FEE} ج.م</span></div>
            <div className="delivery-total"><span>الإجمالي المتوقع</span><span>{total} ج.م</span></div>
          </div>
        )}
      </div>

      {deliveryEnabled && (
        <>
          <button className="add-to-cart-btn" onClick={handleAddToCart} disabled={orderedItems.length === 0}>
            أضف للسلة 🛒
          </button>

          <p style={{ textAlign: "center", marginTop: 10 }}>
            <Link to="/cart">اذهب للسلة</Link>
          </p>
        </>
      )}
    </div>
  );
}
