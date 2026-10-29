import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import { CART_SCRIPT_URL } from "../data/data.js";
import { useAuth } from "../context/AuthContext.jsx";
import AddressPicker from "../components/AddressPicker.jsx";

export default function Register() {
  const [form, setForm] = useState({ name: "", phone: "", address: "", addressLabel: "", lat: null, lng: null, password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
          address: form.address,
          addressLabel: form.addressLabel,
          lat: form.lat,
          lng: form.lng,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "حصل خطأ");
      } else {
        login(data.user, data.token);
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
        <input
          type="text"
          name="name"
          placeholder="الاسم"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="رقم الموبايل"
          value={form.phone}
          onChange={handleChange}
          required
        />
        <AddressPicker
          value={{ label: form.addressLabel, address: form.address, lat: form.lat, lng: form.lng }}
          onChange={(patch) =>
            setForm((f) => {
              const n = { ...f };
              if ("label" in patch) n.addressLabel = patch.label;
              if ("address" in patch) n.address = patch.address;
              if ("lat" in patch) { n.lat = patch.lat; n.lng = patch.lng; }
              return n;
            })
          }
          addressPlaceholder="العنوان (اختياري، تقدر تضيفه بعدين)"
        />

        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="الباسورد (8 حروف + رقم)"
            value={form.password}
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

        <div style={{ position: "relative" }}>
          <input
            type={showConfirm ? "text" : "password"}
            name="confirm"
            placeholder="تأكيد الباسورد"
            value={form.confirm}
            onChange={handleChange}
            required
            style={{ width: "100%", paddingLeft: "40px", boxSizing: "border-box" }}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((prev) => !prev)}
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
            {showConfirm ? "🙈" : "👁️"}
          </button>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "جارٍ الإنشاء..." : "إنشاء حساب"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
