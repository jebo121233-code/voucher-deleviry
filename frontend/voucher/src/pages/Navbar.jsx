import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Navbar.css";
import { shops as fakeStores }  from '../data/data.js';
import { categories as fakeCategories }  from '../data/data.js';

export default function Navbar() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const navigate = useNavigate();

  const menuRef = useRef();
  const toggleRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setUserLoggedIn(!!token);
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/category/list");
      setCategories(res.data.categories);
    } catch (err) {
      console.log("Using fake categories");
      setCategories(fakeCategories);
    }
  };

  const handleCategoriesClick = () => {
    setCategoriesOpen((prev) => !prev);
  };

  const handleCategorySelect = (categoryId) => {
    setCategoriesOpen(false);
    setMenuOpen(false);
    navigate(`/stores?category=${categoryId}`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        toggleRef.current &&
        !toggleRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
        setCategoriesOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleAuthClick = () => {
    if (userLoggedIn) navigate("/profile");
    else navigate("/login");
  };

  return (
    <nav className="navbar">

      {/* LOGO */}
      <div className="nav-logo">
        <Link to="/" onClick={() => setMenuOpen(false)}>
          <div className="logo-text">
            <span className="main-logo">VE</span>
            <span className="sub-logo">Card</span>
          </div>
        </Link>

        <img src="/logo.jpeg" alt="logo" />

        <div className="logo-text">
            <span className="main-logo">Voucher</span>
            <span className="sub-logo">For</span>
            <span className="sub-logo">Everything</span>
        </div>
      </div>

      {/* NAV LINKS */}
      <ul
        ref={menuRef}
        className={`nav-links ${menuOpen ? "active" : ""}`}
      >
        <li>
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
        </li>

        <li>
          <Link to="/stores" onClick={() => setMenuOpen(false)}>Stores</Link>
        </li>

        <li>
          <Link to="/deals" onClick={() => setMenuOpen(false)}>Deals</Link>
        </li>

        {/* Categories */}
        <li className="dropdown">
          <span onClick={handleCategoriesClick}>
            Categories ⬇
          </span>

          {categoriesOpen && (
            <ul className="dropdown-menu">
              {categories.map((cat) => (
                <li
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                >
                  {cat.name}
                </li>
              ))}
            </ul>
          )}
        </li>
      </ul>

      {/* RIGHT SIDE */}
      <div className="right-section">
        {/* <button className="nav-btn" onClick={handleAuthClick}>
          {userLoggedIn ? "Profile" : "Login"}
        </button> */}

        <div
          ref={toggleRef}
          className="menu-icon"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          ☰
        </div>
      </div>

    </nav>
  );
}