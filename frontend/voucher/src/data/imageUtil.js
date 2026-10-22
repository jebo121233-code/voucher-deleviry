// أدوات الصور: تصغير الصورة في الموبايل قبل الرفع + رفعها على Google Drive عن طريق الـ Apps Script
import { CART_SCRIPT_URL } from "./data.js";

// مسار الصورة: لو رابط كامل (https) يتساب زي ما هو، وإلا بيتحط قبله prefix (الافتراضي "/" لصور مجلد public)
export const assetUrl = (p, prefix = "/") => (/^(https?:)?\/\//i.test(String(p || "")) || String(p || "").startsWith("data:") ? p : `${prefix}${p}`);

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}

// بيصغّر الصورة (أقصى بُعد max) وبيرجّع base64. اللوجو بيفضل PNG (شفاف) لو الحجم مناسب.
export async function shrinkImage(file, { max = 600, keepPng = false } = {}) {
  const img = await loadImage(file);
  const ratio = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (keepPng) {
    ctx.drawImage(img, 0, 0, w, h);
    const png = canvas.toDataURL("image/png");
    if (png.length < 380000) return png;
  }
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}

// auth: { password, restaurantId? }  للأدمن   |   { restaurantId, token }  للمحل
// kind: "logo" | "product"      بيرجّع الرابط أو بيرمي Error برسالة عربي
export async function uploadImage(file, auth, kind = "logo") {
  let image;
  try {
    image = await shrinkImage(file, { max: kind === "logo" ? 400 : 700, keepPng: kind === "logo" });
  } catch {
    throw new Error("الصورة مش مقروءة، جرب صورة تانية");
  }
  const res = await fetch(CART_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "sd_uploadImage", kind, image, ...auth }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "فشل رفع الصورة");
  return data.url;
}
