// i18n 键位完整性校验脚本（临时工具，不属于应用源码）
const fs = require("fs");
const path = require("path");

const files = fs.readdirSync("src/locales/zh-CN").filter((f) => f.endsWith(".json"));
const merged = {};
for (const f of files) {
  merged[f.replace(".json", "")] = JSON.parse(fs.readFileSync(path.join("src/locales/zh-CN", f), "utf8"));
}

function lookup(key) {
  let obj = merged;
  for (const part of key.split(".")) {
    if (obj && typeof obj === "object" && part in obj) obj = obj[part];
    else return false;
  }
  return true;
}

const missing = new Set();
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(tsx?)$/.test(entry.name)) continue;
    const src = fs.readFileSync(full, "utf8");
    const re = /(?:[^a-zA-Z_.]|^)\bt\(\s*["']([^"'$]+)["']\s*[,)]/g;
    let m;
    while ((m = re.exec(src))) {
      const key = m[1];
      if (!lookup(key)) missing.add(key + "  [" + full.split(path.sep).join("/") + "]");
    }
  }
}
walk("src");
console.log("missing keys:", missing.size);
console.log([...missing].sort().join("\n"));
