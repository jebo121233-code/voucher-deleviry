import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Search.css";
import { shops } from "../data/data.js";
import { assetUrl } from "../data/imageUtil.js";
import { isVisible, getStoresVersion, loadDynamicStores } from "../data/dynamicStores.js";
import { rankShops } from "../data/searchUtil.js";
import Nm from "../components/Nm.jsx";

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState(() => new URLSearchParams(location.search).get("q") || "");
  const [, setTick] = useState(0);

  // نتأكد إن قايمة الشركاء محدّثة من الشيت
  useEffect(() => {
    loadDynamicStores().then((changed) => changed && setTick((t) => t + 1)).catch(() => {});
  }, []);

  const visible = shops.filter(isVisible);
  const results = rankShops(visible, q);
  const searching = q.trim().length > 0;

  return (
    <div className="srch-page" dir="rtl" data-v={getStoresVersion()}>
      <h2>🔍 ابحث عن مطعم أو شريك</h2>
      <input
        className="srch-input"
        type="search"
        autoFocus
        placeholder="اكتب الاسم بالعربي أو English"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <p className="srch-count">
        {searching ? `${results.length} نتيجة` : `كل الشركاء (${visible.length})`}
      </p>

      <div className="srch-list">
        {results.map((s) => (
          <div className="srch-card" key={s.id} onClick={() => navigate(`/store/${s.id}`)}>
            {s.logos && s.logos[0] ? <img src={assetUrl(s.logos[0])} alt={s.name} /> : <div className="srch-noimg">🏪</div>}
            <div className="srch-info">
              <strong><Nm name={s.name} alt={s.altName} /></strong>
              {s.altName && s.altName !== s.name && <span className="srch-alt" translate="no">{s.altName}</span>}
              {s.description && <small>{s.description}</small>}
            </div>
            {s.percentage && <span className="srch-pct">{s.percentage} OFF</span>}
          </div>
        ))}
        {searching && results.length === 0 && <p className="srch-empty">مفيش نتائج. جرّب اسم تاني أو اكتبه بالإنجليزي/العربي.</p>}
      </div>
    </div>
  );
}
