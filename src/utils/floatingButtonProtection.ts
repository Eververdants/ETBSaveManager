/**
 * Floating button position protection utility
 * Uses MutationObserver to detect and restore position when CSS is overridden
 */

let mutationObserver: MutationObserver | null = null;
let isInitialized = false;

/**
 * Expected position values by viewport width
 */
function getExpectedPosition(): { bottom: string; right: string } {
  const width = window.innerWidth;
  if (width <= 480) return { bottom: "15px", right: "15px" };
  if (width <= 768) return { bottom: "20px", right: "20px" };
  return { bottom: "30px", right: "30px" };
}

/**
 * Restore fixed positioning on the floating action button
 */
export function protectFloatingButtonPosition(): void {
  const container = document.querySelector(".floating-action-container") as HTMLElement | null;
  if (!container) return;

  const { bottom, right } = getExpectedPosition();
  const rect = container.getBoundingClientRect();
  const actualBottom = window.innerHeight - rect.bottom;
  const actualRight = window.innerWidth - rect.right;

  // Only correct when drift exceeds threshold (5px)
  if (Math.abs(actualBottom - parseFloat(bottom)) > 5 || Math.abs(actualRight - parseFloat(right)) > 5) {
    const style = container.style;
    style.setProperty("position", "fixed", "important");
    style.setProperty("bottom", bottom, "important");
    style.setProperty("right", right, "important");
    style.setProperty("top", "auto", "important");
    style.setProperty("left", "auto", "important");
    style.setProperty("transform", "none", "important");
    style.setProperty("z-index", "10000", "important");
  }
}

/**
 * Initialize MutationObserver as a safety net
 * Watches for style attribute changes that would break fixed positioning
 */
export function initFloatingButtonProtection(): void {
  if (isInitialized) return;
  cleanupFloatingButtonProtection();

  const container = document.querySelector(".floating-action-container") as HTMLElement | null;
  if (!container) return;

  const expectedPosition = getExpectedPosition();

  mutationObserver = new MutationObserver(() => {
    if (!container.isConnected) return;

    const criticalProps = ["position", "bottom", "right", "top", "left"];
    let needsRestore = false;

    for (const prop of criticalProps) {
      const current = container.style.getPropertyValue(prop);
      const expected =
        prop === "position"
          ? "fixed"
          : prop === "top" || prop === "left"
            ? "auto"
            : expectedPosition[prop as "bottom" | "right"];

      if (current && current !== expected) {
        needsRestore = true;
        break;
      }
    }

    if (needsRestore) {
      protectFloatingButtonPosition();
    }
  });

  mutationObserver.observe(container, {
    attributes: true,
    attributeFilter: ["style"],
  });

  isInitialized = true;
}

/**
 * Cleanup observer
 */
export function cleanupFloatingButtonProtection(): void {
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  isInitialized = false;
}

/**
 * Safely modify body styles by temporarily disabling CSS transitions
 * Prevents flickering when toggling body overflow/position for modal overlays
 * @param {Object|Function} styles - Style object to apply, or a callback to execute
 * @returns {Function|void} Cleanup function when called with object
 */
export function safeModifyBodyStyles(styles: Record<string, string> | (() => void)): (() => void) | void {
  if (typeof styles === "function") {
    requestAnimationFrame(() => {
      const body = document.body;
      const originalTransition = body.style.transition;
      body.style.transition = "none";
      styles();
      body.style.transition = originalTransition;
    });
    return;
  }

  const original: Record<string, string> = {};
  requestAnimationFrame(() => {
    const body = document.body;
    const originalTransition = body.style.transition;
    body.style.transition = "none";

    for (const prop in styles) {
      original[prop] = body.style.getPropertyValue(prop);
      body.style.setProperty(prop, styles[prop]);
    }

    body.style.transition = originalTransition;
  });

  return (): void => {
    requestAnimationFrame(() => {
      const body = document.body;
      const originalTransition = body.style.transition;
      body.style.transition = "none";

      for (const prop in original) {
        body.style.setProperty(prop, original[prop]);
      }

      body.style.transition = originalTransition;
    });
  };
}

/**
 * Global initialization via requestIdleCallback
 */
export function initGlobalFloatingButtonProtection(): void {
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(() => initFloatingButtonProtection(), { timeout: 3000 });
  } else {
    setTimeout(initFloatingButtonProtection, 2000);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", cleanupFloatingButtonProtection);
}
