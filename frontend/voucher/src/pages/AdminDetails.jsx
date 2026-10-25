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
        {[["info", "📝 البيانات"], ["media", "🖼️ الصور"], ["menu", "🍽️ المنيو"], ["ctl", "⚙️ التحكم"]].map(([k, l]) => (
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
  const save = async () => {
    const r = await run(() => api({ action: "sd_adminUpdateDriver", password, deliveryId: acc.deliveryId, ...f }));
    if (r) onChanged();
  };
  return (
    <Modal title={`🛵 ${acc.name}`} onClose={onClose}>
      <div className="adm-form">
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
