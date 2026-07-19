/**
 * iOS 风格等距圆角（Squircle / Continuous Corner）
 * 双层：1) 原生 corner-shape: squircle  2) SVG alpha-mask polyfill
 * 单个共享 SVG mask，元素尺寸变化只更新 path.d，无 DOM 膨胀
 */
const STYLE_ID = "squircle-styles";
const GLOBAL_STYLE_ID = "squircle-global";
const POLYFILL_SVG_ID = "squircle-polyfill-svg";

const RADIUS_MAP: Record<string, number> = {
  xs: 12, sm: 20, md: 28, lg: 36, xl: 44, "2xl": 52,
};

const GLOBAL_SELECTORS = [
  "button", ".btn", "input", "textarea", "select",
  ".card", ".modal", ".dialog", ".popup", ".tag", ".badge",
  ".dropdown", ".menu", ".tooltip", ".popover", ".sidebar",
  '[class*="squircle-"]', ".archive-card", '[role="button"]',
];

// iOS 连续曲率 κ = 4/3·(√2−1) ≈ 0.5523
const SQUIRCLE_KAPPA = 0.5523;

let polyfillInitialized = false;
let sharedSvg: SVGSVGElement | null = null;
let domObserver: MutationObserver | null = null;
let maskIdCounter = 0;

interface MaskRecord {
  path: SVGPathElement;
  maskEl: SVGMaskElement;
  observer: ResizeObserver;
}
const maskCache = new WeakMap<HTMLElement, MaskRecord>();

function genSquirclePath(rx: number, ry: number): string {
  const cx = Math.min(rx, 0.499);
  const cy = Math.min(ry, 0.499);
  const kx = cx * SQUIRCLE_KAPPA;
  const ky = cy * SQUIRCLE_KAPPA;
  return [
    `M ${cx},0`, `L ${1 - cx},0`,
    `C ${1 - cx + kx},0  1,${cy - ky}  1,${cy}`,
    `L 1,${1 - cy}`,
    `C 1,${1 - cy + ky}  ${1 - cx + kx},1  ${1 - cx},1`,
    `L ${cx},1`,
    `C ${cx - kx},1  0,${1 - cy + ky}  0,${1 - cy}`,
    `L 0,${cy}`,
    `C 0,${cy - ky}  ${cx - kx},0  ${cx},0`,
    "Z",
  ].join(" ");
}

function supportsCornerShape(): boolean {
  if (import.meta.env.DEV && typeof window !== "undefined" && window.location.search.includes("force-polyfill")) {
    return false;
  }
  return CSS.supports("corner-shape: squircle");
}

function getSquircleRadius(el: HTMLElement): number {
  const val = el.getAttribute("data-squircle");
  if (!val) return 0;
  if (val in RADIUS_MAP) return RADIUS_MAP[val]!;
  if (val === "circle" || val === "50%" || val === "pill") return 0;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function isValidRadius(r: number): boolean {
  return r >= 8;
}

function hasSquircleMask(el: HTMLElement): boolean {
  return maskCache.has(el);
}

function isPillOrCircle(el: HTMLElement, radius: number): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  return radius * 2 >= Math.min(rect.width, rect.height);
}

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

// ─── Mask 应用/移除 ──────────────────────────

/**
 * 对元素应用 SVG alpha-mask squircle。
 *
 * 每个元素拥有独立的 <mask> + <path>（因为 radius/width 随元素尺寸变化，
 * 同半径不同宽度的元素不能共享 path.d），但全部挂载到唯一的共享 <svg> 上。
 * Alpha 遮罩（白色 path 在 transparent 背景上）让浏览器用亚像素抗锯齿渲染边缘，
 * 比 clip-path 的硬边更柔和、更接近连续曲率。
 */
function applySquircleMask(el: HTMLElement, radius: number): void {
  if (!isValidRadius(radius)) return;
  if (hasSquircleMask(el)) return;

  const svg = getSharedSvg();
  const maskId = `sq-mask-${maskIdCounter++}`;

  const maskEl = document.createElementNS("http://www.w3.org/2000/svg", "mask");
  maskEl.id = maskId;
  maskEl.setAttribute("maskContentUnits", "objectBoundingBox");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "white");
  maskEl.appendChild(path);
  svg.appendChild(maskEl);

  let applied = false;
  const applyOrUpdate = (): void => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const rx = radius / rect.width;
    const ry = radius / rect.height;
    path.setAttribute("d", genSquirclePath(rx, ry));
    if (!applied) {
      el.style.setProperty("mask", `url(#${maskId})`, "important");
      el.style.setProperty("-webkit-mask", `url(#${maskId})`, "important");
      el.style.setProperty("mask-size", "100% 100%", "important");
      el.style.setProperty("-webkit-mask-size", "100% 100%", "important");
      applied = true;
    }
  };

  // 首次尝试（已布局时直接生效）
  applyOrUpdate();
  // 无论是否已应用，都挂 ResizeObserver：未布局时等就绪，已布局时跟随尺寸
  const observer = new ResizeObserver(applyOrUpdate);
  observer.observe(el);
  maskCache.set(el, { path, maskEl, observer });
}

function removeSquircleMask(el: HTMLElement): void {
  const record = maskCache.get(el);
  if (!record) return;
  el.style.removeProperty("mask");
  el.style.removeProperty("-webkit-mask");
  el.style.removeProperty("mask-size");
  el.style.removeProperty("-webkit-mask-size");
  record.observer.disconnect();
  // 每个元素独占一个 <mask>，移除时直接删掉该节点
  if (record.maskEl.parentNode) record.maskEl.parentNode.removeChild(record.maskEl);
  maskCache.delete(el);
}

