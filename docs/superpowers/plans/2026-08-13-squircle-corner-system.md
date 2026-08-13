# CSS Mask 连续曲率圆角系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 CSS `mask-image` + 内联 data-URI SVG 为界面每个组件提供 n=5 superellipse 连续曲率圆角,替代 `border-radius` 圆形圆角,零 JS,效果最好且兼顾性能。

**Architecture:** `variables.css` 定义 6 档对称 superellipse mask + 1 档侧栏专用不对称(右圆左方)mask 的 CSS 变量(data-URI,运行期零生成)。新文件 `corners.css` 在 `@supports (mask-image: url("data:image/svg+xml"))` 内按档位把全局 + 组件容器选择器分组套 mask,并 `border-radius: 0 !important`(mask 独占形状,防圆形抢先裁剪)。受高度影响的浮起表面从 `box-shadow` 换 `filter: drop-shadow()`(跟随超椭圆轮廓)。低性能模式关 mask 恢复圆形。

**Tech Stack:** Vue 3 + Vite,原生 CSS,无新增依赖。目标运行时 WebView2(现代 Chromium)。

## Global Constraints

- **不用 `corner-shape`**(用户明确排除)。
- **pill(9999px)/circle(50%)不进 mask 组**,保持原样(用户指定)。
- **现有 200+ 处 `border-radius: var(--radius-*)` 声明保留不动**,作 mask 不支持时的 fallback。
- 所有 mask 用 `-webkit-mask` + `mask` 双前缀。
- mask 值写法:`mask: var(--corner-X) center / 100% 100% no-repeat;`
- CSP 已允许 `img-src 'self' data: blob:` 与 `style-src 'self' 'unsafe-inline'`。data-URI 内**不用 `#`**(须 `%23`)。
- superellipse n=5,fraction:xs 0.38 / sm 0.31 / md 0.23 / lg 0.14 / xl 0.13 / 2xl 0.11;侧栏 right 0.13。
- 路径 viewBox 0 0 100 100,每角 16 段折线。生成器 `scripts/gen-superellipse.mjs` 为唯一事实源。
- 每任务结束 `pnpm build`(或 `vue-tsc --noEmit`)确认无错;视觉改动用 dev 核对。

---

## File Structure

- Create: `scripts/gen-superellipse.mjs` — 路径生成器(可复现)。
- Modify: `src/styles/variables.css` — `--corner-*` 变量 + 低性能模式关 mask。
- Create: `src/styles/corners.css` — `@supports` 内档位分组 + 逃生舱。
- Modify: `src/main.ts` — 引入 corners.css。
- Modify(阴影切换): `ArchiveCard.vue`、`Sidebar.vue`、`ConfirmModal.vue`、`PromptPopup.vue`、`ArchiveEditModal.vue`、`NotificationPopup.vue`、`GlobalSearchPanel.vue`、`ArchiveSearchFilter.vue`、`QuickCreateArchiveCard.vue`、`PreviewExecuteArea.vue`、`FloatingActionButton.vue`。

---

### Task 1: superellipse 路径生成器 + mask CSS 变量

**Files:**
- Create: `scripts/gen-superellipse.mjs`
- Modify: `src/styles/variables.css`

**Interfaces:**
- Produces: `--corner-xs|sm|md|lg|xl|2xl`(对称)+ `--corner-right`(右圆左方)。Task 2 消费。

- [ ] **Step 1: 创建生成器脚本**

`scripts/gen-superellipse.mjs`:

