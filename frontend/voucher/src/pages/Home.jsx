import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./Home.css";
import { Link } from "react-router-dom";
import { shops as fakeStores }  from '../data/data.js';
import { categories as fakeCategories }  from '../data/data.js';
import { cards } from '../data/data.js';

export default function Home() {
  const [stores, setStores] = useState([]);
  const [index, setIndex] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    fetchStores(categoryId);
  };

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
      if (categoryId) {
        setStores(fakeStores.filter((s) => s.category_id === parseInt(categoryId)));
      } else {
        setStores(fakeStores);
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
    fetchStores();
    fetchCategories();
  }, []);

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
                  backgroundImage: `url(${stores[index].logos[0]})`,
                }}
              />
            )}

            <div className="hero-content">
              <h1>{stores[index]?.name}</h1>
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
        <div className="store-header-row">
          <div className="filter-section">
            <select value={selectedCategory} onChange={handleCategoryChange}>
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button onClick={handleReset}>Reset</button>
          </div>
        </div>

        <div className="store-scroll">
          {stores.map((store) => (
            <Link to={`/store/${store.id}`} className="store-link">
              <div className="store-card" key={store.id}>

                {store.status && (
                  <div className={`status-badge ${store.status.toLowerCase()}`}>
                    {store.status}
                  </div>
                )}

                {store.logos?.[0] && (
                  <img
                    src={`/${store.logos[0]}`}
                    alt={store.name}
                    className="store-card-img"
                  />
                )}

                <h3>{store.name}</h3>
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
