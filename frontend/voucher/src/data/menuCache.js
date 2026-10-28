// تحميل المنيو بسرعة: بيعرض آخر منيو محفوظ على الجهاز فوراً، وبعدين يحدّثه من السيرفر في الخلفية.
// ولو مفيش نت، المنيو المحفوظ بيفضل ظاهر.
import { CART_SCRIPT_URL } from "./data.js";

const PREFIX = "ve_menu_v1_";
const MAX_AGE_MS = 7 * 24 * 3600 * 1000; // أسبوع
const mem = new Map();
const inflight = new Map();

export function readMenu(key) {
  const k = String(key);
  if (mem.has(k)) return mem.get(k);
  try {
    const v = JSON.parse(localStorage.getItem(PREFIX + k) || "null");
    if (v && Array.isArray(v.items) && Date.now() - (v.at || 0) < MAX_AGE_MS) {
      mem.set(k, v);
      return v;
    }
  } catch {
    /* مش مشكلة */
  }
  return null;
}

function writeMenu(key, data) {
  const v = {
    items: data.items,
    pointsRequired: Number(data.pointsRequired) || 0,
    deliveryEnabled: data.deliveryEnabled !== false,
    at: Date.now(),
  };
  mem.set(String(key), v);
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(v));
  } catch {
    /* التخزين ممتلئ */
  }
  return v;
}

// بيجيب المنيو من السيرفر (طلب واحد بس حتى لو اتنادى كذا مرة). بيرجّع null لو فشل.
export function fetchMenuFresh(key) {
  const k = String(key);
  if (inflight.has(k)) return inflight.get(k);
  const p = fetch(CART_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "getMenu", storeId: k }),
  })
    .then((r) => r.json())
    .then((d) => (d && d.success && Array.isArray(d.items) ? writeMenu(k, d) : null))
    .catch(() => null)
    .finally(() => inflight.delete(k));
  inflight.set(k, p);
  return p;
}

// تحميل مسبق (من غير ما حد ينتظر): استخدمها لما العميل يقرّب من محل
export function prefetchMenu(key) {
  if (key) fetchMenuFresh(key);
}
