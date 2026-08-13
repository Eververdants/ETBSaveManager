// 生成 n=5 superellipse 圆角矩形 mask 路径(viewBox 0 0 100 100)与 CSS 变量行
// 用法: node scripts/gen-superellipse.mjs  输出 --corner-* 行,粘贴进 variables.css
const N = 5, k = 2 / N;
const SEG = 16;
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
function enc(svg) {
  return svg.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23").replace(/ /g, "%20").replace(/"/g, "'");
}
const T = { xs: 0.38, sm: 0.31, md: 0.23, lg: 0.14, xl: 0.13, "2xl": 0.11 };
for (const [name, r] of Object.entries(T)) {
  const d = genPath(r);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'><path fill='white' d='${d}'/></svg>`;
  console.log(`--corner-${name}: url("data:image/svg+xml,${enc(svg)}");`);
}
