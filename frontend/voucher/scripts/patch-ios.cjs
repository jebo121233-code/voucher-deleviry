// بيتنفذ في GitHub Actions بعد "cap add ios": بيضيف أذونات الموقع والتتبع في الخلفية في Info.plist ويظبط رقم النسخة.
const fs = require("fs");
const path = require("path");

const plistPath = path.join("ios", "App", "App", "Info.plist");
let xml = fs.readFileSync(plistPath, "utf8");

const STRINGS = {
  NSLocationWhenInUseUsageDescription: "التطبيق بيستخدم موقعك لتحديد عنوان التوصيل وتتبع الأوردر.",
  NSLocationAlwaysAndWhenInUseUsageDescription: "التطبيق بيستخدم موقعك حتى وهو في الخلفية عشان نتتبع الأوردر أثناء الشيفت.",
  NSLocationAlwaysUsageDescription: "التطبيق بيستخدم موقعك حتى وهو في الخلفية عشان نتتبع الأوردر أثناء الشيفت.",
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
let add = "";
let added = 0;
for (const [k, v] of Object.entries(STRINGS)) {
  if (!xml.includes(`<key>${k}</key>`)) {
    add += `\t<key>${k}</key>\n\t<string>${esc(v)}</string>\n`;
    added++;
  }
}

// UIBackgroundModes: لازم location (والإشعارات لو محتاجها بعدين)
if (!xml.includes("<key>UIBackgroundModes</key>")) {
  add += "\t<key>UIBackgroundModes</key>\n\t<array>\n\t\t<string>location</string>\n\t</array>\n";
  added++;
} else if (!/<key>UIBackgroundModes<\/key>\s*<array>[\s\S]*?<string>location<\/string>/.test(xml)) {
  xml = xml.replace(/(<key>UIBackgroundModes<\/key>\s*<array>)/, "$1\n\t\t<string>location</string>");
  added++;
}

if (add) {
  const i = xml.lastIndexOf("</dict>");
  if (i < 0) throw new Error("Info.plist: closing </dict> not found");
  xml = xml.slice(0, i) + add + xml.slice(i);
}
fs.writeFileSync(plistPath, xml);
console.log("Info.plist keys added:", added);

// رقم النسخة: CFBundleVersion = رقم التشغيل (لازم يزيد في كل رفع على TestFlight)
const run = process.env.GITHUB_RUN_NUMBER || "1";
const pbx = path.join("ios", "App", "App.xcodeproj", "project.pbxproj");
let p = fs.readFileSync(pbx, "utf8");
p = p.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${run};`).replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = 1.0.${run};`);
fs.writeFileSync(pbx, p);
console.log("version set to 1.0." + run);
