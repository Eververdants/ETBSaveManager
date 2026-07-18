/**
 * ============================================
 * 🍎 iOS 26 风格等距圆角（Squircle / Continuous Corner）
 * ============================================
 *
 * 双层方案：
 * 1. 原生 CSS：corner-shape: squircle（Chrome 139+ / Safari TP）
 * 2. SVG clip-path polyfill：在不支持的浏览器中模拟连续曲率
 *
 * 核心特性：
 * - 连续曲率：corner-shape: squircle 或 SVG clip-path 使圆角过渡更自然
 * - 同心等距：8px 均匀递减 (52→44→36→28→20→12)
 * - 大圆角风格：iOS 26 风格
 * - 胶囊风格：按钮/搜索框使用 pill (9999px)
 * - 自动降级：不支持时回退为标准 border-radius
 *
 * ─── 全局注入 ──────────────────────────
 *   enableGlobalSquircle() → 注入全局样式 + 启动 polyfill
 *
 * ─── 指令用法 ──────────────────────────
 *   <div v-squircle="44">   → 44px 连续曲率圆角
 *   <div v-squircle>        → 预设 44px
 *   <div v-squircle:pill>   → 胶囊 (9999px)
 *   <div v-squircle:circle> → 圆形 (50%)
 */

// ─── 常量 ──────────────────────────────────────

const STYLE_ID = "squircle-styles";
const GLOBAL_STYLE_ID = "squircle-global";
const POLYFILL_SVG_ID = "squircle-polyfill-svg";

/** 预设半径映射（同心等距系统，数值单位为 px） */
const RADIUS_MAP: Record<string, number> = {
  xs: 12,
  sm: 20,
  md: 28,
  lg: 36,
  xl: 44,
  "2xl": 52,
};

/** 全局 squircle 匹配选择器列表 */
const GLOBAL_SELECTORS = [
  "button",
  ".btn",
  "input",
  "textarea",
  "select",
  ".card",
  ".modal",
  ".dialog",
  ".popup",
  ".tag",
  ".badge",
  ".dropdown",
  ".menu",
  ".tooltip",
  ".popover",
  ".sidebar",
  '[class*="squircle-"]',
  ".archive-card",
  '[role="button"]',
];

// ─── Polyfill 状态 ────────────────────────────

/** polyfill 是否已初始化 */
let polyfillInitialized = false;

/** 共享 SVG 容器 */
let sharedSvg: SVGSVGElement | null = null;

/** MutationObserver 实例 */
let domObserver: MutationObserver | null = null;

/** clip-path 唯一 ID 计数器 */
let clipPathIdCounter = 0;

/** 已应用的 clip-path 记录 (Map<clipPathId, { el, radius, observer }>) */
interface ClipPathRecord {
  el: HTMLElement;
  radius: number;
  observer: ResizeObserver;
}
const clipPathCache = new Map<string, ClipPathRecord>();

// ─── SVG Squircle 路径生成 ──────────────────

/**
 * 生成 squircle 的 SVG path data（使用 cubic bezier 近似）
 * 坐标归一化到 [0, 1]（配合 clipPathUnits="objectBoundingBox"）
 *
 * @param rx - 水平方向归一化圆角半径 (0 ~ 0.499)
 * @param ry - 垂直方向归一化圆角半径 (0 ~ 0.499)
 * @returns SVG path data string
 */
function genSquirclePath(rx: number, ry: number): string {
  const K = 0.73; // 曲率控制系数（值越大越接近方形，越小越圆）
  const cx = Math.min(rx, 0.499);
  const cy = Math.min(ry, 0.499);

  return [
    `M ${cx},0`,
    `L ${1 - cx},0`,
    `C ${1 - cx * K},0, 1,${cy * K}, 1,${cy}`,
    `L 1,${1 - cy}`,
    `C 1,${1 - cy * K}, ${1 - cx * K},1, ${1 - cx},1`,
    `L ${cx},1`,
    `C ${cx * K},1, 0,${1 - cy * K}, 0,${1 - cy}`,
    `L 0,${cy}`,
    `C 0,${cy * K}, ${cx * K},0, ${cx},0`,
    "Z",
  ].join(" ");
}

// ─── 工具函数 ──────────────────────────────

/** 检查浏览器是否原生支持 corner-shape */
function supportsCornerShape(): boolean {
  // dev 测试：?force-polyfill 可强制启用 SVG polyfill（即使浏览器支持 corner-shape）
  if (import.meta.env.DEV && typeof window !== "undefined" && window.location.search.includes("force-polyfill")) {
    return false;
  }
  return CSS.supports("corner-shape: squircle");
}

