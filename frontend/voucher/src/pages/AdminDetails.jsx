// شاشات التحكم الكامل للأدمن: مطعم / دليفري / عميل
// أي تعديل بيتحفظ في الشيت على طول (وبيتسجل في تاب AdminLog).
import { useState, useEffect, useCallback } from "react";
import { CART_SCRIPT_URL } from "../data/data.js";
import { uploadImage, assetUrl } from "../data/imageUtil.js";
import OptionsEditor from "../components/OptionsEditor.jsx";
import { prepareOptions, fmtField } from "../data/optionsUtil.js";

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
  const [f, setF] = useState({ ...item, quantity: item.quantity === null || item.quantity === undefined ? "" : item.quantity, options: Array.isArray(item.options) ? JSON.parse(JSON.stringify(item.options)) : [] });
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
        item: { itemId: item.itemId || undefined, name: f.name, description: f.description, price: f.price, discountPercent: f.discountPercent, category: f.category, imageUrl: f.imageUrl, available: f.available, quantity: f.quantity, options: prepareOptions(f.options) },
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
      <OptionsEditor value={f.options} onChange={(options) => setF({ ...f, options })} basePrice={f.price} />
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
  const blank = { itemId: "", name: "", description: "", price: "", discountPercent: 0, category: "", imageUrl: "", available: true, quantity: null, options: [] };
  const shown = items.filter((i) => !q || i.name.includes(q) || String(i.category).includes(q));
  return (
    <div>
      <p className="adm-hint">{items.length} صنف. أي حفظ بيتسجل في الشيت فوراً.</p>
      <h4>➕ صنف جديد</h4>
      <ItemRow key={"new" + items.length} password={password} storeId={storeId} item={blank} onChanged={load} />
      <h4>📋 الأصناف</h4>
      {items.length > 6 && <input className="adm-search" placeholder="🔍 بحث" value={q} onChange={(e) => setQ(e.target.value)} />}
      {shown.map((it) => (
        <ItemRow key={it.itemId + "|" + it.name + it.price + it.discountPercent + it.available + it.quantity + JSON.stringify(it.options || [])} password={password} storeId={storeId} item={it} onChanged={load} />
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
          {q.newData && <small>{Object.keys(q.newData).map((k) => `${k}: ${fmtField(k, q.newData[k])}`).join(" • ")}</small>}
          {q.oldData && <small>قبل: {Object.keys(q.oldData).map((k) => `${k}: ${fmtField(k, q.oldData[k])}`).join(" • ")}</small>}
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
    percentage: String(acc.percentage || "").replace("%", ""), note: acc.note || "", altName: acc.altName || "",
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
      update({ name: f.name, ownerName: f.ownerName, phone: f.phone, category: f.category, username: f.username, restaurantPassword: f.restaurantPassword, description: f.description, address: f.address, percentage: f.percentage, note: f.note, altName: f.altName, links })
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
        {[["info", "📝 البيانات"], ["orders", "📊 الطلبات والنقاط"], ["menu", "🍽️ المنيو"], ["review", "📝 المراجعات"], ["media", "🖼️ الصور"], ["log", "📜 السجل"], ["ctl", "⚙️ التحكم"]].map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "info" && (
        <div className="adm-form">
          <Field label="اسم المحل"><input value={f.name} onChange={set("name")} /></Field>
          <Field label="الاسم بالعربي / English (للسيرش)"><input value={f.altName} onChange={set("altName")} placeholder="مثلاً: رولز أو Rolz" /></Field>
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
      {tab === "log" && <ActivityList password={password} store={String(storeId)} extraStores={[String(acc.restaurantId || "")]} />}

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
        <ShiftsPanel password={password} phone={String(acc.phone)} onChanged={onChanged} />
        <h4>📜 سجل حركاته</h4>
        <ActivityList password={password} type="driver" actor={acc.name} />
        {ov && <><h4>🧾 آخر أوردراته</h4><OrdersList orders={ov.orders} /></>}
      </div>
    </Modal>
  );
}


/* ===================== الشيفتات والمسار ===================== */

const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const hm = (v) => (v ? new Date(v).toLocaleString("ar-EG", { weekday: "short", hour: "2-digit", minute: "2-digit", day: "numeric", month: "numeric" }) : "—");
const dur = (a, b) => {
  const m = Math.max(0, Math.round(((b || Date.now()) - a) / 60000));
  return `${Math.floor(m / 60)}س ${m % 60}د`;
};

function TrackMap({ points }) {
  if (!points || points.length < 2) return <p className="adm-hint">مفيش نقط كفاية للمسار.</p>;
  const lats = points.map((p) => p.lat), lngs = points.map((p) => p.lng);
  const minLa = Math.min(...lats), maxLa = Math.max(...lats), minLn = Math.min(...lngs), maxLn = Math.max(...lngs);
  const W = 320, H = 240, pad = 14;
  const k = Math.cos(((minLa + maxLa) / 2) * Math.PI / 180);
  const spanX = Math.max((maxLn - minLn) * k, 1e-5), spanY = Math.max(maxLa - minLa, 1e-5);
  const sc = Math.min((W - pad * 2) / spanX, (H - pad * 2) / spanY);
  const X = (p) => pad + ((p.lng - minLn) * k) * sc;
  const Y = (p) => H - pad - (p.lat - minLa) * sc;
  const pts = points.map((p) => `${X(p).toFixed(1)},${Y(p).toFixed(1)}`).join(" ");
  const a = points[0], z = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="adm-track" role="img" aria-label="مسار الدليفري">
      <rect width={W} height={H} rx="10" fill="#f4f6f8" />
      <polyline points={pts} fill="none" stroke="#ff6b00" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx={X(a)} cy={Y(a)} r="6" fill="#22a45d" />
      <circle cx={X(z)} cy={Y(z)} r="6" fill="#c0392b" />
    </svg>
  );
}

function ShiftsPanel({ password, phone, onChanged }) {
  const [st, setSt] = useState(null);
  const [rows, setRows] = useState([]);
  const [leave, setLeave] = useState({ onLeave: false, until: "" });
  const [trk, setTrk] = useState(null);
  const { busy, msg, run } = useSaver();

  const load = useCallback(async () => {
    try {
      const r = await api({ action: "sh_adminGetDriver", password, phone });
      if (r.success) {
        setSt(r);
        setRows((r.schedule || []).map((x) => ({ day: x.day, start: x.start, end: x.end })));
        setLeave({ onLeave: !!r.leaveForever, until: r.leaveUntil || "" });
      }
    } catch { /* ignore */ }
  }, [password, phone]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const r = await run(() => api({ action: "sh_adminSetSchedule", password, phone, shifts: rows, onLeave: leave.onLeave, leaveUntil: leave.onLeave ? "" : leave.until }));
    if (r) { await load(); onChanged && onChanged(); }
  };
  const forceEnd = async () => {
    if (!window.confirm("إنهاء شيفت الدليفري دلوقتي؟")) return;
    const r = await run(() => api({ action: "sh_adminEndShift", password, phone }));
    if (r) { await load(); onChanged && onChanged(); }
  };
  const showTrack = async (id) => {
    setTrk({ id, loading: true });
    try {
      const r = await api({ action: "sh_adminShiftTrack", password, shiftId: id });
      setTrk(r.success ? { id, ...r } : { id, err: r.error || "حصل خطأ" });
    } catch { setTrk({ id, err: "مشكلة في الاتصال" }); }
  };
  const setRow = (i, k, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  if (!st) return <p className="adm-hint">جارٍ تحميل الشيفتات...</p>;
  return (
    <div className="adm-shifts">
      <h4>🕒 الشيفتات</h4>
      <p className="adm-hint">
        {st.onDuty ? `🟢 في الشيفت من ${hm(st.startedAt)} (${dur(st.startedAt)})${st.overrun ? " — ميعاده خلص وبيكمّل أوردر" : ""}` : st.onLeave ? "🏖️ في إجازة" : "⚪ برّه الشيفت — مش بيجيله أوردرات"}
        {!st.hasSchedule && " • مفيش جدول: يقدر يبدأ في أي وقت"}
      </p>
      {st.onDuty && <button className="adm-btn" disabled={busy} onClick={forceEnd}>⏹️ إنهاء شيفته دلوقتي</button>}

      {rows.map((r, i) => (
        <div className="adm-shift-row" key={i}>
          <select value={r.day} onChange={(e) => setRow(i, "day", Number(e.target.value))}>
            {DAYS_AR.map((n, d) => <option key={d} value={d}>{n}</option>)}
          </select>
          <input type="time" value={r.start} onChange={(e) => setRow(i, "start", e.target.value)} />
          <span>→</span>
          <input type="time" value={r.end} onChange={(e) => setRow(i, "end", e.target.value)} />
          <button type="button" className="adm-x" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button type="button" className="adm-btn" onClick={() => setRows([...rows, { day: 0, start: "10:00", end: "18:00" }])}>➕ إضافة شيفت</button>
      <p className="adm-hint">لو الشيفت بيعدّي نص الليل (مثلاً 22:00 → 02:00) هيتحسب على اليوم اللي بدأ فيه.</p>

      <label className="adm-check">
        <input type="checkbox" checked={leave.onLeave} onChange={(e) => setLeave({ ...leave, onLeave: e.target.checked })} /> 🏖️ في إجازة (لحد ما أرجعه)
      </label>
      {!leave.onLeave && (
        <Field label="أو إجازة لحد تاريخ (شامل اليوم ده)">
          <input type="date" value={leave.until} onChange={(e) => setLeave({ ...leave, until: e.target.value })} />
        </Field>
      )}
      <button className="adm-btn big" disabled={busy} onClick={save}>{busy ? "جارٍ الحفظ..." : "💾 حفظ الشيفتات والإجازة"}</button>
      <Msg msg={msg} />

      <h4>📍 سجل الشيفتات والمسار</h4>
      {(st.shifts || []).length === 0 && <p className="adm-hint">لسه مفيش شيفتات اتسجلت.</p>}
      {(st.shifts || []).map((s) => (
        <div className="adm-ord" key={s.shiftId}>
          <b>{hm(s.startAt)} ← {s.active ? "شغال دلوقتي" : hm(s.endAt)}</b>
          <small>المدة {dur(s.startAt, s.endAt)} • سلّم {s.delivered} أوردر{s.endedBy ? ` • الإنهاء: ${s.endedBy}` : ""}</small>
          <button type="button" className="adm-btn" onClick={() => showTrack(s.shiftId)}>🗺️ المسار</button>
          {trk && trk.id === s.shiftId && (
            trk.loading ? <p className="adm-hint">جارٍ التحميل...</p>
              : trk.err ? <p className="adm-err">⚠️ {trk.err}</p>
              : <><TrackMap points={trk.points} /><p className="adm-hint">{trk.totalPoints} نقطة • حوالي {trk.distanceKm} كم • 🟢 البداية 🔴 النهاية</p></>
          )}
        </div>
      ))}
    </div>
  );
}

/* ===================== سجل الحركات ===================== */

const TYPE_AR = { admin: "👑 الأدمن", partner: "🏪 المطعم", driver: "🛵 دليفري", system: "⚙️ السيستم" };

function ActivityList({ password, store, extraStores, type, actor }) {
  const [log, setLog] = useState(null);
  const [err, setErr] = useState("");
  const [kind, setKind] = useState(type || "");
  useEffect(() => {
    api({ action: "sd_adminGetLog", password, limit: 300, store: store || "", type: kind })
      .then((r) => (r.success ? setLog(r.log) : setErr(r.error || "حصل خطأ")))
      .catch(() => setErr("مشكلة في الاتصال"));
  }, [password, store, kind]);
  if (err) return <p className="adm-err">⚠️ {err}</p>;
  if (!log) return <p className="adm-hint">جارٍ التحميل...</p>;
  const list = log.filter((l) => (!actor || String(l.actor) === String(actor) || String(l.target).includes(actor)));
  return (
    <div className="adm-log">
      {!type && (
        <div className="adm-seg">
          {[["", "الكل"], ["admin", "الأدمن"], ["partner", "المطاعم"], ["driver", "الدليفري"]].map(([k, l]) => (
            <button key={k} className={kind === k ? "on" : ""} onClick={() => { setLog(null); setKind(k); }}>{l}</button>
          ))}
        </div>
      )}
      {list.length === 0 && <p className="adm-hint">مفيش حركات مسجلة.</p>}
      {list.map((l, i) => (
        <div className="adm-ord" key={i}>
          <b>{l.action}{l.target ? ` — ${l.target}` : ""}</b>
          <small>{TYPE_AR[l.type] || l.type}: {l.actor || "—"} • {fmt(l.time)}</small>
          {l.detail && <small className="adm-detail">{String(l.detail)}</small>}
        </div>
      ))}
    </div>
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
  return (
    <div>
      <h3>📜 سجل كل الحركات</h3>
      <ActivityList password={password} />
    </div>
  );
}
