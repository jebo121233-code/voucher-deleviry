// شاشات التحكم الكامل للأدمن: مطعم / دليفري / عميل
// أي تعديل بيتحفظ في الشيت على طول (وبيتسجل في تاب AdminLog).
import { useState, useEffect, useCallback } from "react";
import { CART_SCRIPT_URL } from "../data/data.js";
import { uploadImage, assetUrl } from "../data/imageUtil.js";

async function api(body) {
  const res = await fetch(CART_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  return res.json();
}

const fmt = (v) => {
  const d = new Date(v);
  return isNaN(d) ? "" : d.toLocaleString("ar-EG");
};

// هوك صغير: بينفذ طلب حفظ ويعرض ✅ أو الخطأ
function useSaver() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ ok: "", err: "" });
  const run = async (fn) => {
    setBusy(true);
    setMsg({ ok: "", err: "" });
    try {
      const r = await fn();
      if (r && r.success) {
        setMsg({ ok: "✅ اتحفظ في الشيت", err: "" });
        return r;
      }
      setMsg({ ok: "", err: (r && r.error) || "حصل خطأ" });
    } catch (e) {
      setMsg({ ok: "", err: e.message || "مشكلة في الاتصال" });
    } finally {
      setBusy(false);
    }
    return null;
  };
  return { busy, msg, run };
}

function Msg({ msg }) {
  return (
    <>
      {msg.ok && <p className="adm-ok">{msg.ok}</p>}
      {msg.err && <p className="adm-err">⚠️ {msg.err}</p>}
    </>
  );
}

function Field({ label, children }) {
  return (
    <label className="adm-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div className="adm-overlay" role="dialog">
      <div className="adm-sheet">
        <div className="adm-head">
          <strong>{title}</strong>
          <button className="adm-x" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        <div className="adm-body">{children}</div>
      </div>
    </div>
  );
}

/* ===================== المنيو ===================== */

function ItemRow({ password, storeId, item, onChanged }) {
  const [f, setF] = useState({ ...item, quantity: item.quantity === null || item.quantity === undefined ? "" : item.quantity });
  const { busy, msg, run } = useSaver();
  const [up, setUp] = useState(false);
  const isNew = !item.itemId;

  const pick = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUp(true);
    try {
      const url = await uploadImage(file, { password }, "product");
      setF((p) => ({ ...p, imageUrl: url }));
    } catch (er) {
      alert(er.message || "فشل رفع الصورة");
    } finally {
      setUp(false);
    }
  };

  const save = async () => {
    const r = await run(() =>
      api({
        action: "sd_adminSaveItem", password, storeId,
        item: { itemId: item.itemId || undefined, name: f.name, description: f.description, price: f.price, discountPercent: f.discountPercent, category: f.category, imageUrl: f.imageUrl, available: f.available, quantity: f.quantity },
      })
    );
    if (r) onChanged();
  };
  const del = async () => {
    if (!window.confirm(`حذف "${item.name}" نهائياً؟`)) return;
    const r = await run(() => api({ action: "sd_adminDeleteItem", password, storeId, itemId: item.itemId }));
    if (r) onChanged();
  };

  return (
    <div className={"adm-item" + (f.available === false ? " off" : "")}>
      <div className="adm-item-top">
        {f.imageUrl ? <img src={assetUrl(String(f.imageUrl).split(",")[0])} alt="" /> : <div className="adm-noimg">🍽️</div>}
        <div className="adm-item-main">
          <input placeholder="اسم الصنف" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input placeholder="الوصف" value={f.description || ""} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </div>
      </div>
      <div className="adm-grid">
        <Field label="السعر"><input type="number" inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
        <Field label="خصم %"><input type="number" inputMode="decimal" value={f.discountPercent} onChange={(e) => setF({ ...f, discountPercent: e.target.value })} /></Field>
        <Field label="الكمية (فاضي = بلا حد)"><input type="number" inputMode="numeric" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} /></Field>
        <Field label="القسم"><input value={f.category || ""} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
      </div>
      <div className="adm-row">
        <label className="adm-check"><input type="checkbox" checked={f.available !== false} onChange={(e) => setF({ ...f, available: e.target.checked })} /> متاح للطلب</label>
        <label className="adm-btn gray">{up ? "جارٍ الرفع..." : "📷 صورة"}<input type="file" accept="image/*" hidden disabled={up} onChange={pick} /></label>
        <button className="adm-btn" disabled={busy || up} onClick={save}>{isNew ? "➕ إضافة" : "💾 حفظ"}</button>
        {!isNew && <button className="adm-btn red" disabled={busy} onClick={del}>🗑️</button>}
      </div>
      <Msg msg={msg} />
    </div>
  );
}

function MenuEditor({ password, storeId }) {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const load = useCallback(async () => {
    try {
      const r = await api({ action: "sd_adminGetMenu", password, storeId });
      if (r.success) { setItems(r.items); setErr(""); } else setErr(r.error || "حصل خطأ");
    } catch { setErr("مشكلة في الاتصال"); }
  }, [password, storeId]);
  useEffect(() => { load(); }, [load]);

  if (err) return <p className="adm-err">⚠️ {err}</p>;
  if (!items) return <p>جارٍ التحميل...</p>;
  const blank = { itemId: "", name: "", description: "", price: "", discountPercent: 0, category: "", imageUrl: "", available: true, quantity: null };
  const shown = items.filter((i) => !q || i.name.includes(q) || String(i.category).includes(q));
  return (
    <div>
      <p className="adm-hint">{items.length} صنف. أي حفظ بيتسجل في الشيت فوراً.</p>
      <h4>➕ صنف جديد</h4>
      <ItemRow key={"new" + items.length} password={password} storeId={storeId} item={blank} onChanged={load} />
      <h4>📋 الأصناف</h4>
      {items.length > 6 && <input className="adm-search" placeholder="🔍 بحث" value={q} onChange={(e) => setQ(e.target.value)} />}
      {shown.map((it) => (
        <ItemRow key={it.itemId + "|" + it.name + it.price + it.discountPercent + it.available + it.quantity} password={password} storeId={storeId} item={it} onChanged={load} />
      ))}
      {items.length === 0 && <p>المنيو فاضي لسه.</p>}
    </div>
  );
}


/* ===================== إحصائيات وطلبات ===================== */

const ST_AR = { new: "جديد", pending: "قيد الانتظار", preparing: "بيتحضر", ready: "جاهز", on_the_way: "في الطريق", awaiting_handover: "مستني التسليم", delivered: "✅ تم", cancelled: "❌ ملغي", rejected: "❌ مرفوض" };

function StatBoxes({ stats }) {
  const box = (n, l) => (<div className="adm-stat" key={l}><b>{n}</b><span>{l}</span></div>);
  return (
    <div className="adm-stats">
      {box(stats.total, "كل الأوردرات")}
      {box(stats.delivered, "اتوصلت")}
      {box(stats.active, "شغالة")}
      {box(stats.cancelled, "ملغية")}
      {box(stats.sales, "المبيعات (ج)")}
    </div>
  );
}

function OrdersList({ orders, showDriver }) {
  if (!orders.length) return <p className="adm-hint">مفيش أوردرات لسه</p>;
  return orders.map((o) => (
    <div className="adm-ord" key={o.orderId}>
      <b>{o.orderId} — {o.total} ج — {ST_AR[o.status] || o.status}</b>
      <small>{o.customerName} ({o.customerPhone}) • {o.paymentMethod} • {fmt(o.timestamp)}</small>
      <small>{o.items}</small>
      {showDriver && o.driverName && <small>🛵 {o.driverName}</small>}
    </div>
  ));
}

function PartnerOrders({ password, acc, storeId, onChanged }) {
  const [ov, setOv] = useState(null);
  const [err, setErr] = useState("");
  const [pts, setPts] = useState("");
  const sv = useSaver();
  const load = useCallback(async () => {
    try {
      const r = await api({ action: "sd_adminPartnerOverview", password, restaurantId: acc.restaurantId });
      if (r.success) { setOv(r); setPts(String(r.pointsRequired || 0)); setErr(""); } else setErr(r.error || "حصل خطأ");
    } catch { setErr("مشكلة في الاتصال"); }
  }, [password, acc.restaurantId]);
  useEffect(() => { load(); }, [load]);
  const savePts = async () => {
    const r = await sv.run(() => api({ action: "pts_adminSetStorePoints", password, updates: [{ storeId, pointsRequired: Number(pts) || 0 }] }));
    if (r) load();
  };
  if (err) return <p className="adm-err">⚠️ {err}</p>;
  if (!ov) return <p>جارٍ التحميل...</p>;
  return (
    <div className="adm-form">
      <StatBoxes stats={ov.stats} />
      <h4>⭐ النقاط المطلوبة للطلب من هذا المطعم</h4>
      <div className="adm-row">
        <input type="number" inputMode="numeric" value={pts} onChange={(e) => setPts(e.target.value)} />
        <button className="adm-btn" disabled={sv.busy} onClick={savePts}>💾 حفظ</button>
      </div>
      <p className="adm-hint">0 = من غير نقاط. العميل بيدفع النقاط دي مع كل أوردر.</p>
      <Msg msg={sv.msg} />
      <h4>🧾 آخر الأوردرات</h4>
      <OrdersList orders={ov.orders} showDriver />
    </div>
  );
}

function PartnerReviews({ password, acc, onChanged }) {
  const [reqs, setReqs] = useState(null);
  const [err, setErr] = useState("");
  const [disc, setDisc] = useState({});
  const sv = useSaver();
  const load = useCallback(async () => {
    try {
      const r = await api({ action: "sd_adminPartnerOverview", password, restaurantId: acc.restaurantId });
      if (r.success) { setReqs(r.requests); setErr(""); } else setErr(r.error || "حصل خطأ");
    } catch { setErr("مشكلة في الاتصال"); }
  }, [password, acc.restaurantId]);
  useEffect(() => { load(); }, [load]);
  const review = async (q, approve) => {
    let reason = "";
    if (!approve) { reason = window.prompt("سبب الرفض؟") || ""; if (!reason.trim()) return; }
    const r = await sv.run(() => api({ action: "mm_adminReview", password, requestId: q.requestId, approve, reason, discountPercent: disc[q.requestId] }));
    if (r) { load(); onChanged(); }
  };
  if (err) return <p className="adm-err">⚠️ {err}</p>;
  if (!reqs) return <p>جارٍ التحميل...</p>;
  const TYPE = { add: "➕ صنف جديد", edit: "✏️ تعديل", update: "✏️ تعديل", delete: "🗑️ حذف", remove: "🗑️ حذف" };
  return (
    <div className="adm-form">
      <p className="adm-hint">{reqs.length} طلب مستني مراجعتك من المطعم ده.</p>
      {reqs.map((q) => (
        <div className="adm-item" key={q.requestId}>
          <b>{TYPE[q.type] || q.type} {q.newData && q.newData.name ? `— ${q.newData.name}` : ""}</b>
          {q.newData && <small>{Object.keys(q.newData).map((k) => `${k}: ${q.newData[k]}`).join(" • ")}</small>}
          {q.oldData && <small>قبل: {Object.keys(q.oldData).map((k) => `${k}: ${q.oldData[k]}`).join(" • ")}</small>}
          {q.type === "add" && (
            <Field label="نسبة الخصم % (اختياري)"><input type="number" inputMode="decimal" value={disc[q.requestId] || ""} onChange={(e) => setDisc({ ...disc, [q.requestId]: e.target.value })} /></Field>
          )}
          <div className="adm-row">
            <button className="adm-btn" disabled={sv.busy} onClick={() => review(q, true)}>✅ موافقة</button>
            <button className="adm-btn red" disabled={sv.busy} onClick={() => review(q, false)}>❌ رفض</button>
          </div>
        </div>
      ))}
      <Msg msg={sv.msg} />
    </div>
  );
}

