// 浮动按钮位置保护工具
// 使用全局变量避免重复创建定时器和观察器
let positionCheckInterval = null;
let mutationObserver = null;
let lastCheckTime = 0;
const CHECK_INTERVAL = 1000; // 减少检查频率，从500ms增加到1000ms

// 缓存DOM查询结果，减少重复查询
let cachedButtonElement = null;
let lastCacheTime = 0;
const CACHE_DURATION = 500; // 缓存500ms

/**
 * 安全地修改body样式，避免触发重排和重绘
 * @param {Object} styles - 要修改的样式对象
 * @returns {Function} 恢复样式的函数
 */
export function safeModifyBodyStyles(styles) {
  // 保存原始样式
  const originalStyles = {};

  // 使用requestAnimationFrame确保在下一帧执行，避免阻塞渲染
  requestAnimationFrame(() => {
    // 临时禁用过渡效果，避免不必要的动画
    const originalTransition = document.body.style.transition;
    document.body.style.transition = "none";

    try {
      // 保存原始样式值
      for (const property in styles) {
        originalStyles[property] = document.body.style[property];
      }

      // 应用新样式
      for (const property in styles) {
        document.body.style[property] = styles[property];
      }
    } finally {
      // 恢复原始过渡效果
      document.body.style.transition = originalTransition;
    }
  });

  // 返回恢复样式的函数
  return function restoreStyles() {
    requestAnimationFrame(() => {
      // 临时禁用过渡效果，避免不必要的动画
      const originalTransition = document.body.style.transition;
      document.body.style.transition = "none";

      try {
        // 恢复原始样式
        for (const property in originalStyles) {
          document.body.style[property] = originalStyles[property];
        }
      } finally {
        // 恢复原始过渡效果
        document.body.style.transition = originalTransition;
      }
    });
  };
}

/**
 * 获取浮动按钮元素，使用缓存减少DOM查询
 * @returns {Element|null} 浮动按钮元素
 */
function getFloatingButtonElement() {
  const now = Date.now();

  // 如果缓存仍然有效，返回缓存的元素
  if (cachedButtonElement && now - lastCacheTime < CACHE_DURATION) {
    return cachedButtonElement;
  }

  // 否则重新查询并更新缓存
  cachedButtonElement = document.querySelector(".floating-action-container");
  lastCacheTime = now;

  return cachedButtonElement;
}

/**
 * 保护浮动按钮位置，确保它始终固定在右下角
 * 优化版本：减少DOM操作和重排
 */
export function protectFloatingButtonPosition() {
  const now = Date.now();

  // 限制检查频率，避免过度执行
  if (now - lastCheckTime < CHECK_INTERVAL) {
    return;
  }

  lastCheckTime = now;

  // 使用缓存的元素查询
  const container = getFloatingButtonElement();
  if (!container) {
    return;
  }

  // 批量读取DOM属性，减少重排
  const rect = container.getBoundingClientRect();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // 计算期望位置
  let expectedBottom, expectedRight;

  if (windowWidth <= 480) {
    expectedBottom = 15;
    expectedRight = 15;
  } else if (windowWidth <= 768) {
    expectedBottom = 20;
    expectedRight = 20;
  } else {
    expectedBottom = 30;
    expectedRight = 30;
  }

  // 计算实际位置偏差
  const actualBottom = windowHeight - rect.bottom;
  const actualRight = windowWidth - rect.right;
  const bottomDiff = Math.abs(actualBottom - expectedBottom);
  const rightDiff = Math.abs(actualRight - expectedRight);

  // 只有在位置偏差超过阈值时才进行修正
  if (bottomDiff > 5 || rightDiff > 5) {
    // 批量设置样式，减少重排
    container.style.setProperty("position", "fixed", "important");
    container.style.setProperty("bottom", `${expectedBottom}px`, "important");
    container.style.setProperty("right", `${expectedRight}px`, "important");
    container.style.setProperty("transform", "none", "important");
    container.style.setProperty("margin", "0", "important");
    container.style.setProperty("top", "auto", "important");
    container.style.setProperty("left", "auto", "important");
    container.style.setProperty("z-index", "1000", "important");
  }
}

