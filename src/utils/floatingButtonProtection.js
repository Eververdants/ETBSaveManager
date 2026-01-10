/**
 * 浮动按钮位置保护工具 - 优化版
 * 减少 DOM 操作和性能开销
 */

let positionCheckInterval = null;
let mutationObserver = null;
let cachedButtonElement = null;
let lastCacheTime = 0;
let isInitialized = false;

const CACHE_DURATION = 1000;
const CHECK_INTERVAL = 3000;

/**
 * 获取浮动按钮元素（带缓存）
 */
function getFloatingButton() {
  const now = Date.now();
  if (cachedButtonElement && now - lastCacheTime < CACHE_DURATION) {
    return cachedButtonElement;
  }
  cachedButtonElement = document.querySelector(".floating-action-container");
  lastCacheTime = now;
  return cachedButtonElement;
}

/**
 * 计算期望位置
 */
function getExpectedPosition() {
  const width = window.innerWidth;
  if (width <= 480) return { bottom: 15, right: 15 };
  if (width <= 768) return { bottom: 20, right: 20 };
  return { bottom: 30, right: 30 };
}

/**
 * 保护浮动按钮位置
 */
export function protectFloatingButtonPosition() {
  const container = getFloatingButton();
  if (!container) return;

  const { bottom, right } = getExpectedPosition();
  const rect = container.getBoundingClientRect();
  const actualBottom = window.innerHeight - rect.bottom;
  const actualRight = window.innerWidth - rect.right;

  // 只在偏差超过阈值时修正
  if (Math.abs(actualBottom - bottom) > 5 || Math.abs(actualRight - right) > 5) {
    const style = container.style;
    style.setProperty("position", "fixed", "important");
    style.setProperty("bottom", `${bottom}px`, "important");
    style.setProperty("right", `${right}px`, "important");
    style.setProperty("top", "auto", "important");
    style.setProperty("left", "auto", "important");
    style.setProperty("transform", "none", "important");
    style.setProperty("z-index", "1000", "important");
  }
}

/**
 * 增强的保护函数
 */
export function enhancedProtectFloatingButton() {
  requestAnimationFrame(protectFloatingButtonPosition);
}

/**
 * 安全修改 body 样式
 */
export function safeModifyBodyStyles(styles) {
  const original = {};
  
  requestAnimationFrame(() => {
    const body = document.body;
    const originalTransition = body.style.transition;
    body.style.transition = "none";
    
    for (const prop in styles) {
      original[prop] = body.style[prop];
      body.style[prop] = styles[prop];
    }
    
    body.style.transition = originalTransition;
  });

  return () => {
    requestAnimationFrame(() => {
      const body = document.body;
      const originalTransition = body.style.transition;
      body.style.transition = "none";
      
      for (const prop in original) {
        body.style[prop] = original[prop];
      }
      
      body.style.transition = originalTransition;
    });
  };
}

/**
 * 初始化浮动按钮保护
 */
export function initFloatingButtonProtection() {
  if (isInitialized) return;
  
  cleanupFloatingButtonProtection();

  setTimeout(() => {
    const container = getFloatingButton();
    if (!container) return;

    protectFloatingButtonPosition();

    // 简化的 MutationObserver
    mutationObserver = new MutationObserver(() => {
      protectFloatingButtonPosition();
    });

    mutationObserver.observe(container, {
      attributes: true,
      attributeFilter: ["style"],
    });

    positionCheckInterval = setInterval(protectFloatingButtonPosition, CHECK_INTERVAL);
    isInitialized = true;
  }, 1000);
}

/**
 * 清理保护
 */
export function cleanupFloatingButtonProtection() {
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  if (positionCheckInterval) {
    clearInterval(positionCheckInterval);
    positionCheckInterval = null;
  }
  cachedButtonElement = null;
  isInitialized = false;
}

/**
 * 全局初始化
 */
export function initGlobalFloatingButtonProtection() {
  // 延迟初始化，不阻塞启动
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(() => initFloatingButtonProtection(), { timeout: 3000 });
  } else {
    setTimeout(initFloatingButtonProtection, 2000);
  }
}

// 页面卸载时清理
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", cleanupFloatingButtonProtection);
}
