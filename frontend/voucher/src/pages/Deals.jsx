import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Deals.css";
import { shops as fakeProducts }  from '../data/data.js';
import { categories as fakeCategories }  from '../data/data.js';

export default function Deals() {
  const navigate = useNavigate();
  const [stores, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const fetchProducts = async (categoryId = "") => {
    try {
      const token = localStorage.getItem("token");

      let url = "http://localhost:5000/api/voucher/list";
      if (categoryId) url += `?category_id=${categoryId}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProducts(res.data.vouchers);
    } catch (err) {
      // فلترة على fakeProducts لو فيه category
      if (categoryId) {
        setProducts(fakeProducts.filter((p) => p.category_id === parseInt(categoryId)));
      } else {
        setProducts(fakeProducts);
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/category/list");
      setCategories(res.data.categories);
    } catch (err) {
      console.log("Backend failed, using fake categories:", err.message);
      setCategories(fakeCategories);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    fetchProducts(categoryId);
  };

  const handleReset = () => {
    setSelectedCategory("");
    fetchProducts();
  };

  return (
    <div className="deal-container">
    <h2>Deals</h2>

    {/* Category Filter */}
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

    {/* Products Grid */}
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
              store.addresses.map((address, index) => (
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