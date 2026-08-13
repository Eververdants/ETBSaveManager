// 生成 n=5 superellipse 圆角 clipPath 定义(0..1 归一化,objectBoundingBox 自适应)
// 用法: node scripts/gen-superellipse.mjs  输出 <clipPath> 块,粘贴进 index.html 全局 SVG defs
// fraction: xs 0.38 / sm 0.31 / md 0.23 / lg 0.14 / xl 0.13 / 2xl 0.11 / right 0.13

const N = 5, k = 2 / N, SEG = 16;
const r3 = (x) => Math.round(x * 1000) / 1000;
function arcPts(cx, cy, r, f, reverse = false) {
  const pts = [];
  for (let i = 0; i <= SEG; i++) {
    const t = (Math.PI / 2) * (i / SEG);
    const c = Math.cos(t), s = Math.sin(t);
    const sx = Math.sign(c) * Math.pow(Math.abs(c), k);
    const sy = Math.sign(s) * Math.pow(Math.abs(s), k);
    const p = f(sx, sy);
    pts.push([cx + p[0], cy + p[1]]);
  }
  return reverse ? pts.reverse() : pts;
}
function genPath(r) {
  const parts = [`M ${r3(r)},0`, `L ${r3(1 - r)},0`];
  const tr = arcPts(1 - r, r, 0, (sx, sy) => [r * sx, -r * sy], true);
  for (const p of tr.slice(1)) parts.push(`L ${r3(p[0])},${r3(p[1])}`);
  parts.push(`L 1,${r3(1 - r)}`);
  const br = arcPts(1 - r, 1 - r, 0, (sx, sy) => [r * sx, r * sy]);
  for (const p of br.slice(1)) parts.push(`L ${r3(p[0])},${r3(p[1])}`);
  parts.push(`L ${r3(r)},1`);
  const bl = arcPts(r, 1 - r, 0, (sx, sy) => [-r * sy, r * sx]);
  for (const p of bl.slice(1)) parts.push(`L ${r3(p[0])},${r3(p[1])}`);
  parts.push(`L 0,${r3(r)}`);
  const tl = arcPts(r, r, 0, (sx, sy) => [-r * sx, -r * sy]);
  for (const p of tl.slice(1)) parts.push(`L ${r3(p[0])},${r3(p[1])}`);
  parts.push("Z");
  return parts.join(" ");
}
function genRightPath(r) {
  const parts = [`M 0,0`, `L ${r3(1 - r)},0`];
  const tr = arcPts(1 - r, r, 0, (sx, sy) => [r * sx, -r * sy], true);
  for (const p of tr.slice(1)) parts.push(`L ${r3(p[0])},${r3(p[1])}`);
  parts.push(`L 1,${r3(1 - r)}`);
  const br = arcPts(1 - r, 1 - r, 0, (sx, sy) => [r * sx, r * sy]);
  for (const p of br.slice(1)) parts.push(`L ${r3(p[0])},${r3(p[1])}`);
  parts.push(`L 0,1`, `Z`);
  return parts.join(" ");
}
const T = { xs: 0.38, sm: 0.31, md: 0.23, lg: 0.14, xl: 0.13, "2xl": 0.11 };
console.log('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>');
for (const [name, r] of Object.entries(T)) {
  console.log(`  <clipPath id="sq-${name}" clipPathUnits="objectBoundingBox"><path d="${genPath(r)}"/></clipPath>`);
}
console.log(`  <clipPath id="sq-right" clipPathUnits="objectBoundingBox"><path d="${genRightPath(0.13)}"/></clipPath>`);
console.log('</defs></svg>');
