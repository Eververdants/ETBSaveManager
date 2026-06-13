/**
 * useFocusTrap - 焦点陷阱 composable
 *
 * 在 Modal/Dropdown 打开时，将 TAB 键循环限制在容器内。
 * 关闭时自动恢复焦点到触发元素。
 *
 * 用法：
 *   const triggerRef = ref(null)  // 打开弹窗的按钮元素
 *   const containerRef = ref(null) // 弹窗容器元素
 *   const { activate, deactivate } = useFocusTrap(containerRef, {
 *     triggerRef,
 *     onEscape: () => { show.value = false }
 *   })
 *   watch(show, (v) => { if (v) activate() else deactivate() })
 */
import { onUnmounted } from "vue";

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container) {
  if (!container) return [];

  const selectors = [
    'a[href]:not([disabled])',
    'button:not([disabled]):not([aria-hidden="true"])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
    'details summary',
    '[contenteditable]:not([contenteditable="false"])',
  ];

  return Array.from(container.querySelectorAll(selectors.join(", ")));
}

/**
 * Focus trap composable
 *
 * @param {import('vue').Ref<HTMLElement|null>} containerRef - The modal/panel container ref
 * @param {Object} options
 * @param {import('vue').Ref<HTMLElement|null>} [options.triggerRef] - The element that opened the modal (for focus restoration)
 * @param {Function} [options.onEscape] - Escape key handler
 * @param {boolean|import('vue').Ref<boolean>} [options.initialFocus=true] - Auto-focus first element on activate
 * @param {string} [options.initialFocusSelector] - Specific selector for initial focus (e.g. '[data-auto-focus]')
 */
export function useFocusTrap(containerRef, options = {}) {
  const {
    triggerRef = null,
    onEscape = null,
    initialFocus = true,
    initialFocusSelector = null,
  } = options;

  let previouslyFocused = null;
  let keydownHandler = null;

  function trapKeydown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      if (typeof onEscape === "function") {
        onEscape(event);
      }
      return;
    }

    if (event.key !== "Tab") return;

    const container = containerRef.value;
    if (!container) return;

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const currentIndex = focusable.indexOf(document.activeElement);

    if (event.shiftKey) {
      // Shift+Tab: cycle backwards
      if (currentIndex <= 0) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      }
    } else {
      // Tab: cycle forwards
      if (currentIndex === -1 || currentIndex === focusable.length - 1) {
        event.preventDefault();
        focusable[0].focus();
      }
    }
  }

  function activate() {
    // Save currently focused element for restoration
    previouslyFocused = document.activeElement;

    // Add trap listener
    keydownHandler = trapKeydown;
    document.addEventListener("keydown", keydownHandler);

    // Auto focus first element
    if (initialFocus) {
      requestAnimationFrame(() => {
        const container = containerRef.value;
        if (!container) return;

        let target = null;

        // Try specific selector first
        if (initialFocusSelector) {
          target = container.querySelector(initialFocusSelector);
        }

        // Then try first focusable element
        if (!target) {
          const focusable = getFocusableElements(container);
          target = focusable[0];
        }

        if (target) {
          target.focus();
        } else {
          // Fallback: focus the container itself
          container.setAttribute("tabindex", "-1");
          container.focus();
        }
      });
    }
  }

  function deactivate() {
    if (keydownHandler) {
      document.removeEventListener("keydown", keydownHandler);
      keydownHandler = null;
    }

    // Restore focus to trigger element
    if (previouslyFocused && triggerRef?.value) {
      requestAnimationFrame(() => {
        const trigger = triggerRef.value;
        if (trigger && typeof trigger.focus === "function") {
          trigger.focus();
        }
      });
    } else if (previouslyFocused && previouslyFocused.focus) {
      requestAnimationFrame(() => {
        previouslyFocused.focus();
      });
    }

    previouslyFocused = null;
  }

  onUnmounted(() => {
    deactivate();
  });

  return {
    activate,
    deactivate,
    getFocusableElements: () => getFocusableElements(containerRef.value),
  };
}
