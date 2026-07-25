import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./Store.css";
import "./auth.css";
import "./Delivery.css";
import { cards, CARD_SHIPPING_FEE } from "../data/data.js";
import { useCart } from "../context/CartContext.jsx";

export default function CardOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const card = cards.find((c) => String(c.id) === String(id)) || cards[0];

  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const { addCard } = useCart();

  if (!card) return <p>الكارت غير موجود</p>;

  const total = (card.price || 0) + CARD_SHIPPING_FEE;

  const handleAddToCart = () => {
    addCard({ id: card.id, name: card.name, price: card.price });
    navigate("/cart");
  };

  return (
    <div className="store-page">
      <div className="store-header">
        <h2>{card.name}</h2>
        <p>{card.description}</p>

        {/* GALLERY */}
        {card.images?.length > 0 && (
          <div className="store-images">
            {card.images.map((img, index) => (
              <img
                key={index}
                src={`/${img}`}
                alt={`${card.name} ${index + 1}`}
                className="store-gallery-img"
                onClick={() => setSelectedImageIndex(index)}
              />
            ))}
          </div>
        )}

        {selectedImageIndex !== null && (
          <div className="image-modal" onClick={() => setSelectedImageIndex(null)}>
            <img
              src={`/${card.images[selectedImageIndex]}`}
              alt="Preview"
              className="modal-image"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* CALCULATOR */}
        <div className="delivery-summary" style={{ maxWidth: 400, margin: "20px auto" }}>
          <div><span>سعر الكارت</span><span>{card.price} ج.م</span></div>
          <div><span>رسوم الشحن</span><span>{CARD_SHIPPING_FEE} ج.م</span></div>
          <div className="delivery-total"><span>الإجمالي</span><span>{total} ج.م</span></div>
        </div>

        <button className="add-to-cart-btn" style={{ maxWidth: 400, margin: "0 auto" }} onClick={handleAddToCart}>
          أضف للسلة 🛒
        </button>

        <p style={{ textAlign: "center", marginTop: 10 }}>
          <Link to="/cart">اذهب للسلة</Link>
        </p>
      </div>
    </div>
  );
}
