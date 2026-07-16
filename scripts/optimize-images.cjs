/**
 * 图片优化脚本 — 重新压缩 ETB 背景 WebP 图片
 *
 * 卡片背景实际显示尺寸约 320×100px + blur(1px)，
 * 所以不需要全分辨率 + 高质量。本脚本将现存 WebP：
 *   1. 缩小到最大 640px 宽（覆盖 2x 视网膜屏）
 *   2. 重编码为 quality 15（blur 滤镜会掩盖压缩伪影）
 *
 * 需要 sharp 库：
 *   pnpm add -D sharp
 *
 * 运行方式：
 *   node scripts/optimize-images.cjs
 */

const fs = require("fs");
const path = require("path");

const IMAGE_DIR = path.resolve(__dirname, "../public/images/ETB");
/** 输出质量 — blur 滤镜下 15 已足够 */
const TARGET_QUALITY = 15;
/** 最大宽度（px）— 保留 2x 倍率给 retina 屏幕 */
const MAX_WIDTH = 640;

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.log("⚠ sharp 未安装。请运行 `pnpm add -D sharp` 后重试。");
    return;
  }

  const files = fs.readdirSync(IMAGE_DIR).filter(
    (f) => f.endsWith(".webp") && !f.startsWith("."),
  );

  console.log(`找到 ${files.length} 个 WebP 文件，开始重新压缩 …`);

  let converted = 0;
  let originalTotal = 0;
  let newTotal = 0;

  for (const file of files) {
    const filePath = path.join(IMAGE_DIR, file);
    const originalSize = fs.statSync(filePath).size;

    // 读取到 buffer 后即可释放文件句柄
    const inputBuffer = fs.readFileSync(filePath);
    const metadata = await sharp(inputBuffer).metadata();
    const needResize = metadata.width > MAX_WIDTH;

    // 从 buffer 处理，不持有文件句柄
    let pipeline = sharp(inputBuffer);
    if (needResize) {
      pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    }
    const outputBuffer = await pipeline.webp({ quality: TARGET_QUALITY }).toBuffer();

    const newSize = outputBuffer.length;
    const saving = originalSize - newSize;

    // 写入临时文件再 rename（原子替换，防止进程崩溃时丢文件）
    const tmpPath = path.join(IMAGE_DIR, `.tmp_${file}`);
    fs.writeFileSync(tmpPath, outputBuffer);
    fs.renameSync(tmpPath, filePath);

    const pct = originalSize > 0 ? ((saving / originalSize) * 100).toFixed(0) : "0";
    const resizeLabel = needResize ? ` (${metadata.width}→≤${MAX_WIDTH})` : "";
    console.log(
      `  ✓ ${file.padEnd(30)} ${(originalSize / 1024).toFixed(1)}KB → ${(newSize / 1024).toFixed(1)}KB (-${pct}%)${resizeLabel}`,
    );

    originalTotal += originalSize;
    newTotal += newSize;
    converted++;
  }

  const totalSaving = originalTotal - newTotal;
  const totalPct =
    originalTotal > 0 ? ((totalSaving / originalTotal) * 100).toFixed(0) : "0";
  console.log(
    `\n完成：${converted} 个文件，总 ${(originalTotal / 1024 / 1024).toFixed(1)}MB → ${(newTotal / 1024 / 1024).toFixed(1)}MB（节省 ${totalPct}%）`,
  );
}

main().catch(console.error);
