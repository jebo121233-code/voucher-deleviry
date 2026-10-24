// المحلات اللي جاية من الشيت (إضافة الأدمن أو طلب شراكة اتقبل) بتتضاف لنفس قايمة data.js
// من غير ما نعدل data.js: المحل المكتوب في الكود بيفضل زي ما هو ومبيتكررش.
import { shops, categories, MENU_STORE_KEYS, CART_SCRIPT_URL } from "./data.js";

const CACHE_KEY = "ve_dynamic_stores_v2";
const added = new Set(); // أرقام المحلات الديناميك اللي اتضافت للقايمة

// ===== التحكم في الظهور (من تاب "المحلات" في الأدمن) =====
// visibility[storeId] = { visible, home }. المحل اللي مالوش صف = ظاهر وفي الرئيسية (زي الأول).
let visibility = {};
let version = 0;
export const getStoresVersion = () => version; // الصفحات بتحطه في dependencies عشان تتحدّث لما القايمة تتغير

// ظاهر في صفحة المحلات وعند اختيار القسم
export const isVisible = (shop) => {
  const v = visibility[String(shop.id)];
  return !v || v.visible !== false;
};
// ظاهر في الرئيسية (لازم يكون ظاهر أصلاً)
export const isOnHome = (shop) => {
  const v = visibility[String(shop.id)];
  return isVisible(shop) && (!v || v.home !== false);
};

const norm = (s) => String(s || "").toLowerCase().replace(/[\s\-_.'"]+/g, "");

function categoryIdOf(text) {
  const t = String(text || "").trim();
  const exact = categories.find((c) => c.name === t);
  if (exact) return exact.id;
  const part = categories.find((c) => t && (t.includes(c.name) || c.name.includes(t)));
  return part ? part.id : 1;
}

function readCache() {
  try {
    const v = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    return { stores: Array.isArray(v.stores) ? v.stores : [], visibility: v.visibility && typeof v.visibility === "object" ? v.visibility : {} };
  } catch {
    return { stores: [], visibility: {} };
  }
}

function writeCache(stores, vis) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ stores, visibility: vis }));
  } catch {
    /* مش مشكلة */
  }
}

// بتدمج القايمة في shops و MENU_STORE_KEYS. بترجّع true لو حصل تغيير فعلي.
export function applyDynamicStores(list, vis) {
  let changed = false;
  if (vis && typeof vis === "object" && JSON.stringify(vis) !== JSON.stringify(visibility)) {
    visibility = vis;
    changed = true;
  }
  const wanted = new Map();
  (Array.isArray(list) ? list : []).forEach((s) => s && s.id && wanted.set(String(s.id), s));

  // شيل اللي اتشال/اتخفى من الشيت
  for (let i = shops.length - 1; i >= 0; i--) {
    const sid = shops[i].id;
    if (added.has(sid) && !wanted.has(shops[i].menuKey)) {
      delete MENU_STORE_KEYS[sid];
      added.delete(sid);
      shops.splice(i, 1);
      changed = true;
    }
  }

  const staticKeys = new Set(
    shops.filter((x) => !added.has(x.id)).map((x) => MENU_STORE_KEYS[x.id]).filter(Boolean).map(String)
  );
  const staticNames = new Set(shops.filter((x) => !added.has(x.id)).map((x) => norm(x.name)));

  wanted.forEach((s, key) => {
    if (staticKeys.has(key) || staticNames.has(norm(s.name))) return; // موجود في الكود
    const sid = key; // نفس مفتاح المنيو (مش هيتعارض مع أرقام محلات data.js)
    const shop = {
      id: sid,
      menuKey: key,
      name: s.name,
      description: s.description || "",
      category_ids: [categoryIdOf(s.category)],
      percentage: "",
      status: "Active",
      addresses: s.address ? [s.address] : [],
      logos: s.logoUrl ? [s.logoUrl] : [],
      logoUrl: s.logoUrl || "",
      images: [],
      dynamic: true,
      deliveryEnabled: s.deliveryEnabled !== false,
    };
    const i = shops.findIndex((x) => x.id === sid);
    if (i === -1) {
      shops.push(shop);
      added.add(sid);
      changed = true;
    } else if (JSON.stringify(shops[i]) !== JSON.stringify(shop)) {
      shops[i] = shop;
      changed = true;
    }
    // التوصيل: المحل اللي مفيهوش توصيل مبيدخلش خريطة المنيو
    if (shop.deliveryEnabled) {
      if (MENU_STORE_KEYS[sid] !== key) MENU_STORE_KEYS[sid] = key;
    } else {
      delete MENU_STORE_KEYS[sid];
    }
  });
  if (changed) version += 1;
  return changed;
}

// عند تحميل الملف: نطبّق آخر نسخة محفوظة فوراً (عشان الصفحة متظهرش فاضية)
{
  const c = readCache();
  applyDynamicStores(c.stores, c.visibility);
}

// بتجيب القايمة من الشيت. بترجّع true لو القايمة اتغيرت.
export async function loadDynamicStores() {
  try {
    const res = await fetch(CART_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "sd_getStores" }),
    });
    const data = await res.json();
    if (!data || !data.success || !Array.isArray(data.stores)) return false;
    const vis = data.visibility && typeof data.visibility === "object" ? data.visibility : {};
    writeCache(data.stores, vis);
    return applyDynamicStores(data.stores, vis);
  } catch {
    return false;
  }
}
