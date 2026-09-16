import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { CART_SCRIPT_URL } from "../data/data.js";
import "./Profile.css";

export default function Profile() {
  const { user, isLoggedIn, logout, login } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ newName: "", newPhone: "", currentPassword: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openEdit = () => {
    setForm({ newName: user.name, newPhone: user.phone, currentPassword: "" });
    setError("");
    setEditing(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.currentPassword) {
      setError("محتاج تكتب الباسورد الحالي للتأكيد");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "updateProfile",
          currentPhone: user.phone,
          currentPassword: form.currentPassword,
          newName: form.newName,
          newPhone: form.newPhone,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "حصل خطأ");
      } else {
        login(data.user);
        setEditing(false);
      }
    } catch (err) {
      setError("مشكلة في الاتصال، حاول تاني");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">{user.name?.[0]?.toUpperCase() || "؟"}</div>
        <div className="profile-header-info">
          <h2>{user.name}</h2>
          <span>{user.phone}</span>
        </div>
        <button className="profile-edit-btn" onClick={openEdit}>
          تعديل ✏️
        </button>
      </div>

      {editing && (
        <div className="profile-edit-overlay" onClick={() => setEditing(false)}>
          <form className="profile-edit-form" onSubmit={handleSave} onClick={(e) => e.stopPropagation()}>
            <h3>تعديل البيانات</h3>
            <input
              type="text"
              name="newName"
              placeholder="الاسم"
              value={form.newName}
              onChange={handleChange}
            />
            <input
              type="tel"
              name="newPhone"
              placeholder="رقم الموبايل"
              value={form.newPhone}
              onChange={handleChange}
            />
            <input
              type="password"
              name="currentPassword"
              placeholder="الباسورد الحالي (للتأكيد)"
              value={form.currentPassword}
              onChange={handleChange}
              required
            />
            {error && <p style={{ color: "red", fontSize: "13px" }}>{error}</p>}
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" disabled={saving}>
                {saving ? "جارٍ الحفظ..." : "حفظ"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="cancel-btn">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="profile-menu">
        <div className="profile-menu-item" onClick={() => navigate("/profile")}>
          <span className="menu-icon">🎁</span>
          <span className="menu-label points-label">نقاطي</span>
          <span className="menu-value points-value">⭐ {user.points || 0}</span>
        </div>

        <div className="profile-menu-item" onClick={() => navigate("/orders")}>
          <span className="menu-icon">📦</span>
          <span className="menu-label">طلباتي</span>
        </div>

<div className="profile-menu-item" onClick={() => navigate("/vouchers")}>
  <span className="menu-icon">🎫</span>
  <span className="menu-label">Vouchers</span>
</div>

<div className="profile-menu-item" onClick={() => window.open(`https://wa.me/201025311724`, "_blank")}>
  <span className="menu-icon">❓</span>
  <span className="menu-label">مساعدة</span>
</div>

<div className="profile-menu-item" onClick={() => navigate("/about")}>
  <span className="menu-icon">ℹ️</span>
  <span className="menu-label">عن التطبيق</span>
</div>
</div>
      <div className="profile-actions">
        <button className="profile-action-btn" onClick={() => navigate("/partner-register")}>
          🤝 سجل كمطعم شريك
        </button>
        <button className="profile-action-btn logout-btn" onClick={handleLogout}>
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
