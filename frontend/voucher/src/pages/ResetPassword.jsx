import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import { CART_SCRIPT_URL } from "../data/data.js";

export default function ResetPassword() {
  const [form, setForm] = useState({ phone: "", code: "", newPassword: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const passwordValid = (pw) => /^(?=.*\d).{8,}$/.test(pw);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!passwordValid(form.newPassword)) {
      setError("الباسورد لازم يكون 8 حروف على الأقل ويحتوي على رقم واحد على الأقل");
      return;
    }
    if (form.newPassword !== form.confirm) {
      setError("الباسورد غير متطابق");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(CART_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "resetPassword",
          phone: form.phone,
          code: form.code,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "حصل خطأ");
      } else {
        setSuccess("✅ تم تغيير الباسورد بنجاح! هتتنقل لصفحة الدخول...");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      setError("مشكلة في الاتصال، حاول تاني");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>استعادة الباسورد</h2>
      <p style={{ textAlign: "center", fontSize: "14px", color: "#666" }}>
        كلم صاحب الموقع على الواتساب وهيديك كود، اكتبه هنا مع باسوردك الجديد
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="tel"
          name="phone"
          placeholder="رقم الموبايل"
          value={form.phone}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="code"
          placeholder="الكود اللي وصلك"
          value={form.code}
          onChange={handleChange}
          required
        />

        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            name="newPassword"
            placeholder="الباسورد الجديد (8 حروف + رقم)"
            value={form.newPassword}
            onChange={handleChange}
            required
            style={{ width: "100%", paddingLeft: "40px", boxSizing: "border-box" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              color: "black",
            }}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <input
          type={showPassword ? "text" : "password"}
          name="confirm"
          placeholder="تأكيد الباسورد الجديد"
          value={form.confirm}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "جارٍ التغيير..." : "تغيير الباسورد"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </div>
  );
}
