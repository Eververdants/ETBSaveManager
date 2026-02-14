/**
 * 同步版本号脚本（增量写入）
 * 仅在版本不一致时写文件，避免触发不必要的构建缓存失效。
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

try {
  const packageJsonPath = join(rootDir, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  const version = packageJson.version;
  let changedCount = 0;

  console.log(`📦 当前版本号: ${version}`);

  const tauriConfPath = join(rootDir, "src-tauri", "tauri.conf.json");
  const tauriConf = JSON.parse(readFileSync(tauriConfPath, "utf-8"));
  const oldTauriVersion = tauriConf.version;
  if (oldTauriVersion !== version) {
    tauriConf.version = version;
    writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`, "utf-8");
    changedCount += 1;
    console.log(`✅ tauri.conf.json: ${oldTauriVersion} -> ${version}`);
  } else {
    console.log(`⏭️ tauri.conf.json: 已是 ${version}`);
  }

  const cargoTomlPath = join(rootDir, "src-tauri", "Cargo.toml");
  const cargoToml = readFileSync(cargoTomlPath, "utf-8");
  const versionRegex = /^version = "([^"]+)"$/m;
  const versionMatch = cargoToml.match(versionRegex);

  if (!versionMatch) {
    throw new Error("Cargo.toml 未找到 package version 字段");
  }

  const oldCargoVersion = versionMatch[1];
  if (oldCargoVersion !== version) {
    const nextCargoToml = cargoToml.replace(versionRegex, `version = "${version}"`);
    writeFileSync(cargoTomlPath, nextCargoToml, "utf-8");
    changedCount += 1;
    console.log(`✅ Cargo.toml: ${oldCargoVersion} -> ${version}`);
  } else {
    console.log(`⏭️ Cargo.toml: 已是 ${version}`);
  }

  if (changedCount === 0) {
    console.log("✨ 版本号已同步，无需写入");
  } else {
    console.log(`🎉 版本号同步完成，更新 ${changedCount} 个文件`);
  }
} catch (error) {
  console.error("❌ 版本号同步失败:", error.message);
  process.exit(1);
}
