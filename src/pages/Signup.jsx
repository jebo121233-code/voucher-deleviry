import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./auth.css";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz4iYTup23ZNxkm-yzfbKQF35LDG2_RwdDOv_SCGbYG6sTH-bkdXFXVf4bChyV4iDUF/exec";
const WHATSAPP_NUMBER = "201025311724";

export default function Signup() {
  const [searchParams] = useSearchParams();
  const placeCode = searchParams.get("place") || "";
  const sourceCode = searchParams.get("source") || placeCode || "direct";

  const [form, setForm] = useState({ name: "", whatsapp: "" });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);

    const category = placeCode ? decodeURIComponent(placeCode) : "";
    const source = decodeURIComponent(sourceCode);

    const whatsappMessage =
`الاسم: ${form.name}
رقم الواتساب: ${form.whatsapp}
نوع الخصم: ${category}`;

    // افتح واتساب فورًا
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`,
      "_blank"
    );

    const payload = new Blob(
      [JSON.stringify({
        first_name: form.name,
        whatsapp: form.whatsapp,
        category,
        source,
      })],
      { type: "text/plain;charset=utf-8" }
    );

    const sent = navigator.sendBeacon(SCRIPT_URL, payload);

    if (!sent) {
      fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          first_name: form.name,
          whatsapp: form.whatsapp,
          category,
          source,
        }),
        keepalive: true,
      }).catch((err) => console.error("خطأ في الاتصال بالسيرفر:", err));
    }

    setMessage("✅ جارٍ تحويلك للواتساب...");
    setForm({ name: "", whatsapp: "" });
  };

  return (
    <div className="auth-container">
      <h2>سجل بياناتك</h2>

      {placeCode && (
        <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
          بتسجل من: {decodeURIComponent(placeCode)} 👋
        </p>
      )}

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
          name="whatsapp"
          placeholder="رقم الواتساب"
          value={form.whatsapp}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={sending}>
          ابعتلي الكوبون على واتساب
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}