```js
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
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path fill='white' d='${d}'/></svg>`;
  console.log(`--corner-${name}: url("data:image/svg+xml,${enc(svg)}");`);
}
```

- [ ] **Step 2: 运行脚本,取 6 行输出**

Run: `node scripts/gen-superellipse.mjs`
Expected: 6 行 `--corner-xs:` → `--corner-2xl:`,每条 URI ~1250-1300 字符,path 以 `M 0.XX,0` 开头、`Z` 结尾,bottom-left 弧从 `(r,1)` 单调到 `(0,1-r)`(无对角直切)。

- [ ] **Step 3: 追加 6 行到 variables.css 圆角 `:root` 块**

在 `src/styles/variables.css` 圆角系统 `:root`(`--radius-image` 之后)追加,`<URI>` 处粘贴 Step 2 实际输出整行(勿手改):

```css
  /* ── 连续曲率 mask(n=5 superellipse,viewBox 0 0 100 100) ──
   * fraction 按档位典型尺寸标定,近似 px 层级;比例式,mask 拉伸到元素盒子
   * 生成器: scripts/gen-superellipse.mjs(唯一事实源)
   */
  --corner-xs: url("data:image/svg+xml,<Step 2 输出的 --corner-xs URI>");
  --corner-sm: url("data:image/svg+xml,<Step 2 输出的 --corner-sm URI>");
  --corner-md: url("data:image/svg+xml,<Step 2 输出的 --corner-md URI>");
  --corner-lg: url("data:image/svg+xml,<Step 2 输出的 --corner-lg URI>");
  --corner-xl: url("data:image/svg+xml,<Step 2 输出的 --corner-xl URI>");
  --corner-2xl: url("data:image/svg+xml,<Step 2 输出的 --corner-2xl URI>");
```

- [ ] **Step 4: 追加侧栏专用不对称 mask(右圆左方)**

同一 `:root` 块追加(成品已验证,直接复制):

```css
  /* 侧栏专用:右边圆角、左边直角(贴窗口边缘),fraction 0.13 ≈ xl 档 */
  --corner-right: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20100%20100'%3E%3Cpath%20fill='white'%20d='M%200,0%20L%200.87,0%20L%200.921,0%20L%200.938,0.001%20L%200.949,0.002%20L%200.959,0.004%20L%200.966,0.006%20L%200.973,0.009%20L%200.978,0.013%20L%200.983,0.017%20L%200.987,0.022%20L%200.991,0.027%20L%200.994,0.034%20L%200.996,0.041%20L%200.998,0.051%20L%200.999,0.062%20L%201,0.079%20L%201,0.13%20L%201,0.87%20L%201,0.921%20L%200.999,0.938%20L%200.998,0.949%20L%200.996,0.959%20L%200.994,0.966%20L%200.991,0.973%20L%200.987,0.978%20L%200.983,0.983%20L%200.978,0.987%20L%200.973,0.991%20L%200.966,0.994%20L%200.959,0.996%20L%200.949,0.998%20L%200.938,0.999%20L%200.921,1%20L%200.87,1%20L%200,1%20Z'/%3E%3C/svg%3E");