/** 从元素获取 squircle 半径值（px） */
function getSquircleRadius(el: HTMLElement): number {
  const val = el.getAttribute("data-squircle");
  if (!val) return 0;
  if (val in RADIUS_MAP) return RADIUS_MAP[val]!;
  if (val === "circle" || val === "50%") return 0; // circle/pill 不需要 polyfill
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/** 半径是否有效（>= 8px） */
function isValidRadius(r: number): boolean {
  return r >= 8;
}

/** 检查元素是否已有 clip-path */
function hasClipPath(el: HTMLElement): boolean {
  for (const [, record] of clipPathCache) {
    if (record.el === el) return true;
  }
  return false;
}

// ─── 获取/创建共享 SVG 容器 ─────────────────

function getSharedSvg(): SVGSVGElement {
  if (sharedSvg && sharedSvg.isConnected) return sharedSvg;

  const existing = document.getElementById(POLYFILL_SVG_ID) as unknown as SVGSVGElement | null;
  if (existing) {
    sharedSvg = existing;
    return existing;
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = POLYFILL_SVG_ID;
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;";
  document.body.appendChild(svg);
  sharedSvg = svg;
  return svg;
}

// ─── Clip-Path 应用/移除 ──────────────────

/**
 * 对元素应用 SVG clip-path squircle
 *
 * 关键：元素在 MutationObserver 回调触发时常未布局（宽高=0）。
 * 此时不能静默退出，必须先挂 ResizeObserver，等尺寸就绪再应用 clip-path，
 * 否则该元素将永远是普通圆角（build 模式的主要 bug）。
 */
function applyClipPath(el: HTMLElement, radius: number): void {
  if (!isValidRadius(radius)) return;
  // 防止对同一元素重复创建
  if (hasClipPath(el)) return;

  const svg = getSharedSvg();
  const id = `sq-clip-${clipPathIdCounter++}`;

  // 创建 clipPath + path（路径占位，尺寸就绪后填充）
  const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
  clipPath.id = id;
  clipPath.setAttribute("clipPathUnits", "objectBoundingBox");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  clipPath.appendChild(path);
  svg.appendChild(clipPath);

  let applied = false;

  const applyOrUpdate = (): void => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return; // 尚未布局，等下次回调
    const newRx = radius / rect.width;
    const newRy = radius / rect.height;
    path.setAttribute("d", genSquirclePath(newRx, newRy));
    if (!applied) {
      el.style.setProperty("clip-path", `url(#${id})`, "important");
      applied = true;
    }
  };

  // 首次尝试（已布局时直接生效，dev 模式走这里）
  applyOrUpdate();

  // 无论是否已应用，都挂 ResizeObserver：
  // - 未应用时，等尺寸就绪触发 applyOrUpdate
  // - 已应用时，跟随尺寸变化更新路径
  const resizeObserver = new ResizeObserver(applyOrUpdate);
  resizeObserver.observe(el);

  clipPathCache.set(id, { el, radius, observer: resizeObserver });
}

/**
 * 移除元素的 clip-path
 */
function removeClipPath(el: HTMLElement): void {
  for (const [id, record] of clipPathCache) {
    if (record.el === el) {
      el.style.removeProperty("clip-path");
      record.observer.disconnect();
      const cp = document.getElementById(id);
      if (cp) cp.remove();
      clipPathCache.delete(id);
      break;
    }
  }
}

/**
 * 处理单个元素的 squircle
 */
function handleElement(el: HTMLElement): void {
  if (el.hasAttribute("data-squircle")) {
    const radius = getSquircleRadius(el);
    if (isValidRadius(radius)) {
      applyClipPath(el, radius);
    }
  } else {
    removeClipPath(el);
  }
}

/**
 * 处理全局 squircle 匹配的元素
 */
function handleGlobalMatch(el: HTMLElement): void {
  if (!document.documentElement.classList.contains("squircle-enabled")) return;
  if (hasClipPath(el)) return;

  const radius = parseFloat(getComputedStyle(el).borderRadius);
  if (radius > 0) {
    applyClipPath(el, radius);
  }
}

// ─── DOM MutationObserver ──────────────────

const mutationCallback: MutationCallback = (mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      // 处理新增节点
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          // 新增节点本身有 data-squircle
          if (node.hasAttribute("data-squircle")) {
            handleElement(node);
          }
          // 新增节点的子节点
          node.querySelectorAll("[data-squircle]").forEach((el) => {
            if (!hasClipPath(el as HTMLElement)) {
              handleElement(el as HTMLElement);
            }
          });
          // 全局匹配
          handleGlobalMatch(node);
        }
      }

      // 处理移除节点
      for (const node of mutation.removedNodes) {
        if (node instanceof HTMLElement) {
          removeClipPath(node);
          node.querySelectorAll("[data-squircle]").forEach((el) => {
            removeClipPath(el as HTMLElement);
          });
          // 清理悬空引用（已移除元素仍在 cache 中的情况）
          for (const [id, record] of clipPathCache) {
            if (record.el === node || node.contains(record.el)) {
              record.el.style.removeProperty("clip-path");
              record.observer.disconnect();
              clipPathCache.delete(id);
              const cp = document.getElementById(id);
              if (cp) cp.remove();
            }
          }
        }
      }
    }

    if (mutation.type === "attributes" && mutation.attributeName === "data-squircle") {
      handleElement(mutation.target as HTMLElement);
    }
  }
};

