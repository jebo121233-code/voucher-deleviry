import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import "./Points.css";
import { CART_SCRIPT_URL } from "../data/data.js";
import { useAuth } from "../context/AuthContext.jsx";

const VODAFONE_CASH_NUMBER = "01025311724";

const STATUS_TEXT = { pending: "تحت المراجعة", approved: "اتقبل ✅", rejected: "اترفض ❌" };

async function api(body) {
  const res = await fetch(CART_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export default function Points() {
  const navigate = useNavigate();
  const { user, isLoggedIn, refreshUser } = useAuth();
  const phone = user ? user.phone : "";

  const [packages, setPackages] = useState([]);
  const [perOrder, setPerOrder] = useState(10);
  const [purchases, setPurchases] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chosen, setChosen] = useState(null);
  const [sender, setSender] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  }, [isLoggedIn, navigate]);

  const load = useCallback(async () => {
    if (!phone) return;
    try {
      const [pk, pu, rf, oh] = await Promise.all([
        api({ action: "pts_getPackages" }),
        api({ action: "pts_myPurchases", phone }),
        api({ action: "pts_myRefunds", phone }),
        api({ action: "getOrderHistory", phone }),
      ]);
      if (pk.success) {
        setPackages(pk.packages || []);
        setPerOrder(pk.pointsPerOrder || 10);
      }
      if (pu.success) setPurchases(pu.purchases || []);
      if (rf.success) setRefunds(rf.refunds || []);
      if (oh.success) setOrders((oh.orders || []).filter((o) => Number(o.pointsUsed) > 0));
    } catch {
      setError("مشكلة في الاتصال، حاول تاني");
    }
  }, [phone]);

  useEffect(() => {
    load();
    refreshUser && refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const buy = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!chosen) return setError("اختار الباقة الأول");
    if (sender.replace(/\D/g, "").length < 10) return setError("اكتب رقم المحفظة اللي حوّلت منها");
    setBusy(true);
    try {
      const r = await api({ action: "pts_requestPurchase", phone, packageId: chosen.packageId, senderPhone: sender, reference });
      if (!r.success) setError(r.error || "مقدرناش نسجل الطلب");
      else {
        setNotice("طلبك اتسجل وتحت المراجعة. النقاط هتتضاف أول ما الإدارة تأكد التحويل.");
        setChosen(null);
        setSender("");
        setReference("");
        await load();
      }
    } catch {
      setError("مشكلة في الاتصال، حاول تاني");
    } finally {
      setBusy(false);
    }
  };

  const askRefund = async (o) => {
    const reason = window.prompt("سبب طلب الاسترداد (اختياري):", "");
    if (reason === null) return;
    setError("");
    setNotice("");
    const r = await api({ action: "pts_requestRefund", phone, orderId: o.orderId, reason });
    if (!r.success) setError(r.error || "مقدرناش نسجل الطلب");
    else setNotice("طلب الاسترداد اتبعت للمراجعة.");
    await load();
  };

  if (!isLoggedIn) return null;

  const pendingRefund = (id) => refunds.some((r) => String(r.orderId) === String(id) && (r.status === "pending" || r.status === "approved"));

  return (
    <div className="auth-container pts-page">
      <h2>نقاطي ⭐</h2>
      <div className="pts-balance">
        <b>{user.points || 0}</b>
        <span>نقطة</span>
      </div>
      <p className="pts-muted">بتاخد {perOrder} نقط على كل أوردر دليفري بيتسلّم.</p>

      {error && <p className="pts-error">{error}</p>}
      {notice && <p className="pts-notice">{notice}</p>}

      <h3>شحن نقاط</h3>
      <div className="pts-packages">
        {packages.map((p) => (
          <button
            type="button"
            key={p.packageId}
            className={chosen && chosen.packageId === p.packageId ? "on" : ""}
            onClick={() => setChosen(p)}
          >
            <b>{p.points}</b>
            <span>نقطة</span>
            <em>{p.price} ج.م</em>
          </button>
        ))}
        {packages.length === 0 && <p className="pts-muted">مفيش باقات متاحة دلوقتي.</p>}
      </div>

      {chosen && (
        <form className="pts-form" onSubmit={buy}>
          <p>
            حوّل <strong>{chosen.price} ج.م</strong> على فودافون كاش للرقم:
          </p>
          <div className="pts-number">{VODAFONE_CASH_NUMBER}</div>
          <input type="tel" placeholder="رقم المحفظة اللي حوّلت منها" value={sender} onChange={(e) => setSender(e.target.value)} required />
          <input placeholder="آخر 6 أرقام من عملية التحويل (اختياري)" value={reference} onChange={(e) => setReference(e.target.value)} />
          <button type="submit" disabled={busy}>
            {busy ? "..." : "أكّدت التحويل"}
          </button>
          <p className="pts-muted">الإدارة بتراجع التحويل وبتضيف النقاط بسرعة.</p>
        </form>
      )}

      {purchases.length > 0 && (
        <>
          <h3>طلبات الشحن</h3>
          {purchases.map((p) => (
            <div className="pts-row" key={p.requestId}>
              <span>
                {p.points} نقطة • {p.price} ج.م
              </span>
              <span className={`pts-st pts-${p.status}`}>{STATUS_TEXT[p.status] || p.status}</span>
              {p.status === "rejected" && p.reason && <small>السبب: {p.reason}</small>}
            </div>
          ))}
        </>
      )}

      {orders.length > 0 && (
        <>
          <h3>أوردرات استخدمت فيها نقاط</h3>
          {orders.map((o) => (
            <div className="pts-row" key={o.orderId}>
              <span>
                {o.storeName} • {o.pointsUsed} نقطة
              </span>
              {pendingRefund(o.orderId) ? (
                <span className="pts-st pts-pending">طلب استرداد موجود</span>
              ) : (
                <button type="button" className="pts-small" onClick={() => askRefund(o)}>
                  طلب استرداد
                </button>
              )}
            </div>
          ))}
        </>
      )}

      {refunds.length > 0 && (
        <>
          <h3>طلبات الاسترداد</h3>
          {refunds.map((r) => (
            <div className="pts-row" key={r.requestId}>
              <span>
                {r.points} نقطة • أوردر {r.orderId}
              </span>
              <span className={`pts-st pts-${r.status}`}>{STATUS_TEXT[r.status] || r.status}</span>
              {r.adminNote && <small>{r.adminNote}</small>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
