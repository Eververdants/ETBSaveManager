/**
 * 图片构建优化脚本
 * 压缩 public/ 中的大尺寸PNG文件，减小构建产物体积。
 *
 * 用法: node scripts/optimize-images.mjs
 */

import { readdirSync, statSync, existsSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// 使用 sharp 进行图片压缩
async function optimizeImages() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error(
      "❌ sharp 未安装。请运行: pnpm add -D sharp"
    );
    process.exit(1);
  }

  const publicDir = join(rootDir, "public");
  const results = { before: 0, after: 0, saved: 0, files: [] };

  // 收集需要优化的图片: public/icons/ETB_UI/ + public/*.png
  const imageFiles = [];

  // public/icons/ETB_UI/ 中的所有 PNG
  const iconsDir = join(publicDir, "icons", "ETB_UI");
  if (existsSync(iconsDir)) {
    for (const file of readdirSync(iconsDir)) {
      if (file.endsWith(".png")) {
        imageFiles.push(join(iconsDir, file));
      }
    }
  }

  // public/ 根目录的 PNG
  for (const file of readdirSync(publicDir)) {
    if (file.endsWith(".png")) {
      imageFiles.push(join(publicDir, file));
    }
  }

  console.log(`📊 找到 ${imageFiles.length} 个待优化图片\n`);

  for (const filePath of imageFiles) {
    const origSize = statSync(filePath).size;
    const fileName = filePath.replace(rootDir, "");

    // 跳过已经是小尺寸的图片 (< 5KB)
    if (origSize < 5 * 1024) {
      console.log(`  ⏭️  ${fileName} — 已很小 (${(origSize / 1024).toFixed(1)}KB)`);
      continue;
    }

    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();

      let pipeline = image;

      // UI 图标: 限制最大宽度为 128px（除非原始已很小）
      if (filePath.includes("ETB_UI")) {
        const maxDimension = 128;
        if ((metadata.width || 0) > maxDimension || (metadata.height || 0) > maxDimension) {
          pipeline = pipeline.resize(maxDimension, maxDimension, {
            fit: "inside",
            withoutEnlargement: true,
          });
        }
        // 高质量 PNG 压缩
        pipeline = pipeline.png({
          compressionLevel: 9,
          palette: true, // 减少颜色数量按需生成调色板
          colors: 256,
        });
      } else if (filePath.includes("Written_by_Máo")) {
        // 大幅面图片: 限制宽度为 1200px，降低质量
        pipeline = pipeline
          .resize(1200, undefined, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .png({
            compressionLevel: 9,
            palette: true,
            colors: 128,
          });
      } else {
        // 一般大图: 适度压缩
        pipeline = pipeline.png({
          compressionLevel: 9,
          palette: true,
        });
      }

      const buffer = await pipeline.toBuffer();
      const newSize = buffer.length;
      const saved = origSize - newSize;
      const pct = ((saved / origSize) * 100).toFixed(1);

      results.before += origSize;
      results.after += newSize;
      results.saved += saved;

      // 只有在新文件更小时才写入
      if (newSize < origSize) {
        await pipeline.toFile(filePath + ".tmp");
        const { renameSync, unlinkSync } = await import("fs");
        unlinkSync(filePath);
        renameSync(filePath + ".tmp", filePath);
        results.files.push({ name: fileName, before: origSize, after: newSize, pct });
        console.log(
          `  ✅ ${fileName}  ${(origSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB (-${pct}%)`
        );
      } else {
        results.files.push({ name: fileName, before: origSize, after: origSize, pct: "0.0" });
        console.log(`  ⏭️  ${fileName} — 压缩后未减小，跳过`);
      }
    } catch (err) {
      console.error(`  ❌ ${fileName}: ${err.message}`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📊 优化总结:`);
  console.log(`   优化前: ${(results.before / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   优化后: ${(results.after / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   节省:   ${(results.saved / 1024 / 1024).toFixed(2)} MB (${((results.saved / results.before) * 100).toFixed(1)}%)`);
}

optimizeImages().catch(console.error);
