import { useState } from "react";
import "./auth.css";
import { CART_SCRIPT_URL } from "../data/data.js";

export default function PartnerRegister() {
  const [form, setForm] = useState({ restaurantName: "", ownerName: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "partnerRegister", ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ تم استلام طلبك بنجاح! هنتواصل معاك على الواتساب بعد المراجعة.");
        setForm({ restaurantName: "", ownerName: "", phone: "" });
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
      <h2>🤝 انضم كمطعم شريك</h2>
      <p style={{ textAlign: "center", fontSize: "14px", color: "#666" }}>
        قدّم طلبك وهنتواصل معاك بعد المراجعة لتفعيل حسابك
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="restaurantName"
          placeholder="اسم المطعم"
          value={form.restaurantName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="ownerName"
          placeholder="اسم صاحب المطعم"
          value={form.ownerName}
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
        <button type="submit" disabled={loading}>
          {loading ? "جارٍ الإرسال..." : "إرسال الطلب"}
        </button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
