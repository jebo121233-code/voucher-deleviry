import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./auth.css";
import "./TrackOrder.css";
import { CART_SCRIPT_URL } from "../data/data.js";
import { useAuth } from "../context/AuthContext.jsx";

const POLL_MS = 8000;
const ACTIVE = ["payment_review", "pending", "new", "preparing", "ready", "awaiting_handover", "on_the_way", "accepted_by_restaurant", "out_for_delivery"];

const STATUS_TEXT = {
  payment_review: "بنراجع التحويل",
  pending: "في انتظار تأكيد المحل",
  new: "المطعم استلم الأوردر",
  preparing: "المطعم بيجهز طلبك",
  ready: "الأوردر جاهز",
  awaiting_handover: "الدليفري بيستلم الأوردر",
  on_the_way: "الدليفري في الطريق ليك 🛵",
  delivered: "اتسلّم ✅",
  rejected: "اترفض",
  accepted_by_restaurant: "المحل قبل الأوردر",
  out_for_delivery: "خرج للتوصيل",
};

async function api(body) {
  const res = await fetch(CART_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// خريطة OpenStreetMap مدمجة بعلامة على مكان الدليفري (من غير مكتبات إضافية)
function MapFrame({ lat, lng }) {
  const d = 0.008;
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  return <iframe className="trk-map" title="مكان الدليفري" src={src} loading="lazy" />;
}

export default function TrackOrder() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderId = params.get("id") || "";
  const { user, isLoggedIn } = useAuth();
  const phone = user ? user.phone : "";

  const [list, setList] = useState([]);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  }, [isLoggedIn, navigate]);

  const loadList = useCallback(async () => {
    if (!phone) return;
    try {
      const r = await api({ action: "getOrderHistory", phone });
      if (r.success) setList((r.orders || []).filter((o) => ACTIVE.includes(String(o.status))));
    } catch {
      setError("مشكلة في الاتصال");
    } finally {
      setLoaded(true);
    }
  }, [phone]);

  const loadOne = useCallback(async () => {
    if (!phone || !orderId) return;
    try {
      const r = await api({ action: "tr_orderTracking", orderId, phone });
      if (r.success) {
        setInfo(r);
        setError("");
      } else setError(r.error || "الأوردر مش موجود");
    } catch {
      setError("مشكلة في الاتصال، هنحاول تاني");
    } finally {
      setLoaded(true);
    }
  }, [phone, orderId]);

  useEffect(() => {
    const fn = orderId ? loadOne : loadList;
    fn();
    const id = setInterval(() => document.visibilityState === "visible" && fn(), POLL_MS);
    return () => clearInterval(id);
  }, [orderId, loadOne, loadList]);

  if (!isLoggedIn) return null;

  if (!orderId) {
    return (
      <div className="auth-container trk-page">
        <h2>تابع أوردراتك</h2>
        {!loaded && <p className="trk-muted">جارٍ التحميل...</p>}
        {loaded && list.length === 0 && <p className="trk-muted">مفيش أوردرات شغالة دلوقتي.</p>}
        {list.map((o) => (
          <div className="trk-card" key={o.orderId}>
            <div className="trk-row">
              <strong>{o.storeName}</strong>
              <span className="trk-badge">{STATUS_TEXT[o.status] || o.status}</span>
            </div>
            <div className="trk-muted">{o.items}</div>
            <button type="button" onClick={() => navigate(`/track?id=${encodeURIComponent(o.orderId)}`)}>
              تابع الأوردر
            </button>
          </div>
        ))}
      </div>
    );
  }

  const drv = info && info.driver;
  const hasPos = drv && drv.lat !== null && drv.lng !== null;

  return (
    <div className="auth-container trk-page">
      <h2>أوردر {orderId}</h2>
      {error && <p className="trk-error">{error}</p>}
      {info && <div className="trk-status">{STATUS_TEXT[info.status] || info.status}</div>}

      {info && !drv && !["delivered", "rejected"].includes(info.status) && (
        <p className="trk-muted">لسه مفيش دليفري قبل الأوردر، هنبلغك أول ما حد يستلمه.</p>
      )}

      {drv && (
        <div className="trk-card">
          <div className="trk-row">
            <strong>🛵 {drv.name || "الدليفري"}</strong>
            {drv.phone && <a href={`tel:${drv.phone}`}>اتصل</a>}
          </div>
          {info.distanceKm !== undefined && (
            <div>
              باقي حوالي <b>{info.distanceKm} كم</b> • خلال <b>{info.etaMin} دقيقة</b> تقريباً
            </div>
          )}
          {drv.state !== "online" && <div className="trk-muted">آخر تحديث للمكان من فترة، المكان ممكن يكون قديم.</div>}
          {hasPos ? (
            <>
              <MapFrame lat={drv.lat} lng={drv.lng} />
              <a className="trk-link" href={`https://www.google.com/maps/search/?api=1&query=${drv.lat},${drv.lng}`} target="_blank" rel="noreferrer">
                افتح على خريطة جوجل
              </a>
            </>
          ) : (
            <p className="trk-muted">مكان الدليفري لسه مش ظاهر.</p>
          )}
        </div>
      )}

      <button type="button" className="trk-back" onClick={() => navigate("/track")}>
        كل أوردراتي
      </button>
    </div>
  );
}
