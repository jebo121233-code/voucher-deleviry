import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { CART_SCRIPT_URL } from "../data/data.js";
import "./Offers.css";

export default function Offers() {
  const { user, isLoggedIn } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        const res = await fetch(CART_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "getOffers", phone: isLoggedIn ? user.phone : "" }),
        });
        const data = await res.json();
        if (data.success) setOffers(data.offers);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, [isLoggedIn, user]);

  return (
    <div className="offers-page">
      <h2>🎟️ العروض</h2>

      {loading && <p style={{ textAlign: "center" }}>جارٍ التحميل...</p>}

      {!loading && offers.length === 0 && (
        <p style={{ textAlign: "center" }}>مفيش عروض متاحة دلوقتي</p>
      )}

      <div className="offers-list">
        {offers.map((offer) => (
          <div key={offer.offerId} className={offer.type === "personal" ? "offer-banner personal" : "offer-banner"}>
            {offer.type === "personal" && <span className="offer-badge">🎁 عرض خاص بيك</span>}
            <h3>{offer.title}</h3>
            <p>{offer.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
