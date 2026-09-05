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
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (!authenticated) return;
    if (tab === "orders") fetchOrders();
    if (tab === "users") fetchUsers();
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
    </div>
  );
}
