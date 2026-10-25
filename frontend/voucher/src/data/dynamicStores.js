// المحلات اللي جاية من الشيت (إضافة الأدمن أو طلب شراكة اتقبل) بتتضاف لنفس قايمة data.js
// من غير ما نعدل data.js: المحل المكتوب في الكود بيفضل زي ما هو ومبيتكررش.
import { shops, categories, MENU_STORE_KEYS, CART_SCRIPT_URL } from "./data.js";

const CACHE_KEY = "ve_dynamic_stores_v2";
const added = new Set(); // أرقام المحلات الديناميك اللي اتضافت للقايمة
let lastStaticSig = "";
const origStatic = new Map(); // نسخة من بيانات محلات data.js قبل ما بيانات الشيت تغطّي عليها
const OVERRIDE_FIELDS = ["description", "addresses", "logos", "logoUrl", "images", "percentage", "note", "links"];

// الحقول اللي الأدمن عدّلها من الشيت (الفاضي = سيب اللي في الكود)
function sheetFields(s) {
  const o = {};
  if (s.description) o.description = s.description;
  if (s.address) o.addresses = [s.address];
  if (s.logoUrl) { o.logos = [s.logoUrl]; o.logoUrl = s.logoUrl; }
  if (Array.isArray(s.images) && s.images.length) o.images = s.images;
  if (s.percentage) o.percentage = s.percentage;
  if (s.note) o.note = s.note;
  if (Array.isArray(s.links) && s.links.length) o.links = s.links;
  return o;
}

// ===== التحكم في الظهور (من تاب "المحلات" في الأدمن) =====
// visibility[storeId] = { visible, home }. المحل اللي مالوش صف = ظاهر وفي الرئيسية (زي الأول).
let visibility = {};
let version = 0;
export const getStoresVersion = () => version; // الصفحات بتحطه في dependencies عشان تتحدّث لما القايمة تتغير

// ظاهر في صفحة المحلات وعند اختيار القسم
// الصف بيتدوّر عليه برقم المحل، ولو مفيش فبمفتاح المنيو (لما الأدمن بيتحكم من ملف الشريك بيتسجل بمفتاح المنيو)
const visRow = (shop) => visibility[String(shop.id)] || visibility[String(MENU_STORE_KEYS[shop.id] || "")];
export const isVisible = (shop) => {
  const v = visRow(shop);
  return !v || v.visible !== false;
};
// ظاهر في الرئيسية (لازم يكون ظاهر أصلاً)
export const isOnHome = (shop) => {
  const v = visRow(shop);
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

  // رجّع محلات الكود لأصلها الأول، وبعدين طبّق تعديلات الشيت فوقها
  origStatic.forEach((orig, id) => {
    const sh = shops.find((x) => x.id === id);
    if (sh) OVERRIDE_FIELDS.forEach((k) => { if (orig[k] === undefined) delete sh[k]; else sh[k] = orig[k]; });
  });

  const staticSig = [];
  wanted.forEach((s, key) => {
    if (staticKeys.has(key) || staticNames.has(norm(s.name))) {
      // موجود في الكود: نطبّق بيانات الشيت (لو الأدمن عدّلها) على المحل الأصلي
      const target = shops.find((x) => !added.has(x.id) && (String(MENU_STORE_KEYS[x.id]) === key || norm(x.name) === norm(s.name)));
      if (target) {
        if (!origStatic.has(target.id)) {
          const snap = {};
          OVERRIDE_FIELDS.forEach((k) => { snap[k] = target[k]; });
          origStatic.set(target.id, snap);
        }
        const o = sheetFields(s);
        Object.keys(o).forEach((k) => { target[k] = o[k]; });
        staticSig.push(target.id + JSON.stringify(o));
      }
      return;
    }
    const sid = key; // نفس مفتاح المنيو (مش هيتعارض مع أرقام محلات data.js)
    const shop = {
      id: sid,
      menuKey: key,
      name: s.name,
      description: s.description || "",
      category_ids: [categoryIdOf(s.category)],
      percentage: s.percentage || "",
      note: s.note || "",
      links: Array.isArray(s.links) ? s.links : [],
      status: "Active",
      addresses: s.address ? [s.address] : [],
      logos: s.logoUrl ? [s.logoUrl] : [],
      logoUrl: s.logoUrl || "",
      images: Array.isArray(s.images) ? s.images : [],
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
  const sig = staticSig.sort().join("|");
  if (sig !== lastStaticSig) { lastStaticSig = sig; changed = true; }
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
