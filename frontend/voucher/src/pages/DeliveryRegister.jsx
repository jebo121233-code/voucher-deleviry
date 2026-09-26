import { useState } from "react";
import "./auth.css";
import { CART_SCRIPT_URL } from "../data/data.js";

const VEHICLE_TYPES = ["موتوسيكل", "عجلة", "اسكيت"];

export default function DeliveryRegister() {
  const [form, setForm] = useState({ name: "", phone: "", password: "", vehicleType: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.vehicleType) {
      setError("من فضلك اختار نوع المركبة");
      return;
    }
    if (!/^(?=.*\d).{8,}$/.test(form.password)) {
      setError("الباسورد لازم 8 حروف ورقم على الأقل");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "deliveryRegister", ...form, region: "طنطا" }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ تم استلام طلبك بنجاح! هنتواصل معاك على الواتساب بعد المراجعة.");
        setForm({ name: "", phone: "", password: "", vehicleType: "" });
      } else {
        setError(data.error || "حصل خطأ");
      }
    } catch (err) {
      setError("مشكلة في الاتصال، حاول تاني");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>🛵 إنشاء حساب دليفري</h2>
      <p style={{ textAlign: "center", fontSize: "14px", color: "#666" }}>
        قدّم طلبك وهنتواصل معاك بعد المراجعة لتفعيل حسابك
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="الاسم"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="رقم الموبايل"
          value={form.phone}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="الباسورد (8 حروف على الأقل + رقم)"
          value={form.password}
          onChange={handleChange}
          required
        />
        <select name="vehicleType" value={form.vehicleType} onChange={handleChange} required>
          <option value="" disabled>
            اختار نوع المركبة
          </option>
          {VEHICLE_TYPES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <input type="text" value="طنطا" disabled />
        <button type="submit" disabled={loading}>
          {loading ? "جارٍ الإرسال..." : "إرسال الطلب"}
        </button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
