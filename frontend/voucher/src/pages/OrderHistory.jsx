import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { CART_SCRIPT_URL } from "../data/data.js";
import "./auth.css";
import "./OrderHistory.css";

const STATUS_LABELS = {
  pending: "⏳ قيد الانتظار",
  accepted_by_restaurant: "👨‍🍳 تم القبول من المطعم",
  preparing: "🍳 جارٍ التحضير",
  out_for_delivery: "🛵 في الطريق إليك",
  delivered: "✅ تم التوصيل",
  cancelled: "❌ ملغي",
};

export default function OrderHistory() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(CART_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "getOrderHistory", phone: user.phone }),
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders || []);
        } else {
          setError(data.error || "حصل خطأ في تحميل الأوردرات");
        }
      } catch (err) {
        setError("مشكلة في الاتصال، حاول تاني");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isLoggedIn, user]);

  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <h2>لازم تسجل دخول الأول 🔒</h2>
        <div className="signUp" style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={() => navigate("/login")}>تسجيل الدخول</button>
          <button onClick={() => navigate("/register")}>إنشاء حساب</button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-page">
      <h2>طلباتي</h2>

      {loading && <p style={{ textAlign: "center" }}>جارٍ التحميل...</p>}
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <p style={{ textAlign: "center" }}>لسه معملتش أي طلب 🛒</p>
      )}

      {!loading && orders.length > 0 && (
        <div className="order-list">
          {orders.map((order) => (
            <div key={order.orderId} className="order-card">
              <div className="order-card-header">
                <span className="order-store">{order.storeName || "طلب"}</span>
                <span className="order-status">{STATUS_LABELS[order.status] || order.status}</span>
              </div>
              <div className="order-card-body">
                <span className="order-date">
                  {new Date(order.timestamp).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}
                </span>
                <span className="order-total">{order.total} ج.م</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
