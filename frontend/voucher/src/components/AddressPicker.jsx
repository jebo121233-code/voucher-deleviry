import { useEffect, useRef, useState } from "react";
import "./AddressPicker.css";

// اختيار العنوان: كتابة يدوي + "موقعي الحالي" + اختيار من الخريطة (OpenStreetMap مجاني، من غير مفتاح).
// value = { label, address, lat, lng, accuracy? }   onChange(patch) بيرجّع الحقول اللي اتغيرت بس.
const TANTA = { lat: 30.7865, lng: 31.0004 };
const LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";

let leafletPromise = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = LEAFLET_CSS;
      document.head.appendChild(l);
    }
    const s = document.createElement("script");
    s.src = LEAFLET_JS;
    s.async = true;
    s.onload = () => (window.L ? resolve(window.L) : reject(new Error("leaflet")));
    s.onerror = () => {
      leafletPromise = null;
      reject(new Error("leaflet"));
    };
    document.head.appendChild(s);
  });
  return leafletPromise;
}

// العنوان من الإحداثيات (OpenStreetMap Nominatim). لو فشل بنسكت والعميل يكتب بإيده.
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=ar&lat=${lat}&lon=${lng}`;
    const res = await fetch(url);
    if (!res.ok) return "";
    const j = await res.json();
    const a = j.address || {};
    const parts = [a.road || a.pedestrian || a.neighbourhood, a.suburb || a.quarter, a.city || a.town || a.village].filter(Boolean);
    return (parts.length ? parts.join("، ") : j.display_name || "").slice(0, 200);
  } catch {
    return "";
  }
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy || 0) }),
      (e) => reject(e),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

const geoMsg = (e) =>
  e && e.code === 1 ? "لازم تسمح للتطبيق بالوصول للموقع من الإعدادات" : "مقدرناش نحدد موقعك، جرب تاني أو اختار من الخريطة";

function MapModal({ start, onCancel, onConfirm }) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const [center, setCenter] = useState(start);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    let dead = false;
    loadLeaflet()
      .then((L) => {
        if (dead || !boxRef.current) return;
        const map = L.map(boxRef.current, { zoomControl: true }).setView([start.lat, start.lng], 17);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(map);
        mapRef.current = map;
        setLoading(false);
        const upd = () => {
          const c = map.getCenter();
          setCenter({ lat: c.lat, lng: c.lng });
        };
        map.on("moveend", upd);
        setTimeout(() => map.invalidateSize(), 150);
        upd();
      })
      .catch(() => !dead && setErr("الخريطة مش بتفتح (تأكد من النت). تقدر تكتب العنوان أو تستخدم موقعك الحالي."));
    return () => {
      dead = true;
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // بنجيب اسم المكان بعد ما العميل يوقف تحريك الخريطة
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const t = await reverseGeocode(center.lat, center.lng);
      setText(t);
    }, 600);
    return () => clearTimeout(timer.current);
  }, [center.lat, center.lng]);

  const goMe = async () => {
    setErr("");
    setLocating(true);
    try {
      const p = await getPosition();
      if (mapRef.current) mapRef.current.setView([p.lat, p.lng], 18);
      else setCenter({ lat: p.lat, lng: p.lng });
    } catch (e) {
      setErr(geoMsg(e));
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="ap-overlay" role="dialog" aria-modal="true">
      <div className="ap-modal">
        <div className="ap-modal-head">
          <strong>🗺️ حرّك الخريطة وحط الدبوس على مكانك</strong>
          <button type="button" className="ap-close" onClick={onCancel} aria-label="إغلاق">✕</button>
        </div>
        <div className="ap-map-wrap">
          <div className="ap-map" ref={boxRef} />
          {!err && !loading && <div className="ap-pin" aria-hidden="true">📍</div>}
          {loading && !err && <div className="ap-map-msg">جارٍ تحميل الخريطة...</div>}
          {err && <div className="ap-map-msg">{err}</div>}
        </div>
        <div className="ap-addr-line">{text || "..."}</div>
        <div className="ap-modal-actions">
          <button type="button" className="ap-btn" onClick={goMe} disabled={locating}>
            {locating ? "جارٍ التحديد..." : "📍 موقعي الحالي"}
          </button>
          <button
            type="button"
            className="ap-btn ap-primary"
            disabled={!!err || loading}
            onClick={() => onConfirm({ lat: center.lat, lng: center.lng, text })}
          >
            ✅ تأكيد الموقع
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AddressPicker({ value, onChange, labelPlaceholder, addressPlaceholder, required }) {
  const v = value || {};
  const hasPos = typeof v.lat === "number" && typeof v.lng === "number";
  const [mapOpen, setMapOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState("");

  const useMyLocation = async () => {
    setErr("");
    setLocating(true);
    try {
      const p = await getPosition();
      const patch = { lat: p.lat, lng: p.lng, accuracy: p.accuracy };
      if (!String(v.address || "").trim()) {
        const t = await reverseGeocode(p.lat, p.lng);
        if (t) patch.address = t;
      }
      onChange(patch);
    } catch (e) {
      setErr(geoMsg(e));
    } finally {
      setLocating(false);
    }
  };

  const confirmMap = ({ lat, lng, text }) => {
    const patch = { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6, accuracy: 0 };
    if (!String(v.address || "").trim() && text) patch.address = text;
    onChange(patch);
    setMapOpen(false);
  };

  return (
    <div className="ap-box">
      <input
        type="text"
        className="ap-input"
        placeholder={labelPlaceholder || "اسم الشارع (رقم المنزل ، علامة مميزة)"}
        value={v.label || ""}
        onChange={(e) => onChange({ label: e.target.value })}
      />
      <input
        type="text"
        className="ap-input"
        placeholder={addressPlaceholder || "العنوان بالتفصيل"}
        value={v.address || ""}
        onChange={(e) => onChange({ address: e.target.value })}
        required={required}
      />
      <div className="ap-buttons">
        <button type="button" className="ap-btn" onClick={useMyLocation} disabled={locating}>
          {locating ? "جارٍ التحديد..." : "📍 استخدم موقعي الحالي"}
        </button>
        <button type="button" className="ap-btn" onClick={() => setMapOpen(true)}>
          🗺️ اختار من الخريطة
        </button>
      </div>
      {hasPos ? (
        <p className="ap-ok">
          ✅ تم تحديد موقعك{v.accuracy ? ` (دقة ±${v.accuracy} متر)` : ""} — الدليفري هيوصلك بالظبط{" "}
          <a href={`https://www.openstreetmap.org/?mlat=${v.lat}&mlon=${v.lng}#map=17/${v.lat}/${v.lng}`} target="_blank" rel="noreferrer">
            عرض
          </a>{" "}
          <button type="button" className="ap-link" onClick={() => onChange({ lat: null, lng: null, accuracy: 0 })}>
            مسح
          </button>
        </p>
      ) : (
        <p className="ap-hint">اختياري، بس تحديد الموقع على الخريطة بيخلي الدليفري يوصلك أسرع.</p>
      )}
      {err && <p className="ap-err">{err}</p>}
      {mapOpen && (
        <MapModal start={hasPos ? { lat: v.lat, lng: v.lng } : TANTA} onCancel={() => setMapOpen(false)} onConfirm={confirmMap} />
      )}
    </div>
  );
}
