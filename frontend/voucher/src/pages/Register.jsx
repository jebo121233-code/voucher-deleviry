import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import { CART_SCRIPT_URL } from "../data/data.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const [form, setForm] = useState({ name: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const passwordValid = (pw) => /^(?=.*\d).{8,}$/.test(pw);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!passwordValid(form.password)) {
      setError("الباسورد لازم يكون 8 حروف على الأقل ويحتوي على رقم واحد على الأقل");
      return;
    }
    if (form.password !== form.confirm) {
      setError("الباسورد غير متطابق");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "register",
          name: form.name,
          phone: form.phone,
          password: form.password,
        }),
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
      <h2>إنشاء حساب</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="الاسم" onChange={handleChange} required />
        <input type="tel" name="phone" placeholder="رقم الموبايل" onChange={handleChange} required />
        <input type="password" name="password" placeholder="الباسورد (8 حروف + رقم)" onChange={handleChange} required />
        <input type="password" name="confirm" placeholder="تأكيد الباسورد" onChange={handleChange} required />
        <button type="submit" disabled={loading}>{loading ? "جارٍ الإنشاء..." : "إنشاء حساب"}</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