function handleElement(el: HTMLElement): void {
  if (el.hasAttribute("data-squircle")) {
    const radius = getSquircleRadius(el);
    if (isValidRadius(radius)) {
      applySquircleMask(el, radius);
    } else {
      removeSquircleMask(el);
    }
  } else {
    removeSquircleMask(el);
  }
}

function handleGlobalMatch(el: HTMLElement): void {
  if (!document.documentElement.classList.contains("squircle-enabled")) return;
  if (hasSquircleMask(el)) return;
  const radius = parseFloat(getComputedStyle(el).borderRadius);
  if (radius > 0 && !isPillOrCircle(el, radius)) {
    applySquircleMask(el, radius);
  }
}

// ─── DOM MutationObserver ──────────────────

const mutationCallback: MutationCallback = (mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.hasAttribute("data-squircle")) handleElement(node);
        node.querySelectorAll("[data-squircle]").forEach((el) => {
          if (!hasSquircleMask(el as HTMLElement)) handleElement(el as HTMLElement);
        });
        handleGlobalMatch(node);
      }
      for (const node of mutation.removedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        removeSquircleMask(node);
        node.querySelectorAll("[data-squircle]").forEach((el) => removeSquircleMask(el as HTMLElement));
        if (maskCache.has(node)) {
          const r = maskCache.get(node)!;
          r.observer.disconnect();
          maskCache.delete(node);
        }
      }
    }
    if (mutation.type === "attributes" && mutation.attributeName === "data-squircle") {
      handleElement(mutation.target as HTMLElement);
    }
  }
};

function initPolyfill(): void {
  document.querySelectorAll<HTMLElement>("[data-squircle]").forEach((el) => {
    if (hasSquircleMask(el)) return;
    const radius = getSquircleRadius(el);
    if (isValidRadius(radius)) applySquircleMask(el, radius);
  });

  if (document.documentElement.classList.contains("squircle-enabled")) {
    for (const selector of GLOBAL_SELECTORS) {
      try {
        document.querySelectorAll<HTMLElement>(`.squircle-enabled ${selector}`).forEach((el) => {
          if (hasSquircleMask(el)) return;
          const radius = parseFloat(getComputedStyle(el).borderRadius);
          if (radius > 0 && !isPillOrCircle(el, radius)) applySquircleMask(el, radius);
        });
      } catch { /* 安全降级 */ }
    }
  }
}

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

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [data-squircle] { corner-shape: squircle; }
    [data-squircle="xs"]   { border-radius: 12px; }
    [data-squircle="sm"]   { border-radius: 20px; }
    [data-squircle="md"]   { border-radius: 28px; }
    [data-squircle="lg"]   { border-radius: 36px; }
    [data-squircle="xl"]   { border-radius: 44px; }
    [data-squircle="2xl"]  { border-radius: 52px; }
    [data-squircle="pill"] { border-radius: 9999px; }
    [data-squircle="circle"] { border-radius: 50%; }
    [data-squircle="12"] { border-radius: 12px; }
    [data-squircle="20"] { border-radius: 20px; }
    [data-squircle="28"] { border-radius: 28px; }
    [data-squircle="36"] { border-radius: 36px; }
    [data-squircle="44"] { border-radius: 44px; }
    [data-squircle="52"] { border-radius: 52px; }
  `;
  document.head.appendChild(style);
}

function injectGlobalStyles(): void {
  if (document.getElementById(GLOBAL_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = GLOBAL_STYLE_ID;
  style.textContent = `
    ${GLOBAL_SELECTORS.map((sel) => `.squircle-enabled ${sel}`).join(",\n")} {
      corner-shape: squircle;
    }
  `;
  document.head.appendChild(style);
}

// ─── 导出 ──────────────────────────────────────

export function enableGlobalSquircle(): void {
  injectGlobalStyles();
  document.documentElement.classList.add("squircle-enabled");
  if (!supportsCornerShape()) {
    if (!polyfillInitialized) {
      polyfillInitialized = true;
      initPolyfill();
      startDomObserver();
      requestAnimationFrame(() => setTimeout(initPolyfill, 0));
    }
  }
}

export function disableGlobalSquircle(): void {
  document.documentElement.classList.remove("squircle-enabled");
}

export function rescanSquircle(): void {
  document.querySelectorAll<HTMLElement>("[data-squircle]").forEach((el) => {
    const radius = getSquircleRadius(el);
    if (isValidRadius(radius)) applySquircleMask(el, radius);
    else removeSquircleMask(el);
  });

  if (document.documentElement.classList.contains("squircle-enabled")) {
    for (const selector of GLOBAL_SELECTORS) {
      try {
        document.querySelectorAll<HTMLElement>(`.squircle-enabled ${selector}`).forEach((el) => {
          if (hasSquircleMask(el)) return;
          const radius = parseFloat(getComputedStyle(el).borderRadius);
              if (radius > 0 && !isPillOrCircle(el, radius)) applySquircleMask(el, radius);
        });
      } catch { /* 安全降级 */ }
    }
  }
}

export function squircleClass(size: keyof typeof RADIUS_MAP | string | number): string {
  return `squircle-${size}`;
}

export const vSquircle = {
  mounted(el: HTMLElement, binding: { value?: number | string; arg?: string }) {
    injectStyles();
    if (binding.arg) {
      el.setAttribute("data-squircle", binding.arg);
      return;
    }
    const val = binding.value ?? 44;
    el.setAttribute("data-squircle", String(val));
    if (polyfillInitialized) {
      const radius = getSquircleRadius(el);
      if (isValidRadius(radius)) {
        requestAnimationFrame(() => applySquircleMask(el, radius));
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
