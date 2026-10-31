import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, accountIdOf } from "../context/AuthContext.jsx";
import { CART_SCRIPT_URL } from "../data/data.js";
import AddressPicker from "../components/AddressPicker.jsx";
import "./Profile.css";
import Nm from "../components/Nm.jsx";

export default function Profile() {
  const { user, isLoggedIn, logout, login, removeAccount, refreshUser, updateAddresses } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ newName: "", newPhone: "", currentPassword: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddr, setShowAddr] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: "", address: "", lat: null, lng: null });
  const [addrErr, setAddrErr] = useState("");

  // بنحدّث النقاط من السيرفر أول ما الصفحة تفتح
  useEffect(() => {
    if (isLoggedIn && refreshUser) refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <h2>لازم تسجل دخول الأول 🔒</h2>
        <div className="signUp" style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
          <button onClick={() => navigate("/login")} className="auth-choice-btn">
            تسجيل الدخول
          </button>
          <button onClick={() => navigate("/register")} className="auth-choice-btn">
            إنشاء حساب عميل
          </button>
          <button onClick={() => navigate("/partner-register")} className="auth-choice-btn partner-btn">
            🤝 إضافة شريك
          </button>
          <button onClick={() => navigate("/delivery-register")} className="auth-choice-btn delivery-btn">
            🛵 إنشاء حساب دليفري
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const addresses = user.addresses || [];
  const saveNewAddress = () => {
    setAddrErr("");
    const address = newAddr.address.trim();
    const hasPos = typeof newAddr.lat === "number" && typeof newAddr.lng === "number";
    if (!address && !hasPos) {
      setAddrErr("اكتب العنوان أو حدّد موقعك على الخريطة");
      return;
    }
    const entry = { id: Date.now(), label: newAddr.label.trim() || "عنوان جديد", address: address || "موقعي على الخريطة" };
    if (hasPos) {
      entry.lat = newAddr.lat;
      entry.lng = newAddr.lng;
    }
    updateAddresses([...addresses, entry]);
    setNewAddr({ label: "", address: "", lat: null, lng: null });
  };
  const deleteAddress = (id) => {
    if (window.confirm("حذف العنوان ده؟")) updateAddresses(addresses.filter((a) => a.id !== id));
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
        // لو الرقم اتغير، الحساب القديم (بالرقم القديم) بيتشال من الجهاز عشان ميبقاش فيه حسابين
        const oldId = accountIdOf("customer", { phone: user.phone });
        login(data.user, data.token);
        if (accountIdOf("customer", data.user) !== oldId) removeAccount(oldId);
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
          <h2><Nm name={user.name} /></h2>
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
        <div className="profile-menu-item" onClick={() => navigate("/points")}>
          <span className="menu-icon">🎁</span>
          <span className="menu-label points-label">نقاطي</span>
          <span className="menu-value points-value">⭐ {user.points || 0}</span>
        </div>

        <div className="profile-menu-item" onClick={() => navigate("/orders")}>
          <span className="menu-icon">📦</span>
          <span className="menu-label">طلباتي</span>
        </div>

        <div className="profile-menu-item" onClick={() => setShowAddr((v) => !v)}>
          <span className="menu-icon">📍</span>
          <span className="menu-label">عناويني</span>
          <span className="menu-value">{addresses.length}</span>
        </div>

        {showAddr && (
          <div className="profile-addresses" style={{ padding: "8px 12px", textAlign: "right" }}>
            {addresses.length === 0 && <p style={{ color: "#777" }}>مفيش عناوين محفوظة لسه.</p>}
            {addresses.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", borderBottom: "1px solid #eee", padding: "6px 0" }}>
                <div>
                  <strong>{a.label}</strong>
                  <div style={{ color: "#555", fontSize: "14px" }}>{a.address}{typeof a.lat === "number" ? " 📍" : ""}</div>
                </div>
                <button type="button" onClick={() => deleteAddress(a.id)} aria-label="حذف">✕</button>
              </div>
            ))}
            <h4 style={{ margin: "10px 0 4px" }}>➕ عنوان جديد</h4>
            <AddressPicker
              value={newAddr}
              onChange={(patch) => setNewAddr((n) => ({ ...n, ...patch }))}
            />
            {addrErr && <p style={{ color: "red" }}>{addrErr}</p>}
            <button type="button" onClick={saveNewAddress}>💾 حفظ العنوان</button>
          </div>
        )}

        <div className="profile-menu-item" onClick={() => navigate("/track")}>
          <span className="menu-icon">🛵</span>
          <span className="menu-label">تابع أوردرك</span>
        </div>

        <div className="profile-menu-item" onClick={() => navigate("/login")}>
          <span className="menu-icon">🔁</span>
          <span className="menu-label">تبديل الحساب / إضافة حساب</span>
        </div>

<div className="profile-menu-item" onClick={() => navigate("/vouchers")}>
  <span className="menu-icon">🎫</span>
  <span className="menu-label">قسائم</span>
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
