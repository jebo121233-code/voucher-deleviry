import { useState, useEffect } from "react";
import { CART_SCRIPT_URL } from "../data/data.js";
import "./Admin.css";

const STATUS_OPTIONS = ["pending", "accepted_by_restaurant", "preparing", "out_for_delivery", "delivered", "cancelled"];

const STATUS_LABELS = {
  pending: "⏳ قيد الانتظار",
  accepted_by_restaurant: "👨‍🍳 تم القبول",
  preparing: "🍳 جارٍ التحضير",
  out_for_delivery: "🛵 في الطريق",
  delivered: "✅ تم التوصيل",
  cancelled: "❌ ملغي",
};

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    type: "general",
    targetPhone: "",
    expiryDate: "",
  });
  const [offerCreating, setOfferCreating] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminLogin", password }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
      } else {
        setLoginError(data.error || "باسورد غلط");
      }
    } catch (err) {
      setLoginError("مشكلة في الاتصال");
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminGetOrders", password }),
      });
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminGetUsers", password }),
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminGetOffers", password }),
      });
      const data = await res.json();
      if (data.success) setOffers(data.offers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    if (tab === "orders") fetchOrders();
    if (tab === "users") fetchUsers();
    if (tab === "offers") fetchOffers();
  }, [authenticated, tab]);

  const handleStatusChange = async (rowIndex, newStatus) => {
    setOrders((prev) => prev.map((o) => (o.rowIndex === rowIndex ? { ...o, status: newStatus } : o)));
    try {
      await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminUpdateOrderStatus", password, rowIndex, newStatus }),
      });
    } catch (err) {
      console.error("فشل تحديث الحالة:", err);
    }
  };

  const handleOfferFormChange = (e) => {
    setOfferForm({ ...offerForm, [e.target.name]: e.target.value });
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    setOfferCreating(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminCreateOffer", password, ...offerForm }),
      });
      const data = await res.json();
      if (data.success) {
        setOfferForm({ title: "", description: "", type: "general", targetPhone: "", expiryDate: "" });
        fetchOffers();
      } else {
        alert(data.error || "حصل خطأ");
      }
    } catch (err) {
      alert("مشكلة في الاتصال");
    } finally {
      setOfferCreating(false);
    }
  };

  const handleToggleOffer = async (rowIndex, currentActive) => {
    const newActive = !(currentActive === true || currentActive === "TRUE");
    setOffers((prev) => prev.map((o) => (o.rowIndex === rowIndex ? { ...o, active: newActive } : o)));
    try {
      await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminToggleOffer", password, rowIndex, active: newActive }),
      });
    } catch (err) {
      console.error("فشل تحديث العرض:", err);
    }
  };

  if (!authenticated) {
    return (
      <div className="admin-login-container">
        <form onSubmit={handleLogin} className="admin-login-form">
          <h2>🔒 دخول الأدمن</h2>
          <input
            type="password"
            placeholder="الباسورد"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loginLoading}>
            {loginLoading ? "جارٍ التحقق..." : "دخول"}
          </button>
          {loginError && <p style={{ color: "red" }}>{loginError}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h2>لوحة التحكم</h2>

      <div className="admin-tabs">
        <button className={tab === "orders" ? "admin-tab active" : "admin-tab"} onClick={() => setTab("orders")}>
          📦 الأوردرات
        </button>
        <button className={tab === "users" ? "admin-tab active" : "admin-tab"} onClick={() => setTab("users")}>
          👤 المستخدمين
        </button>
        <button className={tab === "offers" ? "admin-tab active" : "admin-tab"} onClick={() => setTab("offers")}>
          🎟️ العروض
        </button>
      </div>

      {loading && <p style={{ textAlign: "center" }}>جارٍ التحميل...</p>}

      {tab === "orders" && !loading && (
        <div className="admin-list">
          {orders.length === 0 && <p style={{ textAlign: "center" }}>مفيش أوردرات</p>}
          {orders.map((order) => (
            <div key={order.rowIndex} className="admin-card">
              <div className="admin-card-header">
                <strong>{order.storeName || "طلب"}</strong>
                <span>{order.total} ج.م</span>
              </div>
              <div className="admin-card-body">
                <span>{order.customerName} - {order.customerPhone}</span>
                <span>{order.address}</span>
                <span>{new Date(order.timestamp).toLocaleString("ar-EG")}</span>
              </div>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order.rowIndex, e.target.value)}
                className="admin-status-select"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && !loading && (
        <div className="admin-list">
          {users.length === 0 && <p style={{ textAlign: "center" }}>مفيش مستخدمين</p>}
          {users.map((u, idx) => (
            <div key={idx} className="admin-card">
              <div className="admin-card-header">
                <strong>{u.name}</strong>
                <span>⭐ {u.points}</span>
              </div>
              <div className="admin-card-body">
                <span>{u.phone}</span>
                <span>سجل في: {new Date(u.registeredAt).toLocaleDateString("ar-EG")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "offers" && (
        <>
          <form onSubmit={handleCreateOffer} className="admin-offer-form">
            <h3>➕ إضافة عرض جديد</h3>
            <input
              type="text"
              name="title"
              placeholder="عنوان العرض"
              value={offerForm.title}
              onChange={handleOfferFormChange}
              required
            />
            <textarea
              name="description"
              placeholder="وصف قصير للعرض"
              value={offerForm.description}
              onChange={handleOfferFormChange}
              required
            />
            <select name="type" value={offerForm.type} onChange={handleOfferFormChange}>
              <option value="general">عرض عام (لكل الزوار)</option>
              <option value="personal">عرض شخصي (رقم معين)</option>
            </select>
            {offerForm.type === "personal" && (
              <input
                type="tel"
                name="targetPhone"
                placeholder="رقم الموبايل المستهدف"
                value={offerForm.targetPhone}
                onChange={handleOfferFormChange}
                required
              />
            )}
            <label className="admin-offer-label">تاريخ انتهاء العرض (اختياري)</label>
            <input
              type="date"
              name="expiryDate"
              value={offerForm.expiryDate}
              onChange={handleOfferFormChange}
            />
            <button type="submit" disabled={offerCreating}>
              {offerCreating ? "جارٍ الإضافة..." : "إضافة العرض"}
            </button>
          </form>

          {!loading && (
            <div className="admin-list" style={{ marginTop: "20px" }}>
              {offers.length === 0 && <p style={{ textAlign: "center" }}>مفيش عروض لسه</p>}
              {offers.map((offer) => {
                const isActive = offer.active === true || offer.active === "TRUE";
                return (
                  <div key={offer.rowIndex} className="admin-card">
                    <div className="admin-card-header">
                      <strong>{offer.title}</strong>
                      <span>{offer.type === "personal" ? "🎁 شخصي" : "🌍 عام"}</span>
                    </div>
                    <div className="admin-card-body">
                      <span>{offer.description}</span>
                      {offer.targetPhone && <span>الرقم: {offer.targetPhone}</span>}
                      {offer.expiryDate && <span>ينتهي: {new Date(offer.expiryDate).toLocaleDateString("ar-EG")}</span>}
                    </div>
                    <button
                      className="admin-toggle-btn"
                      onClick={() => handleToggleOffer(offer.rowIndex, offer.active)}
                      style={{ background: isActive ? "#4caf50" : "#999" }}
                    >
                      {isActive ? "✅ فعال - دوس للإيقاف" : "⏸️ متوقف - دوس للتفعيل"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
