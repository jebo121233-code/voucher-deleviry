import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import { CART_SCRIPT_URL } from "../data/data.js";
import { useAuth, homePathFor } from "../context/AuthContext.jsx";

const ROLES = [
  { key: "customer", label: "عميل" },
  { key: "delivery", label: "دليفري" },
  { key: "restaurant", label: "مطعم / محل" },
];

const ROLE_LABELS = { customer: "عميل", delivery: "دليفري", restaurant: "مطعم / محل" };

export default function Login() {
  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({ phone: "", password: "", username: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState(null);
  const navigate = useNavigate();
  const { login, loginDriver, loginRestaurant, accounts, activeId, switchTo, removeAccount } = useAuth();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const post = async (body) => {
    const res = await fetch(CART_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (role === "customer") {
        const data = await post({ action: "login", phone: form.phone, password: form.password });
        if (!data.success) return setError(data.error || "حصل خطأ");
        login(data.user, data.token);
        navigate("/");
      } else if (role === "delivery") {
        const data = await post({ action: "deliveryLogin", phone: form.phone, password: form.password });
        if (!data.success) return setError(data.error || "حصل خطأ");
        loginDriver(data.delivery, data.token);
        navigate("/driver");
      } else {
        const data = await post({ action: "mm_restaurantLogin", username: form.username, password: form.password });
        if (!data.success) return setError(data.error || "حصل خطأ");
        loginRestaurant(data.restaurant, data.token);
        navigate("/restaurant");
      }
    } catch (err) {
      setError("مشكلة في الاتصال، حاول تاني");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async (acc) => {
    setError("");
    setSwitchingId(acc.id);
    const result = await switchTo(acc.id);
    setSwitchingId(null);
    if (result.success) {
      navigate(homePathFor(result.role));
    } else {
      setError(result.error || "تعذر التبديل");
      if (result.needsLogin) setRole(acc.role);
    }
  };

  return (
    <div className="auth-container">
      {accounts.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ textAlign: "center", marginBottom: "10px" }}>حساباتك على الجهاز</h3>
          {accounts.map((acc) => (
            <div
              key={acc.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                padding: "10px 12px",
                marginBottom: "8px",
                border: acc.id === activeId ? "2px solid #28a745" : "1px solid #ddd",
                borderRadius: "10px",
              }}
            >
              <div>
                <strong>{acc.label}</strong>
                <div style={{ fontSize: "0.85em", color: "#777" }}>
                  {ROLE_LABELS[acc.role]}
                  {acc.id === activeId ? " • الحساب الحالي" : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {acc.id !== activeId && (
                  <button type="button" onClick={() => handleSwitch(acc)} disabled={switchingId === acc.id}>
                    {switchingId === acc.id ? "..." : "تبديل"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeAccount(acc.id)}
                  aria-label="إزالة الحساب من الجهاز"
                  style={{ background: "#c62828" }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <h3 style={{ textAlign: "center", margin: "16px 0 6px" }}>إضافة حساب تاني</h3>
        </div>
      )}

      {accounts.length === 0 && <h2>تسجيل الدخول</h2>}

      <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "12px" }}>
        {ROLES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => {
              setRole(r.key);
              setError("");
            }}
            style={{
              flex: 1,
              background: role === r.key ? "#28a745" : "#eee",
              color: role === r.key ? "#fff" : "#333",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {role === "restaurant" ? (
          <input
            type="text"
            name="username"
            placeholder="اليوزر نيم"
            value={form.username}
            onChange={handleChange}
            autoCapitalize="none"
            required
          />
        ) : (
          <input
            type="tel"
            name="phone"
            placeholder="رقم الموبايل"
            value={form.phone}
            onChange={handleChange}
            required
          />
        )}
        <input
          type="password"
          name="password"
          placeholder="الباسورد"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "جارٍ الدخول..." : "دخول"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {role === "customer" && form.password === "" && (
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <button type="button" className="forgot-password-link" onClick={() => navigate("/reset-password")}>
            نسيت الباسورد؟
          </button>
        </div>
      )}

      {role === "customer" && (
        <div className="signUp">
          <button onClick={() => navigate("/register")}>مفيش حساب؟ سجل واحد</button>
        </div>
      )}
      {role === "delivery" && (
        <div className="signUp">
          <button onClick={() => navigate("/delivery-register")}>عايز تشتغل دليفري؟ قدّم طلب</button>
        </div>
      )}
      {role === "restaurant" && (
        <div className="signUp">
          <button onClick={() => navigate("/partner-register")}>عايز تنضم كشريك؟ قدّم طلب</button>
        </div>
      )}
    </div>
  );
}