/**
 * 初始化浮动按钮位置保护
 * 优化版本：减少观察器和定时器的使用
 */
export function initFloatingButtonProtection() {
  // 清理之前的观察器和定时器
  cleanupFloatingButtonProtection();

  // 延迟初始化，确保DOM已完全加载
  setTimeout(() => {
    const container = getFloatingButtonElement();
    if (!container) {
      return;
    }

    // 立即执行一次保护
    protectFloatingButtonPosition();

    // 创建一个更高效的MutationObserver，只观察关键属性
    mutationObserver = new MutationObserver((mutations) => {
      let needsProtection = false;

      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "style"
        ) {
          // 只检查关键定位属性
          const style = container.style;
          if (
            style.position !== "fixed" ||
            style.bottom === "" ||
            style.right === "" ||
            style.top !== "auto" ||
            style.left !== "auto"
          ) {
            needsProtection = true;
          }
        }
      });

      if (needsProtection) {
        protectFloatingButtonPosition();
      }
    });

    // 只观察style属性变化
    mutationObserver.observe(container, {
      attributes: true,
      attributeFilter: ["style"],
      childList: false,
      subtree: false,
    });

    // 设置一个更长的定时器间隔，减少性能影响
    positionCheckInterval = setInterval(protectFloatingButtonPosition, 3000);

    console.log("浮动按钮样式保护已启用（优化版）");
  }, 1000);
}

/**
 * 清理浮动按钮位置保护
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

  // 清除缓存
  cachedButtonElement = null;
  lastCacheTime = 0;
}

// 页面加载完成后初始化保护
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFloatingButtonProtection);
  } else {
    initFloatingButtonProtection();
  }

  // 页面卸载时清理
  window.addEventListener("beforeunload", cleanupFloatingButtonProtection);
}

// 优化后的浮动按钮保护函数，减少重排和重绘
const enhancedProtectFloatingButton = () => {
  // 使用requestAnimationFrame确保在下一帧执行
  requestAnimationFrame(() => {
    // 使用更高效的样式修改方式，减少重排
    const container = document.querySelector(".floating-action-container");
    if (container) {
      // 批量读取DOM属性，减少重排
      const rect = container.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // 计算期望位置
      let expectedBottom, expectedRight;
      if (windowWidth <= 480) {
        expectedBottom = 15;
        expectedRight = 15;
      } else if (windowWidth <= 768) {
        expectedBottom = 20;
        expectedRight = 20;
      } else {
        expectedBottom = 30;
        expectedRight = 30;
      }

      // 计算实际位置偏差
      const actualBottom = windowHeight - rect.bottom;
      const actualRight = windowWidth - rect.right;
      const bottomDiff = Math.abs(actualBottom - expectedBottom);
      const rightDiff = Math.abs(actualRight - expectedRight);

      // 只有在位置偏差超过阈值时才进行修正
      if (bottomDiff > 5 || rightDiff > 5) {
        // 批量设置样式，减少重排
        container.style.setProperty("position", "fixed", "important");
        container.style.setProperty(
          "bottom",
          `${expectedBottom}px`,
          "important"
        );
        container.style.setProperty("right", `${expectedRight}px`, "important");
        container.style.setProperty("transform", "none", "important");
        container.style.setProperty("margin", "0", "important");
        container.style.setProperty("top", "auto", "important");
        container.style.setProperty("left", "auto", "important");
        container.style.setProperty("z-index", "1000", "important");
      }
    }

    // 减少延迟检查次数，从多次减少到一次
    setTimeout(() => {
      const container = document.querySelector(".floating-action-container");
      if (container) {
        container.style.setProperty("position", "fixed", "important");
        container.style.setProperty(
          "bottom",
          `${expectedBottom}px`,
          "important"
        );
        container.style.setProperty("right", `${expectedRight}px`, "important");
      }
    }, 1000); // 从1500ms减少到1000ms
  });
};

// 全局初始化函数，供main.js调用
export function initGlobalFloatingButtonProtection() {
  initFloatingButtonProtection();
}

// 导出增强的保护函数
export { enhancedProtectFloatingButton };
