import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";
import "./Delivery.css";
import "./Cart.css";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { CART_SCRIPT_URL, WHATSAPP_NUMBER, MENU_STORE_KEYS } from "../data/data.js";
import AddressPicker from "../components/AddressPicker.jsx";

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

// ⚠️ اسم الـ label لازم يفضل فيه كلمة "فودافون" عشان السيرفر يعتبر الدفع محتاج مراجعة
const PAYMENT_METHODS = {
  cash: { label: "💵 كاش عند الاستلام", needsTransfer: false },
  wallet: {
    label: "📱 تحويل فودافون كاش",
    needsTransfer: true,
    destinationLabel: "رقم فودافون كاش",
    destinationValue: VODAFONE_CASH_NUMBER,
  },
};

const digitsOnly = (v) => String(v || "").replace(/\D/g, "");

async function postJson(body) {
  const res = await fetch(CART_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export default function Cart() {
  const navigate = useNavigate();
  const { user, isLoggedIn, updateAddresses, refreshUser, updateUser } = useAuth();
  const {
    cart, removeDeliveryItems, setUsePoints, updateCardQty, removeCard, clearCart,
    discountActive, unitPrice, potentialSaving,
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
    senderPhone: "",
  });

  const [addressMode, setAddressMode] = useState(addresses.length > 0 ? "select" : "new");
  const [selectedAddressId, setSelectedAddressId] = useState(addresses[0]?.id || null);
  const [coords, setCoords] = useState(null); // { lat, lng, accuracy }
  const [saveAddr, setSaveAddr] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [done, setDone] = useState(null); // { orderId, status, pointsUsed, whatsappUrl, isTransfer }

  const selectedPayment = PAYMENT_METHODS[form.paymentMethod];

  const pointsRequired = hasDelivery ? Number(cart.pointsRequired) || 0 : 0;
  const balance = Number(user?.points) || 0;
  const canUsePoints = pointsRequired > 0 && balance >= pointsRequired;
  const usingPoints = pointsRequired > 0 && cart.usePoints && canUsePoints;

  useEffect(() => {
    if (addressMode === "select" && selectedAddressId) {
      const found = addresses.find((a) => a.id === selectedAddressId);
      if (found) {
        setForm((prev) => ({ ...prev, address: found.address }));
        setCoords(
          typeof found.lat === "number" && typeof found.lng === "number" ? { lat: found.lat, lng: found.lng } : null
        );
      }
    }
    if (addressMode === "new") {
      setForm((prev) => ({ ...prev, address: "", addressLabel: "" }));
      setCoords(null);
    }
  }, [addressMode, selectedAddressId]);

  // لو الرصيد مبقاش كفاية (مثلًا بدّل الحساب) نلغي استخدام النقاط
  useEffect(() => {
    if (cart.usePoints && !canUsePoints) setUsePoints(false);
  }, [cart.usePoints, canUsePoints]);

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

  // 📍 موقعي الحالي: بيساعد الدليفري يوصلك بالظبط
  const handleLocate = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("الموبايل أو المتصفح مش بيدعم تحديد الموقع");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy || 0) });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err && err.code === 1
            ? "لازم تسمح للتطبيق بالوصول للموقع من الإعدادات"
            : "مقدرناش نحدد موقعك، جرب تاني أو اكتب العنوان بالتفصيل"
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const isEmpty = itemsCount === 0;

  const buildWhatsAppUrl = (orderId, status) => {
    const lines = [
      `طلب جديد من السلة 🛒`,
      orderId ? `رقم الطلب: ${orderId}` : "",
      `الاسم: ${form.name}`,
      `رقم الواتساب: ${form.whatsapp}`,
      `العنوان: ${form.address}`,
      `طريقة الدفع: ${selectedPayment.label}`,
      "",
    ];
    if (hasDelivery) {
      lines.push(`--- دليفري من ${cart.restaurant} ---`);
      cart.deliveryItems.forEach((i) => lines.push(`- ${i.name} × ${i.qty} = ${unitPrice(i) * i.qty} ج.م`));
      lines.push(`إجمالي الأصناف: ${deliverySubtotalAfter} ج.م`);
      lines.push(`رسوم التوصيل: ${deliveryFeeTotal} ج.م`);
      if (usingPoints) lines.push(`⭐ تم استخدام ${pointsRequired} نقطة لتفعيل الخصم`);
      lines.push("");
    }
    if (cart.cardItems.length > 0) {
      lines.push(`--- كروت الخصم ---`);
      cart.cardItems.forEach((c) => lines.push(`- ${c.name} × ${c.qty} = ${c.price * c.qty} ج.م`));
      lines.push("");
    }
    lines.push(`الإجمالي النهائي: ${grandTotal} ج.م`);
    if (selectedPayment.needsTransfer) {
      lines.push("");
      lines.push(`💳 تم التحويل على: ${selectedPayment.destinationLabel} (${selectedPayment.destinationValue})`);
      lines.push(`من رقم: ${form.senderPhone}`);
      lines.push(`آخر 6 أرقام من عملية التحويل: ${form.transactionRef}`);
      lines.push("⚠️ برجاء إرسال سكرين شوت إثبات التحويل هنا");
    }
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEmpty || sending) return;
    setErrorMsg("");

    if (selectedPayment.needsTransfer) {
      const sender = digitsOnly(form.senderPhone);
      if (sender.length < 10 || sender.length > 13) {
        setErrorMsg("اكتب رقم المحفظة اللي حوّلت منها (11 رقم)");
        return;
      }
      if (!form.transactionRef.trim()) {
        setErrorMsg("من فضلك اكتب آخر 6 أرقام من عملية التحويل قبل تأكيد الطلب");
        return;
      }
    }

    setSending(true);

    // ---------- بيانات الأوردر ----------
    const paymentMethodText = selectedPayment.label;
    const deliveryItemsText = hasDelivery
      ? cart.deliveryItems.map((i) => `${i.name} × ${i.qty} = ${unitPrice(i) * i.qty} ج.م`).join(" | ")
      : "";
    const cardsText = cart.cardItems.length > 0
      ? cart.cardItems.map((c) => `${c.name} × ${c.qty} = ${c.price * c.qty} ج.م`).join(" | ")
      : "";

    const itemsText = hasDelivery ? deliveryItemsText : cardsText;
    const storeName = hasDelivery ? cart.restaurant : cart.cardItems.map((c) => c.store || c.name).join(", ");
    // السيرفر بيربط المطعم والمخزون باسم تاب المنيو (Rolz) مش برقم المحل في الموقع (11)
    const storeKey = hasDelivery ? MENU_STORE_KEYS[String(cart.restaurantId)] || String(cart.restaurantId || "") : "";

    const newOrderData = {
      action: "createOrder",
      customerPhone: user.phone,
      customerName: form.name,
      storeId: storeKey,
      storeName,
      items: itemsText,
      total: grandTotal,
      paymentMethod: paymentMethodText,
      address: form.address,
      status: "pending",
      lines: hasDelivery ? cart.deliveryItems.map((i) => ({ itemId: i.itemId, qty: i.qty })) : [],
      usePoints: usingPoints,
    };
    if (coords) {
      newOrderData.customerLat = coords.lat;
      newOrderData.customerLng = coords.lng;
    }
    if (selectedPayment.needsTransfer) {
      newOrderData.paymentSender = digitsOnly(form.senderPhone);
      newOrderData.paymentRef = form.transactionRef.trim();
    }

    // ---------- 1) تسجيل الأوردر في السيرفر (لازم ننتظر الرد: المخزون / النقاط / التوصيل ممكن يرفضوه) ----------
    let result;
    try {
      result = await postJson(newOrderData);
    } catch (err) {
      setSending(false);
      setErrorMsg("مشكلة في الاتصال، الطلب لم يتم. جرب تاني.");
      return;
    }
    if (!result || !result.success) {
      setSending(false);
      setErrorMsg((result && result.error) || "حصل خطأ، الطلب لم يتم");
      return;
    }

    // ---------- 2) حفظ عنوان جديد لو المستخدم دخل عنوان جديد ----------
    if (addressMode === "new" && saveAddr && form.address.trim()) {
      const alreadyExists = addresses.some((a) => a.address.trim() === form.address.trim());
      if (!alreadyExists) {
        const entry = { id: Date.now(), label: form.addressLabel.trim() || "عنوان جديد", address: form.address.trim() };
        if (coords) {
          entry.lat = coords.lat;
          entry.lng = coords.lng;
        }
        updateAddresses([...addresses, entry]);
      }
    }

    // ---------- 3) الأوردر القديم (زي ما هو، من غير أي تغيير) ----------
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

    // ---------- 4) شاشة النجاح + تحديث رصيد النقاط ----------
    const pointsUsed = Number(result.pointsUsed) || 0;
    if (pointsUsed > 0) updateUser({ points: Math.max(0, balance - pointsUsed) });
    const whatsappUrl = buildWhatsAppUrl(result.orderId, result.status);
    setDone({
      orderId: result.orderId,
      status: result.status,
      pointsUsed,
      whatsappUrl,
      isTransfer: selectedPayment.needsTransfer,
    });
    clearCart();
    setSending(false);
    refreshUser();
  };

  if (done) {
    const underReview = done.status === "payment_review";
    return (
      <div className="auth-container">
        <h2>✅ تم تسجيل طلبك</h2>
        <p style={{ textAlign: "center" }}>رقم الطلب: <strong>{done.orderId}</strong></p>
        {underReview ? (
          <p style={{ textAlign: "center" }}>
            التحويل تحت المراجعة. أول ما نتأكد منه هنبعت طلبك للمطعم فورًا.
            <br />
            ⚠️ ابعت لنا <strong>سكرين شوت</strong> إثبات التحويل على واتساب عشان نأكد أسرع.
          </p>
        ) : (
          <p style={{ textAlign: "center" }}>طلبك اتبعت وهيتجهز دلوقتي 🎉 تقدر تتابعه من صفحة أوردراتك.</p>
        )}
        {done.pointsUsed > 0 && (
          <p style={{ textAlign: "center" }}>⭐ اتخصم {done.pointsUsed} نقطة لتفعيل الخصم.</p>
        )}
        <div className="signUp" style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
          <a href={done.whatsappUrl} target="_blank" rel="noopener noreferrer">
            <button type="button">
              {underReview ? "📱 ابعت إثبات التحويل على واتساب" : "📱 تواصل معنا على واتساب"}
            </button>
          </a>
          <button type="button" onClick={() => navigate("/orders")}>تابع أوردراتك</button>
          <button type="button" onClick={() => navigate("/")}>الرئيسية</button>
        </div>
      </div>
    );
  }

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
          {cart.deliveryItems.map((item, idx) => {
            const beforeTotal = (item.price * item.qty).toFixed(2);
            const afterTotal = (unitPrice(item) * item.qty).toFixed(2);
            const showStrike = discountActive && Number(item.price) > Number(item.discounted_price);

            return (
              <div className="cart-line" key={idx}>
                <span>{item.name} × {item.qty}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {showStrike && (
                    <span style={{ color: "#999", textDecoration: "line-through", fontSize: "0.9em" }}>
                      {beforeTotal} ج.م
                    </span>
                  )}
                  <span style={{ color: showStrike ? "#28a745" : "inherit", fontWeight: "bold" }}>
                    {afterTotal} ج.م
                  </span>
                </span>
              </div>
            );
          })}
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
        {pointsRequired > 0 && (
          <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={usingPoints}
                disabled={!canUsePoints}
                onChange={(e) => setUsePoints(e.target.checked)}
              />
              <span>
                ⭐ استخدم {pointsRequired} نقطة لتفعيل خصم المحل
                {potentialSaving > 0 ? ` (وفّر ${potentialSaving} ج.م)` : ""}
              </span>
            </label>
            <small style={{ display: "block", marginTop: "6px", color: "#7a5c00" }}>
              رصيدك: {balance} نقطة
              {!canUsePoints ? " — مش كفاية لتفعيل الخصم" : ""} · <Link to="/profile">اشحن نقاط</Link>
            </small>
          </div>
        )}

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
                  <p>{addr.address}{typeof addr.lat === "number" ? " 📍" : ""}</p>
                </div>
                <button type="button" className="delete-address-btn" onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {addressMode === "new" && (
          <>
            <AddressPicker
              required
              value={{ label: form.addressLabel, address: form.address, lat: coords ? coords.lat : null, lng: coords ? coords.lng : null, accuracy: coords ? coords.accuracy : 0 }}
              onChange={(patch) => {
                setForm((f) => ({
                  ...f,
                  ...("label" in patch ? { addressLabel: patch.label } : {}),
                  ...("address" in patch ? { address: patch.address } : {}),
                }));
                if ("lat" in patch) setCoords(typeof patch.lat === "number" ? { lat: patch.lat, lng: patch.lng, accuracy: patch.accuracy || 0 } : null);
              }}
            />
            <label className="save-address-check" style={{ display: "flex", gap: "6px", alignItems: "center", margin: "4px 0" }}>
              <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} /> احفظ العنوان ده في عناويني
            </label>
          </>
        )}

        {hasDelivery && addressMode === "select" && (
          <div style={{ margin: "8px 0" }}>
            <button type="button" onClick={handleLocate} disabled={locating}>
              {locating ? "جارٍ تحديد موقعك..." : coords ? "📍 تحديث موقعي الحالي" : "📍 استخدم موقعي الحالي"}
            </button>
            {coords && (
              <p style={{ color: "#28a745", margin: "6px 0 0" }}>
                ✅ تم تحديد موقعك{coords.accuracy ? ` (دقة ±${coords.accuracy} متر)` : ""} — الدليفري هيوصلك بالظبط
              </p>
            )}
            {!coords && !locationError && (
              <p style={{ color: "#777", margin: "6px 0 0", fontSize: "0.9em" }}>
                اختياري، بس بيخلي الدليفري يوصلك أسرع.
              </p>
            )}
            {locationError && <p style={{ color: "red", margin: "6px 0 0" }}>{locationError}</p>}
          </div>
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
              <input type="tel" name="senderPhone" placeholder="رقم المحفظة اللي حوّلت منها" value={form.senderPhone} onChange={handleChange} required />
              <input type="text" name="transactionRef" placeholder="آخر 6 أرقام من عملية التحويل" value={form.transactionRef} onChange={handleChange} maxLength={6} required />
              <p className="screenshot-warning">⚠️ طلبك هيتراجع الأول، وهيتبعت للمطعم أول ما نتأكد من التحويل. ابعت <strong>سكرين شوت</strong> الإثبات على الواتساب عشان نأكد أسرع.</p>
            </div>
          )}
        </div>

        {errorMsg && <p style={{ color: "red", textAlign: "center" }}>{errorMsg}</p>}

        <button type="submit" disabled={sending}>{sending ? "جارٍ إرسال الطلب..." : "تأكيد الطلب"}</button>
      </form>
    </div>
  );
}
