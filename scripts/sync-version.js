/**
 * 同步版本号脚本
 * 将 package.json 的版本号同步到：
 * - src-tauri/tauri.conf.json
 * - src-tauri/Cargo.toml
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

try {
  // 读取 package.json
  const packageJsonPath = join(rootDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const version = packageJson.version;

  console.log(`📦 当前版本号: ${version}\n`);

  // 1. 同步到 tauri.conf.json
  const tauriConfPath = join(rootDir, 'src-tauri', 'tauri.conf.json');
  const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf-8'));
  const oldTauriVersion = tauriConf.version;
  tauriConf.version = version;
  writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf-8');
  console.log(`✅ tauri.conf.json: ${oldTauriVersion} → ${version}`);

  // 2. 同步到 Cargo.toml
  const cargoTomlPath = join(rootDir, 'src-tauri', 'Cargo.toml');
  let cargoToml = readFileSync(cargoTomlPath, 'utf-8');
  const versionRegex = /^version = ".*"$/m;
  const oldCargoVersion = cargoToml.match(versionRegex)?.[0].match(/"(.*)"/)?.[1];
  cargoToml = cargoToml.replace(versionRegex, `version = "${version}"`);
  writeFileSync(cargoTomlPath, cargoToml, 'utf-8');
  console.log(`✅ Cargo.toml: ${oldCargoVersion} → ${version}`);

  console.log('\n🎉 版本号同步完成！');
} catch (error) {
  console.error('❌ 版本号同步失败:', error.message);
  process.exit(1);
}
