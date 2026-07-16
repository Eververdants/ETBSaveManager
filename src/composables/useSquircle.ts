/**
 * ============================================
 * 🍎 iOS 26 风格等距圆角（Squircle / Continuous Corner）
 * ============================================
 *
 * 纯 CSS 方案：使用原生 corner-shape: squircle（Chrome 139+）
 * 配合 border-radius 降级。
 *
 * 核心特性：
 * - 连续曲率：corner-shape: squircle 使圆角过渡更自然、更平滑
 * - 同心等距：8px 均匀递减 (52→44→36→28→20→12)
 * - 大圆角风格：iOS 26 风格，整体大幅提升
 * - 胶囊风格：按钮/搜索框使用 pill (9999px)
 * - 自动降级：不支持 corner-shape 的浏览器回退为标准 border-radius
 *
 * ─── 全局注入 ──────────────────────────
 *   enableGlobalSquircle()  → 注入全局样式，所有使用设计 token
 *                               的元素自动获得连续曲率圆角
 *
 * ─── 指令用法 ──────────────────────────
 *   <div v-squircle="44">   → 44px 等距连续圆角（推荐容器用）
 *   <div v-squircle>        → 预设 44px
 *   <div v-squircle:pill>   → 胶囊圆角 (9999px)
 *   <div v-squircle:circle> → 圆形 (50%)
 *
 * ─── CSS 类名用法 ──────────────────────
 *   <div class="squircle-44">   → 44px 圆角 + corner-shape
 *   <div class="squircle-pill"> → 胶囊
 *   <div class="squircle-circle"> → 圆形
 */

// ─── 常量 ──────────────────────────────────────

const STYLE_ID = "squircle-styles";
const GLOBAL_STYLE_ID = "squircle-global";

/** 预设半径映射（同心等距系统：52→44→36→28→20→12，8px 均匀递减） */
const RADIUS_MAP: Record<string, string> = {
  xs: "12px",
  sm: "20px",
  md: "28px",
  lg: "36px",
  xl: "44px",
  "2xl": "52px",
  pill: "9999px",
  circle: "50%",
};

// ─── 样式注入 ──────────────────────────────────

/** 注入基础样式（指令模式） */
function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /* ============================================
     * 🍎 等距连续圆角 — corner-shape: squircle
     *    (Chrome 139+ / Safari TP)
     *    不支持时自动降级为标准 border-radius
     * ============================================ */

    /* ── 指令模式 ── */
    [data-squircle] { corner-shape: squircle; }

    /* 各尺寸圆角（同心等距系统：8px 均匀递减） */
    [data-squircle="xs"]   { border-radius: 12px; }
    [data-squircle="sm"]   { border-radius: 20px; }
    [data-squircle="md"]   { border-radius: 28px; }
    [data-squircle="lg"]   { border-radius: 36px; }
    [data-squircle="xl"]   { border-radius: 44px; }
    [data-squircle="2xl"]  { border-radius: 52px; }
    [data-squircle="pill"] { border-radius: 9999px; }
    [data-squircle="circle"] { border-radius: 50%; }

    /* 数值型圆角（匹配 Token 系统） */
    [data-squircle="12"] { border-radius: 12px; }
    [data-squircle="20"] { border-radius: 20px; }
    [data-squircle="28"] { border-radius: 28px; }
    [data-squircle="36"] { border-radius: 36px; }
    [data-squircle="44"] { border-radius: 44px; }
    [data-squircle="52"] { border-radius: 52px; }
  `;
  document.head.appendChild(style);
}

/** 注入全局连续曲率样式
 *  在所有使用 --radius-* 设计 token 的元素上应用 corner-shape: squircle
 *  corner-shape 只影响有 border-radius 的元素，对直角元素无影响
 */
function injectGlobalStyles(): void {
  if (document.getElementById(GLOBAL_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = GLOBAL_STYLE_ID;
  style.textContent = `
    /* ============================================
     * 🌐 全局连续曲率圆角注入（iOS 26 风格大圆角）
     * 对所有使用 border-radius 的元素应用 squircle
     * 只影响有 border-radius 的元素，直角元素不受影响
     * ============================================ */

    /* ── 应用层有圆角的元素 ── */
    .squircle-enabled button,
    .squircle-enabled .btn,
    .squircle-enabled input,
    .squircle-enabled textarea,
    .squircle-enabled select,
    .squircle-enabled .card,
    .squircle-enabled .modal,
    .squircle-enabled .dialog,
    .squircle-enabled .popup,
    .squircle-enabled .tag,
    .squircle-enabled .badge,
    .squircle-enabled .dropdown,
    .squircle-enabled .menu,
    .squircle-enabled .tooltip,
    .squircle-enabled .popover,
    .squircle-enabled .sidebar,
    .squircle-enabled [class*="squircle-"],
    .squircle-enabled .archive-card {
      corner-shape: squircle;
    }

    /* ── 所有使用 design token 的元素 ──
     *   corner-shape 对 border-radius: 0 的元素无视觉影响
     *   所以可以安全地应用到所有元素
     */
    .squircle-enabled [style*="--radius"] {
      corner-shape: squircle;
    }

    /* ── 所有带 border-radius 属性的元素 ── */
    .squircle-enabled [style*="border-radius"] {
      corner-shape: squircle;
    }

    /* ── 胶囊元素使用更大圆角 ── */
    .squircle-enabled button,
    .squircle-enabled .btn,
    .squircle-enabled [role="button"],
    .squircle-enabled .tag,
    .squircle-enabled .badge {
      corner-shape: squircle;
    }

    /* ── 在不支持 corner-shape 的浏览器中完全无影响，
     *   就是标准的 border-radius ── */
  `;
  document.head.appendChild(style);
}

// ─── 全局启用函数 ──────────────────────────────

/**
 * 全局启用连续曲率圆角
 * 在 documentElement（<html>）上添加 squircle-enabled 类
 */
export function enableGlobalSquircle(): void {
  injectGlobalStyles();
  document.documentElement.classList.add("squircle-enabled");
}

/**
 * 禁用全局连续曲率圆角
 */
export function disableGlobalSquircle(): void {
  document.documentElement.classList.remove("squircle-enabled");
}

// ─── CSS 类名工具 ──────────────────────────────

/**
 * 获取 squircle CSS 类名
 * @param size - 半径尺寸（xs/sm/md/lg/xl/2xl/pill/circle 或数值 px）
 */
export function squircleClass(size: keyof typeof RADIUS_MAP | string | number): string {
  return `squircle-${size}`;
}

// ─── 自定义指令 ──────────────────────────────────

export const vSquircle = {
  mounted(el: HTMLElement, binding: { value?: number | string; arg?: string }) {
    injectStyles();

    // 处理 v-squircle:pill / v-squircle:circle 这种参数形式
    if (binding.arg) {
      el.setAttribute("data-squircle", binding.arg);
      return;
    }

    // 处理 v-squircle="44" / v-squircle="md" / v-squircle 多种形式
    const val = binding.value ?? 44;
    el.setAttribute("data-squircle", String(val));
  },
  updated(el: HTMLElement, binding: { value?: number | string }) {
    if (binding.value !== undefined && binding.value !== null) {
      el.setAttribute("data-squircle", String(binding.value));
    }
  },
  unmounted(el: HTMLElement) {
    el.removeAttribute("data-squircle");
  },
};
