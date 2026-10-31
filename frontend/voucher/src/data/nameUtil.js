// أسماء الشركاء والعملاء ما بتتترجمش حرفياً: بتتحوّل لنطقها بالحرف التاني
// (Tea Talk -> تي توك ، شاورما سيتي -> shawerma city ، Joseph Youssef -> جوزيف يوسف).
// ترجمة المتصفح (Google Translate) بتشتغل على باقي النصوص زي الأقسام والقوايم عادي.
import { useSyncExternalStore } from "react";

const AR_RE = /[؀-ۿ]/;
const LAT_RE = /[A-Za-z]/;
export const hasArabic = (s) => AR_RE.test(String(s || ""));
export const hasLatin = (s) => LAT_RE.test(String(s || ""));

/* ---------- اكتشاف ترجمة الصفحة ---------- */
// Chrome بيضيف class "translated-ltr" أو "translated-rtl" على <html> ويحط لغة الترجمة في lang.
function readTarget() {
  try {
    const h = document.documentElement;
    const translated = h.classList.contains("translated-ltr") || h.classList.contains("translated-rtl");
    return translated ? String(h.lang || "").slice(0, 2).toLowerCase() : "";
  } catch {
    return "";
  }
}
let observer = null;
const listeners = new Set();
function subscribe(cb) {
  listeners.add(cb);
  if (!observer && typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(() => listeners.forEach((f) => f()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "lang"] });
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size && observer) {
      observer.disconnect();
      observer = null;
    }
  };
}
// "" لو الصفحة مش مترجمة، وإلا كود لغة الترجمة ("en" / "ar" ...)
export const usePageTarget = () => useSyncExternalStore(subscribe, readTarget, () => "");

/* ---------- قاموس كلمات (إنجليزي <-> عربي) ---------- */
const PAIRS = [
  // أسماء شركاء ومحلات
  ["view", "فيو"], ["optics", "أوبتكس"], ["real", "ريل"], ["soft", "سوفت"], ["house", "هاوس"], ["tiny", "تايني"], ["kids", "كيدز"],
  ["tarek", "طارق"], ["helmy", "حلمي"], ["vatrina", "فاترينا"], ["shailene", "شايلين"], ["vip", "في آي بي"], ["store", "ستور"],
  ["juice", "جوس"], ["box", "بوكس"], ["rolz", "رولز"], ["milo", "ميلو"], ["eckoo", "إيكو"], ["barakat", "بركات"], ["max", "ماكس"],
  ["gym", "جيم"], ["pedro", "بيدرو"], ["vendetta", "فينديتا"], ["milky", "ميلكي"], ["sax's", "ساكس"], ["saxs", "ساكس"], ["sax", "ساكس"],
  ["bellissimo", "بيليسيمو"], ["w", "دبليو"], ["lounge", "لاونج"], ["tea", "تي"], ["talk", "توك"], ["oak", "أوك"], ["ipulse", "آي بولس"],
  ["fit", "فيت"], ["eagle", "إيجل"], ["ice", "آيس"], ["cream", "كريم"], ["desserts", "ديزرتس"], ["ten", "تن"], ["shawerma", "شاورما"],
  ["shawarma", "شاورما"], ["city", "سيتي"], ["haram", "الهرم"], ["el", "ال"], ["asayel", "أصايل"], ["otour", "عطور"], ["burger", "برجر"],
  ["king", "كينج"], ["pizza", "بيتزا"], ["hut", "هت"], ["cafe", "كافيه"], ["coffee", "كوفي"], ["kfc", "كنتاكي"], ["no", "نمبر"],
  ["and", "و"], ["the", "ذا"], ["club", "كلوب"], ["shop", "شوب"], ["market", "ماركت"], ["super", "سوبر"], ["academy", "أكاديمي"],
  ["pharmacy", "صيدلية"], ["sweets", "سويتس"], ["bakery", "بيكري"], ["grill", "جريل"], ["fried", "فرايد"], ["chicken", "تشيكن"],
  // أسماء ناس شائعة
  ["joseph", "جوزيف"], ["youssef", "يوسف"], ["yousef", "يوسف"], ["yusuf", "يوسف"], ["ahmed", "أحمد"], ["ahmad", "أحمد"],
  ["mohamed", "محمد"], ["mohammed", "محمد"], ["muhammad", "محمد"], ["mahmoud", "محمود"], ["ali", "علي"], ["omar", "عمر"],
  ["hassan", "حسن"], ["hussein", "حسين"], ["hossam", "حسام"], ["ibrahim", "إبراهيم"], ["mostafa", "مصطفى"], ["mustafa", "مصطفى"],
  ["khaled", "خالد"], ["kareem", "كريم"], ["karim", "كريم"], ["amr", "عمرو"], ["sara", "سارة"], ["sarah", "سارة"], ["mona", "منى"],
  ["nour", "نور"], ["mariam", "مريم"], ["maryam", "مريم"], ["mina", "مينا"], ["george", "جورج"], ["mark", "مارك"], ["michael", "مايكل"],
  ["peter", "بيتر"], ["john", "جون"], ["mark", "مارك"], ["malak", "ملك"], ["ehab", "إيهاب"], ["tamer", "تامر"], ["islam", "إسلام"],
  ["mahmod", "محمود"], ["osama", "أسامة"], ["samir", "سمير"], ["sherif", "شريف"], ["hany", "هاني"], ["maged", "ماجد"], ["abdallah", "عبدالله"],
  ["abdullah", "عبدالله"], ["abdelrahman", "عبدالرحمن"], ["fady", "فادي"], ["marwan", "مروان"], ["salma", "سلمى"], ["farah", "فرح"],
  ["yasmin", "ياسمين"], ["nada", "ندى"], ["rana", "رنا"], ["hana", "هنا"], ["laila", "ليلى"], ["layla", "ليلى"], ["fatma", "فاطمة"],
  ["fatima", "فاطمة"], ["aya", "آية"], ["esraa", "إسراء"], ["doaa", "دعاء"], ["rania", "رانيا"], ["dina", "دينا"], ["heba", "هبة"],
  // كلمات عربي -> إنجليزي مخصوصة
  ["wahed", "واحد"], ["metpaq", "مطبق"], ["barqouqa", "برقوقة"],
];
const EN2AR = {};
const AR2EN = {};
PAIRS.forEach(([en, ar]) => {
  if (!EN2AR[en]) EN2AR[en] = ar;
  if (!AR2EN[ar]) AR2EN[ar] = en;
});
// أسماء عربي لازم تتكتب بشكل معين بالإنجليزي
AR2EN["محمد"] = "mohamed";
AR2EN["يوسف"] = "youssef";
AR2EN["أحمد"] = "ahmed";
AR2EN["احمد"] = "ahmed";
AR2EN["علي"] = "ali";
AR2EN["الهرم"] = "El-Haram";
AR2EN["كافيه"] = "cafe";
AR2EN["كريم"] = "kareem";
AR2EN["مطعم"] = "restaurant";
AR2EN["مطبخ"] = "kitchen";
AR2EN["مخبز"] = "bakery";
AR2EN["حلويات"] = "sweets";
AR2EN["عطور"] = "otour";
AR2EN["النيل"] = "El Nile";

