import "./OptionsEditor.css";

// محرر أحجام وإضافات الصنف. value = [{name, required, priceMode, discountable, choices:[{label, price|priceAdd}]}]
// بيستخدمه المطعم (لوحة الشريك) والأدمن.
const num = (v) => (v === "" || v === undefined || v === null ? "" : v);

export default function OptionsEditor({ value, onChange, basePrice }) {
  const groups = Array.isArray(value) ? value : [];
  const base = Number(basePrice) > 0 ? Number(basePrice) : 0;

  const setGroup = (gi, patch) => onChange(groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const setChoice = (gi, ci, patch) =>
    onChange(groups.map((g, i) => (i === gi ? { ...g, choices: g.choices.map((c, j) => (j === ci ? { ...c, ...patch } : c)) } : g)));

  const addSizes = () =>
    onChange([
      ...groups,
      {
        name: "الحجم",
        required: true,
        priceMode: "absolute",
        discountable: true,
        choices: [
          { label: "S", price: base },
          { label: "M", price: base ? Math.round(base * 1.2) : "" },
          { label: "L", price: base ? Math.round(base * 1.4) : "" },
        ],
      },
    ]);
  const addExtras = () =>
    onChange([...groups, { name: "إضافات", required: false, discountable: false, choices: [{ label: "", priceAdd: 0 }] }]);
  const addCustom = () =>
    onChange([...groups, { name: "", required: true, discountable: true, choices: [{ label: "", priceAdd: 0 }] }]);

  const switchMode = (gi, mode) => {
    const g = groups[gi];
    const abs = mode === "absolute";
    onChange(
      groups.map((x, i) =>
        i === gi
          ? {
              ...x,
              priceMode: abs ? "absolute" : undefined,
              choices: g.choices.map((c) => {
                const v = abs ? c.price ?? c.priceAdd ?? 0 : c.priceAdd ?? c.price ?? 0;
                return abs ? { label: c.label, price: v } : { label: c.label, priceAdd: v };
              }),
            }
          : x
      )
    );
  };

  return (
    <div className="opt-editor">
      <div className="opt-head">
        <strong>الأحجام والإضافات</strong>
        <span className="opt-hint">اختياري: لو الصنف ليه أحجام (S / M / L) أو إضافات (صوص، جبنة...)</span>
      </div>

      {groups.map((g, gi) => {
        const abs = g.priceMode === "absolute";
        return (
          <div className="opt-group" key={gi}>
            <div className="opt-row">
              <input
                className="opt-name"
                placeholder="اسم المجموعة (الحجم / إضافات)"
                value={g.name || ""}
                onChange={(e) => setGroup(gi, { name: e.target.value })}
              />
              <button type="button" className="opt-x" onClick={() => onChange(groups.filter((_, i) => i !== gi))} aria-label="حذف المجموعة">
                🗑️
              </button>
            </div>

            <div className="opt-row opt-flags">
              <select value={g.required ? "1" : "0"} onChange={(e) => setGroup(gi, { required: e.target.value === "1" })}>
                <option value="1">إجباري (العميل لازم يختار واحد)</option>
                <option value="0">اختياري (العميل يختار أكتر من واحد)</option>
              </select>
              <select value={abs ? "absolute" : "add"} onChange={(e) => switchMode(gi, e.target.value)}>
                <option value="absolute">سعر كامل لكل اختيار (زي الأحجام)</option>
                <option value="add">زيادة على سعر الصنف (زي الإضافات)</option>
              </select>
              <label className="opt-check">
                <input type="checkbox" checked={g.discountable !== false} onChange={(e) => setGroup(gi, { discountable: e.target.checked })} />
                الخصم يسري عليها
              </label>
            </div>

            {(g.choices || []).map((c, ci) => (
              <div className="opt-row" key={ci}>
                <input
                  className="opt-label"
                  placeholder={abs ? "الحجم (مثلاً S)" : "الاختيار (مثلاً صوص تشيز)"}
                  value={c.label || ""}
                  onChange={(e) => setChoice(gi, ci, { label: e.target.value })}
                />
                <input
                  className="opt-price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder={abs ? "السعر" : "+ سعر"}
                  value={num(abs ? c.price : c.priceAdd)}
                  onChange={(e) => setChoice(gi, ci, abs ? { price: e.target.value } : { priceAdd: e.target.value })}
                />
                <button
                  type="button"
                  className="opt-x"
                  onClick={() => setGroup(gi, { choices: g.choices.filter((_, j) => j !== ci) })}
                  aria-label="حذف الاختيار"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="opt-add"
              onClick={() => setGroup(gi, { choices: [...(g.choices || []), abs ? { label: "", price: "" } : { label: "", priceAdd: 0 }] })}
            >
              ➕ اختيار
            </button>
          </div>
        );
      })}

      <div className="opt-actions">
        <button type="button" className="opt-add" onClick={addSizes}>➕ أحجام S / M / L</button>
        <button type="button" className="opt-add" onClick={addExtras}>➕ إضافات</button>
        <button type="button" className="opt-add" onClick={addCustom}>➕ مجموعة تانية</button>
      </div>
    </div>
  );
}
