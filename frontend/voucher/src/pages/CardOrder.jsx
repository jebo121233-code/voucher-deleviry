import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./Store.css";
import "./auth.css";
import "./Delivery.css";
import { cards, CARD_SHIPPING_FEE } from "../data/data.js";

// ⚠️ هتستبدل اللينك ده بلينك شيت "طلب الكارت" لما تعمله (منفصل عن شيت الدليفري)
const CARD_ORDER_SCRIPT_URL = "PASTE_YOUR_CARD_ORDER_APPS_SCRIPT_URL_HERE";
const WHATSAPP_NUMBER = "201025311724";

export default function CardOrder() {
  const { id } = useParams();
  const card = cards.find((c) => String(c.id) === String(id)) || cards[0];

  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [form, setForm] = useState({ name: "", whatsapp: "", address: "" });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  if (!card) return <p>الكارت غير موجود</p>;

  const total = (card.price || 0) + CARD_SHIPPING_FEE;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);

    const whatsappMessage =
`طلب كارت خصم 💳
الكارت: ${card.name}
الاسم: ${form.name}
رقم الواتساب: ${form.whatsapp}
العنوان: ${form.address}

سعر الكارت: ${card.price} ج.م
رسوم الشحن: ${CARD_SHIPPING_FEE} ج.م
الإجمالي: ${total} ج.م`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`,
      "_blank"
    );

    const payload = new Blob(
      [JSON.stringify({
        first_name: form.name,
        whatsapp: form.whatsapp,
        card: card.name,
        address: form.address,
        card_price: card.price,
        shipping_fee: CARD_SHIPPING_FEE,
        total,
      })],
      { type: "text/plain;charset=utf-8" }
    );

    const sent = navigator.sendBeacon(CARD_ORDER_SCRIPT_URL, payload);

    if (!sent) {
      fetch(CARD_ORDER_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          first_name: form.name,
          whatsapp: form.whatsapp,
          card: card.name,
          address: form.address,
          card_price: card.price,
          shipping_fee: CARD_SHIPPING_FEE,
          total,
        }),
        keepalive: true,
      }).catch((err) => console.error("خطأ في الاتصال بالسيرفر:", err));
    }

    setMessage("✅ جارٍ تحويلك للواتساب...");
    setForm({ name: "", whatsapp: "", address: "" });
  };

  return (
    <div className="store-page">
      <div className="store-header">
        <h2>{card.name}</h2>
        <p>{card.description}</p>

        {/* GALLERY */}
        {card.images?.length > 0 && (
          <div className="store-images">
            {card.images.map((img, index) => (
              <img
                key={index}
                src={`/${img}`}
                alt={`${card.name} ${index + 1}`}
                className="store-gallery-img"
                onClick={() => setSelectedImageIndex(index)}
              />
            ))}
          </div>
        )}

        {selectedImageIndex !== null && (
          <div className="image-modal" onClick={() => setSelectedImageIndex(null)}>
            <img
              src={`/${card.images[selectedImageIndex]}`}
              alt="Preview"
              className="modal-image"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* CALCULATOR */}
        <div className="delivery-summary" style={{ maxWidth: 400, margin: "20px auto" }}>
          <div><span>سعر الكارت</span><span>{card.price} ج.م</span></div>
          <div><span>رسوم الشحن</span><span>{CARD_SHIPPING_FEE} ج.م</span></div>
          <div className="delivery-total"><span>الإجمالي</span><span>{total} ج.م</span></div>
        </div>
      </div>

      {/* ORDER FORM */}
      <div className="auth-container">
        <h2>بيانات الطلب</h2>
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
          <input
            type="text"
            name="address"
            placeholder="عنوان الشحن بالتفصيل"
            value={form.address}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={sending}>
            أرسل الطلب على واتساب
          </button>
        </form>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}
