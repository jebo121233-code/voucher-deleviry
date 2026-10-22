import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import "./Driver.css";
import { CART_SCRIPT_URL } from "../data/data.js";
import { useAuth } from "../context/AuthContext.jsx";
import { startLocationWatch } from "../native/tracking.js";

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
  new: "المطعم لسه هيبدأ التجهيز",
  preparing: "المطعم بيجهز الأوردر",
  ready: "الأوردر جاهز في المطعم",
  awaiting_handover: "مستني المطعم يأكد التسليم",
  on_the_way: "في الطريق للعميل",
};

// بيحوّل الأصناف لقائمة قراءة سهلة (من Lines لو موجودة، وإلا من Items)
function itemsOf(o) {
  try {
    const lines = JSON.parse(o.Lines || "[]");
    if (Array.isArray(lines) && lines.length && lines.every((l) => l.name || l.itemName)) {
      return lines.map((l) => `${l.qty || l.quantity || 1}× ${l.name || l.itemName || ""}`);
    }
  } catch {
    /* بنرجع للنص العادي */
  }
  return o.Items ? String(o.Items).split(/[\n,،]+/).map((s) => s.trim()).filter(Boolean) : [];
}

const paymentText = (o) => {
  const m = String(o.PaymentMethod || "").toLowerCase();
  if (m.includes("vodafone") || m.includes("فودافون")) return "اتدفع فودافون كاش (راجعها الأدمن)";
  return "كاش عند الاستلام";
};

