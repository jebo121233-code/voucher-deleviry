import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useLocation } from "react-router-dom";
import "./Stores.css";
import { shops as fakeStores }  from '../data/data.js';
import { categories as fakeCategories }  from '../data/data.js';

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
      if (categoryId) {
        setStores(fakeStores.filter((s) => s.category_id === parseInt(categoryId)));
      } else {
        setStores(fakeStores);
      }
    }
  };

  // Fetch categories
  const fetchCategories = async (category) => {
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
  
  fetchStores(category);
  fetchCategories();
}, [location.search]);

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
                  src={store.logos?.[0]}
                  alt={store.name}
                />
              ) : null}

              <h3>{store.name}</h3>
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

              {/* <button>Buy Now</button> */}
            </div>
          ))
        )}
      </div>
    </div>
  );
}