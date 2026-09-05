import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import { CART_SCRIPT_URL } from "../data/data.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [form, setForm] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "login", ...form }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "حصل خطأ");
      } else {
        login(data.user);
        navigate("/");
      }
    } catch (err) {
      setError("مشكلة في الاتصال، حاول تاني");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>تسجيل الدخول</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="tel"
          name="phone"
          placeholder="رقم الموبايل"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="الباسورد"
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "جارٍ الدخول..." : "دخول"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {form.password === "" && (
  <div style={{ textAlign: "center", marginTop: "10px" }}>
    <button
      type="button"
      className="forgot-password-link"
      onClick={() => navigate("/reset-password")}
    >
      نسيت الباسورد؟
    </button>
  </div>
)}
      
      <div className="signUp">
        <button onClick={() => navigate("/register")}>
          مفيش حساب؟ سجل واحد
        </button>
      </div>
    </div>
  );
}
