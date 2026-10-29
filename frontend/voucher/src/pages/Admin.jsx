import { useState, useEffect, useCallback, useRef } from "react";
import { CART_SCRIPT_URL, shops, categories } from "../data/data.js";
import { loadDynamicStores, isVisible, isOnHome } from "../data/dynamicStores.js";
import { uploadImage, assetUrl } from "../data/imageUtil.js";
import { RestaurantDetail, DriverDetail, CustomerDetail, ChangeLog } from "./AdminDetails.jsx";
import { fmtField } from "../data/optionsUtil.js";
import "./Admin.css";

const STATUS_OPTIONS = ["pending", "accepted_by_restaurant", "preparing", "out_for_delivery", "delivered", "cancelled"];

const STATUS_LABELS = {
  pending: "⏳ قيد الانتظار",
  accepted_by_restaurant: "👨‍🍳 تم القبول",
  preparing: "🍳 جارٍ التحضير",
  out_for_delivery: "🛵 في الطريق",
  delivered: "✅ تم التوصيل",
  cancelled: "❌ ملغي",
};

// يحول رقم مصري لصيغة دولية عشان رابط واتساب يشتغل صح
function toWhatsAppNumber(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return "20" + digits.slice(1);
  return "20" + digits;
}

function buildWhatsAppLink(phone, message) {
  const number = toWhatsAppNumber(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/* ================= أقسام الإدارة الجديدة (مراجعات / منيو / نقاط / لايف) ================= */

async function api(body) {
  const res = await fetch(CART_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  return res.json();
}

const fmtDate = (v) => {
  const d = new Date(v);
  return isNaN(d) ? "" : d.toLocaleString("ar-EG");
};

// صوت تنبيه قصير (من غير ملفات خارجية)
function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.15;
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 350);
  } catch {
    /* المتصفح مانع الصوت */
  }
}