```

- [ ] **Step 5: 低性能模式关 mask**

在 `variables.css` 的 `:root[data-performance-mode="low"]` 规则旁追加:

```css
/* 低性能模式:关闭连续曲率 mask,恢复 border-radius 圆形 */
:root[data-performance-mode="low"] * {
  mask: none !important;
  -webkit-mask: none !important;
}
```

- [ ] **Step 6: 验证**

Run: `pnpm build`
Expected: 构建通过。dev 运行任一页面,devtools 里卡片元素 computed `mask-image` 为 data: URI、`mask-size` 为 `100% 100%`。

- [ ] **Step 7: Commit**

```bash
git add scripts/gen-superellipse.mjs src/styles/variables.css
git commit -m "feat: add superellipse corner mask variables and low-perf fallback"
```

---

### Task 2: corners.css — 档位选择器分组 + 逃生舱

**Files:**
- Create: `src/styles/corners.css`
- Modify: `src/main.ts:33-36`(样式 import 区)

**Interfaces:**
- Consumes: Task 1 的 `--corner-*`。
- Produces: mask 分组(含选择器清单与冲突决策)。Task 3 只处理"mask 生效且带外阴影"的表面。

**选择器分档规则(本任务依据):**

1. **来源**:设计阶段扫描 30+ 文件的 159 条 `border-radius: var(--radius-*)` 容器选择器 + App.vue 全局规则(见 spec `docs/superpowers/specs/2026-08-13-squircle-corner-system-design.md` 与本次决定)。
2. **排除**(不进任何档位组,保持原状):
   - pill/circle:`--radius-pill`、`--radius-button`、`--radius-input`、`--radius-tag`、`--radius-dropdown`、`--radius-tooltip`、`--radius-circle`、`50%`、`9999px`、`.pill`、`.capsule`。
   - **circle/pill 歧义类**:`.avatar`、`.icon-container`、`.icon-wrapper`、`.dot-indicator`、`.progress-step`、`.color-swatch`、`.player-avatar`、`.modal-close`(circle 覆盖处)、`.toggle-visibility-btn`(圆钮)— App.vue 低优先级全局类会被组件 scoped 的 circle 覆盖,套 mask 会破坏圆形。
   - **伪元素 / deep 目标**:`::before`、`::after`、`:deep(.search-highlight)`、`:global(mark.global-find-mark)`、`::-webkit-scrollbar-thumb`、`.section-title::before`、`.form-section-title::before` — 父容器 mask 已管形状。
   - **部分圆角 inner 条**:`.progress-bar*`、`.notification-progress*`、`.tab-highlight`、`.batch-delete-progress .progress-current-file`(内层)— 顶部直角,对称 mask 会破坏;父容器裁剪可见轮廓。
   - **纯装饰微件**:`.checkbox-mark`、`.slot-label`、`.search-highlight`、`.easter-egg-image`(raw img)。
   - **`.btn` 系**(全局 pill 歧义):`.btn`、`.btn-primary`… — ArchiveEditModal 的 `.btn` md 例外放弃,保持圆形 md。
3. **同类名跨档冲突**(不同组件不同 `--radius-*`)→ 取"主导档位"(最常见/最外层),记录:

| 类名 | 出现档位 | 取 |
|---|---|---|
| `.modal-container` | 2xl(Confirm) / xl(Home) / lg(ArchiveEdit) | 2xl |
| `.action-btn` | sm(QuickCreateCard) / md(PreviewExecute, QuickCreate) | md |
| `.level-card` | lg(EditArchive, App) / md(LevelCheckGrid, Step1) | lg |
| `.detail-block` | sm(EditArchive) / md(Step3) | md |
| `.inv-slot` | sm(EditArchive) / md(Step3) | md |
| `.dropdown-menu` | md(CustomDropdown) / sm(settings) | md |
| `.qbtn` | xs(EditArchive) / sm(Step3) | sm |
| `.clear-btn` | md(SearchFilter) / xs(LevelCheckGrid) | md |
| `.search-input` | xl(SearchFilter) / pill(GlobalSearch) | xl |

- [ ] **Step 1: 创建 corners.css**

`src/styles/corners.css`:

```css
/* ==========================================
 * 连续曲率圆角系统 (Superellipse Corner System)
 * n=5, mask 值来自 variables.css --corner-*
 * 仅在 mask 支持环境生效;不支持则保留原 border-radius 圆形
 * 分档规则与冲突决策见计划 Task 2
 * ========================================== */
