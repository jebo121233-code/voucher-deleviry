// بحث بالاسم بالعربي والإنجليزي.
// 1) مطابقة مباشرة بعد التنظيف (حروف مختلفة الشكل: أ/إ/آ، ة/ه، ى/ي، التشكيل...)
// 2) مطابقة صوتية تقريبية: "رولز" تلاقي "Rolz" و"برجر كينج" تلاقي "Burger King" (بنحوّل الاتنين لهيكل حروف ساكنة).

const DIAC = /[\u064B-\u065F\u0670\u0640]/g;

export function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(DIAC, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[\u0660-\u0669]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const AR = {
  ب: "b", ت: "t", ث: "s", ج: "g", ح: "h", خ: "k", د: "d", ذ: "z", ر: "r", ز: "z", س: "s", ش: "s", ص: "s", ض: "d",
  ط: "t", ظ: "z", غ: "g", ف: "f", ق: "k", ك: "k", ل: "l", م: "m", ن: "n", ه: "h",
};

// هيكل صوتي بالحروف الساكنة بس
export function skeleton(s) {
  let t = normalize(s);
  t = t.replace(/sh|ch/g, "s").replace(/kh/g, "k").replace(/th/g, "s").replace(/ph/g, "f").replace(/ck/g, "k").replace(/ee|oo/g, "").replace(/zz/g, "tz");
  let out = "";
  for (const ch of t) {
    if (AR[ch] !== undefined) out += AR[ch];
    else if (/[a-z]/.test(ch)) {
      if ("aeiouwy".includes(ch)) continue;
      out += { c: "k", q: "k", j: "g", v: "f", p: "b", x: "ks" }[ch] || ch;
    } else if (/[0-9]/.test(ch)) out += ch;
    // باقي الحروف العربية (ا و ي ع ء) بتتشال
  }
  return out.replace(/(.)\1+/g, "$1");
}

// هل المحل مطابق للبحث؟ بنبحث في الاسم والاسم التاني (altName)
export function matchesQuery(shop, query) {
  const q = normalize(query);
  if (!q) return true;
  const names = [shop.name, shop.altName].filter(Boolean);
  if (names.some((n) => normalize(n).includes(q))) return true;
  const qs = skeleton(query);
  if (qs.length >= 3) return names.some((n) => skeleton(n).includes(qs));
  // استعلام قصير جداً (حرفين): لازم يطابق كلمة كاملة في الاسم، عشان منجيبش نتائج عشوائية
  if (qs.length === 2) return names.some((n) => normalize(n).split(" ").some((w) => skeleton(w) === qs));
  return false;
}

// ترتيب النتائج: اللي الاسم بيبدأ بالبحث الأول، وبعدين المطابقة المباشرة، وبعدين الصوتية
export function rankShops(shops, query) {
  const q = normalize(query);
  if (!q) return shops;
  const score = (s) => {
    const names = [s.name, s.altName].filter(Boolean).map(normalize);
    if (names.some((n) => n.startsWith(q))) return 0;
    if (names.some((n) => n.includes(q))) return 1;
    return 2;
  };
  return shops.filter((s) => matchesQuery(s, query)).sort((a, b) => score(a) - score(b));
}
