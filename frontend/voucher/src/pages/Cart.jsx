import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";
import "./Delivery.css";
import "./Cart.css";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { CART_SCRIPT_URL, WHATSAPP_NUMBER } from "../data/data.js";

const CARD_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfL4bWVRHsgjOa2I5J2RC38pF2olaUMWsVghwxfuz9MrJyslA/formResponse";

const CARD_FORM_ENTRIES = {
  name: "entry.1441889611",
  phone: "entry.1738070286",
  address: "entry.766948384",
  store: "entry.384682150",
  cardTier: "entry.336839636",
  cardPrice: "entry.1754502734",
  shippingFee: "entry.483753397",
  total: "entry.89843056",
  source: "entry.732120729",
  status: "entry.1092939406",
};

const VODAFONE_CASH_NUMBER = "01025311724";

const PAYMENT_METHODS = {
  cash: { label: "💵 كاش عند الاستلام", needsTransfer: false },
  wallet: {
    label: "📱 تحويل فودافون كاش",
    needsTransfer: true,
    destinationLabel: "رقم فودافون كاش",
    destinationValue: VODAFONE_CASH_NUMBER,
  },
};

export default function Cart() {
  const navigate = useNavigate();
  const { user, isLoggedIn, updateAddresses } = useAuth();
  const {
    cart, removeDeliveryItems, updateCardQty, removeCard, clearCart,
    deliverySubtotalBefore, deliverySubtotalAfter, hasDelivery, deliveryFeeTotal,
    cardsSubtotal, cardsShippingTotal, grandTotal, itemsCount,
  } = useCart();

  const addresses = user?.addresses || [];

  const [form, setForm] = useState({
    name: user?.name || "",
    whatsapp: user?.phone || "",
    address: "",
    addressLabel: "",
    paymentMethod: "cash",
    transactionRef: "",
  });

  const [addressMode, setAddressMode] = useState(addresses.length > 0 ? "select" : "new");
  const [selectedAddressId, setSelectedAddressId] = useState(addresses[0]?.id || null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const selectedPayment = PAYMENT_METHODS[form.paymentMethod];

  useEffect(() => {
    if (addressMode === "select" && selectedAddressId) {
      const found = addresses.find((a) => a.id === selectedAddressId);
      if (found) setForm((prev) => ({ ...prev, address: found.address }));
    }
    if (addressMode === "new") {
      setForm((prev) => ({ ...prev, address: "", addressLabel: "" }));
    }
  }, [addressMode, selectedAddressId]);

  // 🔒 لازم تسجيل دخول عشان تقدر تطلب
  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <h2>لازم تسجل دخول الأول 🔒</h2>
        <p style={{ textAlign: "center" }}>
          عشان نحافظ على نقاطك وتاريخ أوردراتك، محتاجين تسجل دخول أو تعمل حساب قبل ما تكمل الطلب.
          <br />
          متقلقش، سلتك محفوظة وهترجعلك بعد التسجيل.
        </p>
        <div className="signUp" style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={() => navigate("/login")}>تسجيل الدخول</button>
          <button onClick={() => navigate("/register")}>إنشاء حساب</button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCopyNumber = (value) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDeleteAddress = (addressId) => {
    const updated = addresses.filter((a) => a.id !== addressId);
    updateAddresses(updated);
    if (updated.length === 0) {
      setAddressMode("new");
      setSelectedAddressId(null);
    } else if (selectedAddressId === addressId) {
      setSelectedAddressId(updated[0].id);
    }
  };

  const isEmpty = itemsCount === 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEmpty) return;

    if (selectedPayment.needsTransfer && !form.transactionRef.trim()) {
      alert("من فضلك اكتب آخر 6 أرقام من عملية التحويل قبل تأكيد الطلب");
      return;
    }

    setSending(true);

    // ---------- حفظ عنوان جديد لو المستخدم دخل عنوان جديد ----------
    if (addressMode === "new" && form.address.trim()) {
      const alreadyExists = addresses.some((a) => a.address.trim() === form.address.trim());
      if (!alreadyExists) {
        const updated = [
          ...addresses,
          { id: Date.now(), label: form.addressLabel.trim() || "عنوان جديد", address: form.address.trim() },
        ];
        updateAddresses(updated);
      }
    }

    const paymentMethodText = selectedPayment.label;

    let messageParts = [
      `طلب جديد من السلة 🛒`,
      `الاسم: ${form.name}`,
      `رقم الواتساب: ${form.whatsapp}`,
      `العنوان: ${form.address}`,
      `طريقة الدفع: ${paymentMethodText}`,
      "",
    ];

    let deliveryItemsText = "";
    if (hasDelivery) {
      messageParts.push(`--- دليفري من ${cart.restaurant} ---`);
      deliveryItemsText = cart.deliveryItems.map((i) => `${i.name} × ${i.qty} = ${i.discounted_price * i.qty} ج.م`).join(" | ");
      cart.deliveryItems.forEach((i) => {
        messageParts.push(`- ${i.name} × ${i.qty} = ${i.discounted_price * i.qty} ج.م`);
      });
      messageParts.push(`إجمالي الأصناف بعد الخصم: ${deliverySubtotalAfter} ج.م`);
      messageParts.push(`رسوم التوصيل: ${deliveryFeeTotal} ج.م`);
      messageParts.push("");
    }

    let cardsText = "";
    if (cart.cardItems.length > 0) {
      messageParts.push(`--- كروت الخصم ---`);
      cardsText = cart.cardItems.map((c) => `${c.name} × ${c.qty} = ${c.price * c.qty} ج.م`).join(" | ");
      cart.cardItems.forEach((c) => {
        messageParts.push(`- ${c.name} × ${c.qty} = ${c.price * c.qty} ج.م`);
      });
      messageParts.push("");
    }

    const totalShippingFee = (hasDelivery ? deliveryFeeTotal : 0) + (cart.cardItems.length > 0 ? 10 : 0);
    messageParts.push(`رسوم الشحن: ${totalShippingFee} ج.م`);
    messageParts.push(`الإجمالي النهائي: ${grandTotal} ج.م`);

    if (selectedPayment.needsTransfer) {
      messageParts.push("");
      messageParts.push(`💳 تم التحويل على: ${selectedPayment.destinationLabel} (${selectedPayment.destinationValue})`);
      messageParts.push(`آخر 6 أرقام من عملية التحويل: ${form.transactionRef}`);
      messageParts.push("⚠️ برجاء إرسال سكرين شوت إثبات التحويل هنا على الواتساب");
    }

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageParts.join("\n"))}`, "_blank");

    const orderData = {
      first_name: form.name,
      whatsapp: form.whatsapp,
      address: form.address,
      payment_method: paymentMethodText,
      transaction_ref: selectedPayment.needsTransfer ? form.transactionRef : "",
      payment_status: selectedPayment.needsTransfer ? "بانتظار تأكيد التحويل" : "كاش عند الاستلام",
      restaurant: hasDelivery ? cart.restaurant : "",
      delivery_items: deliveryItemsText,
      delivery_subtotal_before: hasDelivery ? deliverySubtotalBefore : "",
      delivery_subtotal_after: hasDelivery ? deliverySubtotalAfter : "",
      delivery_fee: hasDelivery ? deliveryFeeTotal : "",
      cards: cardsText,
      cards_subtotal: cart.cardItems.length > 0 ? cardsSubtotal : "",
      cards_shipping: cart.cardItems.length > 0 ? cardsShippingTotal : "",
      grand_total: grandTotal,
    };

    const payload = new Blob([JSON.stringify(orderData)], { type: "text/plain;charset=utf-8" });
    const sent = navigator.sendBeacon(CART_SCRIPT_URL, payload);
    if (!sent) {
      fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(orderData),
        keepalive: true,
      }).catch((err) => console.error("خطأ في الاتصال بالسيرفر:", err));
    }

    const cardTierText = cart.cardItems.map((c) => `${c.name} × ${c.qty}`).join(", ");
    const cardStoresText = cart.cardItems.map((c) => c.store || c.name).join(", ");

    const formData = new URLSearchParams();
    formData.append(CARD_FORM_ENTRIES.name, form.name);
    formData.append(CARD_FORM_ENTRIES.phone, form.whatsapp);
    formData.append(CARD_FORM_ENTRIES.address, form.address);
    formData.append(CARD_FORM_ENTRIES.store, hasDelivery ? cart.restaurant : cardStoresText);
    formData.append(CARD_FORM_ENTRIES.cardTier, cardTierText);
    formData.append(CARD_FORM_ENTRIES.cardPrice, cart.cardItems.length > 0 ? cardsSubtotal : "");
    formData.append(CARD_FORM_ENTRIES.shippingFee, (cart.cardItems.length > 0 ? cardsShippingTotal : 0) + (hasDelivery ? deliveryFeeTotal : 0));
    formData.append(CARD_FORM_ENTRIES.total, grandTotal);
    formData.append(CARD_FORM_ENTRIES.source, "");
    formData.append(CARD_FORM_ENTRIES.status, "");
    navigator.sendBeacon(CARD_FORM_URL, formData);

    setMessage("✅ جارٍ تحويلك للواتساب... متنساش تبعت سكرين شوت التحويل لو دفعت أونلاين");
    clearCart();
    setTimeout(() => navigate("/"), 2000);
  };

  if (isEmpty) {
    return (
      <div className="auth-container">
        <h2>السلة فاضية 🛒</h2>
        <p style={{ textAlign: "center" }}>
          <Link to="/stores">تصفح المطاعم</Link> أو <Link to="/">اطلب كارت خصم</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h2>سلتك</h2>

      {hasDelivery && (
        <div className="cart-section">
          <div className="cart-section-header">
            <h3>🛵 دليفري من {cart.restaurant}</h3>
            <button className="remove-link" onClick={removeDeliveryItems}>إزالة</button>
          </div>
          {cart.deliveryItems.map((item, idx) => (
            <div className="cart-line" key={idx}>
              <span>{item.name} × {item.qty}</span>
              <span>{item.discounted_price * item.qty} ج.م</span>
            </div>
          ))}
          <div className="cart-line"><span>رسوم التوصيل</span><span>{deliveryFeeTotal} ج.م</span></div>
        </div>
      )}

      {cart.cardItems.length > 0 && (
        <div className="cart-section">
          <h3>💳 كروت الخصم</h3>
          <div className="cart-note-box" style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", color: "#7a5c00", marginBottom: "12px" }}>
            ℹ️ الكارت بيديك خصم على اسم المكان اللي اخترته + 6 أماكن تانية كمان اشتري اكتر وفر اكتر
          </div>
          {cart.cardItems.map((c) => (
            <div className="cart-line" key={c.id}>
              <span>{c.name}</span>
              <div className="qty-control">
                <button type="button" onClick={() => updateCardQty(c.id, -1)}>−</button>
                <span>{c.qty}</span>
                <button type="button" onClick={() => updateCardQty(c.id, 1)}>+</button>
              </div>
              <span>{c.price * c.qty} ج.م</span>
              <button className="remove-link" onClick={() => removeCard(c.id)}>✕</button>
            </div>
          ))}
          <div className="cart-line"><span>رسوم الشحن</span><span>{cardsShippingTotal} ج.م</span></div>
        </div>
      )}

      <div className="delivery-summary cart-grand-total">
        <div className="delivery-total"><span>الإجمالي النهائي</span><span>{grandTotal} ج.م</span></div>
      </div>

      <form onSubmit={handleSubmit} className="cart-checkout-form">
        <h3>بيانات التوصيل</h3>

        <input type="text" name="name" placeholder="الاسم" value={form.name} onChange={handleChange} required />
        <input type="tel" name="whatsapp" placeholder="رقم الواتساب" value={form.whatsapp} onChange={handleChange} required />

        {addresses.length > 0 && (
          <div className="address-mode-toggle">
            <button type="button" className={addressMode === "select" ? "mode-btn active" : "mode-btn"} onClick={() => setAddressMode("select")}>عنوان محفوظ</button>
            <button type="button" className={addressMode === "new" ? "mode-btn active" : "mode-btn"} onClick={() => setAddressMode("new")}>+ عنوان جديد</button>
          </div>
        )}

        {addressMode === "select" && addresses.length > 0 && (
          <div className="saved-addresses-list">
            {addresses.map((addr) => (
              <div key={addr.id} className={selectedAddressId === addr.id ? "saved-address-item selected" : "saved-address-item"} onClick={() => setSelectedAddressId(addr.id)}>
                <div>
                  <strong>{addr.label}</strong>
                  <p>{addr.address}</p>
                </div>
                <button type="button" className="delete-address-btn" onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {addressMode === "new" && (
          <>
            <input type="text" name="addressLabel" placeholder="اسم الشارع ( رقم المنزل ، علامة مميزة)" value={form.addressLabel} onChange={handleChange} />
            <input type="text" name="address" placeholder="العنوان بالتفصيل" value={form.address} onChange={handleChange} required />
          </>
        )}

        <div className="payment-method-section">
          <p className="payment-method-title">طريقة الدفع</p>
          <div className="payment-method-options">
            {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
              <label key={key} className={form.paymentMethod === key ? "payment-option selected" : "payment-option"}>
                <input type="radio" name="paymentMethod" value={key} checked={form.paymentMethod === key} onChange={handleChange} />
                {method.label}
              </label>
            ))}
          </div>

          {selectedPayment.needsTransfer && (
            <div className="transfer-box">
              <p className="transfer-instruction">
                حوّل مبلغ <strong>{grandTotal} ج.م</strong> على الرقم ده (من فودافون كاش أو إنستا باي أو أي محفظة إلكترونية):
              </p>
              <div className="transfer-number-row">
                <span className="transfer-number">{selectedPayment.destinationLabel}: {selectedPayment.destinationValue}</span>
                <button type="button" className="copy-btn" onClick={() => handleCopyNumber(selectedPayment.destinationValue)}>
                  {copied ? "✅ اتنسخ" : "نسخ"}
                </button>
              </div>
              <input type="text" name="transactionRef" placeholder="آخر 6 أرقام من عملية التحويل" value={form.transactionRef} onChange={handleChange} maxLength={6} required />
              <p className="screenshot-warning">⚠️ لازم تبعت <strong>سكرين شوت</strong> إثبات التحويل على الواتساب فور إرسال الطلب، وإلا الطلب مش هيتأكد</p>
            </div>
          )}
        </div>

        <button type="submit" disabled={sending}>تأكيد الطلب</button>
      </form>

      {message && <p style={{ textAlign: "center" }}>{message}</p>}
    </div>
  );
}
