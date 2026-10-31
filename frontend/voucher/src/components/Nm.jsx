import { usePageTarget, localizedName } from "../data/nameUtil.js";

// اسم شريك أو عميل: translate="no" عشان جوجل ما يخربه، وبيتعرض بنطقه بلغة الصفحة لو مترجمة.
export default function Nm({ name, alt, as: Tag = "span", ...rest }) {
  const target = usePageTarget();
  return (
    <Tag translate="no" className={`notranslate${rest.className ? " " + rest.className : ""}`} {...rest}>
      {localizedName(name, alt, target)}
    </Tag>
  );
}
