/**
 * useFocusTrap - Focus trap composable
 *
 * When Modal/Dropdown opens, restricts TAB key cycling within the container.
 * Automatically restores focus to the trigger element on close.
 *
 * Usage:
 *   const triggerRef = ref(null)  // Button element that opens the modal
 *   const containerRef = ref(null) // Modal container element
 *   const { activate, deactivate } = useFocusTrap(containerRef, {
 *     triggerRef,
 *     onEscape: () => { show.value = false }
 *   })
 *   watch(show, (v) => { if (v) activate() else deactivate() })
 */
import { onUnmounted, type Ref } from "vue";

interface FocusTrapOptions {
  triggerRef?: Ref<HTMLElement | null>;
  onEscape?: ((event: KeyboardEvent) => void) | null;
  initialFocus?: boolean;
  initialFocusSelector?: string | null;
}

interface FocusTrapReturn {
  activate: () => void;
  deactivate: () => void;
  getFocusableElements: () => HTMLElement[];
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];

  const selectors = [
    "a[href]:not([disabled])",
    'button:not([disabled]):not([aria-hidden="true"])',
    "input:not([disabled])",
    "textarea:not([disabled])",
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
    "details summary",
    '[contenteditable]:not([contenteditable="false"])',
  ];

  return Array.from(container.querySelectorAll(selectors.join(", ")));
}

/**
 * Focus trap composable
 *
 * @param containerRef - The modal/panel container ref
 * @param options
 */
export function useFocusTrap(containerRef: Ref<HTMLElement | null>, options: FocusTrapOptions = {}): FocusTrapReturn {
  const { triggerRef = null, onEscape = null, initialFocus = true, initialFocusSelector = null } = options;

  let previouslyFocused: HTMLElement | null = null;
  let keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  function trapKeydown(event: KeyboardEvent): void {
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

    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);

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

  function activate(): void {
    // Save currently focused element for restoration
    previouslyFocused = document.activeElement as HTMLElement | null;

    // Add trap listener
    keydownHandler = trapKeydown;
    document.addEventListener("keydown", keydownHandler);

    // Auto focus first element
    if (initialFocus) {
      requestAnimationFrame(() => {
        const container = containerRef.value;
        if (!container) return;

        let target: Element | null = null;

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
          (target as HTMLElement).focus();
        } else {
          // Fallback: focus the container itself
          container.setAttribute("tabindex", "-1");
          container.focus();
        }
      });
    }
  }

  function deactivate(): void {
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
    } else if (previouslyFocused && typeof (previouslyFocused as HTMLElement).focus === "function") {
      const el = previouslyFocused as HTMLElement;
      requestAnimationFrame(() => {
        el.focus();
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
    getFocusableElements: (): HTMLElement[] => getFocusableElements(containerRef.value),
  };
}