@supports (mask-image: url("data:image/svg+xml")) {
  /* 逃生舱:个别元素不用连续曲率,恢复圆形 */
  [data-corner="none"] {
    -webkit-mask: none !important;
    mask: none !important;
    border-radius: var(--radius-md, 8px) !important;
  }

  /* 2xl:模态/大弹窗 */
  .modal, .dialog, .popup,
  .modal-window, .dialog-box, .alert-box, .prompt-box,
  .modal-container, .prompt-popup, .success-modal-card {
    border-radius: 0 !important;
    -webkit-mask: var(--corner-2xl) center / 100% 100% no-repeat;
    mask: var(--corner-2xl) center / 100% 100% no-repeat;
  }

  /* right:侧栏面板(右圆左方) */
  .sidebar {
    border-radius: 0 !important;
    -webkit-mask: var(--corner-right) center / 100% 100% no-repeat;
    mask: var(--corner-right) center / 100% 100% no-repeat;
  }

  /* xl:大面板/侧栏项/搜索面板/模式卡 */
  .sidebar-panel, .nav-panel, .sidebar-item,
  .unified-search-filter, .search-input, .scroll-hint-content,
  .archive-details-card, .popup-icon-wrapper,
  .archive-list-container, .empty-card, .batch-delete-progress,
  .slider, .mode-card, .bottom-back-button, .bottom-actions {
    border-radius: 0 !important;
    -webkit-mask: var(--corner-xl) center / 100% 100% no-repeat;
    mask: var(--corner-xl) center / 100% 100% no-repeat;
  }

  /* lg:卡片/分区/面板 */
  .card, .archive-card, .modal-card, .dropdown-content, .level-card,
  .section, .panel, .settings-section, .config-panel,
  .performance-monitor, .search-suggestions, .preview-execute-area,
  .ending-group, .section-card, .glass-card, .setting-group,
  .update-message, .theme-editor-container, .settings-card,
  .level-group, .player-list-section, .player-detail-section,
  .quick-create-header, .options-panel, .result-modal, .step,
  .item-card, .fuzzy-card {
    border-radius: 0 !important;
    -webkit-mask: var(--corner-lg) center / 100% 100% no-repeat;
    mask: var(--corner-lg) center / 100% 100% no-repeat;
  }

  /* md:列表项/表单组/中尺寸容器 */
  .list-item, .menu-item, .dropdown-item, .select-option,
  .hidden-badge, .clear-btn, .filter-item, .action-btn,
  .global-search-panel, .selector-modal, .empty-state,
  .form-input, .dropdown-menu, .dropdown-option, .quick-archive-card,
  .preview-names, .preview-empty, .grid-header, .ending-slider, .ending-tab,
  .app-icon, .list-section, .settings-input, .difficulty-hint, .diff-option,
  .cache-info, .back-button, .create-btn, .result-stat, .error-details,
  .mode-select-button, .back-to-quick-mode-btn, .step-info,
  .drop-zone, .reset-tutorial-btn, .detail-block,
  .inv-slot, .inv-slot.backpack-slot {
    border-radius: 0 !important;
    -webkit-mask: var(--corner-md) center / 100% 100% no-repeat;
    mask: var(--corner-md) center / 100% 100% no-repeat;
  }

  /* sm:内层小卡片/按钮/图标容器 */
  .multi-select-checkbox, .mode-badge, .difficulty-badge, .close-btn,
  .setting-icon, .check-update-btn, .update-btn, .api-key-input,
  .save-api-key-btn, .cache-count, .view-cache-btn, .clear-cache-btn,
  .tab-nav, .player-item, .steamid-edit-row, .estimated-time, .stat-item,
  .notification-item, .qbtn {
    border-radius: 0 !important;
    -webkit-mask: var(--corner-sm) center / 100% 100% no-repeat;
    mask: var(--corner-sm) center / 100% 100% no-repeat;
  }

  /* xs:标签/徽章/小指示器 */
  .filter-label, .clear-history-btn,
  .notification-icon-wrapper, .notification-details, .preview-name,
  .tab-btn, .version-tag, .update-source-hint, .error-message,
  .msg-tip, .del-btn, .sidebar-toggle {
    border-radius: 0 !important;
    -webkit-mask: var(--corner-xs) center / 100% 100% no-repeat;
    mask: var(--corner-xs) center / 100% 100% no-repeat;
  }
}
```

- [ ] **Step 2: 核对选择器与 App.vue 现有全局规则不冲突**

检查 App.vue 全局 `border-radius` 规则(约 400-575 行):凡全局规则里用了 `--radius-pill/button/input/tag/dropdown/tooltip/circle` 的选择器(`button, input, .tag, .badge, .pill...`),确认未落入上面任一 mask 组。若发现遗漏落入(如某类被全局设 pill 却出现在上面),从 mask 组移除。

- [ ] **Step 3: main.ts 引入**

`src/main.ts` 现有样式 import(第 33-36 行)后追加:

```ts
import "./styles/corners.css";
```

- [ ] **Step 4: 验证**

Run: `pnpm build`
Expected: 构建通过。dev 运行:卡片/模态/侧栏/按钮为连续曲率(肉眼对照 n=5 超椭圆),胶囊/圆形/头像仍为原状,侧栏只有右边圆角,`.avatar` 圆形不受影响。

- [ ] **Step 5: Commit**

```bash
git add src/styles/corners.css src/main.ts
git commit -m "feat: apply superellipse corner masks to all radius surfaces"
```

---

### Task 3: 浮起表面阴影 box-shadow → filter: drop-shadow()

**Files:** 修改以下文件指定行。
- `src/components/archive/ArchiveCard.vue`
- `src/components/layout/Sidebar.vue`
- `src/components/modal/ConfirmModal.vue`
- `src/components/modal/PromptPopup.vue`
- `src/components/modal/ArchiveEditModal.vue`
- `src/components/ui/NotificationPopup.vue`
- `src/components/feature/GlobalSearchPanel.vue`
- `src/components/archive/ArchiveSearchFilter.vue`
- `src/components/archive/QuickCreateArchiveCard.vue`
- `src/components/feature/PreviewExecuteArea.vue`
- `src/components/feature/FloatingActionButton.vue`(仅 `.scroll-hint-content`)

**Interfaces:**
- Consumes: Task 2 mask 分组(mask 裁 box-shadow,浮起表面必须换 drop-shadow)。

**转换规则(逐条套用):**

1. 纯外层阴影:`box-shadow: X` → 删 `box-shadow`,加 `filter: drop-shadow(X)`;`transition: box-shadow ...` → `transition: filter ...`。
2. 外层 + inset 同一声明 → 拆:inset 留 `box-shadow`,外层进 `filter: drop-shadow(...)`(drop-shadow 不支持 inset)。
3. inset / focus ring(`inset 0 0 0 2px` 等)不动(mask 会把 inset 整形为超椭圆,正好)。
4. mask 未覆盖元素(pill/circle/排除类)不动。
5. `-webkit-` 前缀按原文件既有写法。

**已确认替换点(行号为设计期 grep,实施时按当前文件核对):**

- `ArchiveCard.vue:215` `.archive-card` `box-shadow: var(--card-shadow)` → `filter: drop-shadow(var(--card-shadow))`;`:262` hover `box-shadow: var(--card-shadow-hover)` → `filter: drop-shadow(var(--card-shadow-hover))`。
  **perf 权衡**:`.archive-card` 有 `contain: paint`(225 行),与 `filter: drop-shadow` 冲突(阴影被裁出盒外)。处理:删除 `contain: paint`,加注释——"drop-shadow 使卡片自身成合成层,悬停只重栅格化本卡,等价于原 contain:paint 的隔离意图;与 hover `will-change: transform` 图层策略一致"。若 Task 4 性能核对异常,回退方案见 Task 4。
- `Sidebar.vue:388` `.sidebar` `box-shadow: var(--shadow-lg)` → `filter: drop-shadow(var(--shadow-lg))`;394-399 transition 里 `box-shadow 0.25s ease` → `filter 0.25s ease`。`:458` `.sidebar-item:hover` → `filter: drop-shadow(var(--shadow-md))`,441-444 / 459-462 transition `box-shadow` → `filter`。`:468` active inset ring 不动。
- `ConfirmModal.vue:238` `.modal-container` → `filter: drop-shadow(0 20px 60px rgba(0,0,0,0.3))`。
- `PromptPopup.vue:201-204` `.prompt-popup`(外层+2 inset)→ 拆:inset 两层留 `box-shadow`,加 `filter: drop-shadow(0 20px 60px rgba(0,0,0,0.15))`。`:253-255` `.popup-icon-wrapper` → 外层转 `filter: drop-shadow(0 6px 16px color-mix(in srgb, var(--primary) 30%, transparent))`,inset 留;`:261-263` hover 同理。
- `ArchiveEditModal.vue:253` → `filter: drop-shadow(var(--shadow-lg))`(`:332` inset ring 不动)。
- `NotificationPopup.vue:433` `.notification-item` → `filter: drop-shadow(0 6px 24px rgba(0,0,0,0.12))`;`:441` hover → `filter: drop-shadow(0 8px 32px rgba(0,0,0,0.16))`;`:669` 外层同样处理。状态色小图标阴影(465-480)→ 核对,mask 覆盖则转。
- `GlobalSearchPanel.vue:206` → `filter: drop-shadow(var(--shadow-lg))`。
- `ArchiveSearchFilter.vue:255` 面板 → `filter: drop-shadow(var(--shadow-xl, 0 8px 32px rgba(0,0,0,0.15)))`;`:290-293` search-input transition `box-shadow` → `filter`;`:298-300` focus 外层+inset → 拆;`:483`/`:499` 外层 → 转。
- `QuickCreateArchiveCard.vue:177` → `filter: drop-shadow(var(--shadow-md))`(`:203` inset ring 不动)。
- `PreviewExecuteArea.vue:301` → `filter: drop-shadow(var(--shadow-md))`。
- `FloatingActionButton.vue:589` `.scroll-hint-content` → `filter: drop-shadow(var(--card-shadow))`(FAB 本体 circle、tooltip pill 不动)。

- [ ] **Step 1: 逐文件套用规则**

按清单 + 规则逐文件修改。每文件改完对照 grep:确认无"mask 覆盖元素上的纯外层 box-shadow"遗漏。

- [ ] **Step 2: 验证**

Run: `pnpm build`
Expected: 构建通过。dev 运行:卡片/侧栏/模态/通知/面板阴影贴合超椭圆轮廓,无方形角;hover 阴影过渡平滑;inset ring 仍在。

- [ ] **Step 3: Commit**

```bash
git add src/components/archive/ArchiveCard.vue src/components/layout/Sidebar.vue src/components/modal/ConfirmModal.vue src/components/modal/PromptPopup.vue src/components/modal/ArchiveEditModal.vue src/components/ui/NotificationPopup.vue src/components/feature/GlobalSearchPanel.vue src/components/archive/ArchiveSearchFilter.vue src/components/archive/QuickCreateArchiveCard.vue src/components/feature/PreviewExecuteArea.vue src/components/feature/FloatingActionButton.vue
git commit -m "fix: follow superellipse silhouette with drop-shadow on elevated surfaces"
```

---

### Task 4: 校准 + 性能核对(收尾)

**Files:**
- Modify: `src/styles/variables.css`(fraction 微调,若有)

- [ ] **Step 1: 视觉抽查**

dev 运行截屏,核对三类代表组件的小标签/卡片/模态曲率是否符合档位意图。若明显失真(如通知条 sm 档在 350px 宽 corner 过大、小按钮 xs 档近直角),改 `scripts/gen-superellipse.mjs` 的 `T` 表 fraction,重跑 Step 1-3(Task 1)重新生成。

- [ ] **Step 2: 阴影与 contain:paint 核对**

dev 运行确认卡片 hover 阴影正常、无整卡重绘闪烁。若卡片 `filter: drop-shadow` 有可感知性能/内存问题:回退「卡片本体不加 mask、恢复 box-shadow + border-radius 圆形」,并从 corners.css 卡片组移除 `.archive-card` 选择器,记录取舍。

- [ ] **Step 3: 低性能模式核对**

dev 运行切 `data-performance-mode="low"`,确认 mask 全关、圆角回圆形。

- [ ] **Step 4: 最终验证 + Commit**

Run: `pnpm build` + `pnpm lint`(如项目配置)
Expected: 通过。

```bash
git add scripts/gen-superellipse.mjs src/styles/variables.css
git commit -m "chore: calibrate superellipse corner fractions after visual pass"
```

---

## Self-Review Checklist

**Spec coverage:**
- 6 档对称 mask + 侧栏 right mask → Task 1
- corners.css `@supports` + 档位分组 + 逃生舱 + circle/pill 排除 → Task 2
- 阴影 box-shadow → drop-shadow → Task 3
- 低性能模式关 mask → Task 1 Step 5
- fraction 校准 → Task 4
- 零 JS / 不用 corner-shape → 全局约束

**Placeholder scan:** 仅 `variables.css` 的 `<Step 2 输出的 --corner-* URI>` 是"运行生成器产出",非逻辑占位;其余每步含完整代码与选择器。`Task 2 Step 2` 冲突表已定案。

**Type consistency:** 变量 `--corner-{xs,sm,md,lg,xl,2xl,right}` 全文档一致;`mask: var(--corner-X) center / 100% 100% no-repeat` 统一。
