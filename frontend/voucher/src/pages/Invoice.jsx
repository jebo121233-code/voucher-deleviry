import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./auth.css";
import { CART_SCRIPT_URL } from "../data/data.js";
import { useAuth } from "../context/AuthContext.jsx";
import { buildInvoice } from "../data/invoiceUtil.js";
import InvoiceButton, { InvoiceSheet } from "../components/Invoice.jsx";

// صفحة فاتورة أوردر للعميل: /invoice?id=ORD-...
export default function Invoice() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderId = params.get("id") || "";
  const { user, isLoggedIn } = useAuth();
  const [inv, setInv] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (!user || !orderId) return;
    fetch(CART_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "getOrderHistory", phone: user.phone }),
    })
      .then((r) => r.json())
      .then((r) => {
        const o = (r.orders || []).find((x) => String(x.orderId) === orderId);
        if (o) setInv(buildInvoice(o, { audience: "customer" }));
        else setError("الأوردر مش موجود");
      })
      .catch(() => setError("مشكلة في الاتصال"));
  }, [user, orderId]);

  if (!isLoggedIn) return null;
  return (
    <div className="auth-container">
      <h2>🧾 الفاتورة</h2>
      {error && <p style={{ color: "#c0392b", textAlign: "center" }}>{error}</p>}
      {!inv && !error && <p style={{ textAlign: "center" }}>جارٍ التحميل...</p>}
      {inv && (
        <>
          <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "12px", padding: "10px" }}>
            <InvoiceSheet inv={inv} />
          </div>
          <div className="signUp" style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", marginTop: "12px" }}>
            <InvoiceButton invoice={inv} label="🖨️ طباعة الفاتورة" />
            <button type="button" onClick={() => navigate(-1)}>رجوع</button>
          </div>
        </>
      )}
    </div>
  );
}
