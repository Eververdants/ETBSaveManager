# 设计规格:CSS Mask 连续曲率圆角系统

- 日期:2026-08-13
- 状态:已批准(用户确认 n=5、mask-only、全局选择器、pill/circle 保持原样)
- 分支:`feat/uesave-0.7`(工作区已有未提交改动,本系统独立成层)

## 目标

用 **CSS Mask + 内联 Data URI SVG** 为界面每个组件提供连续曲率(superellipse,超椭圆)圆角,替代当前 `border-radius` 的纯圆形圆角。**不用 `corner-shape`**(用户明确要求)。效果最好,兼顾性能,零运行期 JS。

当前状态:200+ 处 `border-radius: var(--radius-*)` 分布 30+ 文件,px 设计系统(12/20/28/36/44/52 同心递减)。旧的 `useSquircle.ts`(corner-shape + JS SVG-mask polyfill + MutationObserver)已删除,无残留引用。

## 技术决策

| 决策点 | 结论 | 理由 |
|---|---|---|
| 机制 | 纯 CSS `mask-image` + data-URI SVG | 用户指定 |
| `corner-shape` | 不用 | 用户明确排除 |
| 曲率 | superellipse n=5(比 iOS n≈4.5 更方,现代感强) | 用户指定 |
| 档位 | 每档 `--radius-*` 一个独立 mask(fraction 标定) | 保留嵌套层级视觉,最优效果 |
| 覆盖 | 全局选择器扩展(App.vue 现有分组 + 补齐 scoped 未覆盖容器类) | 用户指定,呼应旧 GLOBAL_SELECTORS |
| pill/circle | 不进 mask 组,保持原样 | 用户指定 |
| 运行期 JS | 无 | 旧系统已删,纯 CSS |

## 关键约束(不可规避的 CSS 事实)

1. **mask 是比例式**:`mask-size: 100% 100%` 把 data-URI SVG 拉伸到元素盒子,圆角半径随元素尺寸缩放,无法纯 CSS 保持 px。对策:每档 fraction 按该档典型元素尺寸标定,近似 px 层级。**接受近似,不做 JS 逐元素计算。**
2. **border-radius 与 mask 叠加 = 交集,较紧者胜**。superellipse(n>2)弧比圆更平(更贴近直角),若保留 `border-radius: var(--radius-*)`,圆形会先裁剪、连续曲率不可见。对策:mask 生效时 `border-radius: 0 !important`,由 mask 独占形状。
3. **mask 裁剪元素自身 box-shadow**。对策:浮起表面从 `box-shadow` 换 `filter: drop-shadow()`(跟随元素 alpha 轮廓,即超椭圆,阴影贴形)。

## 架构

### 1. `src/styles/variables.css` — 底座

`:root` 新增 6 个 mask 变量 + 1 个 none:

```css
--corner-xs: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='white' d='...'/%3E%3C/svg%3E");
--corner-sm: ...;
--corner-md: ...;
--corner-lg: ...;
--corner-xl: ...;
--corner-2xl: ...;
```

- 每个 SVG:viewBox 0 0 100 100,单个 `<path fill="white">`,d 为 superellipse n=5 圆角矩形轮廓。
- d 字符串由脚本生成后硬编码(见"实现"节),运行期零生成。
- data-URI 编码:`<`→`%3C`,`>`→`%3E`,`#`→`%23`,引号用单引号。满足现有 CSP(`img-src 'self' data: blob:`、`style-src 'self' 'unsafe-inline'`)。
- 兼容前缀:`-webkit-mask-image` 同步定义。

**fraction 基线**(按档位典型尺寸标定,实现期截图校准):

| 档 | px 值 | 典型尺寸 | fraction |
|---|---|---|---|
| xs | 12 | ~32px 小标签/指示器 | 0.38 |
| sm | 20 | ~64px 小卡片/内层 | 0.31 |
| md | 28 | ~120px 列表项/表单组 | 0.23 |
| lg | 36 | ~260px 卡片 | 0.14 |
| xl | 44 | ~330px 面板/侧栏 | 0.13 |
| 2xl | 52 | ~480px 模态 | 0.11 |

### 2. `src/styles/corners.css`(新文件)— 应用层

main.ts 第 36 行后加 `import "./styles/corners.css";`。

结构:

