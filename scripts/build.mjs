/**
 * 并行构建脚本
 *
 * 流程: sync-version → optimize-images → (vue-tsc ∥ vite build)
 *
 * 关键优化: vue-tsc 与 vite build 互不依赖,在机器上并行执行,
 * 把串行 ~23s 压到约等于两者中较长者的耗时。
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const startTime = Date.now();

/** 运行子进程,继承 stdio;失败时 reject 并携带退出码 */
function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: true });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve();
      const err = new Error(`${cmd} ${args.join(" ")} 失败 (退出码 ${code})`);
      err.code = code;
      reject(err);
    });
  });
}

try {
  // 1. 版本同步:写 src-tauri/tauri.conf.json 与 Cargo.toml
  await run("pnpm", ["sync-version"]);

  // 2. 图片压缩:修改 public/,须在 vite 打包前完成
  await run("node", ["scripts/optimize-images.mjs"]);

  // 3. 类型检查与打包并行(互不依赖)
  const results = await Promise.allSettled([
    run("pnpm", ["typecheck"]),
    run("node", [join("node_modules", "vite", "bin", "vite.js"), "build"]),
  ]);

  const failed = results.find((r) => r.status === "rejected");
  if (failed) process.exit(failed.reason?.code ?? 1);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ 构建完成 (${elapsed}s)`);
} catch (err) {
  console.error(`❌ 构建失败: ${err.message}`);
  process.exit(1);
}
