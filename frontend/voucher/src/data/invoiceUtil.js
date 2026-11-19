// تجهيز بيانات الفاتورة من صف أوردر (الشيت) أو من سلة العميل وقت الشراء.
// الأصناف بتتقرا من نص الأوردر: "برجر × 2 = 120 ج.م | بطاطس × 1 = 30 ج.م"

const num = (v) => {
  const n = Number(String(v ?? "").replace(/[^\d.\-]/g, ""));
  return isFinite(n) ? n : 0;
};
const round2 = (n) => Math.round(n * 100) / 100;

export function parseItems(text) {
  return String(text || "")
    .split(/\s*\|\s*|\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = p.match(/^(.*?)\s*[×xX*]\s*(\d+)\s*(?:=\s*([\d.,]+))?/);
      if (!m) return { name: p, qty: 1, total: null };
      const qty = Math.max(1, Number(m[2]) || 1);
      return { name: m[1].trim() || p, qty, total: m[3] !== undefined ? num(m[3]) : null };
    });
}

export const isTransferPayment = (method) => /فودافون|vodafone|تحويل|instapay|انستا/i.test(String(method || ""));

// order: صف من الشيت (OrderID, Items, Total...) أو من getOrderHistory (orderId, items, total...)
// opts.audience: "customer" | "partner" | "driver"
export function buildInvoice(order, opts = {}) {
  const o = order || {};
  const pick = (...keys) => {
    for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
    return "";
  };
  const items = parseItems(pick("Items", "items", "delivery_items", "cards"));
  const lines = items.map((it) => {
    const total = it.total !== null ? it.total : 0;
    return { name: it.name, qty: it.qty, unit: round2(total / it.qty), total: round2(total) };
  });
  const subtotal = round2(lines.reduce((s, l) => s + l.total, 0));
  const total = num(pick("Total", "total", "grand_total"));
  const feeRaw = pick("DeliveryFee", "deliveryFee", "delivery_fee");
  const feeKnown = feeRaw !== "";
  const fee = feeKnown ? num(feeRaw) : 0;
  let adjustment = round2(total - subtotal - fee); // موجب = رسوم، سالب = خصم
  if (!lines.length || Math.abs(adjustment) < 0.005) adjustment = 0;
  const method = String(pick("PaymentMethod", "paymentMethod", "payment_method"));
  const ts = pick("Timestamp", "timestamp", "CreatedAt", "date");
  const date = ts ? new Date(typeof ts === "string" && /^\d+$/.test(ts) ? Number(ts) : ts) : new Date();
  return {
    orderId: String(pick("OrderID", "OrderId", "orderId")),
    date: isNaN(date) ? new Date() : date,
    storeName: String(pick("StoreName", "storeName", "restaurant")),
    customerName: String(pick("CustomerName", "customerName", "name")),
    customerPhone: String(pick("CustomerPhone", "customerPhone", "phone")),
    address: String(pick("CustomerAddress", "Address", "address")),
    driverName: String(pick("DriverName", "driverName")),
    status: String(pick("Status", "status")),
    lines,
    fallbackText: lines.length ? "" : String(pick("Items", "items")),
    subtotal,
    deliveryFee: fee,
    feeKnown,
    adjustment,
    pointsUsed: num(pick("PointsUsed", "pointsUsed")),
    total,
    paymentMethod: method,
    transfer: isTransferPayment(method),
    audience: opts.audience || "customer",
  };
}