const normAr = (w) => w.replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
const AR2EN_N = {};
Object.keys(AR2EN).forEach((k) => (AR2EN_N[normAr(k)] = AR2EN[k]));

/* ---------- تحويل بالقواعد لو الكلمة مش في القاموس ---------- */
const L2A_DIGRAPHS = [
  ["sch", "سك"], ["tch", "تش"], ["sh", "ش"], ["ch", "تش"], ["kh", "خ"], ["th", "ث"], ["ph", "ف"], ["ck", "ك"], ["gh", "غ"],
  ["ee", "ي"], ["oo", "و"], ["ou", "و"], ["ea", "ي"], ["ai", "ي"], ["ay", "ي"], ["ie", "ي"], ["aa", "ا"], ["qu", "كو"],
];
const L2A_SINGLE = {
  a: "ا", b: "ب", c: "ك", d: "د", e: "ي", f: "ف", g: "ج", h: "ه", i: "ي", j: "ج", k: "ك", l: "ل", m: "م", n: "ن", o: "و", p: "ب",
  q: "ق", r: "ر", s: "س", t: "ت", u: "و", v: "ف", w: "و", x: "كس", y: "ي", z: "ز",
};
function latinWordToArabic(w) {
  let s = w.toLowerCase().replace(/'s$/, "").replace(/[^a-z0-9]/g, "");
  if (!s) return w;
  if (/^[0-9]+$/.test(s)) return s;
  let out = "";
  for (let i = 0; i < s.length; ) {
    const d = L2A_DIGRAPHS.find(([k]) => s.startsWith(k, i));
    if (d) {
      out += d[1];
      i += d[0].length;
      continue;
    }
    const ch = s[i];
    if (ch === "c" && "eiy".includes(s[i + 1] || "")) out += "س";
    else if (/[0-9]/.test(ch)) out += ch;
    else if (i === 0 && ch === "a") out += "أ";
    else if (i === 0 && ch === "e") out += "إ";
    else if (ch === "e" && i === s.length - 1 && i > 0) {
      /* e صامتة في آخر الكلمة */
    } else out += L2A_SINGLE[ch] || "";
    i++;
  }
  return out.replace(/(.)\1{2,}/g, "$1$1");
}

const A2L = {
  ا: "a", أ: "a", إ: "e", آ: "a", ب: "b", ت: "t", ث: "s", ج: "g", ح: "h", خ: "kh", د: "d", ذ: "z", ر: "r", ز: "z", س: "s", ش: "sh",
  ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "k", ك: "k", ل: "l", م: "m", ن: "n", ه: "h", ة: "a", و: "o", ي: "y",
  ى: "a", ء: "", ئ: "e", ؤ: "o",
};
const VOWELS = "aeiou";
function arabicWordToLatin(w) {
  const s = w.replace(/[ً-ٰٟـ]/g, "");
  if (/^[0-9٠-٩]+$/.test(s)) return s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    let piece = A2L[ch];
    if (piece === undefined) {
      out += ch;
      continue;
    }
    if (ch === "و" && i > 0) piece = "o";
    if (ch === "ي" && i > 0) piece = "i";
    // فاصل حرف علة بين صامتين متتاليين عشان الاسم يتقري
    const prevLast = out[out.length - 1];
    const startsCons = piece && !VOWELS.includes(piece[0]);
    if (prevLast && startsCons && !VOWELS.includes(prevLast) && i > 0 && i < s.length - 1) out += "e";
    out += piece;
  }
  return out;
}