// بيراقب عدّاد المراجعات كل 20 ثانية وبينبهك لما يزيد (صوت + إشعار متصفح + عنوان الصفحة)
function useAdminPending(password) {
  const [pending, setPending] = useState(null);
  const last = useRef(null);
  useEffect(() => {
    if (!password) return undefined;
    let stopped = false;
    const tick = async () => {
      try {
        const r = await api({ action: "pts_adminPending", password });
        if (stopped || !r.success) return;
        setPending(r);
        if (last.current !== null && r.total > last.current) {
          beep();
          try {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("VE Voucher", { body: `فيه ${r.total} حاجة محتاجة مراجعة` });
            }
          } catch {
            /* ignore */
          }
        }
        last.current = r.total;
        document.title = r.total > 0 ? `(${r.total}) إدارة VE` : "إدارة VE";
      } catch {
        /* هنحاول تاني */
      }
    };
    tick();
    const id = setInterval(tick, 20000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [password]);
  return pending;
}

function Msg({ error, notice }) {
  return (
    <>
      {error && <p className="adx-error">{error}</p>}
      {notice && <p className="adx-notice">{notice}</p>}
    </>
  );
}

/* ===================== مراجعات ===================== */
function Reviews({ password, onChanged }) {
  const [data, setData] = useState({ orders: [], purchases: [], refunds: [], requests: [] });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [discounts, setDiscounts] = useState({});

  const load = useCallback(async () => {
    try {
      const [o, p, r, m] = await Promise.all([
        api({ action: "pts_adminGetPaymentOrders", password }),
        api({ action: "pts_adminGetPurchases", password }),
        api({ action: "pts_adminGetRefunds", password }),
        api({ action: "mm_adminGetRequests", password }),
      ]);
      setData({ orders: o.orders || [], purchases: p.purchases || [], refunds: r.refunds || [], requests: m.requests || [] });
      const bad = [o, p, r, m].find((x) => !x.success);
      setError(bad ? bad.error : "");
    } catch {
      setError("مشكلة في الاتصال");
    }
  }, [password]);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  const review = async (body, okText) => {
    setError("");
    setNotice("");
    const r = await api({ password, ...body });
    if (!r.success) setError(r.error || "فشل");
    else setNotice(okText);
    await load();
    onChanged && onChanged();
  };

  const ask = (msg) => window.prompt(msg, "");

  const rejectReason = () => {
    const reason = ask("سبب الرفض:");
    return reason === null ? null : reason;
  };

  const none = !data.orders.length && !data.purchases.length && !data.refunds.length && !data.requests.length;

  return (
    <>
      <Msg error={error} notice={notice} />
      {none && <p className="adx-muted">مفيش حاجة محتاجة مراجعة دلوقتي ✅</p>}

      {data.orders.length > 0 && <h3>دفع أوردرات (فودافون كاش) — {data.orders.length}</h3>}
      {data.orders.map((o) => (
        <div className="adx-card" key={o.orderId}>
          <div className="adx-row">
            <strong>{o.storeName}</strong>
            <b>{o.total} ج.م</b>
          </div>
          <div className="adx-muted">
            {o.customerName} • {o.phone} • {fmtDate(o.timestamp)}
          </div>
          <div>{o.items}</div>
          <div className="adx-box">
            حوّل من: <b>{o.senderPhone || "—"}</b> {o.reference && <>• مرجع: {o.reference}</>}
            {o.pointsUsed > 0 && <> • نقاط مستخدمة: {o.pointsUsed}</>}
          </div>
          <div className="adx-actions">
            <button onClick={() => review({ action: "pts_adminReviewOrderPayment", orderId: o.orderId, approve: true }, "اتقبل وراح للمطعم")}>تأكيد الدفع</button>
            <button
              className="adx-danger"
              onClick={() => {
                const reason = rejectReason();
                if (reason !== null) review({ action: "pts_adminReviewOrderPayment", orderId: o.orderId, approve: false, reason }, "اترفض وراجعت الكمية والنقاط");
              }}
            >
              رفض
            </button>
          </div>
        </div>
      ))}

      {data.purchases.length > 0 && <h3>شراء نقاط — {data.purchases.length}</h3>}
      {data.purchases.map((p) => (
        <div className="adx-card" key={p.requestId}>
          <div className="adx-row">
            <strong>
              {p.points} نقطة • {p.price} ج.م
            </strong>
            <span className="adx-muted">{fmtDate(p.createdAt)}</span>
          </div>
          <div className="adx-muted">
            {p.name} • {p.phone}
          </div>
          <div className="adx-box">
            حوّل من: <b>{p.senderPhone}</b> {p.reference && <>• مرجع: {p.reference}</>}
          </div>
          <div className="adx-actions">
            <button onClick={() => review({ action: "pts_adminReviewPurchase", requestId: p.requestId, approve: true }, "النقاط اتضافت للعميل")}>تأكيد وإضافة النقاط</button>
            <button
              className="adx-danger"
              onClick={() => {
                const reason = rejectReason();
                if (reason !== null) review({ action: "pts_adminReviewPurchase", requestId: p.requestId, approve: false, reason }, "اترفض");
              }}
            >
              رفض
            </button>
          </div>
        </div>
      ))}

      {data.refunds.length > 0 && <h3>استرداد نقاط — {data.refunds.length}</h3>}
      {data.refunds.map((r) => (
        <div className="adx-card" key={r.requestId}>
          <div className="adx-row">
            <strong>
              {r.points} نقطة • أوردر {r.orderId}
            </strong>
            <span className="adx-muted">{fmtDate(r.createdAt)}</span>
          </div>
          <div className="adx-muted">{r.phone}</div>
          {r.reason && <div>السبب: {r.reason}</div>}
          <div className="adx-actions">
            <button onClick={() => review({ action: "pts_adminReviewRefund", requestId: r.requestId, approve: true }, "النقاط اترجعت للعميل")}>موافقة وإرجاع النقاط</button>
            <button
              className="adx-danger"
              onClick={() => {
                const reason = rejectReason();
                if (reason !== null) review({ action: "pts_adminReviewRefund", requestId: r.requestId, approve: false, reason }, "اترفض");
              }}
            >
              رفض
            </button>
          </div>
        </div>
      ))}

      {data.requests.length > 0 && <h3>تعديلات المنيو — {data.requests.length}</h3>}
      {data.requests.map((q) => {
        const nd = q.newData || {};
        const od = q.oldData || {};
        const name = nd.name || od.name || "";
        return (
          <div className="adx-card" key={q.requestId}>
            <div className="adx-row">
              <strong>
                {{ add: "إضافة", edit: "تعديل", delete: "حذف" }[q.type] || q.type} {name}
              </strong>
              <span className="adx-muted">{q.restaurantName}</span>
            </div>
            {q.type !== "delete" && (
              <div className="adx-box">
                {Object.keys(nd).map((k) => (
                  <div key={k}>
                    {k === "options" ? "الأحجام والإضافات" : k}: <b>{fmtField(k, nd[k])}</b>
                    {od[k] !== undefined && fmtField(k, od[k]) !== fmtField(k, nd[k]) && <span className="adx-muted"> (كان {fmtField(k, od[k])})</span>}
                  </div>
                ))}
                {nd.imageUrl && <img className="adx-img" src={String(nd.imageUrl).split(",")[0]} alt="" />}
              </div>
            )}
            {q.type !== "delete" && (
              <input
                className="adx-input"
                type="number"
                min="0"
                max="100"
                placeholder="نسبة الخصم % (اختياري)"
                value={discounts[q.requestId] || ""}
                onChange={(e) => setDiscounts({ ...discounts, [q.requestId]: e.target.value })}
              />
            )}
            <div className="adx-actions">
              <button
                onClick={() =>
                  review(
                    { action: "mm_adminReview", requestId: q.requestId, approve: true, discountPercent: discounts[q.requestId] || undefined },
                    "اتقبل وظهر للعملاء"
                  )
                }
              >
                موافقة
              </button>
              <button
                className="adx-danger"
                onClick={() => {
                  const reason = rejectReason();
                  if (reason) review({ action: "mm_adminReview", requestId: q.requestId, approve: false, reason }, "اترفض");
                  else if (reason === "") window.alert("اكتب سبب الرفض");
                }}
              >
                رفض
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ===================== منيو وخصومات ===================== */
function MenuDiscounts({ password }) {
  const [partners, setPartners] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [items, setItems] = useState([]);
  const [edits, setEdits] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api({ action: "mm_adminGetPartners", password }).then((r) => (r.success ? setPartners(r.partners || []) : setError(r.error || "")));
  }, [password]);

  const loadItems = useCallback(
    async (id) => {
      setStoreId(id);
      setItems([]);
      setEdits({});
      if (!id) return;
      const r = await api({ action: "mm_adminGetStoreItems", password, storeId: id });
      if (r.success) setItems(r.items || []);
      else setError(r.error || "");
    },
    [password]
  );

  const save = async () => {
    const updates = Object.keys(edits).map((itemId) => ({ itemId, discountPercent: Number(edits[itemId]) }));
    if (!updates.length) return;
    setError("");
    const r = await api({ action: "mm_adminSetDiscount", password, storeId, updates });
    if (!r.success) setError(r.error || "فشل");
    else {
      setNotice("الخصومات اتحفظت");
      await loadItems(storeId);
    }
  };

  return (
    <>
      <Msg error={error} notice={notice} />
      <select className="adx-input" value={storeId} onChange={(e) => loadItems(e.target.value)}>
        <option value="">اختار المحل</option>
        {partners.map((p) => (
          <option key={p.restaurantId} value={p.storeId}>
            {p.name}
          </option>
        ))}
      </select>
      {items.map((it) => {
        const val = edits[it.itemId] !== undefined ? edits[it.itemId] : it.discountPercent || 0;
        return (
          <div className="adx-card" key={it.itemId}>
            <div className="adx-row">
              <strong>{it.name}</strong>
              <span>{it.price} ج.م</span>
            </div>
            <div className="adx-row">
              <span className="adx-muted">
                بعد الخصم: {Math.round(it.price * (1 - Number(val) / 100) * 100) / 100} ج.م {it.available ? "" : "• غير متاح"}
              </span>
              <label>
                خصم %{" "}
                <input
                  className="adx-num"
                  type="number"
                  min="0"
                  max="100"
                  value={val}
                  onChange={(e) => setEdits({ ...edits, [it.itemId]: e.target.value })}
                />
              </label>
            </div>
          </div>
        );
      })}
      {Object.keys(edits).length > 0 && (
        <button className="adx-sticky" onClick={save}>
          حفظ {Object.keys(edits).length} تعديل
        </button>
      )}
    </>
  );
}

/* ===================== نقاط وباقات وتوصيل ===================== */
function PointsAndDelivery({ password }) {
  const [packages, setPackages] = useState([]);
  const [stores, setStores] = useState([]);
  const [partners, setPartners] = useState([]);
  const [storeEdits, setStoreEdits] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const [pk, st, pa] = await Promise.all([
      api({ action: "pts_adminGetPackages", password }),
      api({ action: "pts_adminGetStores", password }),
      api({ action: "mm_adminGetPartners", password }),
    ]);
    if (pk.success) setPackages(pk.packages || []);
    if (st.success) setStores(st.stores || []);
    if (pa.success) setPartners(pa.partners || []);
  }, [password]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (body, okText) => {
    setError("");
    setNotice("");
    const r = await api({ password, ...body });
    if (!r.success) setError(r.error || "فشل");
    else setNotice(okText);
    await load();
  };

  const editPackage = (p) => {
    const points = window.prompt("عدد النقاط:", p ? p.points : "");
    if (points === null) return;
    const price = window.prompt("السعر بالجنيه:", p ? p.price : "");
    if (price === null) return;
    run({ action: "pts_adminSavePackage", packageId: p ? p.packageId : undefined, points: Number(points), price: Number(price), active: p ? p.active : true }, "الباقة اتحفظت");
  };

  const saveStorePoints = () => {
    const updates = Object.keys(storeEdits).map((storeId) => ({ storeId, pointsRequired: Number(storeEdits[storeId]) }));
    run({ action: "pts_adminSetStorePoints", updates }, "نقاط المحلات اتحفظت").then(() => setStoreEdits({}));
  };

  return (
    <>
      <Msg error={error} notice={notice} />
      <h3>باقات النقاط</h3>
      {packages.map((p) => (
        <div className="adx-card adx-row" key={p.packageId}>
          <span>
            {p.points} نقطة = {p.price} ج.م {p.active ? "" : "(موقوفة)"}
          </span>
          <span className="adx-actions">
            <button onClick={() => editPackage(p)}>تعديل</button>
            <button className="adx-gray" onClick={() => run({ action: "pts_adminSavePackage", packageId: p.packageId, points: p.points, price: p.price, active: !p.active }, "اتغيرت الحالة")}>
              {p.active ? "إيقاف" : "تفعيل"}
            </button>
            <button
              className="adx-danger"
              onClick={() => window.confirm("حذف الباقة؟") && run({ action: "pts_adminDeletePackage", packageId: p.packageId }, "اتحذفت")}
            >
              حذف
            </button>
          </span>
        </div>
      ))}
      <button onClick={() => editPackage(null)}>+ باقة جديدة</button>

      <h3>النقاط المطلوبة لكل محل</h3>
      <p className="adx-muted">0 = الخصم شغال من غير نقاط.</p>
      {stores.map((s) => (
        <div className="adx-card adx-row" key={s.storeId}>
          <span>{s.name}</span>
          <input
            className="adx-num"
            type="number"
            min="0"
            value={storeEdits[s.storeId] !== undefined ? storeEdits[s.storeId] : s.pointsRequired}
            onChange={(e) => setStoreEdits({ ...storeEdits, [s.storeId]: e.target.value })}
          />
        </div>
      ))}
      {Object.keys(storeEdits).length > 0 && <button onClick={saveStorePoints}>حفظ نقاط المحلات</button>}

      <h3>التوصيل (مطاعم وكافيهات بس)</h3>
      {partners.map((p) => (
        <label className="adx-card adx-row" key={p.restaurantId}>
          <span>{p.name}</span>
          <input
            type="checkbox"
            checked={!!p.deliveryEnabled}
            onChange={(e) => {
              const enabled = e.target.checked;
              setPartners((prev) => prev.map((x) => (x.restaurantId === p.restaurantId ? { ...x, deliveryEnabled: enabled } : x)));
              run({ action: "mm_adminSetDelivery", updates: [{ storeId: p.storeId, enabled }] }, "اتحدّث");
            }}
          />
        </label>
      ))}
    </>
  );
}

/* ===================== الدليفري لايف ===================== */
const STATE_TEXT = { online: "🟢 أونلاين", stale: "🟡 متأخر", offline: "🔴 مقطوع" };

function LiveDrivers({ password }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [sel, setSel] = useState(null);

  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      try {
        const r = await api({ action: "tr_adminLive", password });
        if (stopped) return;
        if (r.success) {
          setData(r);
          setError("");
        } else setError(r.error || "فشل");
      } catch {
        setError("مشكلة في الاتصال");
      }
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [password]);

  const drivers = data ? data.drivers : [];
  const chosen = drivers.find((d) => d.phone === sel) || drivers.find((d) => d.lat !== null);
  let map = null;
  if (chosen && chosen.lat !== null) {
    const d = 0.01;
    map = `https://www.openstreetmap.org/export/embed.html?bbox=${chosen.lng - d},${chosen.lat - d},${chosen.lng + d},${chosen.lat + d}&layer=mapnik&marker=${chosen.lat},${chosen.lng}`;
  }

  return (
    <>
      {error && <p className="adx-error">{error}</p>}
      {data && (
        <p className="adx-muted">
          أونلاين {data.counts.online} • متأخر {data.counts.stale} • مقطوع {data.counts.offline} (بيتحدّث كل 10 ثواني)
        </p>
      )}
      {map && <iframe className="adx-map" title="الدليفري" src={map} />}
      {drivers.map((d) => (
        <div className={`adx-card ${chosen && chosen.phone === d.phone ? "adx-sel" : ""}`} key={d.phone} onClick={() => setSel(d.phone)}>
          <div className="adx-row">
            <strong>{d.name}</strong>{d.onDuty ? <span className="adm-duty"> 🟢 في الشيفت</span> : <span className="adm-duty off"> ⚪ برّه الشيفت</span>}
            <span>{STATE_TEXT[d.state] || d.state}</span>
          </div>
          <div className="adx-muted">
            {d.phone} • {d.vehicle} • {d.ageSec === null ? "مفيش مكان" : `من ${d.ageSec} ثانية`}
            {d.battery !== null && d.battery !== undefined && d.battery !== "" && ` • بطارية ${d.battery}%`}
            {d.appState && ` • ${d.appState}`}
          </div>
          {d.orderId ? <div className="adx-box">معاه أوردر {d.orderId} ({d.orderStatus})</div> : <div className="adx-muted">فاضي</div>}
          {d.mapsUrl && (
            <a href={d.mapsUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              افتح على الخريطة
            </a>
          )}
        </div>
      ))}
      {data && drivers.length === 0 && <p className="adx-muted">مفيش دليفري مفعّل.</p>}
    </>
  );
}

/* ===================== الواجهة الرئيسية ===================== */


// ===== إضافة مطعم/محل مباشرة + التحكم في ظهوره في الموقع =====
function AddPartnerForm({ password, onDone, onCreated }) {
  const empty = { restaurantName: "", ownerName: "", phone: "", category: "مطاعم", username: "", restaurantPassword: "", description: "", address: "", logoUrl: "", storeKey: "" };
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [err, setErr] = useState("");
  const pickLogo = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setLogoBusy(true);
    setErr("");
    try {
      const url = await uploadImage(file, { password }, "logo");
      setF((p) => ({ ...p, logoUrl: url }));
    } catch (er) {
      setErr(er.message || "فشل رفع اللوجو");
    } finally {
      setLogoBusy(false);
    }
  };
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const genPass = () => setF((p) => ({ ...p, restaurantPassword: Math.random().toString(36).slice(2, 6) + Math.floor(1000 + Math.random() * 9000) }));

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      const r = await api({ action: "sd_adminAddPartner", password, ...f });
      if (r.success) {
        setF(empty);
        setOpen(false);
        onCreated(r);
        onDone();
      } else setErr(r.error || "حصل خطأ");
    } catch {
      setErr("مشكلة في الاتصال");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return <div className="adx"><button style={{ width: "100%" }} onClick={() => setOpen(true)}>➕ إضافة مطعم / محل جديد</button></div>;
  return (
    <div className="adx adx-box adx-addform">
      <h4>➕ إضافة محل جديد</h4>
      <input placeholder="اسم المحل *" value={f.restaurantName} onChange={set("restaurantName")} />
      <input placeholder="اسم صاحب المحل *" value={f.ownerName} onChange={set("ownerName")} />
      <input placeholder="رقم الموبايل (واتساب) *" inputMode="tel" value={f.phone} onChange={set("phone")} />
      <select value={f.category} onChange={set("category")}>
        {["مطاعم", "كافيهات", "ملابس رجالي", "ملابس حريمي", "ملابس أطفال", "أحذية", "محلات كلاسيك", "إكسسوارات وعطور", "ميكب", "نظارات", "جيم", "أدوات رياضية", "سوبر ماركت", "أكاديمية كورسات"].map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input placeholder="اليوزر نيم * (إنجليزي بدون مسافات)" value={f.username} onChange={set("username")} />
      <div className="adx-inline">
        <input placeholder="الباسورد * (6 حروف على الأقل)" value={f.restaurantPassword} onChange={set("restaurantPassword")} />
        <button type="button" className="adx-small" onClick={genPass}>🎲 توليد</button>
      </div>
      <input placeholder="وصف قصير (اختياري)" value={f.description} onChange={set("description")} />
      <input placeholder="العنوان (اختياري)" value={f.address} onChange={set("address")} />
      <label className="adx-upload">
        🖼️ {logoBusy ? "جارٍ رفع اللوجو..." : f.logoUrl ? "تغيير اللوجو" : "رفع لوجو (اختياري)"}
        <input type="file" accept="image/*" hidden disabled={logoBusy} onChange={pickLogo} />
      </label>
      {f.logoUrl && <img className="adx-logo-prev" src={assetUrl(f.logoUrl)} alt="" />}
      <input placeholder="مفتاح المنيو (اختياري - لو سبته هيتعمل تلقائي)" value={f.storeKey} onChange={set("storeKey")} />
      <small className="adx-muted">التوصيل بيتفعّل تلقائي للمطاعم والكافيهات بس. المحل هيظهر في الموقع فوراً.</small>
      {err && <p className="adx-error">{err}</p>}
      <div className="adx-inline">
        <button className="" disabled={busy || logoBusy} onClick={submit}>{busy ? "جارٍ الحفظ..." : "حفظ وإنشاء الحساب"}</button>
        <button className="adx-small adx-gray" disabled={busy} onClick={() => setOpen(false)}>إلغاء</button>
      </div>
    </div>
  );
}

function PartnerControls({ password, acc, onDone }) {
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ description: acc.description || "", address: acc.address || "" });
  const [listed, setListed] = useState(!!acc.listed);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const changeLogo = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      await uploadImage(file, { password, restaurantId: acc.restaurantId }, "logo");
      onDone();
    } catch (er) {
      setErr(er.message || "فشل رفع اللوجو");
    } finally {
      setBusy(false);
    }
  };

  const update = async (patch) => {
    setBusy(true);
    setErr("");
    try {
      const r = await api({ action: "sd_adminUpdateAccount", password, restaurantId: acc.restaurantId, ...patch });
      if (r.success) {
        setEdit(false);
        onDone();
      } else {
        setErr(r.error || "حصل خطأ");
        setListed(!!acc.listed);
      }
    } catch {
      setErr("مشكلة في الاتصال");
      setListed(!!acc.listed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adx adx-controls">
      <label className="adx-check">
        <input type="checkbox" style={{ width: 20, height: 20 }} checked={listed} disabled={busy} onChange={(e) => { setListed(e.target.checked); update({ listed: e.target.checked }); }} />
        ظاهر في الموقع للعملاء
      </label>
      <div className="adx-inline">
        <button className="adx-small" disabled={busy} onClick={() => update({ status: acc.status === "active" ? "suspended" : "active" })}>
          {acc.status === "active" ? "⏸ إيقاف الحساب" : "▶️ تفعيل الحساب"}
        </button>
        <button className="adx-small adx-gray" onClick={() => setEdit((v) => !v)}>✏️ تعديل البيانات</button>
      </div>
      {edit && (
        <div className="adx-addform">
          <input placeholder="وصف" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <input placeholder="العنوان" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
          {acc.logoUrl && <img className="adx-logo-prev" src={assetUrl(acc.logoUrl)} alt="" />}
          <label className="adx-upload">
            🖼️ {busy ? "جارٍ الرفع..." : acc.logoUrl ? "تغيير اللوجو" : "رفع لوجو"}
            <input type="file" accept="image/*" hidden disabled={busy} onChange={changeLogo} />
          </label>
          <button className="adx-small" disabled={busy} onClick={() => update({ description: f.description, address: f.address })}>حفظ</button>
        </div>
      )}
      {err && <p className="adx-error">{err}</p>}
    </div>
  );
}


// إيقاف / تفعيل حساب دليفري
function DriverStatusButton({ password, acc, onDone }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const toggle = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await api({ action: "sd_adminSetDeliveryStatus", password, deliveryId: acc.deliveryId, status: acc.status === "active" ? "suspended" : "active" });
      if (r.success) onDone();
      else setErr(r.error || "حصل خطأ");
    } catch {
      setErr("مشكلة في الاتصال");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="adx adx-controls">
      <button className="adx-small" disabled={busy} onClick={toggle}>
        {acc.status === "active" ? "⏸ إيقاف الحساب" : "▶️ تفعيل الحساب"}
      </button>
      {err && <p className="adx-error">{err}</p>}
    </div>
  );
}


// ===== التحكم في ظهور المحلات للعملاء =====
// كل محل له حالة من 3:
//   home      = ⭐ الرئيسية + العملاء (يظهر في الصفحة الأولى وفي صفحة المحلات وعند اختيار القسم)
//   customers = 👥 العملاء فقط (يظهر في صفحة المحلات وعند اختيار القسم، من غير الصفحة الأولى)
//   hidden    = 🚫 مخفي (مبيظهرش للعميل، لكن بيفضل هنا وتقدر ترجّعه في أي وقت)
const VIS_STATES = [
  { key: "home", label: "⭐ الرئيسية", patch: { visible: true, home: true } },
  { key: "customers", label: "👥 العملاء فقط", patch: { visible: true, home: false } },
  { key: "hidden", label: "🚫 مخفي", patch: { visible: false } },
];

function StoresVisibility({ password }) {
  const [list, setList] = useState([]);
  const [vis, setVis] = useState({});
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const catName = (s) => (s.category_ids || []).map((id) => (categories.find((c) => c.id === id) || {}).name).filter(Boolean).join(" + ");

  const load = useCallback(async () => {
    setError("");
    try {
      await loadDynamicStores(); // يضيف المحلات اللي من الشيت للقايمة
      setList(shops.map((s) => ({ id: String(s.id), name: String(s.name || "").trim(), cat: catName(s), dynamic: !!s.dynamic })));
      const r = await api({ action: "sd_adminGetVisibility", password });
      if (r.success) setVis(r.visibility || {});
      else setError(r.error || "مقدرناش نحمّل الإعدادات");
    } catch {
      setError("مشكلة في الاتصال");
    }
  }, [password]);

  useEffect(() => {
    load();
  }, [load]);

  const stateOf = (id) => {
    const v = vis[id] || {};
    if (v.visible === false) return "hidden";
    return v.home === false ? "customers" : "home";
  };

  const apply = async (updates, okMsg) => {
    if (!updates.length) return;
    setBusy(true);
    setError("");
    setNotice("");
    const prev = vis;
    const next = { ...vis };
    updates.forEach((u) => {
      const cur = vis[u.storeId] || {};
      next[u.storeId] = {
        visible: u.visible === undefined ? cur.visible !== false : u.visible,
        home: u.home === undefined ? cur.home !== false : u.home,
      };
    });
    setVis(next); // تحديث فوري على الشاشة
    try {
      const r = await api({ action: "sd_adminSetVisibility", password, updates });
      if (r.success) {
        setVis(r.visibility || next);
        setNotice(okMsg || "اتحفظ ✅");
        loadDynamicStores();
      } else {
        setVis(prev);
        setError(r.error || "فشل الحفظ");
      }
    } catch {
      setVis(prev);
      setError("مشكلة في الاتصال");
    } finally {
      setBusy(false);
    }
  };

  const counts = { all: list.length, home: 0, customers: 0, hidden: 0 };
  list.forEach((s) => { counts[stateOf(s.id)] += 1; });

  const shown = list.filter(
    (s) =>
      (filter === "all" || stateOf(s.id) === filter) &&
      (!q.trim() || (s.name + " " + s.cat).toLowerCase().includes(q.trim().toLowerCase()))
  );
  const pack = (items, patch) => items.map((s) => ({ storeId: s.id, name: s.name, ...patch }));
  const chips = [{ key: "all", label: "الكل" }, ...VIS_STATES.map((st) => ({ key: st.key, label: st.label }))];

  return (
    <div>
      <Msg error={error} notice={notice} />
      <p className="adx-muted">
        ⭐ الرئيسية: يظهر في الصفحة الأولى + صفحة المحلات + القسم • 👥 العملاء فقط: صفحة المحلات والقسم بس • 🚫 مخفي: مبيظهرش
        للعميل لكن بيفضل هنا وترجّعه في أي وقت.
      </p>
      <div className="adx-actions">
        {chips.map((c) => (
          <button key={c.key} className={filter === c.key ? "" : "adx-gray"} onClick={() => setFilter(c.key)}>
            {c.label} ({counts[c.key]})
          </button>
        ))}
      </div>
      <input className="adx-input" placeholder="🔍 ابحث باسم المحل أو القسم" value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="adx-muted">تطبيق على المعروض ({shown.length}):</p>
      <div className="adx-actions">
        {VIS_STATES.map((st) => (
          <button key={st.key} disabled={busy || !shown.length} className="adx-gray" onClick={() => apply(pack(shown, st.patch), "اتحدّثوا ✅")}>
            كلهم {st.label}
          </button>
        ))}
      </div>
      {shown.map((s) => {
        const cur = stateOf(s.id);
        return (
          <div className="adx-card" key={s.id}>
            <div className="adx-row">
              <strong>{s.name}</strong>
              <span className="adx-muted">{s.cat}{s.dynamic ? " • من الأدمن" : ""}</span>
            </div>
            <div className="adx-actions">
              {VIS_STATES.map((st) => (
                <button
                  key={st.key}
                  type="button"
                  disabled={busy}
                  className={cur === st.key ? "" : "adx-gray"}
                  aria-pressed={cur === st.key}
                  onClick={() => cur !== st.key && apply(pack([s], st.patch))}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {shown.length === 0 && <p className="adx-muted">مفيش نتايج</p>}
    </div>
  );
}

// إضافة دليفري مباشرة من الأدمن
function AddDriverForm({ password, onDone, onCreated }) {
  const empty = { name: "", phone: "", vehicleType: "موتوسيكل", region: "طنطا", driverPassword: "" };
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const genPass = () => setF((p) => ({ ...p, driverPassword: Math.random().toString(36).slice(2, 7) + Math.floor(1000 + Math.random() * 9000) }));

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      const r = await api({ action: "sd_adminAddDriver", password, ...f });
      if (r.success) {
        setF(empty);
        setOpen(false);
        onCreated(r);
        onDone();
      } else setErr(r.error || "حصل خطأ");
    } catch {
      setErr("مشكلة في الاتصال");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return <div className="adx"><button style={{ width: "100%" }} onClick={() => setOpen(true)}>➕ إضافة دليفري جديد</button></div>;
  return (
    <div className="adx adx-box adx-addform">
      <h4>➕ إضافة دليفري</h4>
      <input placeholder="اسم الدليفري *" value={f.name} onChange={set("name")} />
      <input placeholder="رقم الموبايل * (هو اللي بيدخل بيه)" inputMode="tel" value={f.phone} onChange={set("phone")} />
      <select value={f.vehicleType} onChange={set("vehicleType")}>
        {["موتوسيكل", "عجلة", "سيارة", "توك توك"].map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
      <input placeholder="المنطقة" value={f.region} onChange={set("region")} />
      <div className="adx-inline">
        <input placeholder="الباسورد * (8 حروف ورقم على الأقل)" value={f.driverPassword} onChange={set("driverPassword")} />
        <button type="button" className="adx-small" onClick={genPass}>🎲 توليد</button>
      </div>
      {err && <p className="adx-error">{err}</p>}
      <div className="adx-inline">
        <button disabled={busy} onClick={submit}>{busy ? "جارٍ الحفظ..." : "حفظ وإنشاء الحساب"}</button>
        <button className="adx-small adx-gray" disabled={busy} onClick={() => setOpen(false)}>إلغاء</button>
      </div>
    </div>
  );
}

// ===== معاينة الموقع: شوف الرئيسية والأقسام زي ما العميل بيشوفها =====
function SitePreview() {
  const [view, setView] = useState("home"); // home = الرئيسية | cats = الأقسام
  const [catId, setCatId] = useState(categories[0] ? categories[0].id : 1);
  const [busy, setBusy] = useState(false);
  const [, bump] = useState(0);
  const refresh = async () => {
    setBusy(true);
    await loadDynamicStores();
    bump((v) => v + 1);
    setBusy(false);
  };
  useEffect(() => { refresh(); }, []);

  const list = view === "home"
    ? shops.filter(isOnHome)
    : shops.filter((s) => isVisible(s) && (s.category_ids || []).includes(Number(catId)));
  const hiddenCount = shops.filter((s) => !isVisible(s)).length;
  const logoOf = (s) => (s.logos && s.logos[0]) || s.logoUrl || "";

  return (
    <div>
      <div className="adm-pv-bar">
        <button className={view === "home" ? "on" : ""} onClick={() => setView("home")}>🏠 الرئيسية</button>
        <button className={view === "cats" ? "on" : ""} onClick={() => setView("cats")}>🗂️ الأقسام</button>
        <button onClick={refresh} disabled={busy}>{busy ? "..." : "🔄 تحديث"}</button>
      </div>
      {view === "cats" && (
        <div className="adm-pv-chips">
          {categories.map((c) => (
            <button key={c.id} className={Number(catId) === c.id ? "on" : ""} onClick={() => setCatId(c.id)}>{c.name}</button>
          ))}
        </div>
      )}
      <p className="adx-muted">
        {list.length} محل ظاهر {view === "home" ? "في الرئيسية" : "في القسم"} • {hiddenCount} مخفي عن العملاء
      </p>
      <div className="adm-pv-grid">
        {list.map((s) => (
          <div className="adm-pv-card" key={s.id}>
            {logoOf(s) ? <img src={assetUrl(logoOf(s))} alt="" /> : <div className="adm-pv-noimg">🏪</div>}
            <b>{s.name}</b>
            {s.percentage && <span className="adm-pv-pct">{s.percentage} OFF</span>}
            <small>
              {isOnHome(s) ? "🏠 رئيسية" : "👥 عملاء فقط"}
              {s.deliveryEnabled === false ? "" : s.dynamic || s.menuKey ? " • 🛵 توصيل" : ""}
            </small>
          </div>
        ))}
      </div>
      {list.length === 0 && <p style={{ textAlign: "center" }}>مفيش محلات هنا</p>}
      <a className="adm-btn adm-open" style={{ textDecoration: "none" }} href="/" target="_blank" rel="noopener noreferrer">🌐 افتح الموقع الحقيقي</a>
    </div>
  );
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [tab, setTab] = useState("reviews");
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [partnerRequests, setPartnerRequests] = useState([]);
  const [restaurantAccounts, setRestaurantAccounts] = useState([]);
  const [deliveryRequests, setDeliveryRequests] = useState([]);
  const [deliveryAccounts, setDeliveryAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvedInfo, setApprovedInfo] = useState(null);
  const [accountsError, setAccountsError] = useState("");
  const [approvedDeliveryInfo, setApprovedDeliveryInfo] = useState(null);
  const [detail, setDetail] = useState(null); // { kind: "restaurant"|"driver"|"customer", data }

  // عدّاد المراجعات (بيتحدّث كل 20 ثانية وبينبهك بصوت لما يزيد)
  const pending = useAdminPending(authenticated ? password : "");
  useEffect(() => {
    if (!authenticated) return;
    try {
      if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
    } catch {
      /* ignore */
    }
  }, [authenticated]);

  // بيانات اليوزر/الباسورد اللي بيكتبها الأدمن لكل طلب شراكة (keyed بـ rowIndex)
  const [approveForms, setApproveForms] = useState({});
  const [approvingRow, setApprovingRow] = useState(null);
  const [approvingDeliveryRow, setApprovingDeliveryRow] = useState(null);

  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    type: "general",
    targetPhone: "",
    startDate: "",
    expiryDate: "",
  });
  const [offerCreating, setOfferCreating] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminLogin", password }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
      } else {
        setLoginError(data.error || "باسورد غلط");
      }
    } catch (err) {
      setLoginError("مشكلة في الاتصال");
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminGetOrders", password }),
      });
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminGetUsers", password }),
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminGetOffers", password }),
      });
      const data = await res.json();
      if (data.success) setOffers(data.offers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartnerRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminGetPartnerRequests", password }),
      });
      const data = await res.json();
      if (data.success) setPartnerRequests(data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminGetRestaurantAccounts", password }),
      });
      const data = await res.json();
      if (data.success) {
        setRestaurantAccounts(data.accounts);
        setAccountsError("");
      } else setAccountsError(data.error || "مقدرناش نحمّل الحسابات");
    } catch (err) {
      console.error(err);
      setAccountsError("مشكلة في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminGetDeliveryRequests", password }),
      });
      const data = await res.json();
      if (data.success) setDeliveryRequests(data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminGetDeliveryAccounts", password }),
      });
      const data = await res.json();
      if (data.success) {
        setDeliveryAccounts(data.accounts);
        setAccountsError("");
      } else setAccountsError(data.error || "مقدرناش نحمّل الحسابات");
    } catch (err) {
      console.error(err);
      setAccountsError("مشكلة في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    if (tab === "orders") fetchOrders();
    if (tab === "users") fetchUsers();
    if (tab === "offers") fetchOffers();
    if (tab === "partners") {
      fetchPartnerRequests();
      fetchRestaurantAccounts();
    }
    if (tab === "delivery") {
      fetchDeliveryRequests();
      fetchDeliveryAccounts();
    }
  }, [authenticated, tab]);

  const handleStatusChange = async (rowIndex, newStatus) => {
    setOrders((prev) => prev.map((o) => (o.rowIndex === rowIndex ? { ...o, status: newStatus } : o)));
    try {
      await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminUpdateOrderStatus", password, rowIndex, newStatus }),
      });
    } catch (err) {
      console.error("فشل تحديث الحالة:", err);
    }
  };

  const handleOfferFormChange = (e) => {
    setOfferForm({ ...offerForm, [e.target.name]: e.target.value });
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    setOfferCreating(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminCreateOffer", password, ...offerForm }),
      });
      const data = await res.json();
      if (data.success) {
        setOfferForm({ title: "", description: "", type: "general", targetPhone: "", startDate: "", expiryDate: "" });
        fetchOffers();
      } else {
        alert(data.error || "حصل خطأ");
      }
    } catch (err) {
      alert("مشكلة في الاتصال");
    } finally {
      setOfferCreating(false);
    }
  };

  const handleToggleOffer = async (rowIndex, currentActive) => {
    const newActive = !(currentActive === true || currentActive === "TRUE");
    setOffers((prev) => prev.map((o) => (o.rowIndex === rowIndex ? { ...o, active: newActive } : o)));
    try {
      await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminToggleOffer", password, rowIndex, active: newActive }),
      });
    } catch (err) {
      console.error("فشل تحديث العرض:", err);
    }
  };

  const handleApproveFormChange = (rowIndex, field, value) => {
    setApproveForms((prev) => ({
      ...prev,
      [rowIndex]: { ...prev[rowIndex], [field]: value },
    }));
  };

  const handleApprovePartner = async (rowIndex) => {
    const form = approveForms[rowIndex] || {};
    const username = (form.username || "").trim();
    const restaurantPassword = (form.password || "").trim();

    if (!username || !restaurantPassword) {
      alert("من فضلك اكتب اليوزر نيم والباسورد الأول");
      return;
    }

    setApprovingRow(rowIndex);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "adminApprovePartner",
          password,
          rowIndex,
          username,
          restaurantPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApprovedInfo(data);
        setApproveForms((prev) => {
          const next = { ...prev };
          delete next[rowIndex];
          return next;
        });
        fetchPartnerRequests();
        fetchRestaurantAccounts();
      } else {
        alert(data.error || "حصل خطأ");
      }
    } catch (err) {
      alert("مشكلة في الاتصال");
    } finally {
      setApprovingRow(null);
    }
  };

  const handleRejectPartner = async (rowIndex) => {
    setPartnerRequests((prev) => prev.map((r) => (r.rowIndex === rowIndex ? { ...r, status: "rejected" } : r)));
    try {
      await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminRejectPartner", password, rowIndex }),
      });
    } catch (err) {
      console.error("فشل الرفض:", err);
    }
  };

  // الدليفري بالفعل حاطط الباسورد بتاعه وقت التسجيل، فالأدمن هنا بس بيوافق أو يرفض
  const handleApproveDelivery = async (rowIndex) => {
    setApprovingDeliveryRow(rowIndex);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminApproveDelivery", password, rowIndex }),
      });
      const data = await res.json();
      if (data.success) {
        setApprovedDeliveryInfo(data);
        fetchDeliveryRequests();
        fetchDeliveryAccounts();
      } else {
        alert(data.error || "حصل خطأ");
      }
    } catch (err) {
      alert("مشكلة في الاتصال");
    } finally {
      setApprovingDeliveryRow(null);
    }
  };

  const handleRejectDelivery = async (rowIndex) => {
    setDeliveryRequests((prev) => prev.map((r) => (r.rowIndex === rowIndex ? { ...r, status: "rejected" } : r)));
    try {
      await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminRejectDelivery", password, rowIndex }),
      });
    } catch (err) {
      console.error("فشل الرفض:", err);
    }
  };

  if (!authenticated) {
    return (
      <div className="admin-login-container">
        <form onSubmit={handleLogin} className="admin-login-form">
          <h2>🔒 دخول الأدمن</h2>
          <input
            type="password"
            placeholder="الباسورد"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loginLoading}>
            {loginLoading ? "جارٍ التحقق..." : "دخول"}
          </button>
          {loginError && <p style={{ color: "red" }}>{loginError}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <h2>لوحة التحكم</h2>
        <button
          type="button"
          className="admin-logout-btn"
          onClick={() => {
            setAuthenticated(false);
            setPassword("");
          }}
        >
          خروج
        </button>
      </div>

      <div className="admin-tabs">
        <button className={tab === "reviews" ? "admin-tab active" : "admin-tab"} onClick={() => setTab("reviews")}>
          ✅ مراجعات
          {pending && pending.total > 0 && <span className="adx-badge">{pending.total}</span>}
        </button>
        <button className={tab === "partners" ? "admin-tab active" : "admin-tab"} onClick={() => setTab("partners")}>
          🤝 الشركاء
        </button>
        <button className={tab === "delivery" ? "admin-tab active" : "admin-tab"} onClick={() => setTab("delivery")}>
          🛵 الدليفري
        </button>
        <button className={tab === "users" ? "admin-tab active" : "admin-tab"} onClick={() => setTab("users")}>
          👤 العملاء
        </button>
        <button className={tab === "orders" ? "admin-tab active" : "admin-tab"} onClick={() => setTab("orders")}>
          📦 الأوردرات
        </button>
        <button className={tab === "live" ? "admin-tab active" : "admin-tab"} onClick={() => setTab("live")}>
          📍 لايف
        </button>
        <button className={tab === "offers" ? "admin-tab active" : "admin-tab"} onClick={() => setTab("offers")}>
          🎟️ العروض
        </button>
        <button className={tab === "settings" ? "admin-tab active" : "admin-tab"} onClick={() => setTab("settings")}>
          ⚙️ إعدادات
        </button>
        <button className={tab === "preview" ? "admin-tab active" : "admin-tab"} onClick={() => setTab("preview")}>
          👁️ معاينة الموقع
        </button>
      </div>

      {tab === "reviews" && (
        <div className="adx">
          {pending && (
            <p className="adx-muted">
              دفع أوردرات {pending.orderPayments} • شراء نقاط {pending.purchases} • استرداد {pending.refunds} • منيو {pending.menuRequests}
            </p>
          )}
          <Reviews password={password} />
        </div>
      )}
      {tab === "preview" && <div className="adx"><SitePreview /></div>}
      {tab === "settings" && (
        <div className="adx">
          <h3>⭐ باقات النقاط وتوصيل المطاعم</h3>
          <PointsAndDelivery password={password} />
          <h3 style={{ marginTop: 24 }}>🏬 المحلات اللي في الكود (ظهور فقط)</h3>
          <StoresVisibility password={password} />
          <h3 style={{ marginTop: 24 }}>🍔 خصم الأصناف (سريع)</h3>
          <MenuDiscounts password={password} />
          <ChangeLog password={password} />
        </div>
      )}
      {tab === "live" && <div className="adx"><LiveDrivers password={password} /></div>}
      {detail && detail.kind === "restaurant" && (
        <RestaurantDetail key={detail.data.restaurantId} password={password} acc={detail.data} onClose={() => setDetail(null)} onChanged={() => { fetchRestaurantAccounts(); loadDynamicStores(); }} />
      )}
      {detail && detail.kind === "driver" && (
        <DriverDetail key={detail.data.deliveryId} password={password} acc={detail.data} onClose={() => setDetail(null)} onChanged={fetchDeliveryAccounts} />
      )}
      {detail && detail.kind === "customer" && (
        <CustomerDetail key={detail.data.phone} password={password} phone={String(detail.data.phone)} onClose={() => setDetail(null)} onChanged={fetchUsers} />
      )}

      {loading && <p style={{ textAlign: "center" }}>جارٍ التحميل...</p>}

      {tab === "orders" && !loading && (
        <div className="admin-list">
          {orders.length === 0 && <p style={{ textAlign: "center" }}>مفيش أوردرات</p>}
          {orders.map((order) => (
            <div key={order.rowIndex} className="admin-card">
              <div className="admin-card-header">
                <strong>{order.storeName || "طلب"}</strong>
                <span>{order.total} ج.م</span>
              </div>
              <div className="admin-card-body">
                <span>{order.customerName} - {order.customerPhone}</span>
                <span>{order.address}</span>
                <span>{new Date(order.timestamp).toLocaleString("ar-EG")}</span>
              </div>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order.rowIndex, e.target.value)}
                className="admin-status-select"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && !loading && (
        <div className="admin-list">
          {users.length === 0 && <p style={{ textAlign: "center" }}>مفيش مستخدمين</p>}
          {users.map((u, idx) => (
            <div key={idx} className="admin-card">
              <div className="admin-card-header">
                <strong>{u.name}</strong>
                <span>⭐ {u.points}</span>
              </div>
              <div className="admin-card-body">
                <span>{u.phone}</span>
                <span>سجل في: {new Date(u.registeredAt).toLocaleDateString("ar-EG")}</span>
              </div>
              <button className="adm-btn adm-open" onClick={() => setDetail({ kind: "customer", data: u })}>📂 فتح بيانات العميل</button>
            </div>
          ))}
        </div>
      )}

      {tab === "offers" && (
        <>
          <form onSubmit={handleCreateOffer} className="admin-offer-form">
            <h3>➕ إضافة عرض جديد</h3>
            <input
              type="text"
              name="title"
              placeholder="عنوان العرض"
              value={offerForm.title}
              onChange={handleOfferFormChange}
              required
            />
            <textarea
              name="description"
              placeholder="وصف قصير للعرض"
              value={offerForm.description}
              onChange={handleOfferFormChange}
              required
            />
            <select name="type" value={offerForm.type} onChange={handleOfferFormChange}>
              <option value="general">عرض عام (لكل الزوار)</option>
              <option value="personal">عرض شخصي (رقم معين)</option>
            </select>
            {offerForm.type === "personal" && (
              <input
                type="tel"
                name="targetPhone"
                placeholder="رقم الموبايل المستهدف"
                value={offerForm.targetPhone}
                onChange={handleOfferFormChange}
                required
              />
            )}
            <label className="admin-offer-label">تاريخ بداية العرض</label>
            <input
              type="date"
              name="startDate"
              value={offerForm.startDate}
              onChange={handleOfferFormChange}
              required
            />
            <label className="admin-offer-label">تاريخ انتهاء العرض</label>
            <input
              type="date"
              name="expiryDate"
              value={offerForm.expiryDate}
              onChange={handleOfferFormChange}
              required
            />
            <button type="submit" disabled={offerCreating}>
              {offerCreating ? "جارٍ الإضافة..." : "إضافة العرض"}
            </button>
          </form>

          {!loading && (
            <div className="admin-list" style={{ marginTop: "20px" }}>
              {offers.length === 0 && <p style={{ textAlign: "center" }}>مفيش عروض لسه</p>}
              {offers.map((offer) => {
                const isActive = offer.active === true || offer.active === "TRUE";
                return (
                  <div key={offer.rowIndex} className="admin-card">
                    <div className="admin-card-header">
                      <strong>{offer.title}</strong>
                      <span>{offer.type === "personal" ? "🎁 شخصي" : "🌍 عام"}</span>
                    </div>
                    <div className="admin-card-body">
                      <span>{offer.description}</span>
                      {offer.targetPhone && <span>الرقم: {offer.targetPhone}</span>}
                      {offer.startDate && <span>من: {new Date(offer.startDate).toLocaleDateString("ar-EG")}</span>}
                      {offer.expiryDate && <span>لـ: {new Date(offer.expiryDate).toLocaleDateString("ar-EG")}</span>}
                    </div>
                    <button
                      className="admin-toggle-btn"
                      onClick={() => handleToggleOffer(offer.rowIndex, offer.active)}
                      style={{ background: isActive ? "#4caf50" : "#999" }}
                    >
                      {isActive ? "✅ فعال - دوس للإيقاف" : "⏸️ متوقف - دوس للتفعيل"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "partners" && !loading && (
        <>
          <AddPartnerForm
            password={password}
            onCreated={(r) => setApprovedInfo(r)}
            onDone={fetchRestaurantAccounts}
          />
          {approvedInfo && (
            <div className="admin-approved-box">
              <p>✅ تم إنشاء حساب شريك "{approvedInfo.restaurantName}" بنجاح!</p>
              <p><strong>اليوزر نيم:</strong> {approvedInfo.username}</p>
              <p><strong>الباسورد:</strong> {approvedInfo.restaurantPassword}</p>
              <div className="admin-approved-actions">
                <a
                  href={buildWhatsAppLink(
                    approvedInfo.phone,
                    `مرحباً ${approvedInfo.ownerName} 👋\n\nتم تفعيل حساب "${approvedInfo.restaurantName}" على VE Voucher ✅\n\nبيانات الدخول:\nاليوزر نيم: ${approvedInfo.username}\nالباسورد: ${approvedInfo.restaurantPassword}\n\nمبروك الانضمام لينا 🎉`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-whatsapp-link"
                >
                  📱 إرسال بيانات الدخول على واتساب
                </a>
                <button className="admin-close-btn" onClick={() => setApprovedInfo(null)}>إغلاق</button>
              </div>
            </div>
          )}

          <h3 style={{ margin: "10px 0" }}>📋 طلبات الشراكة</h3>
          <div className="admin-list">
            {partnerRequests.length === 0 && <p style={{ textAlign: "center" }}>مفيش طلبات</p>}
            {partnerRequests.map((req) => (
              <div key={req.rowIndex} className="admin-card">
                <div className="admin-card-header">
                  <strong>{req.restaurantName}</strong>
                  <span>{req.status === "pending" ? "⏳ قيد المراجعة" : req.status === "approved" ? "✅ مقبول" : "❌ مرفوض"}</span>
                </div>
                <div className="admin-card-body">
                  <span>صاحب النشاط: {req.ownerName}</span>
                  <span>الرقم: {req.phone}</span>
                  {req.category && <span>النشاط: {req.category}</span>}
                  <span>{new Date(req.timestamp).toLocaleString("ar-EG")}</span>
                </div>
                {req.status === "pending" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                    <input
                      type="text"
                      className="admin-partner-input"
                      placeholder="اليوزر نيم"
                      value={approveForms[req.rowIndex]?.username || ""}
                      onChange={(e) => handleApproveFormChange(req.rowIndex, "username", e.target.value)}
                    />
                    <input
                      type="text"
                      className="admin-partner-input"
                      placeholder="الباسورد"
                      value={approveForms[req.rowIndex]?.password || ""}
                      onChange={(e) => handleApproveFormChange(req.rowIndex, "password", e.target.value)}
                    />
                    <div className="admin-partner-actions">
                      <button
                        className="admin-toggle-btn"
                        style={{ background: "#4caf50" }}
                        onClick={() => handleApprovePartner(req.rowIndex)}
                        disabled={approvingRow === req.rowIndex}
                      >
                        {approvingRow === req.rowIndex ? "جارٍ الموافقة..." : "✅ موافقة"}
                      </button>
                      <button
                        className="admin-toggle-btn"
                        style={{ background: "#c62828" }}
                        onClick={() => handleRejectPartner(req.rowIndex)}
                      >
                        ❌ رفض
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <h3 style={{ margin: "20px 0 10px" }}>🏪 حسابات الشركاء النشطة</h3>
          <div className="admin-list">
            {accountsError && <p style={{ textAlign: "center", color: "#c62828" }}>⚠️ {accountsError}</p>}
            {!accountsError && restaurantAccounts.length === 0 && <p style={{ textAlign: "center" }}>مفيش حسابات لسه</p>}
            {restaurantAccounts.map((acc) => (
              <div key={acc.rowIndex} className="admin-card">
                <div className="admin-card-header">
                  <strong>{acc.logoUrl && <img className="adx-logo-mini" src={assetUrl(acc.logoUrl)} alt="" />}{acc.restaurantName}</strong>
                  <span>{acc.status === "active" ? "🟢 نشط" : "🔴 موقوف"}</span>
                </div>
                <div className="admin-card-body">
                  <span>صاحب النشاط: {acc.ownerName}</span>
                  <span>الرقم: {acc.phone}</span>
                  {acc.category && <span>النشاط: {acc.category}</span>}
                  <span>اليوزر نيم: {acc.username}</span>
                  <span>الباسورد: {acc.password}</span>
                  <span>تاريخ الإنشاء: {new Date(acc.createdAt).toLocaleDateString("ar-EG")}</span>
                  <span>مفتاح المنيو: {acc.storeId || acc.restaurantId} • التوصيل: {acc.deliveryEnabled === false ? "❌ مقفول" : "✅ شغال"}</span>
                </div>
                <button className="adm-btn adm-open" onClick={() => setDetail({ kind: "restaurant", data: acc })}>📂 فتح كل البيانات والتحكم</button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "delivery" && !loading && (
        <>
          <AddDriverForm
            password={password}
            onCreated={(r) => setApprovedDeliveryInfo(r)}
            onDone={fetchDeliveryAccounts}
          />
          {approvedDeliveryInfo && (
            <div className="admin-approved-box">
              <p>✅ تم تفعيل حساب الدليفري "{approvedDeliveryInfo.name}" بنجاح!</p>
              <p><strong>الرقم:</strong> {approvedDeliveryInfo.phone}</p>
              <p><strong>الباسورد:</strong> {approvedDeliveryInfo.password}</p>
              <div className="admin-approved-actions">
                <a
                  href={buildWhatsAppLink(
                    approvedDeliveryInfo.phone,
                    `مرحباً ${approvedDeliveryInfo.name} 👋\n\nتم تفعيل حسابك كمندوب دليفري على VE Voucher ✅\n\nبيانات الدخول:\nالرقم: ${approvedDeliveryInfo.phone}\nالباسورد: ${approvedDeliveryInfo.password}\n\nمبروك الانضمام لينا 🎉`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-whatsapp-link"
                >
                  📱 إبلاغه على واتساب
                </a>
                <button className="admin-close-btn" onClick={() => setApprovedDeliveryInfo(null)}>إغلاق</button>
              </div>
            </div>
          )}

          <h3 style={{ margin: "10px 0" }}>📋 طلبات الدليفري</h3>
          <div className="admin-list">
            {deliveryRequests.length === 0 && <p style={{ textAlign: "center" }}>مفيش طلبات</p>}
            {deliveryRequests.map((req) => (
              <div key={req.rowIndex} className="admin-card">
                <div className="admin-card-header">
                  <strong>{req.name}</strong>
                  <span>{req.status === "pending" ? "⏳ قيد المراجعة" : req.status === "approved" ? "✅ مقبول" : "❌ مرفوض"}</span>
                </div>
                <div className="admin-card-body">
                  <span>الرقم: {req.phone}</span>
                  <span>المركبة: {req.vehicleType}</span>
                  <span>المنطقة: {req.region}</span>
                  <span>{new Date(req.timestamp).toLocaleString("ar-EG")}</span>
                </div>
                {req.status === "pending" && (
                  <div className="admin-partner-actions" style={{ marginTop: "8px" }}>
                    <button
                      className="admin-toggle-btn"
                      style={{ background: "#4caf50" }}
                      onClick={() => handleApproveDelivery(req.rowIndex)}
                      disabled={approvingDeliveryRow === req.rowIndex}
                    >
                      {approvingDeliveryRow === req.rowIndex ? "جارٍ الموافقة..." : "✅ موافقة"}
                    </button>
                    <button
                      className="admin-toggle-btn"
                      style={{ background: "#c62828" }}
                      onClick={() => handleRejectDelivery(req.rowIndex)}
                    >
                      ❌ رفض
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <h3 style={{ margin: "20px 0 10px" }}>🛵 حسابات الدليفري النشطة</h3>
          <div className="admin-list">
            {accountsError && <p style={{ textAlign: "center", color: "#c62828" }}>⚠️ {accountsError}</p>}
            {!accountsError && deliveryAccounts.length === 0 && <p style={{ textAlign: "center" }}>مفيش حسابات لسه</p>}
            {deliveryAccounts.map((acc) => (
              <div key={acc.rowIndex} className="admin-card">
                <div className="admin-card-header">
                  <strong>{acc.name}</strong>
                  <span>{acc.status === "active" ? "🟢 نشط" : "🔴 موقوف"}</span>
                </div>
                <div className="admin-card-body">
                  <span>الرقم: {acc.phone}</span>
                  <span>الباسورد: {acc.password}</span>
                  <span>المركبة: {acc.vehicleType}</span>
                  <span>المنطقة: {acc.region}</span>
                  <span>تاريخ الإنشاء: {new Date(acc.createdAt).toLocaleDateString("ar-EG")}</span>
                </div>
                <button className="adm-btn adm-open" onClick={() => setDetail({ kind: "driver", data: acc })}>📂 فتح كل البيانات والتحكم</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
