// المحلات اللي جاية من الشيت (إضافة الأدمن أو طلب شراكة اتقبل) بتتضاف لنفس قايمة data.js
// من غير ما نعدل data.js: المحل المكتوب في الكود بيفضل زي ما هو ومبيتكررش.
import { shops, categories, MENU_STORE_KEYS, CART_SCRIPT_URL } from "./data.js";

const CACHE_KEY = "ve_dynamic_stores_v1";
const added = new Set(); // أرقام المحلات الديناميك اللي اتضافت للقايمة

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
    const v = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function writeCache(list) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch {
    /* مش مشكلة */
  }
}

// بتدمج القايمة في shops و MENU_STORE_KEYS. بترجّع true لو حصل تغيير فعلي.
export function applyDynamicStores(list) {
  let changed = false;
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
  return changed;
}

// عند تحميل الملف: نطبّق آخر نسخة محفوظة فوراً (عشان الصفحة متظهرش فاضية)
applyDynamicStores(readCache());

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
    writeCache(data.stores);
    return applyDynamicStores(data.stores);
  } catch {
    return false;
  }
}
