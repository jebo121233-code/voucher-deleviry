import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Store.css";
import { shops as fakeStores } from "../data/data.js";
import { useCart } from "../context/CartContext.jsx";

export default function Store() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addCard } = useCart();

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
const [quantities, setQuantities] = useState({});

  const getQuantity = (index) => quantities[index] || 1;

  const increaseQty = (index) => {
    setQuantities((prev) => ({
      ...prev,
      [index]: getQuantity(index) + 1,
    }));
  };

  const decreaseQty = (index) => {
    setQuantities((prev) => ({
      ...prev,
      [index]: Math.max(1, getQuantity(index) - 1),
    }));
  };
  const fetchStore = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/store/${id}`);
      setStore(res.data.store);
    } catch (err) {
      const fake =
        fakeStores.find((s) => String(s.id) === String(id)) || fakeStores[0];
      setStore(fake);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, [id]);

  useEffect(() => {
    if (selectedImageIndex === null || !store?.images?.length) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        setSelectedImageIndex(
          (prev) => (prev + 1) % store.images.length
        );
      }

      if (e.key === "ArrowLeft") {
        setSelectedImageIndex(
          (prev) => (prev - 1 + store.images.length) % store.images.length
        );
      }

      if (e.key === "Escape") {
        setSelectedImageIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, store]);

  if (loading) return <p>Loading...</p>;

  if (!store) return <p>Store not found</p>;

  return (
    <div className="store-page">
      <div className="store-header">
        {/* STATUS */}
        {store.status && (
          <div className={`status-badge ${store.status.toLowerCase()}`}>
            {store.status}
          </div>
        )}

        {/* LOGO */}
        {store.logos?.[0] && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <img
              className="store-image"
              src={`/${store.logos[0]}`}
              alt={store.name}
            />

            <div className="store-actions">
              <button
                type="button"
                className="register-btn"
                onClick={() => {
                  addCard({
                    id: `store-card-${store.id}`,
                    name: `${store.name} - VE Card`,
                    price: 10,
                    store: store.name,
                  });
                  navigate("/cart");
                }}
              >
                احصل على خصم - {store.name}
              </button>

              {/* زرار الدليفري - يظهر بس في المطاعم/الكافيهات (7) والمشروبات (9) */}
              {(store.category_id === 7 || store.category_id === 9) && (
                <Link
                  to={`/delivery?place=${encodeURIComponent(store.name)}&id=${store.id}`}
                  className="delivery-btn"
                >
                  🛵 Delivery Order
                </Link>
              )}
            </div>
          </div>
        )}

        <h2>{store.name}</h2>

        <p>{store.description}</p>

        {/* Notes */}
        {store.note && <div className="store-note">
          <strong>⚠️ Note:</strong> {store.note}
        </div>}

        {/* links */}
        {store.links && <div className="links_store">
          <a
            href={store.links}
            target="_blank"
            rel="noopener noreferrer"
            className="link_store"
          >
            Visit Link
          </a>
        </div>}

        {/* STORE IMAGES */}
        {store.images?.length > 0 && (
          <div className="store-images">
            {store.images.map((img, index) => (
              <img
                key={index}
                src={`/${img}`}
                alt={`${store.name} ${index + 1}`}
                className="store-gallery-img"
                onClick={() => setSelectedImageIndex(index)}
              />
            ))}
          </div>
        )}

        {/* IMAGE MODAL */}
        {selectedImageIndex !== null && (
          <div
            className="image-modal"
            onClick={() => setSelectedImageIndex(null)}
          >
            <button
              className="nav-btn prev"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(
                  (prev) =>
                    (prev - 1 + store.images.length) %
                    store.images.length
                );
              }}
            >
              ❮
            </button>

            <img
              src={`/${store.images[selectedImageIndex]}`}
              alt={`Preview ${selectedImageIndex + 1}`}
              className="modal-image"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              className="nav-btn next"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(
                  (prev) => (prev + 1) % store.images.length
                );
              }}
            >
              ❯
            </button>
          </div>
        )}

        {/* DISCOUNT */}
        {store.percentage && (
          <div className="percentage-badge">
            {store.percentage} OFF
          </div>
        )}
        
{/* MENU (restaurants only) */}
{store.menu?.length > 0 && (
  <div className="store-menu">
    <h3>المنيو</h3>
    <div className="menu-list">
      {store.menu.map((item, index) => (
        <div className="menu-item" key={index}>
          <div className="menu-item-info">
            {item.image && (
              <img
                src={`/${item.image}`}
                alt={item.name}
                className="menu-item-thumb"
              />
            )}
            <span className="menu-item-name">{item.name}</span>
          </div>
          <span className="menu-item-prices">
            <span className="price-before">{item.price} ج.م</span>
            <span className="price-after">{item.discounted_price} ج.م</span>
          </span>
        </div>
      ))}
    </div>
  </div>
)}
      </div>

      {/* ADDRESSES */}
      <div className="store-addresses">
        <h3>Addresses</h3>

        {store.addresses?.map((address, index) => (
          <p key={index}>{address}</p>
        ))}
      </div>
    </div>
  );
}
