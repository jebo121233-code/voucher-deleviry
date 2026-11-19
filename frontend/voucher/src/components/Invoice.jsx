import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./Invoice.css";
import { buildInvoice } from "../data/invoiceUtil.js";

const money = (n) => `${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} ج.م`;
const fmtDate = (d) =>
  new Date(d).toLocaleString("ar-EG", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

const STATUS_TEXT = {
  payment_review: "بنراجع التحويل", pending: "في انتظار المحل", new: "جديد", preparing: "بيتجهز", ready: "جاهز",
  awaiting_handover: "مستني التسليم", on_the_way: "في الطريق", delivered: "اتسلّم", rejected: "ملغي",
};

// مقاس الورق: حراري 80mm (الافتراضي) أو A4
function usePageSize(size) {
  useEffect(() => {
    const st = document.createElement("style");
    st.setAttribute("data-inv-page", "1");
    st.textContent = size === "a4" ? "@page{size:A4;margin:12mm}" : "@page{size:80mm auto;margin:3mm}";
    document.head.appendChild(st);
    return () => st.remove();
  }, [size]);
}

// الفاتورة نفسها (بتتعرض وبتتطبع)
export function InvoiceSheet({ inv }) {
  const collect = inv.audience === "driver";
  const showCustomer = inv.customerName || inv.customerPhone || inv.address;
  return (
    <div className="inv-sheet" dir="rtl">
      <div className="inv-head">
        <div className="inv-brand">VE Voucher</div>
        <div className="inv-title">فاتورة {inv.storeName ? `- ${inv.storeName}` : ""}</div>
      </div>
      <div className="inv-meta"><span>رقم الأوردر:</span><b dir="ltr">{inv.orderId || "—"}</b></div>
      <div className="inv-meta"><span>التاريخ:</span><span>{fmtDate(inv.date)}</span></div>
      {inv.status && <div className="inv-meta"><span>الحالة:</span><span>{STATUS_TEXT[inv.status] || inv.status}</span></div>}
      {inv.driverName && <div className="inv-meta"><span>الدليفري:</span><span>{inv.driverName}</span></div>}

      {showCustomer && (
        <div className="inv-block">
          {inv.customerName && <div>👤 {inv.customerName}</div>}
          {inv.customerPhone && <div dir="ltr" style={{ textAlign: "right" }}>📞 {inv.customerPhone}</div>}
          {inv.address && <div>🏠 {inv.address}</div>}
        </div>
      )}

      {inv.lines.length > 0 ? (
        <table className="inv-table">
          <thead>
            <tr><th>الصنف</th><th className="n">الكمية</th><th className="n">السعر</th><th className="n">الإجمالي</th></tr>
          </thead>
          <tbody>
            {inv.lines.map((l, i) => (
              <tr key={i}>
                <td>{l.name}</td>
                <td className="n">{l.qty}</td>
                <td className="n">{l.unit ? l.unit : "—"}</td>
                <td className="n">{l.total ? l.total : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="inv-block">{inv.fallbackText || "—"}</div>
      )}

      <div className="inv-block">
        {inv.lines.length > 0 && <div className="inv-tot"><span>المجموع</span><span>{money(inv.subtotal)}</span></div>}
        {inv.deliveryFee > 0 && <div className="inv-tot"><span>رسوم التوصيل</span><span>{money(inv.deliveryFee)}</span></div>}
        {inv.adjustment > 0 && <div className="inv-tot"><span>{inv.feeKnown ? "رسوم أخرى" : "رسوم التوصيل"}</span><span>{money(inv.adjustment)}</span></div>}
        {inv.adjustment < 0 && <div className="inv-tot"><span>خصم{inv.pointsUsed > 0 ? ` (${inv.pointsUsed} نقطة)` : ""}</span><span>- {money(-inv.adjustment)}</span></div>}
        <div className="inv-tot inv-grand"><span>الإجمالي</span><span>{money(inv.total)}</span></div>
        {inv.paymentMethod && <div className="inv-tot"><span>طريقة الدفع</span><span>{inv.paymentMethod}</span></div>}
      </div>

      {collect && inv.total > 0 && (
        <div className="inv-collect">{inv.transfer ? "تم الدفع بالتحويل ✅" : `المطلوب تحصيله: ${money(inv.total)}`}</div>
      )}

      {inv.audience === "driver" && (
        <div className="inv-sign"><span>توقيع الدليفري</span><span>توقيع العميل</span></div>
      )}
      <div className="inv-foot">شكراً لاختياركم VE Voucher 🧡</div>
    </div>
  );
}

// نافذة الفاتورة مع زرار الطباعة
export function InvoiceModal({ inv, onClose }) {
  const [size, setSize] = useState("thermal");
  usePageSize(size);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!inv) return null;
  return createPortal(
    <div className="inv-overlay" onClick={onClose}>
      <div className="inv-box" onClick={(e) => e.stopPropagation()}>
        <div className="inv-actions">
          <button type="button" className="inv-print-btn" onClick={() => window.print()}>🖨️ طباعة</button>
          <select value={size} onChange={(e) => setSize(e.target.value)} aria-label="مقاس الورق">
            <option value="thermal">ورق حراري 80mm</option>
            <option value="a4">ورق A4</option>
          </select>
          <button type="button" onClick={onClose}>إغلاق</button>
        </div>
        <InvoiceSheet inv={inv} />
      </div>
    </div>,
    document.body
  );
}

// زرار جاهز: بيفتح فاتورة أوردر. order = صف أوردر، audience = customer | partner | driver
export default function InvoiceButton({ order, invoice, audience = "customer", label = "🧾 الفاتورة", className = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>
      {open && <InvoiceModal inv={invoice || buildInvoice(order, { audience })} onClose={() => setOpen(false)} />}
    </>
  );
}