/**
 * 初始化 polyfill：对已有元素应用，并启动 DOM 监听
 */
function initPolyfill(): void {
  // 扫描已有 [data-squircle] 元素
  document.querySelectorAll<HTMLElement>("[data-squircle]").forEach((el) => {
    if (hasClipPath(el)) return;
    const radius = getSquircleRadius(el);
    if (isValidRadius(radius)) {
      applyClipPath(el, radius);
    }
  });

  // 扫描全局匹配元素（如果启用了全局 squircle）
  if (document.documentElement.classList.contains("squircle-enabled")) {
    for (const selector of GLOBAL_SELECTORS) {
      try {
        document.querySelectorAll<HTMLElement>(`.squircle-enabled ${selector}`).forEach((el) => {
          if (hasClipPath(el)) return;
          const radius = parseFloat(getComputedStyle(el).borderRadius);
          if (radius > 0) {
            applyClipPath(el, radius);
          }
        });
      } catch {
        // 安全降级
      }
    }
  }
}

/**
 * 启动 DOM 变化监听
 */
function startDomObserver(): void {
  if (domObserver) return;
  domObserver = new MutationObserver(mutationCallback);
  domObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-squircle"],
  });
}

// ─── 样式注入 ──────────────────────────────────

/** 注入基础样式（指令模式 + polyfill 辅助样式） */
function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /* ============================================
     * 等距连续圆角 — corner-shape: squircle
     * (Chrome 139+ / Safari TP)
     * 不支持时自动降级为标准 border-radius
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

/** 注入全局连续曲率样式 */
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

    ${GLOBAL_SELECTORS.map((sel) => `.squircle-enabled ${sel}`).join(",\n")} {
      corner-shape: squircle;
    }

    .squircle-enabled [style*="--radius"] {
      corner-shape: squircle;
    }

    .squircle-enabled [style*="border-radius"] {
      corner-shape: squircle;
    }

    .squircle-enabled button,
    .squircle-enabled .btn,
    .squircle-enabled [role="button"],
    .squircle-enabled .tag,
    .squircle-enabled .badge {
      corner-shape: squircle;
    }

    /* 在不支持 corner-shape 的浏览器中完全无影响，
     * 就是标准的 border-radius */
  `;
  document.head.appendChild(style);
}

// ─── 全局启用/禁用函数 ──────────────────────

/**
 * 全局启用连续曲率圆角
 * 在 documentElement（<html>）上添加 squircle-enabled 类，
 * 注入全局样式，并启动 SVG polyfill（针对不支持 corner-shape 的浏览器）
 */
export function enableGlobalSquircle(): void {
  injectGlobalStyles();
  document.documentElement.classList.add("squircle-enabled");

  // 如果浏览器原生不支持 corner-shape，启动 SVG polyfill
  if (!supportsCornerShape()) {
    if (!polyfillInitialized) {
      polyfillInitialized = true;
      // 对已有元素应用 polyfill
      initPolyfill();
      // 启动 DOM 变化监听
      startDomObserver();
      // 再次扫描确保所有元素都被覆盖
      requestAnimationFrame(() => {
        setTimeout(initPolyfill, 0);
      });
    }
  }
}

/**
 * 禁用全局连续曲率圆角
 */
export function disableGlobalSquircle(): void {
  document.documentElement.classList.remove("squircle-enabled");
}

/**
 * 重扫并（重新）应用 polyfill。
 * 用于 window 显示 / 布局稳定后补捞遗漏元素：
 * - 对仍未挂 clip-path 的有效元素调用 applyClipPath（幂等，已挂的跳过）
 * - 对不再是 squircle 的元素清理 clip-path
 */
export function rescanSquircle(): void {
  document.querySelectorAll<HTMLElement>("[data-squircle]").forEach((el) => {
    const radius = getSquircleRadius(el);
    if (isValidRadius(radius)) {
      applyClipPath(el, radius);
    } else {
      removeClipPath(el);
    }
  });

  if (document.documentElement.classList.contains("squircle-enabled")) {
    for (const selector of GLOBAL_SELECTORS) {
      try {
        document.querySelectorAll<HTMLElement>(`.squircle-enabled ${selector}`).forEach((el) => {
          if (hasClipPath(el)) return;
          const radius = parseFloat(getComputedStyle(el).borderRadius);
          if (radius > 0) {
            applyClipPath(el, radius);
          }
        });
      } catch {
        // 安全降级
      }
    }
  }
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

    // 如果已启用 polyfill，对新元素应用 clip-path
    if (polyfillInitialized) {
      const radius = getSquircleRadius(el);
      if (isValidRadius(radius)) {
        requestAnimationFrame(() => {
          applyClipPath(el, radius);
        });
      }
    }
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