```css
@supports (mask-image: url("data:image/svg+xml")) {
  /* 组:每组分档,选器沿用现有全局分组 + 补齐组件 scoped 未覆盖的容器类 */
  .card, .archive-card, .level-card, .modal-card, .settings-section, .section, .panel { ... }
  .modal, .dialog, .popup, .modal-window, .dialog-box, .alert-box, .prompt-box { ... }
  /* ... 共 6 组,对应 xs→2xl ... */

  /* 每组模板 */
  selector-list {
    border-radius: 0 !important;
    -webkit-mask: var(--corner-lg) center/100% 100% no-repeat;
    mask: var(--corner-lg) center/100% 100% no-repeat;
  }
}

/* 逃生舱 */
[data-corner="none"] {
  mask: none !important;
  -webkit-mask: none !important;
  border-radius: var(--radius-md, 8px) !important; /* 恢复圆形,默认 md 档;元素侧可再覆盖 */
}
```

- 选择器 map 来源:App.vue 现有 10 组全局圆角规则 + 上文 grep 到的组件 scoped `border-radius` 容器类。
- 不包含:pill(9999px)/circle(50%)选择器(`.pill,.capsule`、`--radius-pill` 相关、`--radius-circle`、`50%`、`9999px` 元素)。
- 现有 200+ `border-radius` 声明**保留不动**,作 mask 不支持的 fallback。

### 3. 阴影处理 — 浮起表面换 `filter: drop-shadow()`

mask 生效后 box-shadow 被裁。以下元素从 `box-shadow` 换 `filter: drop-shadow()`(值沿用原 box-shadow):

- `ArchiveCard.vue`(card + hover 状态,含状态色阴影)
- `Sidebar.vue`(面板 shadow-lg/md)
- `PromptPopup.vue` / `ConfirmModal.vue` / `ArchiveEditModal.vue`(模态阴影)
- `ArchiveSearchFilter.vue`(下拉面板)
- `FloatingActionButton.vue`(FAB)
- `NotificationPopup.vue`(通知条)
- `GlobalSearchPanel.vue`(搜索面板)
- 其他 grep 到的浮起容器(实现期按 mask 选择器对照清单逐项核对)

**不换**:输入框、标签、小控件(阴影微弱/inset,被裁无感)。

注意:drop-shadow 换 filter 后:
- hover 过渡同步改为 `filter 0.x s`(原 `box-shadow 0.x s`)。
- `:root[data-performance-mode="low"]` 已有部分 filter 禁用逻辑,实现期核对不冲突。

### 4. 性能降级 — `variables.css`

`:root[data-performance-mode="low"]` 追加:

```css
:root[data-performance-mode="low"] * {
  mask: none !important;
  -webkit-mask: none !important;
}
```

mask 关闭后 `border-radius` 声明仍在,自然回到圆形圆角。现有 `data-animation-quality="disabled"` 不动。

## 效果预期

- 卡片/模态/侧栏/面板/按钮/输入变为连续曲率(n=5 superellipse)。
- 嵌套层级保留(档位→fraction 映射)。
- 浮起表面阴影贴超椭圆轮廓。
- 低性能模式自动降级圆形。
- 零 JS、零 DOM 观察、单张 shape 缓存,GPU 友好。

## 实现步骤(供 writing-plans 细化)

1. 写 node 脚本生成 6 条 superellipse n=5 path `d`(viewBox 100 采样,如每角 12 段 polyline 或 bezier 拟合),输出到临时文件供复制。
2. variables.css 加 `--corner-*` 变量(含 `-webkit-` 前缀)+ 低性能模式关闭规则。
3. 建 corners.css,写 `@supports` 内 6 组分档 mask 规则 + 逃生舱;main.ts 引入。
4. 遍历 grep 清单,把浮起表面 box-shadow → drop-shadow。
5. 校准:fraction 对照真实组件截图微调(小标签、卡片、模态各抽查)。
6. 验证:`pnpm build` / 类型检查;dev 运行截图对比 mask 前后阴影与圆角。低性能模式开关验证。

## 不做什么(YAGNI)

- 不用 corner-shape、不用 JS、不逐元素计算 px。
- 不做 pill/circle 的连续曲率。
- 不改 200+ 处 border-radius 声明本身(保留作 fallback)。
- 不加设置开关(旧 squircle toggle 已删,不复活)。

## 风险与缓解

| 风险 | 缓解 |
|---|---|
| fraction 在异常尺寸元素上失真(大元素套小档) | 档位按典型尺寸标定 + 实现期抽查;个别异常元素用 `data-corner` 逃生舱指档/关闭 |
| drop-shadow 性能 | 仅限浮起表面(~15 处),GPU 光栅化已强制 |
| mask 全量层提升内存 | 6 张 URI 缓存一次;低性能模式关闭;观察实际内存 |
| hover 过渡(影子变 filter) | 逐处改 transition 属性 |
