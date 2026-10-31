import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./Stores.css";
import { shops as fakeStores } from '../data/data.js';
import { categories as fakeCategories } from '../data/data.js';
import { assetUrl } from '../data/imageUtil.js';
import { isVisible, getStoresVersion } from '../data/dynamicStores.js';
import Nm from "../components/Nm.jsx";

export default function Store() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Fetch stores (with optional category filter)
  const fetchStores = async (categoryId = "") => {
    try {
      let url = "http://localhost:5000/api/store/list";
      if (categoryId) url += `?category_id=${categoryId}`;

      const res = await axios.get(url);
      setStores(res.data.stores);
    } catch (err) {
      // Use fake stores if backend fails
      // المحلات الظاهرة بس (الأدمن بيتحكم فيها من تاب "المحلات")
      const visible = fakeStores.filter(isVisible);
      if (categoryId) {
        setStores(visible.filter((s) => s.category_ids.includes(parseInt(categoryId))));
      } else {
        setStores(visible);
      }
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/category/list");
      setCategories(res.data.categories);
    } catch (err) {
      console.log("Backend failed, using fake categories:", err.message);
      setCategories(fakeCategories);
    }
  };

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    setSelectedCategory(category || "");

    fetchStores(category);
    fetchCategories();
    // getStoresVersion(): لما محلات الشيت أو إعدادات الظهور تتحمّل القايمة تتحدّث لوحدها
  }, [location.search, getStoresVersion()]);

  // When dropdown changes
  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    fetchStores(categoryId);
  };

  // Reset filter
  const handleReset = () => {
    setSelectedCategory("");
    fetchStores();
  };

  return (
    <div className="store-container">
      <h2>All Stores</h2>

      {/* Dropdown */}
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

      {/* Stores */}
      <div className="stores-grid">
        {stores.length === 0 ? (
          <p>Loading...</p>
        ) : (
          stores.map((store) => (
            <div className="store-card" key={store.id} onClick={() => navigate(`/store/${store.id}`)}>

              {store.status && (
                <div className={`status-badge ${store.status.toLowerCase()}`}>
                  {store.status}
                </div>
              )}

              {/* image fix */}
              {store.logos?.[0] ? (
                <img
                  src={assetUrl(store.logos[0])}
                  alt={store.name}
                />
              ) : null}

              <h3><Nm name={store.name} alt={store.altName} /></h3>
              <p>{store.description}</p>
              {store.percentage && (
                <div className="percentage-badge">
                  {store.percentage} OFF
                </div>
              )}

              {/* show addresses if needed */}
              {store.addresses?.length > 0 &&
                store.addresses.slice(0, 3).map((address, index) => (
                  <p key={index}>{address}</p>
                ))
              }
            </div>
          ))
        )}
      </div>
    </div>
  );
}
