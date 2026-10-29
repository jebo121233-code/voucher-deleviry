// أدوات صغيرة لأحجام وإضافات الصنف (Options)

// نص مقروء: "الحجم*: S=50 / M=60 | إضافات: صوص+5"
export function optSummary(opts) {
  if (!Array.isArray(opts) || !opts.length) return "";
  return opts
    .map((g) => {
      const abs = g.priceMode === "absolute";
      const list = (g.choices || [])
        .map((c) => {
          const v = abs ? c.price : c.priceAdd;
          return c.label + (v ? (abs ? "=" : "+") + v : "");
        })
        .join(" / ");
      return `${g.name}${g.required ? "*" : ""}: ${list}`;
    })
    .join(" | ");
}

// بيعرض أي قيمة في طلب التعديل (الأوبشنز بتتحول لنص مقروء)
export const fmtField = (k, v) => (k === "options" ? optSummary(v) || "(من غير)" : String(v));

// بيجهّز الأوبشنز للإرسال: يشيل الفاضي ويحوّل الأسعار لأرقام
export function prepareOptions(groups) {
  if (!Array.isArray(groups)) return [];
  return groups
    .map((g) => {
      const abs = g.priceMode === "absolute";
      const choices = (g.choices || [])
        .filter((c) => String(c.label || "").trim())
        .map((c) => {
          const v = Number(abs ? c.price : c.priceAdd);
          const val = isFinite(v) && v > 0 ? v : 0;
          return abs ? { label: String(c.label).trim(), price: val } : { label: String(c.label).trim(), priceAdd: val };
        });
      const out = { name: String(g.name || "").trim(), required: !!g.required, discountable: g.discountable !== false, choices };
      if (abs) out.priceMode = "absolute";
      return out;
    })
    .filter((g) => g.name || g.choices.length);
}
