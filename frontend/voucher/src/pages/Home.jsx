import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./Home.css";
import "./HomeTop.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { shops as fakeStores }  from '../data/data.js';
import { categories as fakeCategories }  from '../data/data.js';
import { cards } from '../data/data.js';
import { assetUrl } from '../data/imageUtil.js';
import { isVisible, isOnHome, getStoresVersion } from '../data/dynamicStores.js';
import { categoryImage, categoryEmoji } from '../data/categoryImages.js';
import Nm from "../components/Nm.jsx";

export default function Home() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const greetName = role === "customer" && user && user.name ? String(user.name).trim().split(/\s+/)[0] : "";
  const [stores, setStores] = useState([]);
  const [index, setIndex] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleReset = () => {
    setSelectedCategory("");
    fetchStores();
  };

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const fetchStores = async (categoryId = "") => {
    try {
      let url = "http://localhost:5000/api/store/list";
      if (categoryId) url += `?category_id=${categoryId}`;

      const res = await axios.get(url);
      setStores(res.data.stores);
    } catch (err) {
      // من غير قسم: اللي الأدمن مفعّله في الرئيسية بس. مع اختيار قسم: كل المحلات الظاهرة في القسم ده.
      if (categoryId) {
        setStores(fakeStores.filter((s) => isVisible(s) && s.category_ids.includes(parseInt(categoryId))));
      } else {
        setStores(fakeStores.filter(isOnHome));
      }
    }
  };

  const fetchCategories = async (category) => {
    try {
      const res = await axios.get("http://localhost:5000/api/category/list");
      setCategories(res.data.categories);
    } catch (err) {
      console.log("Backend failed, using fake categories:", err.message);
      setCategories(fakeCategories);
    }
  };

  useEffect(() => {
    fetchStores(selectedCategory);
    fetchCategories();
    // getStoresVersion(): لما محلات الشيت أو إعدادات الظهور تتحمّل القايمة تتحدّث لوحدها
  }, [getStoresVersion()]);

  useEffect(() => {
    if (stores.length <= 1) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % stores.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [stores.length]);

  useEffect(() => {
    setIndex(0);
  }, [stores]);

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % stores.length);
  };

  const prevSlide = () => {
    setIndex((prev) =>
      prev === 0 ? stores.length - 1 : prev - 1
    );
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) nextSlide();
    if (touchStartX.current - touchEndX.current < -50) prevSlide();
  };

  return (
    <div className="home">

      {/* SEARCH + CATEGORIES (زي طلبات) */}
      <div className="hm-top">
        <div className="hm-hello">{greetName ? <>Hello, <Nm name={greetName} /></> : "Hello 👋"}</div>
        <Link to="/search" className="hm-search" aria-label="بحث">
          <span className="hm-search-ico">🔍</span>
          <span>ابحث عن مطعم أو شريك...</span>
        </Link>
      </div>
      <div className="hm-cats">
        <button type="button" className="hm-cat" onClick={() => navigate("/stores")}>
          <span className="hm-cat-img">✨</span>
          <span className="hm-cat-name">الكل</span>
        </button>
        {categories.map((cat) => (
          <button
            type="button"
            key={cat.id}
            className="hm-cat"
            onClick={() => navigate(`/stores?category=${cat.id}`)}
          >
            <span className="hm-cat-img">
              {categoryImage(cat.id) ? <img src={categoryImage(cat.id)} alt={cat.name} loading="lazy" /> : categoryEmoji(cat.id)}
            </span>
            <span className="hm-cat-name">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* HERO */}
      <section
        className="hero"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {stores.length === 0 ? (
          <h1 className="loading">Loading Stores...</h1>
        ) : (
          <>
            {stores[index]?.logos?.length > 0 && (
              <div
                key={stores[index].logos[0]}
                className="hero-bg"
                style={{
                  backgroundImage: `url(${assetUrl(stores[index].logos[0], "")})`,
                }}
              />
            )}

            <div className="hero-content">
              <h1><Nm name={stores[index]?.name} alt={stores[index]?.altName} /></h1>
              {stores[index]?.percentage && <div className="hero-pct">{stores[index].percentage} OFF</div>}
              <p>{stores[index]?.description}</p>

              <Link to="/stores">
                <button className="hero-btn">Explore Store</button>
              </Link>
            </div>
          </>
        )}
      </section>


        {/* REGISTER NOW */}
      {false&&(
        <section className="register-section">
          <a
            href="https://ve-voucher-000.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="register-btn"
          >
            سجل الآن
          </a>
        </section>
)}
      

      {/* Hook place */}
      {/* <img className="hook" src="hook.jpeg" alt="Hook" /> */}

      {/* CARDS SECTION - اطلب كارت الخصم نفسه */}
      {cards?.length > 0 && (
        <section className="cards-section">
          <h2 className="cards-title">اطلب كارت الخصم</h2>
          <div className="cards-scroll">
            {cards.map((card) => (
              <Link
                to={`/card/${card.id}`}
                className="card-link"
                key={card.id}
              >
                <div className="card-item">
                  <img
                    src={`/${card.logo?.[0]}`}
                    alt={card.name}
                    className="card-item-img"
                  />
                  <h3>{card.name}</h3>
                  <p>{card.description}</p>
                  {card.price && (
                    <div className="percentage-badge">{card.price} ج.م</div>
                  )}
                  <button className="view-button">اطلب الكارت</button>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* STORE GRID */}
      <section className="store">
        <div className="store-scroll">
          {stores.map((store) => (
            <Link to={`/store/${store.id}`} className="store-link" key={store.id}>
              <div className="store-card" key={store.id}>

                {store.status && (
                  <div className={`status-badge ${store.status.toLowerCase()}`}>
                    {store.status}
                  </div>
                )}

                {store.logos?.[0] && (
                  <img
                    src={assetUrl(store.logos[0])}
                    alt={store.name}
                    className="store-card-img"
                  />
                )}

                <h3><Nm name={store.name} alt={store.altName} /></h3>
                <p>{store.description}</p>
                {store.percentage && (
                  <div className="percentage-badge">
                    {store.percentage} OFF
                  </div>
                )}

                  <button className="view-button">View Store</button>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
          }