/* ===================== المطعم ===================== */

const VIS = [
  { key: "home", label: "⭐ الرئيسية + العملاء", patch: { visible: true, home: true } },
  { key: "customers", label: "👥 العملاء فقط", patch: { visible: true, home: false } },
  { key: "hidden", label: "🚫 مخفي", patch: { visible: false } },
];

export function RestaurantDetail({ password, acc, onClose, onChanged }) {
  const [tab, setTab] = useState("info");
  const [cur, setCur] = useState(acc);
  const [f, setF] = useState({
    name: acc.restaurantName || acc.name || "", ownerName: acc.ownerName || "", phone: acc.phone || "", category: acc.category || "",
    username: acc.username || "", restaurantPassword: acc.password || "", description: acc.description || "", address: acc.address || "",
    percentage: String(acc.percentage || "").replace("%", ""), note: acc.note || "",
  });
  const [links, setLinks] = useState(Array.isArray(acc.links) ? acc.links : []);
  const [images, setImages] = useState(Array.isArray(acc.images) ? acc.images : []);
  const [logo, setLogo] = useState(acc.logoUrl || "");
  const [deliveryEnabled, setDelivery] = useState(acc.deliveryEnabled !== false);
  const [status, setStatus] = useState(acc.status);
  const [vis, setVis] = useState("home");
  const [upBusy, setUpBusy] = useState(false);
  const info = useSaver();
  const media = useSaver();
  const ctl = useSaver();
  const storeId = acc.storeId || acc.restaurantId;

  useEffect(() => {
    api({ action: "sd_adminGetVisibility", password }).then((r) => {
      const v = r && r.visibility && r.visibility[storeId];
      if (!v) setVis("home");
      else setVis(v.visible === false ? "hidden" : v.home === false ? "customers" : "home");
    }).catch(() => {});
  }, [password, storeId]);

  const update = (patch) => api({ action: "sd_adminUpdateAccount", password, restaurantId: acc.restaurantId, ...patch });

  const saveInfo = async () => {
    const r = await info.run(() =>
      update({ name: f.name, ownerName: f.ownerName, phone: f.phone, category: f.category, username: f.username, restaurantPassword: f.restaurantPassword, description: f.description, address: f.address, percentage: f.percentage, note: f.note, links })
    );
    if (r) onChanged();
  };
  const saveMedia = async () => {
    const r = await media.run(() => update({ images, logoUrl: logo }));
    if (r) onChanged();
  };
  const upLogo = async (e) => {
    const file = e.target.files[0]; e.target.value = "";
    if (!file) return;
    setUpBusy(true);
    try { setLogo(await uploadImage(file, { password }, "logo")); } catch (er) { alert(er.message); } finally { setUpBusy(false); }
  };
  const upImage = async (e) => {
    const file = e.target.files[0]; e.target.value = "";
    if (!file) return;
    if (images.length >= 10) return alert("أقصى عدد صور 10");
    setUpBusy(true);
    try { const u = await uploadImage(file, { password }, "product"); setImages((p) => [...p, u]); } catch (er) { alert(er.message); } finally { setUpBusy(false); }
  };
  const setVisibility = async (st) => {
    const prev = vis;
    setVis(st.key);
    const r = await ctl.run(() => api({ action: "sd_adminSetVisibility", password, updates: [{ storeId, name: f.name, ...st.patch }] }));
    if (!r) setVis(prev); else onChanged();
  };
  const toggleListed = async () => {
    const r = await ctl.run(() => update({ status: status === "active" ? "suspended" : "active" }));
    if (r) { setStatus(status === "active" ? "suspended" : "active"); onChanged(); }
  };
  const toggleDelivery = async () => {
    const r = await ctl.run(() => update({ deliveryEnabled: !deliveryEnabled }));
    if (r) { setDelivery(!deliveryEnabled); onChanged(); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <Modal title={`🏪 ${cur.restaurantName || f.name}`} onClose={onClose}>
      <div className="adm-tabs">
        {[["info", "📝 البيانات"], ["orders", "📊 الطلبات والنقاط"], ["menu", "🍽️ المنيو"], ["review", "📝 المراجعات"], ["media", "🖼️ الصور"], ["ctl", "⚙️ التحكم"]].map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "info" && (
        <div className="adm-form">
          <Field label="اسم المحل"><input value={f.name} onChange={set("name")} /></Field>
          <Field label="صاحب المحل"><input value={f.ownerName} onChange={set("ownerName")} /></Field>
          <Field label="الموبايل"><input inputMode="tel" value={f.phone} onChange={set("phone")} /></Field>
          <Field label="النشاط"><input value={f.category} onChange={set("category")} /></Field>
          <Field label="اليوزر نيم"><input value={f.username} onChange={set("username")} /></Field>
          <Field label="الباسورد"><input value={f.restaurantPassword} onChange={set("restaurantPassword")} /></Field>
          <Field label="الوصف"><textarea rows={3} value={f.description} onChange={set("description")} /></Field>
          <Field label="العنوان"><input value={f.address} onChange={set("address")} /></Field>
          <Field label="نسبة الخصم المعروضة للعملاء % (شارة على المحل)"><input type="number" inputMode="decimal" value={f.percentage} onChange={set("percentage")} /></Field>
          <Field label="ملاحظة للعملاء"><input value={f.note} onChange={set("note")} /></Field>
          <div className="adm-links">
            <span>🔗 لينكات (فيس، انستا، خريطة...)</span>
            {links.map((l, i) => (
              <div className="adm-row" key={i}>
                <input placeholder="الاسم" value={l.label || ""} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <input placeholder="https://..." value={l.url || ""} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                <button className="adm-btn red" onClick={() => setLinks(links.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            {links.length < 8 && <button className="adm-btn gray" onClick={() => setLinks([...links, { label: "", url: "" }])}>➕ لينك</button>}
          </div>
          <button className="adm-btn big" disabled={info.busy} onClick={saveInfo}>{info.busy ? "جارٍ الحفظ..." : "💾 حفظ البيانات"}</button>
          <Msg msg={info.msg} />
        </div>
      )}

      {tab === "media" && (
        <div className="adm-form">
          <h4>اللوجو</h4>
          <div className="adm-row">
            {logo ? <img className="adm-logo" src={assetUrl(logo)} alt="" /> : <div className="adm-noimg">لا يوجد</div>}
            <label className="adm-btn gray">{upBusy ? "جارٍ الرفع..." : "📷 رفع لوجو"}<input type="file" accept="image/*" hidden disabled={upBusy} onChange={upLogo} /></label>
            {logo && <button className="adm-btn red" onClick={() => setLogo("")}>إزالة</button>}
          </div>
          <h4>صور المحل ({images.length}/10)</h4>
          <div className="adm-gallery">
            {images.map((u, i) => (
              <div key={u + i} className="adm-thumb">
                <img src={assetUrl(u)} alt="" />
                <button onClick={() => setImages(images.filter((_, j) => j !== i))} aria-label="حذف الصورة">✕</button>
              </div>
            ))}
          </div>
          <label className="adm-btn gray">{upBusy ? "جارٍ الرفع..." : "➕ إضافة صورة"}<input type="file" accept="image/*" hidden disabled={upBusy} onChange={upImage} /></label>
          <button className="adm-btn big" disabled={media.busy || upBusy} onClick={saveMedia}>{media.busy ? "جارٍ الحفظ..." : "💾 حفظ الصور"}</button>
          <Msg msg={media.msg} />
        </div>
      )}

      {tab === "orders" && <PartnerOrders password={password} acc={acc} storeId={storeId} onChanged={onChanged} />}
      {tab === "review" && <PartnerReviews password={password} acc={acc} onChanged={onChanged} />}
      {tab === "menu" && <MenuEditor password={password} storeId={storeId} />}

      {tab === "ctl" && (
        <div className="adm-form">
          <h4>ظهوره للعملاء</h4>
          <div className="adm-seg">
            {VIS.map((s) => (
              <button key={s.key} className={vis === s.key ? "on" : ""} disabled={ctl.busy} onClick={() => setVisibility(s)}>{s.label}</button>
            ))}
          </div>
          <h4>حالة الحساب</h4>
          <button className="adm-btn big" disabled={ctl.busy} onClick={toggleListed}>{status === "active" ? "⏸ إيقاف الحساب (الحالة: نشط)" : "▶️ تفعيل الحساب (الحالة: موقوف)"}</button>
          <h4>الدليفري</h4>
          <button className="adm-btn big gray" disabled={ctl.busy} onClick={toggleDelivery}>{deliveryEnabled ? "🚫 قفل التوصيل (الحالي: شغال)" : "🛵 تشغيل التوصيل (الحالي: مقفول)"}</button>
          <p className="adm-hint">مفتاح المنيو: {storeId}</p>
          <Msg msg={ctl.msg} />
        </div>
      )}
    </Modal>
  );
}

/* ===================== الدليفري ===================== */

export function DriverDetail({ password, acc, onClose, onChanged }) {
  const [f, setF] = useState({ name: acc.name || "", phone: String(acc.phone || ""), driverPassword: String(acc.password || ""), vehicleType: acc.vehicleType || "", region: acc.region || "", status: acc.status || "active" });
  const { busy, msg, run } = useSaver();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const [ov, setOv] = useState(null);
  useEffect(() => {
    api({ action: "sd_adminDriverOverview", password, phone: String(acc.phone) }).then((r) => r.success && setOv(r)).catch(() => {});
  }, [password, acc.phone]);
  const save = async () => {
    const r = await run(() => api({ action: "sd_adminUpdateDriver", password, deliveryId: acc.deliveryId, ...f }));
    if (r) onChanged();
  };
  return (
    <Modal title={`🛵 ${acc.name}`} onClose={onClose}>
      <div className="adm-form">
        {ov && <><StatBoxes stats={ov.stats} /><p className="adm-hint">{ov.busy ? `🛵 معاه أوردر شغال ${ov.currentOrderId}` : "🟢 فاضي دلوقتي"}</p></>}
        <Field label="الاسم"><input value={f.name} onChange={set("name")} /></Field>
        <Field label="الموبايل"><input inputMode="tel" value={f.phone} onChange={set("phone")} /></Field>
        <Field label="الباسورد"><input value={f.driverPassword} onChange={set("driverPassword")} /></Field>
        <Field label="نوع المركبة"><input value={f.vehicleType} onChange={set("vehicleType")} /></Field>
        <Field label="المنطقة"><input value={f.region} onChange={set("region")} /></Field>
        <Field label="الحالة">
          <select value={f.status} onChange={set("status")}>
            <option value="active">🟢 نشط</option>
            <option value="suspended">🔴 موقوف</option>
          </select>
        </Field>
        <button className="adm-btn big" disabled={busy} onClick={save}>{busy ? "جارٍ الحفظ..." : "💾 حفظ"}</button>
        <Msg msg={msg} />
        {ov && <><h4>🧾 آخر أوردراته</h4><OrdersList orders={ov.orders} /></>}
      </div>
    </Modal>
  );
}

/* ===================== العميل ===================== */

export function CustomerDetail({ password, phone, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPass, setNewPass] = useState("");
  const [addrs, setAddrs] = useState([]);
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const { busy, msg, run } = useSaver();

  const load = useCallback(async () => {
    try {
      const r = await api({ action: "sd_adminGetCustomer", password, phone });
      if (!r.success) return setErr(r.error || "حصل خطأ");
      setData(r);
      setName(r.customer.name);
      setNewPhone(r.customer.phone);
      setAddrs(r.customer.addresses || []);
    } catch { setErr("مشكلة في الاتصال"); }
  }, [password, phone]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const body = { action: "sd_adminUpdateCustomer", password, phone: data.customer.phone, name, addresses: addrs };
    if (newPhone && newPhone !== data.customer.phone) body.newPhone = newPhone;
    if (newPass) body.newPassword = newPass;
    if (delta !== "" && Number(delta) !== 0) { body.pointsDelta = Number(delta); body.note = note; }
    const r = await run(() => api(body));
    if (r) {
      setNewPass(""); setDelta(""); setNote("");
      onChanged();
      // لو الرقم اتغير نقرا بالرقم الجديد
      const r2 = await api({ action: "sd_adminGetCustomer", password, phone: body.newPhone || data.customer.phone });
      if (r2.success) { setData(r2); setNewPhone(r2.customer.phone); setAddrs(r2.customer.addresses || []); }
    }
  };

  return (
    <Modal title={`👤 ${data ? data.customer.name : "عميل"}`} onClose={onClose}>
      {err && <p className="adm-err">⚠️ {err}</p>}
      {!data && !err && <p>جارٍ التحميل...</p>}
      {data && (
        <div className="adm-form">
          <p className="adm-hint">⭐ النقاط الحالية: <b>{data.customer.points}</b> • سجل في {fmt(data.customer.registeredAt)}</p>
          <Field label="الاسم"><input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="الموبايل"><input inputMode="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} /></Field>
          <Field label="باسورد جديد (سيبه فاضي لو مش عايز تغيره)"><input value={newPass} onChange={(e) => setNewPass(e.target.value)} /></Field>
          <div className="adm-links">
            <span>📍 العناوين</span>
            {addrs.map((a, i) => (
              <div className="adm-row" key={a.id || i}>
                <input placeholder="الاسم" value={a.label || ""} onChange={(e) => setAddrs(addrs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <input placeholder="العنوان" value={a.address || ""} onChange={(e) => setAddrs(addrs.map((x, j) => (j === i ? { ...x, address: e.target.value } : x)))} />
                <button className="adm-btn red" onClick={() => setAddrs(addrs.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button className="adm-btn gray" onClick={() => setAddrs([...addrs, { label: "عنوان", address: "" }])}>➕ عنوان</button>
          </div>
          <div className="adm-grid">
            <Field label="إضافة/خصم نقاط (مثال 50 أو -20)"><input type="number" inputMode="numeric" value={delta} onChange={(e) => setDelta(e.target.value)} /></Field>
            <Field label="السبب"><input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          </div>
          <button className="adm-btn big" disabled={busy} onClick={save}>{busy ? "جارٍ الحفظ..." : "💾 حفظ"}</button>
          <Msg msg={msg} />

          <h4>🧾 آخر الطلبات ({data.orders.length})</h4>
          {data.orders.length === 0 && <p className="adm-hint">مفيش طلبات</p>}
          {data.orders.map((o) => (
            <div className="adm-ord" key={o.orderId}>
              <b>{o.storeName}</b> — {o.total} ج — {o.status}
              <small>{fmt(o.timestamp)} • {o.paymentMethod}</small>
            </div>
          ))}
          <h4>⭐ سجل النقاط</h4>
          {data.pointsLog.length === 0 && <p className="adm-hint">مفيش حركات</p>}
          {data.pointsLog.map((p, i) => (
            <div className="adm-ord" key={i}>
              <b style={{ color: p.points >= 0 ? "#2e7d32" : "#c62828" }}>{p.points > 0 ? "+" : ""}{p.points}</b> — {p.type} {p.note && `(${p.note})`}
              <small>{fmt(p.time)}</small>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ===================== سجل التعديلات ===================== */

export function ChangeLog({ password }) {
  const [log, setLog] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api({ action: "sd_adminGetLog", password, limit: 100 }).then((r) => (r.success ? setLog(r.log) : setErr(r.error || "حصل خطأ"))).catch(() => setErr("مشكلة في الاتصال"));
  }, [password]);
  if (err) return <p className="adm-err">⚠️ {err}</p>;
  if (!log) return <p>جارٍ التحميل...</p>;
  return (
    <div>
      <h3>📜 سجل التعديلات</h3>
      {log.length === 0 && <p>مفيش تعديلات لسه</p>}
      {log.map((l, i) => (
        <div className="adm-ord" key={i}>
          <b>{l.action}</b> — {l.target}
          <small>{l.detail} • {fmt(l.time)}</small>
        </div>
      ))}
    </div>
  );
}
import { RestaurantDetail, DriverDetail,
CustomerDetail, ChangeLog } from "./
AdminDetails.jsx";
import "./Admin.css";
const STATUS_OPTIONS = ["pending",
"accepted_by_restaurant", "preparing",
"out_for_delivery", "delivered", "cancelled"];
const STATUS_LABELS = {
,"قيد الانتظار ⏳" :pending
accepted_by_restaurant: "👨‍🍳 القبول تم,"
,"جاٍر التحضير ��" :preparing
out_for_delivery: "🛵 الطريق في,"
,"تم التوصيل ✅" :delivered
,"ملغي ❌" :cancelled
};
// يحول رقم مصري لصيغة دولية عشان رابط واتساب يشتغل
صح
function toWhatsAppNumber(phone) {
let digits = String(phone || "").replace(/\D/g, "");
if (digits.startsWith("20")) return digits;
if (digits.startsWith("0")) return "20" +
digits.slice(1);
return "20" + digits;
}
function buildWhatsAppLink(phone, message) {
const number = toWhatsAppNumber(phone);
return https://wa.me/${number}?text=$
{encodeURIComponent(message)};
}
/* ================= أقسام الإدارة الجديدة
(مراجعات / منيو / نقاط / لايف) =================
/*
async function api(body) {
const res = await fetch(CART_SCRIPT_URL, {
method: "POST",
headers: { "Content-Type": "text/
plain;charset=utf-8" },
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
const Ctx = window.AudioContext ||
window.webkitAudioContext;
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
// بيراقب عّداد المراجعات كل 20 ثانية وبينبهك لما يزيد
(صوت + إشعار متصفح + عنوان الصفحة)
function useAdminPending(password) {
const [pending, setPending] = useState(null);
const last = useRef(null);
useEffect(() => {
if (!password) return undefined;
let stopped = false;
const tick = async () => {
try {
const r = await api({ action: "pts_adminPending",
password });
if (stopped || !r.success) return;
setPending(r);
if (last.current !== null && r.total > last.current) {
beep();
try {
if ("Notification" in window &&
Notification.permission === "granted") {
new Notification("VE Voucher", { body: فيه$
{r.total} مراجعة محتاجة حاجة { { ;({catch { /* ignore
*/ } } last.current = r.total; document.title = r.total
&gt; 0 ?(${r.total}) إدارة VE : "إدارة VE";
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
{notice && <p className="adx-notice">{notice}</
p>}
</>
);
}
/* ===================== مراجعات
/* =====================
function Reviews({ password, onChanged }) {
const [data, setData] = useState({ orders: [],
purchases: [], refunds: [], requests: [] });
const [error, setError] = useState("");
const [notice, setNotice] = useState("");
const [discounts, setDiscounts] = useState({});
const load = useCallback(async () => {
try {
const [o, p, r, m] = await Promise.all([
api({ action: "pts_adminGetPaymentOrders",
password }),
api({ action: "pts_adminGetPurchases",
password }),
api({ action: "pts_adminGetRefunds", password
}),
api({ action: "mm_adminGetRequests",
password }),
 ]);
setData({ orders: o.orders || [], purchases:
p.purchases || [], refunds: r.refunds || [], requests:
m.requests || [] });
const bad = [o, p, r, m].find((x) => !x.success);
setError(bad ? bad.error : "");
} catch {
;("مشكلة في الاتصال")setError
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
if (!r.success) setError(r.error || "فشل;("
else setNotice(okText);
await load();
onChanged && onChanged();
};
const ask = (msg) => window.prompt(msg, "");
const rejectReason = () => {
const reason = ask("الرفض سبب;(":
return reason === null ? null : reason;
};
const none = !data.orders.length && !
data.purchases.length && !data.refunds.length
&& !data.requests.length;
return (
<>
<Msg error={error} notice={notice} />
{none && <p className="adx-muted"> حاجة مفيش
{<p ✅</محتاجة مراجعة دلوقتي
{data.orders.length > 0 && <h3> أوردرات دفع
(كاش فودافون} — (data.orders.length}</h3>}
{data.orders.map((o) => (
<div className="adx-card" key={o.orderId}>
<div className="adx-row">
<strong>{o.storeName}</strong>
<b>{o.total} م.ج/>b>
</div>
<div className="adx-muted">
{o.customerName} • {o.phone} •
{fmtDate(o.timestamp)}
</div>
<div>{o.items}</div>
<div className="adx-box">
 <b>{o.senderPhone || "—"}</b> :من ولّح
{</>{o.reference} :مرجع && <>• o.reference}
{o.pointsUsed > 0 && <> • مستخدمة نقاط :
{o.pointsUsed}</>}
</div>
<div className="adx-actions">
<button onClick={() => review({ action:
"pts_adminReviewOrderPayment", orderId:
تأكيد <{("اتقبل وراح للمطعم" ,{ true: approve, orderId.o
<button</الدفع
<button
className="adx-danger"
onClick={() => {
const reason = rejectReason();
if (reason !== null) review({ action:
"pts_adminReviewOrderPayment", orderId:
o.orderId, approve: false, reason }, " وراجعت اترفض
;("الكمية والنقاط
}}
>
رفض
</button>
</div>
</div>
))}
{data.purchases.length > 0 && <h3>نقاط شراء —
{data.purchases.length}</h3>}
{data.purchases.map((p) => (
<div className="adx-card" key={p.requestId}>
<div className="adx-row">
<strong>
{p.points} نقطة} • p.price} م.ج
</strong>
<span className="adxmuted">{fmtDate(p.createdAt)}</span>
</div>
<div className="adx-muted">
{p.name} • {p.phone}
</div>
<div className="adx-box">
 && p.reference} <b>{p.senderPhone}</b> :من ولّح
{</>{p.reference} :مرجع<>•
</div>
<div className="adx-actions">
<button onClick={() => review({ action:
"pts_adminReviewPurchase", requestId:
p.requestId, approve: true }, "للعميل اتضافت النقاط{("
<button</تأكيد وإضافة النقاط<
<button
className="adx-danger"
onClick={() => {
const reason = rejectReason();
if (reason !== null) review({ action:
"pts_adminReviewPurchase", requestId:
p.requestId, approve: false, reason }, "اترفض;("
}}
>
رفض
</button>
</div>
</div>
))}
{data.refunds.length > 0 && <h3>نقاط استرداد —
{data.refunds.length}</h3>}
{data.refunds.map((r) => (
<div className="adx-card" key={r.requestId}>
<div className="adx-row">
<strong>
{r.points} أوردر • نقطة} r.orderId}
</strong>
<span className="adxmuted">{fmtDate(r.createdAt)}</span>
</div>
<div className="adx-muted">{r.phone}</div>
{r.reason && <div>السبب} :r.reason}</div>}
<div className="adx-actions">
<button onClick={() => review({ action:
"pts_adminReviewRefund", requestId:
r.requestId, approve: true }, "للعميل اترجعت النقاط{("
<button</موافقة وإرجاع النقاط<
<button
className="adx-danger"
onClick={() => {
const reason = rejectReason();
if (reason !== null) review({ action:
"pts_adminReviewRefund", requestId:
r.requestId, approve: false, reason }, "اترفض;("
}}
>
رفض
</button>
</div>
</div>
))}
{data.requests.length > 0 && <h3>المنيو تعديلات —
{data.requests.length}</h3>}
{data.requests.map((q) => {
const nd = q.newData || {};
const od = q.oldData || {};
const name = nd.name || od.name || "";
return (
<div className="adx-card" key={q.requestId}>
<div className="adx-row">
<strong>
{{ add: "إضافة ,"edit: "تعديل ,"delete: "حذف]{ "q.type]
|| q.type} {name}
</strong>
<span className="adxmuted">{q.restaurantName}</span>
</div>
{q.type !== "delete" && (
<div className="adx-box">
{Object.keys(nd).map((k) => (
<div key={k}>
{k}: <b>{String(nd[k])}</b>
{od[k] !== undefined && String(od[k]) !==
String(nd[k]) && <span className="adx-muted">
(كان} String(od[k])})</span>}
</div>
))}
{nd.imageUrl && <img className="adx-img"
src={String(nd.imageUrl).split(",")[0]} alt="" />}
</div>
)}
{q.type !== "delete" && (
<input
className="adx-input"
type="number"
min="0"
max="100"
"نسبة الخصم % (اختياري)"=placeholder
value={discounts[q.requestId] || ""}
onChange={(e) => setDiscounts({ ...discounts,
[q.requestId]: e.target.value })}
/>
)}
<div className="adx-actions">
<button
onClick={() =>
review(
{ action: "mm_adminReview", requestId:
q.requestId, approve: true, discountPercent:
discounts[q.requestId] || undefined },
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
if (reason) review({ action: "mm_adminReview",
requestId: q.requestId, approve: false, reason },
;("اترفض"
else if (reason === "") window.alert(" سبب اكتب
;("الرفض
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
/* ===================== منيو وخصومات
/* =====================
function MenuDiscounts({ password }) {
const [partners, setPartners] = useState([]);
const [storeId, setStoreId] = useState("");
const [items, setItems] = useState([]);
const [edits, setEdits] = useState({});
const [error, setError] = useState("");
const [notice, setNotice] = useState("");
useEffect(() => {
api({ action: "mm_adminGetPartners", password
}).then((r) => (r.success ? setPartners(r.partners
|| []) : setError(r.error || "")));
}, [password]);
const loadItems = useCallback(
async (id) => {
setStoreId(id);
setItems([]);
setEdits({});
if (!id) return;
const r = await api({ action:
"mm_adminGetStoreItems", password, storeId:
id });
if (r.success) setItems(r.items || []);
else setError(r.error || "");
},
[password]
);
const save = async () => {
const updates = Object.keys(edits).map((itemId)
=> ({ itemId, discountPercent:
Number(edits[itemId]) }));
if (!updates.length) return;
setError("");
const r = await api({ action:
"mm_adminSetDiscount", password, storeId,
updates });
if (!r.success) setError(r.error || "فشل;("
else {
;("الخصومات اتحفظت")setNotice
await loadItems(storeId);
}
};
return (
<>
<Msg error={error} notice={notice} />
<select className="adx-input" value={storeId}
onChange={(e) => loadItems(e.target.value)}>
<option value="">المحل اختار/>option>
{partners.map((p) => (
<option key={p.restaurantId} value={p.storeId}>
{p.name}
</option>
))}
</select>
{items.map((it) => {
const val = edits[it.itemId] !== undefined ?
edits[it.itemId] : it.discountPercent || 0;
return (
<div className="adx-card" key={it.itemId}>
<div className="adx-row">
<strong>{it.name}</strong>
<span>{it.price} م.ج/>span>
</div>
<div className="adx-row">
<span className="adx-muted">
Math.round(it.price * (1 - Number(val) } :الخصم بعد
غير ? "" : "• it.available} م.ج /} 100) * 100) / 100
متاح"}
</span>
<label>
خصم %{" "}
<input
className="adx-num"
type="number"
min="0"
max="100"
value={val}
onChange={(e) => setEdits({ ...edits, [it.itemId]:
e.target.value })}
/>
</label>
</div>
</div>
);
})}
{Object.keys(edits).length > 0 && (
<button className="adx-sticky" onClick={save}>
تعديل} Object.keys(edits).length} حفظ
</button>
)}
</>
);
}
/* ===================== نقاط وباقات وتوصيل
/* =====================
function PointsAndDelivery({ password }) {
const [packages, setPackages] = useState([]);
const [stores, setStores] = useState([]);
const [partners, setPartners] = useState([]);
const [storeEdits, setStoreEdits] = useState({});
const [error, setError] = useState("");
const [notice, setNotice] = useState("");
const load = useCallback(async () => {
const [pk, st, pa] = await Promise.all([
api({ action: "pts_adminGetPackages", password
}),
api({ action: "pts_adminGetStores", password }),
api({ action: "mm_adminGetPartners", password
}),
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
if (!r.success) setError(r.error || "فشل;("
else setNotice(okText);
await load();
};
const editPackage = (p) => {
const points = window.prompt("النقاط عدد ,":p ?
p.points : "");
if (points === null) return;
const price = window.prompt("بالجنيه السعر ,":p ?
p.price : "");
if (price === null) return;
run({ action: "pts_adminSavePackage",
packageId: p ? p.packageId : undefined, points:
Number(points), price: Number(price), active: p ?
p.active : true }, "اتحفظت الباقة;("
};
const saveStorePoints = () => {
const updates =
Object.keys(storeEdits).map((storeId) => ({
storeId, pointsRequired:
Number(storeEdits[storeId]) }));
run({ action: "pts_adminSetStorePoints", updates
 <= ())then").نقاط المحلات اتحفظت" ,{
setStoreEdits({}));
};
return (
<>
<Msg error={error} notice={notice} />
<h3</باقات النقاط<h3<
{packages.map((p) => (
<div className="adx-card adx-row"
key={p.packageId}>
<span>
{p.points} نقطة} = p.price} م.ج} p.active ? "" :
{"(موقوفة)"
</span>
<span className="adx-actions">
<button onClick={() => editPackage(p)}>تعديل/>
button>
<button className="adx-gray" onClick={() =>
run({ action: "pts_adminSavePackage",
packageId: p.packageId, points: p.points, price:
p.price, active: !p.active }, "الحالة اتغيرت<{("
{"إيقاف" : "تفعيل" ? active.p{
</button>
<button
className="adx-danger"
onClick={() => window.confirm("الباقة؟ حذف && ("
run({ action: "pts_adminDeletePackage",
packageId: p.packageId }, "اتحذفت{("
>
حذف
</button>
</span>
</div>
))}
<button onClick={() => editPackage(null)}>+ باقة
<button</جديدة
<h3</النقاط المطلوبة لكل محل<h3<
<p className="adx-muted">0 = من شغال الخصم
<p.</غير نقاط
{stores.map((s) => (
<div className="adx-card adx-row"
key={s.storeId}>
<span>{s.name}</span>
<input
className="adx-num"
type="number"
min="0"
value={storeEdits[s.storeId] !== undefined ?
storeEdits[s.storeId] : s.pointsRequired}
onChange={(e) => setStoreEdits({ ...storeEdits,
[s.storeId]: e.target.value })}
/>
</div>
))}
{Object.keys(storeEdits).length > 0 && <button
/>حفظ نقاط المحلات<{saveStorePoints={onClick
button>}
<h3</التوصيل (مطاعم وكافيهات بس)<h3<
{partners.map((p) => (
<label className="adx-card adx-row"
key={p.restaurantId}>
<span>{p.name}</span>
<input
type="checkbox"
checked={!!p.deliveryEnabled}
onChange={(e) => {
const enabled = e.target.checked;
setPartners((prev) => prev.map((x) =>
(x.restaurantId === p.restaurantId ? { ...x,
deliveryEnabled: enabled } : x)));
run({ action: "mm_adminSetDelivery", updates: [{
storeId: p.storeId, enabled }] }, "دثّاتح;("
}}
/>
</label>
))}
</>
);
}
/* ===================== الدليفري لايف
/* =====================
const STATE_TEXT = { online: "🟢 أونلاين ,"stale:
;{ "مقطوع ��" :offline", متأخر ��"
function LiveDrivers({ password }) {
const [data, setData] = useState(null);
const [error, setError] = useState("");
const [sel, setSel] = useState(null);
useEffect(() => {
let stopped = false;
const tick = async () => {
try {
const r = await api({ action: "tr_adminLive",
password });
if (stopped) return;
if (r.success) {
setData(r);
setError("");
} else setError(r.error || "فشل;("
} catch {
;("مشكلة في الاتصال")setError
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
const chosen = drivers.find((d) => d.phone ===
sel) || drivers.find((d) => d.lat !== null);
let map = null;
if (chosen && chosen.lat !== null) {
const d = 0.01;
map = https://www.openstreetmap.org/export/
embed.html?bbox=${chosen.lng - d},$
{chosen.lat - d},${chosen.lng + d},${chosen.lat +
d}&layer=mapnik&marker=${chosen.lat},$
{chosen.lng};
}
return (
<>
{error && <p className="adx-error">{error}</p>}
{data && (
<p className="adx-muted">
متأخر} • data.counts.online} أونلاين
 {data.counts.offline} مقطوع} • data.counts.stale}
(بيتحّدث كل 10 ثواني)
</p>
)}
{map && <iframe className="adx-map"
title="الدليفري "src={map} />}
{drivers.map((d) => (
<div className={adx-card ${chosen &&
chosen.phone === d.phone ? "adx-sel" : ""}}
key={d.phone} onClick={() =&gt; setSel(d.phone)}
&gt; &lt;div className="adx-row"&gt;
&lt;strong&gt;{d.name}&lt;/strong&gt;
&lt;span&gt;{STATE_TEXT[d.state] || d.state}&lt;/
span&gt; &lt;/div&gt; &lt;div className="adxmuted"&gt; {d.phone} • {d.vehicle} • {d.ageSec
{ثانية {ageSec.d ${مفيش مكان" :من" ? null===
{d.battery !== null && d.battery !== undefined &&
d.battery !== "" && • بطارية}$ d.battery}%}
{d.appState && • ${d.appState}}
</div>
{d.orderId ? <div className="adx-box">أوردر معاه
{d.orderId} ({d.orderStatus})</div> : <div
className="adx-muted">فاضي/>div>}
{d.mapsUrl && (
<a href={d.mapsUrl} target="_blank"
rel="noreferrer" onClick={(e) =>
e.stopPropagation()}>
افتح على الخريطة
</a>
)}
</div>
))}
{data && drivers.length === 0 && <p
{<p.</مفيش دليفري مفّعل<"muted-adx="className
</>
);
}
/* ===================== الواجهة الرئيسية
/* =====================
// ===== إضافة مطعم/محل مباشرة + التحكم في ظهوره
في الموقع =====
function AddPartnerForm({ password, onDone,
onCreated }) {
const empty = { restaurantName: "", ownerName:
"", phone: "", category: "مطاعم ,"username: "",
restaurantPassword: "", description: "", address:
"", logoUrl: "", storeKey: "" };
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
const url = await uploadImage(file, { password },
"logo");
setF((p) => ({ ...p, logoUrl: url }));
} catch (er) {
;("فشل رفع اللوجو" || message.er(setErr
} finally {
setLogoBusy(false);
}
};
const set = (k) => (e) => setF((p) => ({ ...p, [k]:
e.target.value }));
const genPass = () => setF((p) => ({ ...p,
restaurantPassword:
Math.random().toString(36).slice(2, 6) +
Math.floor(1000 + Math.random() * 9000) }));
const submit = async () => {
setErr("");
setBusy(true);
try {
const r = await api({ action:
"sd_adminAddPartner", password, ...f });
if (r.success) {
setF(empty);
setOpen(false);
onCreated(r);
onDone();
} else setErr(r.error || "خطأ حصل;("
} catch {
;("مشكلة في الاتصال")setErr
} finally {
setBusy(false);
}
};
if (!open) return <div className="adx"><button
style={{ width: "100%" }} onClick={() =>
/>إضافة مطعم / محل جديد ➕<{(true(setOpen
button></div>;
return (
<div className="adx adx-box adx-addform">
<h4</إضافة محل جديد ➕<h4<
 "* اسم المحل"=placeholder input<
value={f.restaurantName}
onChange={set("restaurantName")} />
 "* اسم صاحب المحل"=placeholder input<
value={f.ownerName}
onChange={set("ownerName")} />
 " رقم الموبايل (واتساب)"=placeholder input<
inputMode="tel" value={f.phone}
onChange={set("phone")} />
<select value={f.category}
onChange={set("category")}>
{["مطاعم", "كافيهات", "ملابس رجالي", "ملابس حريمي",
"ملابس أطفال", "أحذية", "محلات كلاسيك", "إكسسوارات
وعطور", "ميكب", "نظارات", "جيم", "أدوات رياضية", "سوبر
ماركت", "أكاديمية كورسات"].(c((map) <=
<option key={c} value={c}>{c}</option>
))}
</select>
اليوزر نيم * (إنجليزي بدون "=placeholder input<
(مسافات "value={f.username}
onChange={set("username")} />
<div className="adx-inline">
 "الباسورد * (6 حروف على الأقل)"=placeholder input<
value={f.restaurantPassword}
onChange={set("restaurantPassword")} />
<button type="button" className="adx-small"
onClick={genPass}>🎲توليد/>button>
</div>
 "وصف قصير (اختياري)"=placeholder input<
value={f.description}
onChange={set("description")} />
 "العنوان (اختياري)"=placeholder input<
value={f.address} onChange={set("address")} />
<label className="adx-upload">
تغيير" ? logoUrl.f..." : جاٍر رفع اللوجو" ? logoBusy🖼️ {
{"اللوجو" : "رفع لوجو (اختياري)
<input type="file" accept="image/" hidden
disabled={logoBusy} onChange={pickLogo} />
</label>
{f.logoUrl && <img className="adx-logo-prev"
src={assetUrl(f.logoUrl)} alt="" />}
مفتاح المنيو (اختياري - لو سبته "=placeholder input<
(تلقائي هيتعمل "value={f.storeKey}
onChange={set("storeKey")} />
<small className="adx-muted"> علّبيتف التوصيل
تلقائي للمطاعم والكافيهات بس. المحل هيظهر في الموقع
فورًا.</small<
{err && <p className="adx-error">{err}</p>}
<div className="adx-inline">
<button className="" disabled={busy ||
logoBusy} onClick={submit}>{busy ? " "...الحفظ رٍجا
<button" :"}</حفظ وإنشاء الحساب
<button className="adx-small adx-gray"
disabled={busy} onClick={() => setOpen(false)}
<button</إلغاء<
</div>
</div>
);
}
function PartnerControls({ password, acc,
onDone }) {
const [edit, setEdit] = useState(false);
const [f, setF] = useState({ description:
acc.description || "", address: acc.address || "" });
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
await uploadImage(file, { password,
restaurantId: acc.restaurantId }, "logo");
onDone();
} catch (er) {
;("فشل رفع اللوجو" || message.er(setErr
} finally {
setBusy(false);
}
};
const update = async (patch) => {
setBusy(true);
setErr("");
try {
const r = await api({ action:
"sd_adminUpdateAccount", password,
restaurantId: acc.restaurantId, ...patch });
if (r.success) {
setEdit(false);
onDone();
} else {
setErr(r.error || "خطأ حصل;("
setListed(!!acc.listed);
}
} catch {
;("مشكلة في الاتصال")setErr
setListed(!!acc.listed);
} finally {
setBusy(false);
}
};
return (
<div className="adx adx-controls">
<label className="adx-check">
<input type="checkbox" style={{ width: 20, height:
20 }} checked={listed} disabled={busy}
onChange={(e) => { setListed(e.target.checked);
update({ listed: e.target.checked }); }} />
ظاهر في الموقع للعملاء
</label>
<div className="adx-inline">
<button className="adx-small" disabled={busy}
onClick={() => update({ status: acc.status ===
"active" ? "suspended" : "active" })}>
{acc.status === "active" ? "⏸ ▶️" : "الحساب إيقاف
{"تفعيل الحساب
</button>
<button className="adx-small adx-gray"
onClick={() => setEdit((v) => !v)}>✏️ تعديل

button>
</div>
{edit && (
<div className="adx-addform">
<input placeholder="وصف "value={f.description}
onChange={(e) => setF({ ...f, description:
e.target.value })} />
<input placeholder="العنوان "value={f.address}
onChange={(e) => setF({ ...f, address:
e.target.value })} />
{acc.logoUrl && <img className="adx-logoprev" src={assetUrl(acc.logoUrl)} alt="" />}
<label className="adx-upload">
تغيير اللوجو" : " ? logoUrl.acc..." : جاٍر الرفع" ? busy🖼️ {
{""رفع لوجو
<input type="file" accept="image/*" hidden
disabled={busy} onChange={changeLogo} />
</label>
<button className="adx-small" disabled={busy}
onClick={() => update({ description:

address: f.address })}>حفظ/>button>
</div>
)}
{err && <p className="adx-error">{err}</p>}
</div>
);
}
// إيقاف / تفعيل حساب دليفري
function DriverStatusButton({ password, acc,
onDone }) {
const [busy, setBusy] = useState(false);
const [err, setErr] = useState("");
const toggle = async () => {
setBusy(true);
setErr("");
try {
const r = await api({ action:
"sd_adminSetDeliveryStatus", password,
deliveryId: acc.deliveryId, status: acc.status ===
"active" ? "suspended" : "active" });
if (r.success) onDone();
else setErr(r.error || "خطأ حصل;("
} catch {
;("مشكلة في الاتصال")setErr
} finally {
setBusy(false);
}
};
return (
<div className="adx adx-controls">
<button className="adx-small" disabled={busy}
onClick={toggle}>
{acc.status === "active" ? "⏸ ▶️" : "الحساب إيقاف
{"تفعيل الحساب
</button>
{err && <p className="adx-error">{err}</p>}
</div>
);
}
// ===== التحكم في ظهور المحلات للعملاء =====
// كل محل له حالة من 3:
الرئيسية + العملاء (يظهر في الصفحة الأولى ⭐ = home//
وفي صفحة المحلات وعند اختيار القسم)
العملاء فقط (يظهر في صفحة �� = customers//
المحلات وعند اختيار القسم، من غير الصفحة الأولى)
مخفي (مبيظهرش للعميل، لكن بيفضل هنا �� = hidden//
وتقدر ترّجعه في أي وقت)
const VIS_STATES = [
{ key: "home", label: "⭐ الرئيسية ,"patch: { visible:
true, home: true } },
{ key: "customers", label: "👥 فقط العملاء ,"patch: {
visible: true, home: false } },
{ key: "hidden", label: "🚫 مخفي ,"patch: { visible:
false } },
];
function StoresVisibility({ password }) {
const [list, setList] = useState([]);
const [vis, setVis] = useState({});
const [q, setQ] = useState("");
const [filter, setFilter] = useState("all");
const [busy, setBusy] = useState(false);
const [error, setError] = useState("");
const [notice, setNotice] = useState("");
const catName = (s) => (s.category_ids ||
[]).map((id) => (categories.find((c) => c.id === id)
|| {}).name).filter(Boolean).join(" + ");
const load = useCallback(async () => {
setError("");
try {
يضيف المحلات اللي // ;()loadDynamicStores await
من الشيت للقايمة
setList(shops.map((s) => ({ id: String(s.id),
name: String(s.name || "").trim(), cat:

dynamic: !!s.dynamic })));
const r = await api({ action:
"sd_adminGetVisibility", password });
if (r.success) setVis(r.visibility || {});
;("مقدرناش نحّمل الإعدادات" || error.r(setError else
} catch {
;("مشكلة في الاتصال")setError
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
visible: u.visible === undefined ? cur.visible !==
false : u.visible,
home: u.home === undefined ? cur.home !==
false : u.home,
};
});
تحديث فوري على الشاشة // ;(next(setVis
try {
const r = await api({ action:
"sd_adminSetVisibility", password, updates });
if (r.success) {
setVis(r.visibility || next);
setNotice(okMsg || "اتحفظ;("✅
loadDynamicStores();
} else {
setVis(prev);
setError(r.error || "الحفظ فشل;("
}
} catch {
setVis(prev);
;("مشكلة في الاتصال")setError
} finally {
setBusy(false);
}
};
const counts = { all: list.length, home: 0,
customers: 0, hidden: 0 };
list.forEach((s) => { counts[stateOf(s.id)] += 1; });
const shown = list.filter(
(s) =>
(filter === "all" || stateOf(s.id) === filter) &&
(!q.trim() || (s.name + " " +
s.cat).toLowerCase().includes(q.trim().toLowerC
ase()))
);
const pack = (items, patch) => items.map((s) =>
({ storeId: s.id, name: s.name, ...patch }));
const chips = [{ key: "all", label: "الكل ,{ "
...VIS_STATES.map((st) => ({ key: st.key, label:
st.label }))];
return (
<div>
<Msg error={error} notice={notice} />
<p className="adx-muted">
⭐ الرئيسية: يظهر في الصفحة الأولى + صفحة المحلات +
القسم • �� العملاء فقط: صفحة المحلات والقسم بس • ��
مخفي: مبيظهرش
للعميل لكن بيفضل هنا وترّجعه في أي وقت.
</p>
<div className="adx-actions">
{chips.map((c) => (
<button key={c.key} className={filter === c.key
? "" : "adx-gray"} onClick={() => setFilter(c.key)}>
{c.label} ({counts[c.key]})
</button>
))}
</div>
<input className="adx-input" placeholder="🔍
 (e={(onChange} q={value" ابحث باسم المحل أو القسم
=> setQ(e.target.value)} />
<p className="adx-muted">المعروض على تطبيق
({shown.length}):</p>
<div className="adx-actions">
{VIS_STATES.map((st) => (
<button key={st.key} disabled={busy || !
shown.length} className="adx-gray"
onClick={() => apply(pack(shown, st.patch),

{st.label} كلهم
</button>
))}
</div>
{shown.map((s) => {
const cur = stateOf(s.id);
return (
<div className="adx-card" key={s.id}>
<div className="adx-row">
<strong>{s.name}</strong>
<span className="adx-muted">{s.cat}
{s.dynamic ? " • الأدمن من/>{"" : "span>
</div>
<div className="adx-actions">
{VIS_STATES.map((st) => (
<button
key={st.key}
type="button"
disabled={busy}
className={cur === st.key ? "" : "adx-gray"}
aria-pressed={cur === st.key}
onClick={() => cur !== st.key && apply(pack([s],
st.patch))}
>
{st.label}
</button>
))}
</div>
</div>
);
})}
{shown.length === 0 && <p className="adxmuted">نتايج مفيش/>p>}
</div>
);
}
// إضافة دليفري مباشرة من الأدمن
function AddDriverForm({ password, onDone,
onCreated }) {
const empty = { name: "", phone: "", vehicleType:
;{ "" :driverPassword", طنطا" :region", موتوسيكل"
const [open, setOpen] = useState(false);
const [f, setF] = useState(empty);
const [busy, setBusy] = useState(false);
const [err, setErr] = useState("");
const set = (k) => (e) => setF((p) => ({ ...p, [k]:
e.target.value }));
const genPass = () => setF((p) => ({ ...p,
driverPassword:
Math.random().toString(36).slice(2, 7) +
Math.floor(1000 + Math.random() * 9000) }));
const submit = async () => {
setErr("");
setBusy(true);
try {
const r = await api({ action:
"sd_adminAddDriver", password, ...f });
if (r.success) {
setF(empty);
setOpen(false);
onCreated(r);
onDone();
} else setErr(r.error || "خطأ حصل;("
} catch {
;("مشكلة في الاتصال")setErr
} finally {
setBusy(false);
}
};
if (!open) return <div className="adx"><button
style={{ width: "100%" }} onClick={() =>
/><button</إضافة دليفري جديد ➕<{(true(setOpen
div>;
return (
<div className="adx adx-box adx-addform">
<h4</إضافة دليفري ➕<h4<
<input placeholder="الدليفري اسم "* value={f.name}
onChange={set("name")} />
رقم الموبايل * (هو اللي بيدخل "=placeholder input<
(بيه "inputMode="tel" value={f.phone}
onChange={set("phone")} />
<select value={f.vehicleType}
onChange={set("vehicleType")}>
{["موتوسيكل", "عجلة", "سيارة", "توك توك"].(v((map) <=
<option key={v} value={v}>{v}</option>
))}
</select>
<input placeholder="المنطقة "value={f.region}
onChange={set("region")} />
<div className="adx-inline">
الباسورد * (8 حروف ورقم على "=placeholder input<
(الأقل "value={f.driverPassword}
onChange={set("driverPassword")} />
<button type="button" className="adx-small"
onClick={genPass}>🎲 توليد/>button>
</div>
{err && <p className="adx-error">{err}</p>}
<div className="adx-inline">
<button disabled={busy} onClick={submit}>{busy
<button"}</جاٍر الحفظ..." : "حفظ وإنشاء الحساب" ?
<button className="adx-small adx-gray"
disabled={busy} onClick={() => setOpen(false)}
<button</إلغاء<
</div>
</div>
);
}
export default function Admin() {
const [password, setPassword] = useState("");
const [authenticated, setAuthenticated] =
useState(false);
const [loginError, setLoginError] = useState("");
const [loginLoading, setLoginLoading] =
useState(false);
const [tab, setTab] = useState("reviews");
const [orders, setOrders] = useState([]);
const [users, setUsers] = useState([]);
const [offers, setOffers] = useState([]);
const [partnerRequests, setPartnerRequests] =
useState([]);
const [restaurantAccounts,
setRestaurantAccounts] = useState([]);
const [deliveryRequests, setDeliveryRequests] =
useState([]);
const [deliveryAccounts, setDeliveryAccounts] =
useState([]);
const [loading, setLoading] = useState(false);
const [approvedInfo, setApprovedInfo] =
useState(null);
const [accountsError, setAccountsError] =
useState("");
const [approvedDeliveryInfo,
setApprovedDeliveryInfo] = useState(null);
const [detail, setDetail] = useState(null); // { kind:
"restaurant"|"driver"|"customer", data }
// عّداد المراجعات (بيتحّدث كل 20 ثانية وبينبهك بصوت لما
يزيد)
const pending =
useAdminPending(authenticated ? password : "");
useEffect(() => {
if (!authenticated) return;
try {
if ("Notification" in window &&
Notification.permission === "default")
Notification.requestPermission();
} catch {
/* ignore */
}
}, [authenticated]);
// بيانات اليوزر/الباسورد اللي بيكتبها الأدمن لكل طلب شراكة
(rowIndex بـ keyed)
const [approveForms, setApproveForms] =
useState({});
const [approvingRow, setApprovingRow] =
useState(null);
const [approvingDeliveryRow,
setApprovingDeliveryRow] = useState(null);
const [offerForm, setOfferForm] = useState({
title: "",
description: "",
type: "general",
targetPhone: "",
startDate: "",
expiryDate: "",
});
const [offerCreating, setOfferCreating] =
useState(false);
const handleLogin = async (e) => {
e.preventDefault();
setLoginError("");
setLoginLoading(true);
try {
const res = await fetch(CART_SCRIPT_URL, {
method: "POST",
headers: { "Content-Type": "text/
plain;charset=utf-8" },
body: JSON.stringify({ action: "adminLogin",
password }),
});
const data = await res.json();
if (data.success) {
setAuthenticated(true);
} else {
setLoginError(data.error || "غلط باسورد;("
}
} catch (err) {
;("مشكلة في الاتصال")setLoginError
} finally {
setLoginLoading(false);
}
};
const fetchOrders = async () => {
setLoading(true);
try {
const res = await fetch(CART_SCRIPT_URL, {
method: "POST",
headers: { "Content-Type": "text/
plain;charset=utf-8" },
body: JSON.stringify({ action: "adminGetOrders",
password }),
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
headers: { "Content-Type": "text/
plain;charset=utf-8" },
body: JSON.stringify({ action: "adminGetUsers",
password }),
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
headers: { "Content-Type": "text/
plain;charset=utf-8" },
body: JSON.stringify({ action: "adminGetOffers",
password }),
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
headers: { "Content-Type": "text/
plain;charset=utf-8" },
body: JSON.stringify({ action:
"adminGetPartnerRequests", password }),
});
const data = await res.json();
if (data.success)
setPartnerRequests(data.requests);
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
headers: { "Content-Type": "text/
plain;charset=utf-8" },
body: JSON.stringify({ action:
"adminGetRestaurantAccounts", password }),
});
const data = await res.json();
if (data.success) {
setRestaurantAccounts(data.accounts);
setAccountsError("");
} else setAccountsError(data.error || " مقدرناش
;("نحّمل الحسابات
} catch (err) {
console.error(err);
;("مشكلة في الاتصال")setAccountsError
} finally {
setLoading(false);
}
};
const fetchDeliveryRequests = async () => {
setLoading(true);
try {
const res = await fetch(CART_SCRIPT_URL, {
method: "POST",
headers: { "Content-Type": "text/
plain;charset=utf-8" },
body: JSON.stringify({ action:
"adminGetDeliveryRequests", password }),
});
const data = await res.json();
if (data.success)
setDeliveryRequests(data.requests);
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
headers: { "Content-Type": "text/
plain;charset=utf-8" },
body: JSON.stringify({ action:
"adminGetDeliveryAccounts", password }),
});
const data = await res.json();
if (data.success) {
setDeliveryAccounts(data.accounts);
setAccountsError("");
} else setAccountsError(data.error || " مقدرناش
;("نحّمل الحسابات
} catch (err) {
console.error(err);
;("مشكلة في الاتصال")setAccountsError
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
const handleStatusChange = async (rowIndex,
newStatus) => {
setOrders((prev) => prev.map((o) => (o.rowIndex
=== rowIndex ? { ...o, status: newStatus } : o)));
try {
await fetch(CART_SCRIPT_URL, {
method: "POST",
headers: { "Content-Type": "text/
plain;charset=utf-8" },
body: JSON.stringify({ action:
"adminUpdateOrderStatus", password, rowIndex,
newStatus }),
});
} catch (err) {
;(err:", فشل تحديث الحالة")error.console
}
};
const handleOfferFormChange = (e) => {
setOfferForm({ ...offerForm, [e.target.name]:
e.target.value });
};
const handleCreateOffer = async (e) => {
e.preventDefault();
setOfferCreating(true);
try {
const res = await fetch(CART_SCRIPT_URL, {
method: "POST",
headers: { "Content-Type": "text/
plain;charset=utf-8" },
body: JSON.stringify({ action:
"adminCreateOffer", password, ...offerForm }),
});
const data = await res.json();
if (data.success) {
setOfferForm({ title: "", description: "", type:
"general", targetPhone: "", startDate: "",
expiryDate: "" });
fetchOffers();
} else {
alert(data.error || "خطأ حصل;("
}
} catch (err) {
;("مشكلة في الاتصال")alert
} finally {
setOfferCreating(false);
}
};
const handleToggleOffer = async (rowIndex,
currentActive) => {
const newActive = !(currentActive === true ||
currentActive === "TRUE");
setOffers((prev) => prev.map((o) => (o.rowIndex
=== rowIndex ? { ...o, active: newActive } : o)));
try {
await fetch(CART_SCRIPT_URL, {
method: "POST",
headers: { "Content-Type": "text/
plain;charset=utf-8" },
body: JSON.stringify({ action:
"adminToggleOffer", password, rowIndex, active:
newActive }),
});
} catch (err) {
;(err:", فشل تحديث العرض")error.console
}
};
const handleApproveFormChange = (rowIndex,
field, value) => {
setApproveForms((prev) => ({
...prev,
[rowIndex]: { ...prev[rowIndex], [field]: value },
}));
};
const handleApprovePartner = async (rowIndex)
=> {
const form = approveForms[rowIndex] || {};
const username = (form.username || "").trim();
const restaurantPassword = (form.password ||
"").trim();
if (!username || !restaurantPassword) {
;("من فضلك اكتب اليوزر نيم والباسورد الأول")alert
return;
}
setApprovingRow(rowIndex);
try {
const res = await fetch(CART_SCRIPT_URL, {
method: "POST",
headers: { "Content-Type": "text/
plain;charset=utf-8" },
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
alert(data.error || "خطأ حصل;("
}
} catch (err) {
;("مشكلة في الاتصال")alert
} finally {
setApprovingRow(null);
}
};
const handleRejectPartner = async (rowIndex)
=> {
setPartnerRequests((prev) => prev.map((r) =>
(r.rowIndex === rowIndex ? { ...r, status:
"rejected" } : r)));
try {
await fetch(CART_SCRIPT_URL, {
method: "POST",
headers: { "Content-Type": "text/
plain;charset=utf-8" },
body: JSON.stringify({ action:
"adminRejectPartner", password, rowIndex }),
});
} catch (err) {
console.error("الرفض فشل ,":err);
}
};
// الدليفري بالفعل حاطط الباسورد بتاعه وقت التسجيل،
فالأدمن هنا بس بيوافق أو يرفض
const handleApproveDelivery = async (rowIndex)
=> {
setApprovingDeliveryRow(rowIndex);
try {
const res = await fetch(CART_SCRIPT_URL, {
method: "POST",
headers: { "Content-Type": "text/
plain;charset=utf-8" },
body: JSON.stringify({ action:
"adminApproveDelivery", password, rowIndex }),
});
const data = await res.json();
if (data.success) {
setApprovedDeliveryInfo(data);
fetchDeliveryRequests();
fetchDeliveryAccounts();
} else {
alert(data.error || "خطأ حصل;("
}
} catch (err) {
;("مشكلة في الاتصال")alert
} finally {
setApprovingDeliveryRow(null);
}
};
const handleRejectDelivery = async (rowIndex)
=> {
setDeliveryRequests((prev) => prev.map((r) =>
(r.rowIndex === rowIndex ? { ...r, status:
"rejected" } : r)));
try {
await fetch(CART_SCRIPT_URL, {
method: "POST",
headers: { "Content-Type": "text/
plain;charset=utf-8" },
body: JSON.stringify({ action:
"adminRejectDelivery", password, rowIndex }),
});
} catch (err) {
console.error("الرفض فشل ,":err);
}
};
if (!authenticated) {
return (
<div className="admin-login-container">
<form onSubmit={handleLogin}
className="admin-login-form">
<h2</دخول الأدمن ��<h2<
<input
type="password"
"الباسورد"=placeholder
value={password}
onChange={(e) => setPassword(e.target.value)}
required
/>
<button type="submit" disabled={loginLoading}>
{"جاٍر التحقق..." : "دخول" ? loginLoading{
</button>
{loginError && <p style={{ color: "red" }}
>{loginError}</p>}
</form>
</div>
);
}
return (
<div className="admin-page">
<div className="admin-topbar">
<h2</لوحة التحكم<h2<
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
<button className={tab === "reviews" ? "admintab active" : "admin-tab"} onClick={() =>
setTab("reviews")}>
✅ مراجعات
{pending && pending.total > 0 && <span
className="adx-badge">{pending.total}</span>}
</button>
<button className={tab === "partners" ? "admintab active" : "admin-tab"} onClick={() =>
setTab("partners")}>
�� الشركاء
</button>
<button className={tab === "delivery" ? "admintab active" : "admin-tab"} onClick={() =>
setTab("delivery")}>
�� الدليفري
</button>
<button className={tab === "users" ? "admintab active" : "admin-tab"} onClick={() =>
setTab("users")}>
�� العملاء
</button>
<button className={tab === "orders" ? "admintab active" : "admin-tab"} onClick={() =>
setTab("orders")}>
�� الأوردرات
</button>
<button className={tab === "live" ? "admin-tab
active" : "admin-tab"} onClick={() =>
setTab("live")}>
�� لايف
</button>
<button className={tab === "offers" ? "admintab active" : "admin-tab"} onClick={() =>
setTab("offers")}>
️�� العروض
</button>
<button className={tab === "settings" ? "admintab active" : "admin-tab"} onClick={() =>
setTab("settings")}>
️⚙ إعدادات
</button>
</div>
{tab === "reviews" && (
<div className="adx">
{pending && (
<p className="adx-muted">
دفع أوردرات {orderPayments.pending • {شراء نقاط
 • {pending.refunds} استرداد} • pending.purchases}
{pending.menuRequests} منيو
</p>
)}
<Reviews password={password} />
</div>
)}
{tab === "settings" && (
<div className="adx">
<h3</باقات النقاط وتوصيل المطاعم ⭐<h3<
<PointsAndDelivery password={password} />
<h3 style={{ marginTop: 24 }}>🏬 في اللي المحلات
<h3</الكود (ظهور فقط)
<StoresVisibility password={password} />
<h3 style={{ marginTop: 24 }}>🍔 الأصناف خصم
<h3)</سريع)
<MenuDiscounts password={password} />
<ChangeLog password={password} />
</div>
)}
{tab === "live" && <div
className="adx"><LiveDrivers
password={password} /></div>}
{detail && detail.kind === "restaurant" && (
<RestaurantDetail key={detail.data.restaurantId}
password={password} acc={detail.data}
onClose={() => setDetail(null)} onChanged={() =>
{ fetchRestaurantAccounts();
loadDynamicStores(); }} />
)}
{detail && detail.kind === "driver" && (
<DriverDetail key={detail.data.deliveryId}
password={password} acc={detail.data}
onClose={() => setDetail(null)}
onChanged={fetchDeliveryAccounts} />
)}
{detail && detail.kind === "customer" && (
<CustomerDetail key={detail.data.phone}
password={password}
phone={String(detail.data.phone)} onClose={()
=> setDetail(null)} onChanged={fetchUsers} />
)}
{loading && <p style={{ textAlign: "center" }}> رٍجا
{<p...</التحميل
{tab === "orders" && !loading && (
<div className="admin-list">
{orders.length === 0 && <p style={{ textAlign:
{<p</مفيش أوردرات<{{ "center"
{orders.map((order) => (
<div key={order.rowIndex} className="admincard">
<div className="admin-card-header">
<strong>{order.storeName || "طلب/>{"strong>
<span>{order.total} م.ج/>span>
</div>
<div className="admin-card-body">
<span>{order.customerName} -
{order.customerPhone}</span>
<span>{order.address}</span>
<span>{new
Date(order.timestamp).toLocaleString("ar-EG")}</
span>
</div>
<select
value={order.status}
onChange={(e) =>
handleStatusChange(order.rowIndex,
e.target.value)}
className="admin-status-select"
>
{STATUS_OPTIONS.map((s) => (
<option key={s} value={s}>{STATUS_LABELS[s]}
</option>
))}
</select>
</div>
))}
</div>
)}
{tab === "users" && !loading && (
<div className="admin-list">
{users.length === 0 && <p style={{ textAlign:
{<p</مفيش مستخدمين<{{ "center"
{users.map((u, idx) => (
<div key={idx} className="admin-card">
<div className="admin-card-header">
<strong>{u.name}</strong>
<span>⭐ {u.points}</span>
</div>
<div className="admin-card-body">
<span>{u.phone}</span>
 new: {سجل في<span<
Date(u.registeredAt).toLocaleDateString("ar-EG")}
</span>
</div>
<button className="adm-btn adm-open"
onClick={() => setDetail({ kind: "customer", data:
<button</فتح بيانات العميل ��<{({ u
</div>
))}
</div>
)}
{tab === "offers" && (
<>
<form onSubmit={handleCreateOffer}
className="admin-offer-form">
<h3</إضافة عرض جديد ➕<h3<
<input
type="text"
name="title"
"عنوان العرض"=placeholder
value={offerForm.title}
onChange={handleOfferFormChange}
required
/>
<textarea
name="description"
"وصف قصير للعرض"=placeholder
value={offerForm.description}
onChange={handleOfferFormChange}
required
/>
<select name="type" value={offerForm.type}
onChange={handleOfferFormChange}>
/>عرض عام (لكل الزوار)<"general="value option<
option>
/>عرض شخصي (رقم معين)<"personal="value option<
option>
</select>
{offerForm.type === "personal" && (
<input
type="tel"
name="targetPhone"
"رقم الموبايل المستهدف"=placeholder
value={offerForm.targetPhone}
onChange={handleOfferFormChange}
required
/>
)}
<label className="admin-offer-label"> بداية تاريخ
<label</العرض
<input
type="date"
name="startDate"
value={offerForm.startDate}
onChange={handleOfferFormChange}
required
/>
<label className="admin-offer-label"> انتهاء تاريخ
<label</العرض
<input
type="date"
name="expiryDate"
value={offerForm.expiryDate}
onChange={handleOfferFormChange}
required
/>
<button type="submit" disabled={offerCreating}>
{"جاٍر الإضافة..." : "إضافة العرض" ? offerCreating{
</button>
</form>
{!loading && (
<div className="admin-list" style={{ marginTop:
"20px" }}>
{offers.length === 0 && <p style={{ textAlign:
{<p</مفيش عروض لسه<{{ "center"
{offers.map((offer) => {
const isActive = offer.active === true ||
offer.active === "TRUE";
return (
<div key={offer.rowIndex} className="admincard">
<div className="admin-card-header">
<strong>{offer.title}</strong>
<span>{offer.type === "personal" ? "🎁 : "شخصي
<span 🌍""}</عام
</div>
<div className="admin-card-body">
<span>{offer.description}</span>
{offer.targetPhone && <span>الرقم :
{offer.targetPhone}</span>}
{offer.startDate && <span>من} :new
Date(offer.startDate).toLocaleDateString("arEG")}</span>}
{offer.expiryDate && <span>لـ} :new
Date(offer.expiryDate).toLocaleDateString("arEG")}</span>}
</div>
<button
className="admin-toggle-btn"
onClick={() => handleToggleOffer(offer.rowIndex,
offer.active)}
style={{ background: isActive ? "#4caf50" :
"#999" }}
>
فعال - دوس للإيقاف" : "⏸ متوقف - ✅" ? isActive{
{"دوس للتفعيل
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
تم إنشاء حساب شريك ✅<p<
"{approvedInfo.restaurantName}" بنجاح/>!p>
<p><strong>نيم اليوزر/>:strong>
{approvedInfo.username}</p>
<p><strong>الباسورد/>:strong>
{approvedInfo.restaurantPassword}</p>
<div className="admin-approved-actions">
<a
href={buildWhatsAppLink(
approvedInfo.phone,
مرحبًا ${ownerName.approvedInfo\👋 {n\nتم تفعيل
VE على}" approvedInfo.restaurantName}$" حساب
n\n ✅\Voucherبيانات الدخول:\nاليوزر نيم: $
$ :الباسوردn\{approvedInfo.username}
مبروكn\n\{approvedInfo.restaurantPassword}
الانضمام لينا ��
)}
target="_blank"
rel="noopener noreferrer"
className="admin-whatsapp-link"
>
�� إرسال بيانات الدخول على واتساب
</a>
<button className="admin-close-btn"
onClick={() => setApprovedInfo(null)}>إغلاق/>
button>
</div>
</div>
)}
<h3 style={{ margin: "10px 0" }}>📋 الشراكة طلبات/>
h3>
<div className="admin-list">
{partnerRequests.length === 0 && <p style={{
textAlign: "center" }}>طلبات مفيش/>p>}
{partnerRequests.map((req) => (
<div key={req.rowIndex} className="admincard">
<div className="admin-card-header">
<strong>{req.restaurantName}</strong>
<span>{req.status === "pending" ? "⏳ قيد
المراجعة : "req.status === "approved" ? "✅ مقبول : "
"❌ مرفوض"}</span<
</div>
<div className="admin-card-body">
<span>النشاط صاحب} :req.ownerName}</span>
<span>الرقم} :req.phone}</span>
{req.category && <span>النشاط} :req.category}</
span>}
<span>{new
Date(req.timestamp).toLocaleString("ar-EG")}</
span>
</div>
{req.status === "pending" && (
<div style={{ display: "flex", flexDirection:
"column", gap: "8px", marginTop: "8px" }}>
<input
type="text"
className="admin-partner-input"
"اليوزر نيم"=placeholder
value={approveForms[req.rowIndex]?.username
|| ""}
onChange={(e) =>
handleApproveFormChange(req.rowIndex,
"username", e.target.value)}
/>
<input
type="text"
className="admin-partner-input"
"الباسورد"=placeholder
value={approveForms[req.rowIndex]?.password
|| ""}
onChange={(e) =>
handleApproveFormChange(req.rowIndex,
"password", e.target.value)}
/>
<div className="admin-partner-actions">
<button
className="admin-toggle-btn"
style={{ background: "#4caf50" }}
onClick={() =>
handleApprovePartner(req.rowIndex)}
disabled={approvingRow === req.rowIndex}
>
جاٍر الموافقة..." " ? rowIndex.req === approvingRow{
{": "✅ موافقة
</button>
<button
className="admin-toggle-btn"
style={{ background: "#c62828" }}
onClick={() =>
handleRejectPartner(req.rowIndex)}
>
❌ رفض
</button>
</div>
</div>
)}
</div>
))}
</div>
<h3 style={{ margin: "20px 0 10px" }}>🏪 حسابات
<h3</الشركاء النشطة
<div className="admin-list">
{accountsError && <p style={{ textAlign: "center",
color: "#c62828" }}>⚠️ {accountsError}</p>}
{!accountsError && restaurantAccounts.length
=== 0 && <p style={{ textAlign: "center" }}> مفيش
{<p</حسابات لسه
{restaurantAccounts.map((acc) => (
<div key={acc.rowIndex} className="admincard">
<div className="admin-card-header">
<strong>{acc.logoUrl && <img className="adxlogo-mini" src={assetUrl(acc.logoUrl)} alt="" />}
{acc.restaurantName}</strong>
<span>{acc.status === "active" ? "🟢 🔴" : "نشط
<span"}</موقوف
</div>
<div className="admin-card-body">
<span>النشاط صاحب} :acc.ownerName}</span>
<span>الرقم} :acc.phone}</span>
{acc.category && <span>النشاط} :acc.category}</
span>}
<span>نيم اليوزر} :acc.username}</span>
<span>الباسورد} :acc.password}</span>
 new: {تاريخ الإنشاء<span<
Date(acc.createdAt).toLocaleDateString("ar-EG")}
</span>
<span>المنيو مفتاح} :acc.storeId ||
acc.restaurantId} • التوصيل} :acc.deliveryEnabled
<span"}</مقفول" : "✅ شغال ❌" ? false===
</div>
<button className="adm-btn adm-open"
onClick={() => setDetail({ kind: "restaurant", data:
<button</فتح كل البيانات والتحكم ��<{({ acc
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
تم تفعيل حساب الدليفري ✅<p<
"{approvedDeliveryInfo.name}" بنجاح/>!p>
<p><strong>الرقم/>:strong>
{approvedDeliveryInfo.phone}</p>
<p><strong>الباسورد/>:strong>
{approvedDeliveryInfo.password}</p>
<div className="admin-approved-actions">
<a
href={buildWhatsAppLink(
approvedDeliveryInfo.phone,
تمn\n\👋 {approvedDeliveryInfo.name}$ اًمرحب
تفعيل حسابك كمندوب دليفري على Voucher VE
n\n✅\بيانات الدخول:\nالرقم: $
$ :الباسوردn\{approvedDeliveryInfo.phone}
مبروكn\n\{approvedDeliveryInfo.password}
الانضمام لينا ��
)}
target="_blank"
rel="noopener noreferrer"
className="admin-whatsapp-link"
>
�� إبلاغه على واتساب
</a>
<button className="admin-close-btn"
onClick={() => setApprovedDeliveryInfo(null)}
<button</إغلاق<
</div>
</div>
)}
<h3 style={{ margin: "10px 0" }}>📋 الدليفري طلبات/>
h3>
<div className="admin-list">
{deliveryRequests.length === 0 && <p style={{
textAlign: "center" }}>طلبات مفيش/>p>}
{deliveryRequests.map((req) => (
<div key={req.rowIndex} className="admincard">
<div className="admin-card-header">
<strong>{req.name}</strong>
<span>{req.status === "pending" ? "⏳ قيد
المراجعة : "req.status === "approved" ? "✅ : "مقبول
<span ❌""}</مرفوض
</div>
<div className="admin-card-body">
<span>الرقم} :req.phone}</span>
<span>المركبة} :req.vehicleType}</span>
<span>المنطقة} :req.region}</span>
<span>{new
Date(req.timestamp).toLocaleString("ar-EG")}</
span>
</div>
{req.status === "pending" && (
<div className="admin-partner-actions" style={{
marginTop: "8px" }}>
<button
className="admin-toggle-btn"
style={{ background: "#4caf50" }}
onClick={() =>
handleApproveDelivery(req.rowIndex)}
disabled={approvingDeliveryRow ===
req.rowIndex}
>
{approvingDeliveryRow === req.rowIndex ? " رٍجا
{"الموافقة..." : "✅ موافقة
</button>
<button
className="admin-toggle-btn"
style={{ background: "#c62828" }}
onClick={() =>
handleRejectDelivery(req.rowIndex)}
>
❌ رفض
</button>
</div>
)}
</div>
))}
</div>
<h3 style={{ margin: "20px 0 10px" }}>🛵 حسابات
<h3</الدليفري النشطة
<div className="admin-list">
{accountsError && <p style={{ textAlign: "center",
color: "#c62828" }}>⚠️ {accountsError}</p>}
{!accountsError && deliveryAccounts.length ===
0 && <p style={{ textAlign: "center" }}> مفيش
{<p</حسابات لسه
{deliveryAccounts.map((acc) => (
<div key={acc.rowIndex} className="admin-
card">
<div className="admin-card-header">
<strong>{acc.name}</strong>
<span>{acc.status === "active" ? "🟢 🔴" : "نشط
<span"}</موقوف
</div>
<div className="admin-card-body">
<span>الرقم} :acc.phone}</span>
<span>الباسورد} :acc.password}</span>
<span>المركبة} :acc.vehicleType}</span>
<span>المنطقة} :acc.region}</span>
 new: {تاريخ الإنشاء<span<
Date(acc.createdAt).toLocaleDateString("ar-EG")}
</span>
</div>
<button className="adm-btn adm-open"
onClick={() => setDetail({ kind: "driver", data: acc
<button</فتح كل البيانات والتحكم ��<{({
</div>
))}
</div>
</>
)}
</div>
);
}
 
