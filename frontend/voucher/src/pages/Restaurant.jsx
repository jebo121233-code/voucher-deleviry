import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import "./Restaurant.css";
import { CART_SCRIPT_URL } from "../data/data.js";
import { CLOUDINARY_CLOUD_NAME as CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET as UPLOAD_PRESET } from "../data/upload.js";
import { useAuth } from "../context/AuthContext.jsx";
import { uploadImage as driveUpload } from "../data/imageUtil.js";
import OptionsEditor from "../components/OptionsEditor.jsx";
import { prepareOptions, optSummary } from "../data/optionsUtil.js";

// لو ملّيت ملف data/upload.js، المحل يقدر يرفع الصورة من الموبايل مباشرة، وإلا بيكتب رابط الصورة

const POLL_MS = 6000;

async function api(body) {
  const res = await fetch(CART_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  return res.json();
}

const STATUS_TEXT = {
  new: "جديد",
  preparing: "بيتجهز",
  ready: "جاهز",
  awaiting_handover: "الدليفري استلم، أكّد التسليم",
  on_the_way: "خرج للتوصيل",
  pending: "جديد",
};

const RANGES = [
  { key: "today", label: "اليوم" },
  { key: "week", label: "7 أيام" },
  { key: "month", label: "30 يوم" },
  { key: "all", label: "الكل" },
];

const REQ_TEXT = { pending: "في انتظار موافقة الإدارة", approved: "اتقبل", rejected: "اترفض", cancelled: "اتلغى" };
const TYPE_TEXT = { add: "إضافة", edit: "تعديل", delete: "حذف" };

function itemsOf(o) {
  try {
    const lines = JSON.parse(o.Lines || "[]");
    if (Array.isArray(lines) && lines.length && lines.every((l) => l.name || l.itemName)) {
      return lines.map((l) => `${l.qty || l.quantity || 1}× ${l.name || l.itemName || ""}`);
    }
  } catch {
    /* نرجع للنص */
  }
  return o.Items ? String(o.Items).split(/[\n,،]+/).map((s) => s.trim()).filter(Boolean) : [];
}

const EMPTY_FORM = { itemId: "", name: "", description: "", price: "", category: "", imageUrl: "", quantity: "", options: [] };

export default function Restaurant() {
  const navigate = useNavigate();
  const { role, restaurant, token, logout } = useAuth();
  const rid = restaurant ? restaurant.restaurantId : "";

  const [deliveryEnabled, setDeliveryEnabled] = useState(restaurant ? restaurant.deliveryEnabled !== false : true);
  const [tab, setTab] = useState(deliveryEnabled ? "orders" : "menu");
  const [range, setRange] = useState("today");
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stockEdits, setStockEdits] = useState({});
  const [form, setForm] = useState(null); // null = مقفول
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoBusy, setLogoBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (role !== "restaurant" || !token) navigate("/login");
  }, [role, token, navigate]);

  const ofCall = useCallback((action, extra = {}) => api({ action, partnerId: rid, token, ...extra }), [rid, token]);
  const mmCall = useCallback((action, extra = {}) => api({ action, restaurantId: rid, token, ...extra }), [rid, token]);

  const loadOrders = useCallback(async () => {
    if (!rid || !token || !deliveryEnabled) return;
    try {
      const [a, s] = await Promise.all([ofCall("of_partnerActive"), ofCall("of_partnerStats", { range })]);
      if (a.success) {
        setOrders(a.orders || []);
        setError("");
      } else setError(a.error || "حصل خطأ");
      if (s.success) setStats(s.stats);
    } catch {
      setError("مشكلة في الاتصال، هنحاول تاني");
    }
  }, [ofCall, rid, token, range, deliveryEnabled]);

  const loadMenu = useCallback(async () => {
    if (!rid || !token) return;
    try {
      const r = await mmCall("mm_getMenu");
      if (r.success) {
        setItems(r.items || []);
        setRequests(r.requests || []);
        if (r.restaurant) setDeliveryEnabled(r.restaurant.deliveryEnabled !== false);
      } else setError(r.error || "حصل خطأ");
    } catch {
      setError("مشكلة في الاتصال");
    }
  }, [mmCall, rid, token]);

  useEffect(() => {
    loadOrders();
    const id = setInterval(() => document.visibilityState === "visible" && loadOrders(), POLL_MS);
    return () => clearInterval(id);
  }, [loadOrders]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const act = async (action, orderId) => {
    setBusy(action + orderId);
    setError("");
    try {
      const r = await ofCall(action, { orderId });
      if (!r.success) setError(r.error || "مقدرناش ننفذ");
      await loadOrders();
    } catch {
      setError("مشكلة في الاتصال، حاول تاني");
    } finally {
      setBusy("");
    }
  };

  const reject = (o) => {
    if (window.confirm("متأكد إنك عايز ترفض الأوردر؟")) act("of_partnerReject", o.OrderID);
  };

  // ===== المخزون (فوري) =====
  const saveStock = async (it, patch) => {
    setBusy("stock" + it.itemId);
    setError("");
    // تحديث فوري على الشاشة، ولو السيرفر رفض بنرجع للقيمة الصح
    setItems((prev) =>
      prev.map((x) =>
        x.itemId === it.itemId
          ? {
              ...x,
              ...(patch.available !== undefined ? { available: patch.available } : {}),
              ...(patch.quantity !== undefined ? { quantity: patch.quantity } : {}),
            }
          : x
      )
    );
    try {
      const r = await mmCall("mm_setStock", { updates: [{ itemId: it.itemId, ...patch }] });
      if (!r.success) {
        setError(r.error || "مقدرناش نحفظ");
        await loadMenu();
      } else {
        setStockEdits((p) => {
          const n = { ...p };
          delete n[it.itemId];
          return n;
        });
        await loadMenu();
      }
    } catch {
      setError("مشكلة في الاتصال");
    } finally {
      setBusy("");
    }
  };

  const qtyValue = (it) => (stockEdits[it.itemId] !== undefined ? stockEdits[it.itemId] : it.quantity === null ? "" : String(it.quantity));

  const commitQty = (it) => {
    const raw = stockEdits[it.itemId];
    if (raw === undefined) return;
    saveStock(it, { quantity: raw === "" ? null : Number(raw) });
  };

  // ===== طلبات التعديل (بتتراجع من الإدارة) =====
  const openAdd = () => setForm({ ...EMPTY_FORM, mode: "add" });
  const openEdit = (it) =>
    setForm({
      mode: "edit",
      itemId: it.itemId,
      name: it.name,
      description: it.description || "",
      price: String(it.price),
      category: it.category || "",
      imageUrl: it.imageUrl || "",
      quantity: "",
      options: Array.isArray(it.options) ? JSON.parse(JSON.stringify(it.options)) : [],
    });

  // رفع صورة المنتج: Cloudinary لو متظبط، وإلا على Google Drive عن طريق السيرفر (من غير أي إعداد)
  const uploadImage = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      if (CLOUD_NAME && UPLOAD_PRESET) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
        const data = await res.json();
        if (data.secure_url) setForm((f) => ({ ...f, imageUrl: data.secure_url }));
        else setError("فشل رفع الصورة");
      } else {
        const url = await driveUpload(file, { restaurantId: rid, token }, "product");
        setForm((f) => ({ ...f, imageUrl: url }));
      }
    } catch (e) {
      setError(e.message || "فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  // لوجو المحل: بيظهر للعملاء في صفحة المحلات
  useEffect(() => {
    if (!rid || !token) return;
    api({ action: "sd_myProfile", restaurantId: rid, token }).then((r) => r.success && setLogoUrl(r.logoUrl || "")).catch(() => {});
  }, [rid, token]);

  const changeLogo = async (file) => {
    if (!file) return;
    setLogoBusy(true);
    setError("");
    setNotice("");
    try {
      const url = await driveUpload(file, { restaurantId: rid, token }, "logo");
      setLogoUrl(url);
      setNotice("اللوجو اتحدّث.");
    } catch (e) {
      setError(e.message || "فشل رفع اللوجو");
    } finally {
      setLogoBusy(false);
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy("form");
    const item = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      category: form.category,
      imageUrl: form.imageUrl,
      options: prepareOptions(form.options),
    };
    if (form.mode === "add" && form.quantity !== "") item.quantity = Number(form.quantity);
    try {
      const r = await mmCall("mm_submitChange", {
        type: form.mode,
        itemId: form.mode === "edit" ? form.itemId : undefined,
        item,
      });
      if (!r.success) setError(r.error || "مقدرناش نبعت الطلب");
      else {
        setNotice("الطلب اتبعت للإدارة وهيتراجع قبل ما يظهر للعملاء.");
        setForm(null);
        await loadMenu();
      }
    } catch {
      setError("مشكلة في الاتصال");
    } finally {
      setBusy("");
    }
  };

  const requestDelete = async (it) => {
    if (!window.confirm(`طلب حذف "${it.name}"؟ هيتراجع من الإدارة.`)) return;
    setError("");
    setNotice("");
    const r = await mmCall("mm_submitChange", { type: "delete", itemId: it.itemId });
    if (!r.success) setError(r.error || "مقدرناش نبعت الطلب");
    else setNotice("طلب الحذف اتبعت للإدارة.");
    await loadMenu();
  };

  const cancelRequest = async (requestId) => {
    const r = await mmCall("mm_cancelRequest", { requestId });
    if (!r.success) setError(r.error || "مقدرناش نلغي الطلب");
    await loadMenu();
  };

  if (role !== "restaurant" || !restaurant) return null;

  const renderOrder = (o) => {
    const hasDriver = !!o.DriverPhone;
    const st = String(o.Status);
    const isNew = st === "new" || st === "pending";
    const isBusy = !!busy;
    return (
      <div className="rst-card" key={o.OrderID}>
        <div className="rst-row">
          <strong>أوردر {o.OrderID}</strong>
          <span className="rst-badge">{STATUS_TEXT[st] || st}</span>
        </div>
        <ul className="rst-items">
          {itemsOf(o).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
        {hasDriver ? (
          <div className="rst-box">
            <div>🛵 الدليفري: {o.DriverName || "—"} {o.DriverPhone && <a href={`tel:${o.DriverPhone}`}>({String(o.DriverPhone)})</a>}</div>
            {o.CustomerName && <div>👤 {o.CustomerName}</div>}
            {o.CustomerPhone && <div>📞 {String(o.CustomerPhone)}</div>}
            {(o.CustomerAddress || o.Address) && <div>🏠 {o.CustomerAddress || o.Address}</div>}
          </div>
        ) : (
          <div className="rst-muted">بيانات العميل هتظهر بعد ما دليفري يقبل الأوردر.</div>
        )}
        <div className="rst-actions">
          {isNew && (
            <button disabled={isBusy} onClick={() => act("of_partnerAccept", o.OrderID)}>
              قبول وبدء التجهيز
            </button>
          )}
          {st === "preparing" && (
            <button disabled={isBusy} onClick={() => act("of_partnerReady", o.OrderID)}>
              الأوردر جاهز
            </button>
          )}
          {["ready", "awaiting_handover"].includes(st) && hasDriver && (
            <button disabled={isBusy} onClick={() => act("of_partnerHandover", o.OrderID)}>
              سلّمت للدليفري
            </button>
          )}
          {["new", "pending", "preparing", "ready"].includes(st) && !hasDriver && (
            <button className="rst-danger" disabled={isBusy} onClick={() => reject(o)}>
              رفض
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="auth-container rst-page">
      <div className="rst-head">
        <h2>{restaurant.name}</h2>
        <button
          type="button"
          className="rst-small"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          خروج / تبديل
        </button>
      </div>

      <div className="rst-tabs">
        {deliveryEnabled && (
          <button className={tab === "orders" ? "on" : ""} onClick={() => setTab("orders")}>
            الأوردرات
          </button>
        )}
        <button className={tab === "menu" ? "on" : ""} onClick={() => setTab("menu")}>
          المنتجات
        </button>
        <button className={tab === "requests" ? "on" : ""} onClick={() => setTab("requests")}>
          طلباتي
        </button>
      </div>

      {error && <p className="rst-error">{error}</p>}
      {notice && <p className="rst-notice">{notice}</p>}

      {tab === "orders" && deliveryEnabled && (
        <>
          <div className="rst-ranges">
            {RANGES.map((r) => (
              <button key={r.key} className={range === r.key ? "on" : ""} onClick={() => setRange(r.key)}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="rst-stats">
            <div><b>{stats ? stats.inProgress : "–"}</b><span>قيد التنفيذ</span></div>
            <div><b>{stats ? stats.onTheWay : "–"}</b><span>خرج للتوصيل</span></div>
            <div><b>{stats ? stats.delivered : "–"}</b><span>تم التنفيذ</span></div>
            <div><b>{stats ? stats.cancelled : "–"}</b><span>تم الإلغاء</span></div>
          </div>
          {orders.length === 0 && <p className="rst-muted">مفيش أوردرات شغالة دلوقتي.</p>}
          {orders.map(renderOrder)}
        </>
      )}

      {tab === "menu" && (
        <>
          <div className="rst-card rst-logo">
            {logoUrl ? <img className="rst-logo-img" src={logoUrl} alt="لوجو المحل" /> : <div className="rst-muted">لسه مفيش لوجو للمحل</div>}
            <label className="rst-upload">
              🖼️ {logoBusy ? "جارٍ الرفع..." : logoUrl ? "تغيير اللوجو" : "رفع لوجو المحل"}
              <input type="file" accept="image/*" hidden disabled={logoBusy} onChange={(e) => changeLogo(e.target.files[0])} />
            </label>
          </div>
          <button className="rst-add" onClick={openAdd}>
            + إضافة منتج جديد
          </button>
          {!deliveryEnabled && <p className="rst-muted">المحل ده مش متاح له التوصيل، المنتجات بتتعرض للعملاء بس.</p>}

          {form && (
            <form className="rst-form" onSubmit={submitForm}>
              <h3>{form.mode === "add" ? "منتج جديد" : "تعديل منتج"}</h3>
              <input placeholder="اسم المنتج" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input placeholder="الوصف (اختياري)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <input type="number" inputMode="decimal" min="0" step="0.01" placeholder="السعر قبل الخصم" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              <input placeholder="القسم (مثلاً: برجر)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
              {form.mode === "add" && (
                <input type="number" inputMode="numeric" min="0" placeholder="الكمية المتاحة (سيبها فاضية لو من غير حد)" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              )}
              <OptionsEditor value={form.options} onChange={(options) => setForm({ ...form, options })} basePrice={form.price} />
              <label className="rst-upload">
                📷 {uploading ? "جارٍ الرفع..." : form.imageUrl ? "تغيير الصورة" : "اختار صورة"}
                <input type="file" accept="image/*" hidden disabled={uploading} onChange={(e) => uploadImage(e.target.files[0])} />
              </label>
              {form.imageUrl && <img className="rst-preview" src={form.imageUrl} alt="" />}
              <p className="rst-muted">الخصم بتحدده الإدارة، والتغيير بيظهر للعملاء بعد الموافقة.</p>
              <div className="rst-actions">
                <button type="submit" disabled={busy === "form" || uploading}>
                  {busy === "form" ? "..." : "إرسال للمراجعة"}
                </button>
                <button type="button" className="rst-gray" onClick={() => setForm(null)}>
                  إلغاء
                </button>
              </div>
            </form>
          )}

          {items.map((it) => (
            <div className="rst-card" key={it.itemId}>
              <div className="rst-row">
                <div className="rst-item-main">
                  {it.imageUrl && <img className="rst-thumb" src={it.imageUrl} alt="" loading="lazy" />}
                  <div>
                    <strong>{it.name}</strong>
                    <div className="rst-muted">
                      {it.price} ج.م {Number(it.discountPercent) > 0 && `• خصم ${it.discountPercent}%`} {it.category && `• ${it.category}`}
                    </div>
                    {Array.isArray(it.options) && it.options.length > 0 && <div className="rst-muted">🔹 {optSummary(it.options)}</div>}
                  </div>
                </div>
                {it.pending && <span className="rst-badge">{TYPE_TEXT[it.pending.type] || ""} قيد المراجعة</span>}
              </div>

              <div className="rst-stock">
                <label className="rst-switch">
                  <input type="checkbox" checked={!!it.available} disabled={busy === "stock" + it.itemId} onChange={(e) => saveStock(it, { available: e.target.checked })} />
                  <span>{it.available ? "متاح" : "غير متاح"}</span>
                </label>
                <input
                  className="rst-qty"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="الكمية (فاضي = من غير حد)"
                  value={qtyValue(it)}
                  onChange={(e) => setStockEdits({ ...stockEdits, [it.itemId]: e.target.value })}
                  onBlur={() => commitQty(it)}
                  onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                />
              </div>
              {it.soldOut && <div className="rst-error">خلصت الكمية</div>}

              <div className="rst-actions">
                <button type="button" className="rst-gray" onClick={() => openEdit(it)} disabled={!!it.pending}>
                  تعديل
                </button>
                <button type="button" className="rst-danger" onClick={() => requestDelete(it)} disabled={!!it.pending}>
                  حذف
                </button>
                {it.pending && (
                  <button type="button" className="rst-gray" onClick={() => cancelRequest(it.pending.requestId)}>
                    إلغاء الطلب
                  </button>
                )}
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="rst-muted">لسه مفيش منتجات. ابدأ بإضافة أول منتج.</p>}
        </>
      )}

      {tab === "requests" && (
        <>
          {requests.length === 0 && <p className="rst-muted">مفيش طلبات تعديل لسه.</p>}
          {requests.map((r) => (
            <div className="rst-card" key={r.requestId}>
              <div className="rst-row">
                <strong>
                  {TYPE_TEXT[r.type] || r.type} {(r.newData && r.newData.name) || (r.oldData && r.oldData.name) || ""}
                </strong>
                <span className="rst-badge">{REQ_TEXT[r.status] || r.status}</span>
              </div>
              {r.reason && <div className="rst-muted">السبب: {r.reason}</div>}
              {r.status === "pending" && (
                <button type="button" className="rst-gray" onClick={() => cancelRequest(r.requestId)}>
                  إلغاء الطلب
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
