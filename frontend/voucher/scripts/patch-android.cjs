// بيتنفذ في GitHub Actions بعد "cap add android": بيضيف أذونات الموقع في الخلفية ويظبط رقم النسخة.
const fs = require("fs");
const path = require("path");

const manifestPath = path.join("android", "app", "src", "main", "AndroidManifest.xml");
const gradlePath = path.join("android", "app", "build.gradle");

const PERMISSIONS = [
  "android.permission.INTERNET",
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.ACCESS_BACKGROUND_LOCATION",
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_LOCATION",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.WAKE_LOCK",
];

let xml = fs.readFileSync(manifestPath, "utf8");
const missing = PERMISSIONS.filter((p) => !xml.includes(`"${p}"`));
if (missing.length) {
  const block = missing.map((p) => `    <uses-permission android:name="${p}" />`).join("\n") + "\n";
  if (!xml.includes("<application")) throw new Error("AndroidManifest.xml: <application> not found");
  xml = xml.replace("<application", block + "\n    <application");
  fs.writeFileSync(manifestPath, xml);
}
console.log("manifest permissions added:", missing.length);

const run = process.env.GITHUB_RUN_NUMBER || "1";
let gradle = fs.readFileSync(gradlePath, "utf8");
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${run}`).replace(/versionName\s+"[^"]*"/, `versionName "1.0.${run}"`);
fs.writeFileSync(gradlePath, gradle);
console.log("version set to 1.0." + run);