const cleanEnds = (s) => s.replace(/^[\s\-–—.,]+|[\s\-–—.,]+$/g, "").replace(/\s{2,}/g, " ");
const tokens = (s) => String(s || "").split(/(\s+|-)/);

export function toArabicName(name) {
  name = String(name || "").replace(/\bno\.?\s*(\d+)/gi, "نمبر $1");
  return cleanEnds(
    tokens(name)
      .map((t) => {
        if (!t || /^(\s+|-)$/.test(t) || hasArabic(t)) return t;
        const k = t.toLowerCase().replace(/[^a-z0-9']/g, "");
        if (EN2AR[k]) return EN2AR[k];
        if (EN2AR[k.replace(/'s$/, "")]) return EN2AR[k.replace(/'s$/, "")];
        return hasLatin(t) || /[0-9]/.test(t) ? latinWordToArabic(t) : t;
      })
      .join("")
  );
}

const cap = (w) => (w ? w[0].toUpperCase() + w.slice(1) : w);

export function toEnglishName(name) {
  return cleanEnds(
    tokens(name)
      .map((t) => {
        if (!t || /^(\s+|-)$/.test(t) || !hasArabic(t)) return t;
        const n = normAr(t.replace(/[\u064B-\u065F\u0670\u0640]/g, ""));
        if (AR2EN_N[n] !== undefined) return cap(AR2EN_N[n]);
        if (n.startsWith("ال") && n.length > 3) {
          const rest = n.slice(2);
          return "El-" + cap(AR2EN_N[rest] !== undefined ? AR2EN_N[rest] : arabicWordToLatin(rest));
        }
        return cap(arabicWordToLatin(t));
      })
      .join("")
  );
}

// الجزء العربي أو اللاتيني من اسم مختلط زي "shawerma city شاورما سيتي"
function partOf(name, wantArabic) {
  const words = String(name || "").split(/\s+/).filter(Boolean);
  const keep = words.filter((w) => (wantArabic ? hasArabic(w) : hasLatin(w) && !hasArabic(w)));
  return cleanEnds(keep.join(" "));
}

// الاسم اللي يتعرض حسب لغة الصفحة المترجمة (target). لو الصفحة مش مترجمة بيرجع الاسم زي ما هو.
// alt = الاسم التاني اللي الأدمن كاتبه (بيتفضّل على التحويل التلقائي).
export function localizedName(name, alt, target) {
  const n = String(name || "").trim();
  const a = String(alt || "").trim();
  if (!n) return n;
  if (target === "ar") {
    if (hasArabic(n)) return partOf(n, true) || n;
    if (hasArabic(a)) return partOf(a, true);
    return toArabicName(n);
  }
  if (target === "en") {
    if (hasLatin(n) && !hasArabic(n)) return n;
    if (hasLatin(n) && hasArabic(n)) return partOf(n, false) || n;
    if (hasLatin(a)) return partOf(a, false);
    return toEnglishName(n);
  }
  return n;
}
