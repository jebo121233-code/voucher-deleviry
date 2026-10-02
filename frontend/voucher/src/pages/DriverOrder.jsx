import { useState, useEffect, useCallback, useMemo } from "react";

// TODO: حط رابط الـ Web App بتاع Apps Script هنا
const API_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";

// TODO: عدّل الدالة دي على حسب طريقة قراءتك لبيانات الدليفري المسجل دخوله
function useCurrentDriverPhone() {
  // const { user } = useAuth();
  // return user?.phone;
  return localStorage.getItem("driverPhone");
}

async function callApi(action, payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

function formatMinSec(ms) {
  const total = Math.floor(Math.abs(ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function DriverOrders() {
  const driverPhone = useCurrentDriverPhone();
  const [current, setCurrent] = useState(null);
  const [available, setAvailable] = useState([]);
  const [serverOffset, setServerOffset] = useState(0); // فرق التوقيت بين جهازه والسيرفر
  const [arriveLimitMin, setArriveLimitMin] = useState(15);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!driverPhone) return;
    const cur = await callApi("of_driverCurrent", { driverPhone });
    if (cur.success) {
      setCurrent(cur.order);
      setServerOffset(cur.serverNow - Date.now());
      setArriveLimitMin(cur.arriveLimitMin);
    }
    if (!cur.order) {
      const av = await callApi("of_driverAvailable", { driverPhone });
      if (av.success) setAvailable(av.orders);
    } else {
      setAvailable([]);
    }
    setLoading(false);
  }, [driverPhone]);

  useEffect(() => {
    load();
    const t = setInterval(load, 6000); // تحديث كل 6 ثواني
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000); // عداد لايف كل ثانية
    return () => clearInterval(t);
  }, []);

  // حساب وقت الوصول المتبقي/المتأخر بناءً على وقت السيرفر
  const arriveTimer = useMemo(() => {
    if (!current || current.ArrivedAt) return null;
    const serverNow = now + serverOffset;
    const deadline = Number(current.AcceptedAt) + arriveLimitMin * 60000;
    const diff = deadline - serverNow;
    return { late: diff < 0, ms: diff };
  }, [current, now, serverOffset, arriveLimitMin]);

  async function acceptOrder(orderId) {
    const r = await callApi("of_driverAccept", { orderId, driverPhone });
    if (!r.success) alert(r.error);
    load();
  }

  async function markArrived() {
    const r = await callApi("of_driverArrived", { orderId: current.OrderID, driverPhone });
    if (!r.success) alert(r.error);
    load();
  }

  async function markPickup() {
    const r = await callApi("of_driverPickup", { orderId: current.OrderID, driverPhone });
    if (!r.success) alert(r.error);
    load();
  }

  async function markDelivered() {
    if (!confirm("تأكيد إنك سلّمت الأوردر للعميل؟")) return;
    const r = await callApi("of_driverDelivered", { orderId: current.OrderID, driverPhone });
    if (!r.success) alert(r.error);
    load();
  }

  if (!driverPhone) return <div className="p-4">لازم تسجل دخول كدليفري.</div>;
  if (loading) return <div className="p-4">جاري التحميل...</div>;

  return (
    <div className="p-4 space-y-4">
      {current ? (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold">أوردر #{current.OrderID}</span>
            <span className="text-sm px-2 py-0.5 rounded bg-gray-100">{current.Status}</span>
          </div>

          <div className="text-sm space-y-0.5">
            <div>العميل: {current.CustomerName}</div>
            <div>الموبايل: {current.CustomerPhone}</div>
            {/* العنوان بيظهر تلقائيًا هنا لأنه اتفك بمجرد ما قبلت الأوردر */}
            {current.CustomerAddress && <div>العنوان: {current.CustomerAddress}</div>}
            <div>الفرع: {current.BranchName}</div>
          </div>

          {!current.ArrivedAt && arriveTimer && (
            <div className={`text-center font-mono text-lg ${arriveTimer.late ? "text-red-600" : "text-green-700"}`}>
              {arriveTimer.late
                ? `متأخر بـ ${formatMinSec(arriveTimer.ms)} — سرّع!`
                : `باقي ${formatMinSec(arriveTimer.ms)} للوصول للمطعم`}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {!current.ArrivedAt && (
              <button onClick={markArrived} className="btn-primary">وصلت المطعم</button>
            )}
            {current.ArrivedAt && !current.DriverPickupAt && (
              <button onClick={markPickup} className="btn-primary">استلمت من المطعم</button>
            )}
            {current.DriverPickupAt && current.Status === "awaiting_handover" && (
              <div className="text-sm text-amber-600">بانتظار تأكيد المطعم للتسليم</div>
            )}
            {current.Status === "on_the_way" && (
              <button onClick={markDelivered} className="btn-primary">تم التسليم للعميل</button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="font-bold">الأوردرات المتاحة</div>
          {available.length === 0 && <div className="text-gray-500">مفيش أوردرات متاحة دلوقتي</div>}
          {available.map((o) => (
            <div key={o.OrderID} className="border rounded-lg p-3 space-y-1">
              <div className="flex justify-between">
                <span className="font-bold">#{o.OrderID}</span>
                <span className="text-sm text-gray-500">{o.BranchName}</span>
              </div>
              {/* الاسم والرقم ظاهرين، العنوان مقفول لحد ما يقبل */}
              <div className="text-sm">العميل: {o.CustomerName}</div>
              <div className="text-sm">الموبايل: {o.CustomerPhone}</div>
              <button onClick={() => acceptOrder(o.OrderID)} className="btn-primary w-full mt-2">
                قبول الأوردر
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ملاحظة: btn-primary دي كلاس افتراضي، بدّله بكلاس Tailwind الفعلي عندك. */
