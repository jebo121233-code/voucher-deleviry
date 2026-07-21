import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import "./auth.css";
import "./Delivery.css";
import { shops as fakeStores, DELIVERY_FEE } from "../data/data.js";

// ⚠️ هتستبدل اللينك ده بلينك الشيت بتاع الدليفري لما تعمله
const DELIVERY_SCRIPT_URL = "PASTE_YOUR_DELIVERY_APPS_SCRIPT_URL_HERE";
const WHATSAPP_NUMBER = "201025311724";

export default function Delivery() {
  const [searchParams] = useSearchParams();
  const placeName = searchParams.get("place") || "";
  const storeId = searchParams.get("id") || "";

  const store = fakeStores.find((s) => String(s.id) === String(storeId));
  const hasMenu = store?.menu?.length > 0;

  const [quantities, setQuantities] = useState({});
  const [extraNotes, setExtraNotes] = useState("");
  const [form, setForm] = useState({ name: "", whatsapp: "", address: "" });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updateQty = (itemName, delta) => {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[itemName] || 0) + delta);
      return { ...prev, [itemName]: next };
    });
  };

  // حساب الإجمالي قبل وبعد الخصم من الأصناف المختارة
  const { orderedItems, subtotalBefore, subtotalAfter } = useMemo(() => {
    if (!hasMenu) return { orderedItems: [], subtotalBefore: 0, subtotalAfter: 0 };

    const items = store.menu
      .map((item) => ({ ...item, qty: quantities[item.name] || 0 }))
      .filter((item) => item.qty > 0);

    const before = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const after = items.reduce((sum, i) => sum + i.discounted_price * i.qty, 0);

    return { orderedItems: items, subtotalBefore: before, subtotalAfter: after };
  }, [quantities, hasMenu, store]);

  const total = subtotalAfter + DELIVERY_FEE;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);

    const restaurant = placeName ? decodeURIComponent(placeName) : "";

    const itemsLines = hasMenu
      ? orderedItems.map((i) => `- ${i.name} × ${i.qty} = ${i.discounted_price * i.qty} ج.م`).join("\n")
      : extraNotes;

    const whatsappMessage =
`طلب دليفري جديد 🛵
المطعم: ${restaurant}
الاسم: ${form.name}
رقم الواتساب: ${form.whatsapp}
العنوان: ${form.address}

الأصناف:
${itemsLines}
${hasMenu ? `
الإجمالي قبل الخصم: ${subtotalBefore} ج.م
الإجمالي بعد الخصم: ${subtotalAfter} ج.م
رسوم التوصيل: ${DELIVERY_FEE} ج.م
الإجمالي النهائي: ${total} ج.م` : ""}
${!hasMenu ? `ملاحظات إضافية: ${extraNotes}` : ""}`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`,
      "_blank"
    );

    const payload = new Blob(
      [JSON.stringify({
        first_name: form.name,
        whatsapp: form.whatsapp,
        restaurant,
        address: form.address,
        items: hasMenu ? orderedItems : extraNotes,
        subtotal_before: hasMenu ? subtotalBefore : "",
        subtotal_after: hasMenu ? subtotalAfter : "",
        delivery_fee: DELIVERY_FEE,
        total: hasMenu ? total : "",
      })],
      { type: "text/plain;charset=utf-8" }
    );

    const sent = navigator.sendBeacon(DELIVERY_SCRIPT_URL, payload);

    if (!sent) {
      fetch(DELIVERY_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          first_name: form.name,
          whatsapp: form.whatsapp,
          restaurant,
          address: form.address,
          items: hasMenu ? orderedItems : extraNotes,
          subtotal_before: hasMenu ? subtotalBefore : "",
          subtotal_after: hasMenu ? subtotalAfter : "",
          delivery_fee: DELIVERY_FEE,
          total: hasMenu ? total : "",
        }),
        keepalive: true,
      }).catch((err) => console.error("خطأ في الاتصال بالسيرفر:", err));
    }

    setMessage("✅ جارٍ تحويلك للواتساب...");
    setForm({ name: "", whatsapp: "", address: "" });
    setQuantities({});
    setExtraNotes("");
  };

  return (
    <div className="auth-container delivery-container">
      <h2>اطلب دليفري</h2>

      {placeName && (
        <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
          بتطلب من: {decodeURIComponent(placeName)} 🛵
        </p>
      )}

      {/* المنيو مع الحاسبة */}
      {hasMenu && (
        <div className="delivery-menu">
          {store.menu.map((item, index) => (
            <div className="delivery-menu-item" key={index}>
              <div className="delivery-menu-item-info">
                <span className="menu-item-name">{item.name}</span>
                <span className="menu-item-prices">
                  <span className="price-before">{item.price} ج.م</span>
                  <span className="price-after">{item.discounted_price} ج.م</span>
                </span>
              </div>
              <div className="qty-control">
                <button type="button" onClick={() => updateQty(item.name, -1)}>−</button>
                <span>{quantities[item.name] || 0}</span>
                <button type="button" onClick={() => updateQty(item.name, 1)}>+</button>
              </div>
            </div>
          ))}

          <div className="delivery-summary">
            <div><span>الإجمالي قبل الخصم</span><span>{subtotalBefore} ج.م</span></div>
            <div><span>الإجمالي بعد الخصم</span><span>{subtotalAfter} ج.م</span></div>
            <div><span>رسوم التوصيل</span><span>{DELIVERY_FEE} ج.م</span></div>
            <div className="delivery-total"><span>الإجمالي النهائي</span><span>{total} ج.م</span></div>
          </div>
        </div>
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
        <input
          type="text"
          name="address"
          placeholder="العنوان بالتفصيل"
          value={form.address}
          onChange={handleChange}
          required
        />

        {/* لو المطعم لسه معندوش منيو منظم، سيب مكان للعميل يكتب طلبه */}
        {!hasMenu && (
          <textarea
            name="extraNotes"
            placeholder="اكتب الأصناف اللي عايزها (كل صنف في سطر)"
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            rows={4}
            required
          />
        )}

        <button type="submit" disabled={sending || (hasMenu && orderedItems.length === 0)}>
          أرسل الطلب على واتساب
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}
