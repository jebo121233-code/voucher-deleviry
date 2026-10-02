import { useState, useEffect, useCallback } from "react";

// TODO: حط رابط الـ Web App بتاع Apps Script هنا (أو استورده من ملف config عندك)
const API_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";

// TODO: عدّل الدالة دي على حسب طريقة قراءتك لبيانات الشريك المسجل دخوله
// المفروض ترجع partnerId (نفس القيمة المخزنة في عمود PartnerID بشيت الأوردرات)
function useCurrentPartnerId() {
  // مثال لو عندك AuthContext:
  // const { user } = useAuth();
  // return user?.partnerId;
  return localStorage.getItem("partnerId");
}

async function callApi(action, payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

const STATUS_LABELS = {
  new: "جديد",
  preparing: "تحت التنفيذ",
  ready: "جاهز للاستلام",
  awaiting_handover: "بانتظار تأكيد التسليم",
  on_the_way: "في الطريق",
  delivered: "تم التسليم",
  rejected: "مرفوض",
};

export default function PartnerOrders() {
  const partnerId = useCurrentPartnerId();
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("orders"); // orders | branches

  const loadOrders = useCallback(async () => {
    if (!partnerId) return;
    const r = await callApi("of_partnerActive", { partnerId });
    if (r.success) setOrders(r.orders);
    else setError(r.error);
    setLoading(false);
  }, [partnerId]);

  const loadBranches = useCallback(async () => {
    if (!partnerId) return;
    const r = await callApi("of_branchList", { partnerId });
    if (r.success) setBranches(r.branches);
  }, [partnerId]);

  useEffect(() => {
    loadOrders();
    loadBranches();
    const t = setInterval(loadOrders, 8000); // تحديث كل 8 ثواني
    return () => clearInterval(t);
  }, [loadOrders, loadBranches]);

  async function act(action, orderId) {
    const r = await callApi(action, { orderId, partnerId });
    if (!r.success) alert(r.error);
    loadOrders();
  }

  async function addBranch() {
    const name = prompt("اسم الفرع؟");
    if (!name) return;
    const lat = prompt("Lat (خط العرض)؟");
    const lng = prompt("Lng (خط الطول)؟");
    if (!lat || !lng) return;
    const r = await callApi("of_branchAdd", { partnerId, name, lat, lng });
    if (!r.success) alert(r.error);
    loadBranches();
  }

  async function requestBranchChange(branchId, branchAction) {
    const note = prompt(
      branchAction === "pause" ? "سبب الإيقاف المؤقت؟" : "سبب طلب التشغيل؟"
    );
    if (note === null) return;
    const r = await callApi("of_branchRequestChange", {
      branchId,
      partnerId,
      branchAction,
      note,
    });
    if (!r.success) alert(r.error);
    else alert("تم إرسال الطلب، هيتراجع من الإدارة قريبًا");
    loadBranches();
  }

  if (!partnerId) return <div className="p-4">لازم تسجل دخول كشريك.</div>;
  if (loading) return <div className="p-4">جاري التحميل...</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTab("orders")}
          className={`px-3 py-1 rounded ${tab === "orders" ? "bg-orange-500 text-white" : "bg-gray-100"}`}
        >
          الأوردرات
        </button>
        <button
          onClick={() => setTab("branches")}
          className={`px-3 py-1 rounded ${tab === "branches" ? "bg-orange-500 text-white" : "bg-gray-100"}`}
        >
          الفروع
        </button>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 && <div className="text-gray-500">مفيش أوردرات شغالة دلوقتي</div>}
          {orders.map((o) => (
            <div key={o.OrderID} className="border rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold">#{o.OrderID}</span>
                <span className="text-sm px-2 py-0.5 rounded bg-gray-100">
                  {STATUS_LABELS[o.Status] || o.Status}
                </span>
              </div>
              <div className="text-sm text-gray-600">الفرع: {o.BranchName || "—"}</div>

              {/* البيانات دي بتظهر بس بعد ما دليفري يقبل الأوردر */}
              {o.CustomerName && (
                <div className="text-sm space-y-0.5">
                  <div>العميل: {o.CustomerName}</div>
                  <div>الموبايل: {o.CustomerPhone}</div>
                  {o.CustomerAddress && <div>العنوان: {o.CustomerAddress}</div>}
                </div>
              )}

              <div className="flex gap-2 flex-wrap pt-1">
                {o.Status === "new" && (
                  <>
                    <button onClick={() => act("of_partnerAccept", o.OrderID)} className="btn-primary">
                      قبول
                    </button>
                    <button onClick={() => act("of_partnerReject", o.OrderID)} className="btn-danger">
                      رفض
                    </button>
                  </>
                )}
                {o.Status === "preparing" && (
                  <>
                    <button onClick={() => act("of_partnerReady", o.OrderID)} className="btn-primary">
                      تم التجهيز
                    </button>
                    <button onClick={() => act("of_partnerReject", o.OrderID)} className="btn-danger">
                      رفض
                    </button>
                  </>
                )}
                {(o.Status === "ready" || o.Status === "awaiting_handover") && o.DriverName && (
                  <button onClick={() => act("of_partnerHandover", o.OrderID)} className="btn-primary">
                    تم التسليم للدليفري ({o.DriverName})
                  </button>
                )}
                {(o.Status === "ready" || o.Status === "awaiting_handover") && !o.DriverName && (
                  <div className="text-sm text-amber-600">في انتظار دليفري يقبل الأوردر</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "branches" && (
        <div className="space-y-3">
          <button onClick={addBranch} className="btn-primary">+ إضافة فرع</button>
          {branches.map((b) => (
            <div key={b.BranchID} className="border rounded-lg p-3 flex justify-between items-center">
              <div>
                <div className="font-bold">{b.Name}</div>
                <div className="text-sm text-gray-500">
                  {String(b.Active).toLowerCase() === "yes" ? "شغال" : "متوقف"}
                  {b.PendingAction && ` — طلب ${b.PendingAction === "pause" ? "إيقاف" : "تشغيل"} قيد المراجعة`}
                </div>
              </div>
              {!b.PendingAction && (
                <button
                  onClick={() =>
                    requestBranchChange(
                      b.BranchID,
                      String(b.Active).toLowerCase() === "yes" ? "pause" : "resume"
                    )
                  }
                  className="btn-secondary"
                >
                  {String(b.Active).toLowerCase() === "yes" ? "طلب إيقاف مؤقت" : "طلب تشغيل"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ملاحظة: btn-primary / btn-danger / btn-secondary دول أسماء كلاسات افتراضية،
   بدّلها بكلاسات Tailwind بتاعتك الفعلية أو حط تعريفهم في CSS عندك. */