export default function Driver() {
  const navigate = useNavigate();
  const { role, driver, token, logout } = useAuth();
  const phone = driver ? driver.phone : "";

  const [tab, setTab] = useState("work");
  const [current, setCurrent] = useState(null);
  const [available, setAvailable] = useState([]);
  const [history, setHistory] = useState([]);
  const [target, setTarget] = useState(null);
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [gps, setGps] = useState("waiting"); // waiting | ok | denied | unsupported
  const lastPos = useRef(null);
  const intervalSec = useRef(30);

  useEffect(() => {
    if (role !== "delivery" || !token) navigate("/login");
  }, [role, token, navigate]);

  const call = useCallback(
    (action, extra = {}) => api({ action, driverPhone: phone, token, ...extra }),
    [phone, token]
  );

  // ===== تحديث الشغل =====
  const refresh = useCallback(async () => {
    if (!phone || !token) return;
    try {
      const cur = await call("of_driverCurrent");
      if (!cur.success) {
        setError(cur.error || "حصل خطأ");
        return;
      }
      setError("");
      setCurrent(cur.order || null);
      if (cur.order) {
        setAvailable([]);
        const t = await api({ action: "tr_driverTarget", phone, token, orderId: cur.order.OrderID });
        setTarget(t.success ? t : null);
      } else {
        setTarget(null);
        const av = await call("of_driverAvailable");
        if (av.success) setAvailable(av.orders || []);
      }
    } catch {
      setError("مشكلة في الاتصال، هنحاول تاني");
    } finally {
      setLoaded(true);
    }
  }, [call, phone, token]);

  useEffect(() => {
    refresh();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (tab !== "history" || !phone) return;
    call("of_history", { role: "driver", id: phone }).then((r) => r.success && setHistory(r.history || []));
  }, [tab, call, phone]);

  // ===== إرسال الموقع: في تطبيق الأندرويد بيكمّل في الخلفية، وفي المتصفح والصفحة مفتوحة =====
  useEffect(() => {
    if (!phone || !token) return undefined;
    let stopped = false;
    let lastSent = 0;
    let sending = false;
    const buffer = [];

    const flush = async () => {
      if (stopped || sending || !buffer.length) return;
      if (Date.now() - lastSent < intervalSec.current * 1000) return;
      sending = true;
      const pts = buffer.splice(0, buffer.length).slice(-20);
      try {
        const r = await api({
          action: "tr_ping",
          phone,
          token,
          ...pts[pts.length - 1],
          points: pts,
          appState: document.visibilityState,
        });
        if (r.success) {
          lastSent = Date.now();
          if (r.intervalSec) intervalSec.current = r.intervalSec;
        }
      } catch {
        // الإنترنت فصل: نحتفظ بالنقط ونبعتها مع الدورة الجاية
        buffer.unshift(...pts);
        if (buffer.length > 60) buffer.splice(0, buffer.length - 60);
      } finally {
        sending = false;
      }
    };

    const stopWatch = startLocationWatch({
      onState: (s) => !stopped && setGps(s),
      onPos: (p) => {
        lastPos.current = p;
        buffer.push(p);
        flush();
      },
    });

    // لو واقف مكانه مفيش تحديثات جديدة، فبنكرر آخر مكان عشان الإدارة تشوفه أونلاين
    const timer = setInterval(() => {
      if (!buffer.length && lastPos.current && Date.now() - lastSent >= intervalSec.current * 1000) {
        buffer.push({ ...lastPos.current, t: Date.now() });
      }
      flush();
    }, 5000);

    return () => {
      stopped = true;
      clearInterval(timer);
      stopWatch();
    };
  }, [phone, token]);

  const act = async (action, orderId, okMsg) => {
    setBusyAction(action + orderId);
    setError("");
    try {
      const r = await call(action, { orderId });
      if (!r.success) setError(r.error || "مقدرناش ننفذ");
      else if (okMsg && r.delayMinutes > 0) setError(`${okMsg} (تأخير ${r.delayMinutes} دقيقة اتسجل)`);
      await refresh();
    } catch {
      setError("مشكلة في الاتصال، حاول تاني");
    } finally {
      setBusyAction("");
    }
  };

  const confirmDeliver = (orderId) => {
    if (window.confirm("تأكيد إنك سلّمت الأوردر للعميل؟")) act("of_driverDelivered", orderId);
  };

  if (role !== "delivery" || !driver) return null;

  const gpsLabel = {
    ok: "📍 مكانك بيتبعت",
    waiting: "📡 بندوّر على الموقع...",
    denied: "⚠️ اسمح للموقع من إعدادات المتصفح",
    unsupported: "⚠️ الجهاز مبيدعمش الموقع",
  }[gps];

  const renderCurrent = (o) => {
    const arrived = !!o.ArrivedAt;
    const picked = !!o.DriverPickupAt;
    const onWay = o.Status === "on_the_way";
    const canPickup = arrived && !picked && ["ready", "awaiting_handover"].includes(o.Status);
    const items = itemsOf(o);
    const cust = target ? target.customer : { name: o.CustomerName, phone: o.CustomerPhone, address: o.CustomerAddress };
    return (
      <div className="drv-card drv-current">
        <div className="drv-row">
          <strong>{o.StoreName || "المطعم"}</strong>
          <span className="drv-badge">{STATUS_TEXT[o.Status] || o.Status}</span>
        </div>
        <div className="drv-muted">أوردر {o.OrderID}</div>

        {items.length > 0 && (
          <ul className="drv-items">
            {items.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        )}

        <div className="drv-box">
          <div>👤 {cust.name || "—"}</div>
          {cust.phone && (
            <div>
              📞 <a href={`tel:${cust.phone}`}>{cust.phone}</a>
            </div>
          )}
          <div>🏠 {cust.address || "—"}</div>
        </div>

        <div className="drv-row">
          <span>الإجمالي: <strong>{o.Total} ج.م</strong></span>
          <span className="drv-muted">{paymentText(o)}</span>
        </div>

        {(o.DelayMinutes > 0) && <div className="drv-warn">تأخير مسجّل: {o.DelayMinutes} دقيقة</div>}

        {target && target.navigationUrl && (
          <a className="drv-btn drv-nav" href={target.navigationUrl} target="_blank" rel="noreferrer">
            🗺️ افتح الخريطة للعميل
          </a>
        )}

        {!arrived && !onWay && (
          <button className="drv-btn" disabled={!!busyAction} onClick={() => act("of_driverArrived", o.OrderID, "اتسجل وصولك")}>
            وصلت المطعم
          </button>
        )}
        {canPickup && (
          <button className="drv-btn" disabled={!!busyAction} onClick={() => act("of_driverPickup", o.OrderID)}>
            استلمت الأوردر من المطعم
          </button>
        )}
        {picked && o.Status === "awaiting_handover" && (
          <div className="drv-muted">مستني المطعم يأكد التسليم وبعدها تتحرك...</div>
        )}
        {arrived && !picked && !canPickup && !onWay && (
          <div className="drv-muted">الأوردر لسه بيتجهز، زر الاستلام هيظهر أول ما يجهز.</div>
        )}
        {onWay && (
          <button className="drv-btn drv-ok" disabled={!!busyAction} onClick={() => confirmDeliver(o.OrderID)}>
            ✅ تم التسليم للعميل
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="auth-container drv-page">
      <div className="drv-head">
        <div>
          <h2>أهلاً {driver.name}</h2>
          <div className={`drv-gps drv-gps-${gps}`}>{gpsLabel}</div>
        </div>
        <button
          type="button"
          className="drv-small"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          خروج / تبديل
        </button>
      </div>

      <div className="drv-tabs">
        <button className={tab === "work" ? "on" : ""} onClick={() => setTab("work")}>
          الشغل
        </button>
        <button className={tab === "history" ? "on" : ""} onClick={() => setTab("history")}>
          اللي سلّمته
        </button>
      </div>

      {error && <p className="drv-error">{error}</p>}

      {tab === "work" && (
        <>
          {!loaded && <p className="drv-muted">جارٍ التحميل...</p>}
          {loaded && current && renderCurrent(current)}
          {loaded && !current && (
            <>
              <h3>أوردرات متاحة</h3>
              {available.length === 0 && <p className="drv-muted">مفيش أوردرات دلوقتي، هتظهر هنا أول ما توصل.</p>}
              {available.map((o) => (
                <div className="drv-card" key={o.OrderID}>
                  <div className="drv-row">
                    <strong>{o.StoreName || "مطعم"}</strong>
                    <span className="drv-badge">{STATUS_TEXT[o.Status] || o.Status}</span>
                  </div>
                  <ul className="drv-items">
                    {itemsOf(o).map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                  <div className="drv-muted">العميل: {o.CustomerName || "—"} • العنوان هيظهر بعد القبول</div>
                  <div className="drv-row">
                    <span>الإجمالي: <strong>{o.Total} ج.م</strong></span>
                    <button className="drv-btn drv-inline" disabled={!!busyAction} onClick={() => act("of_driverAccept", o.OrderID)}>
                      قبول
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {tab === "history" && (
        <>
          {history.length === 0 && <p className="drv-muted">لسه مفيش أوردرات متسلّمة.</p>}
          {history.map((h) => (
            <div className="drv-card" key={h.OrderID}>
              <div className="drv-row">
                <strong>{h.CustomerName || "عميل"}</strong>
                <span className="drv-muted">{h.OrderID}</span>
              </div>
              <div className="drv-muted">
                {h.DeliveredAt ? new Date(Number(h.DeliveredAt)).toLocaleString("ar-EG") : ""}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
