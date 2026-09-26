import { useState } from "react";
import "./auth.css";
import { CART_SCRIPT_URL } from "../data/data.js";

const PARTNER_CATEGORIES = [
  "مطعم",
  "كافيه",
  "محل ملابس رجالي",
  "محل ملابس حريمي",
  "محل ملابس أطفال",
  "محل أحذية",
  "محلات كلاسيك",
  "محل إكسسوارات وعطور",
  "محل ميكب",
  "جيم",
  "محل أدوات رياضية",
  "سوبر ماركت",
  "أكاديمية كورسات",
];

export default function PartnerRegister() {
  const [form, setForm] = useState({ restaurantName: "", ownerName: "", phone: "", category: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.category) {
      setError("من فضلك اختار نوع النشاط");
      return;
    }

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
        setForm({ restaurantName: "", ownerName: "", phone: "", category: "" });
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
      <h2>🤝 إضافة شريك</h2>
      <p style={{ textAlign: "center", fontSize: "14px", color: "#666" }}>
        قدّم طلبك وهنتواصل معاك بعد المراجعة لتفعيل حسابك
      </p>
      <form onSubmit={handleSubmit}>
        <select name="category" value={form.category} onChange={handleChange} required>
          <option value="" disabled>
            اختار نوع النشاط
          </option>
          {PARTNER_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="restaurantName"
          placeholder="اسم المحل / النشاط"
          value={form.restaurantName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="ownerName"
          placeholder="اسم صاحب النشاط"
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
