import { ref, onUnmounted } from "vue";
import { initFloatingButtonProtection, cleanupFloatingButtonProtection } from "../utils/floatingButtonProtection.js";
import type { Ref } from "vue";

interface FloatingButtonComposable {
  fabCurrentIndex: Ref<number>;
  initButtonProtection: () => void;
  cleanup: () => void;
}

/**
 * Floating button protection composable
 * Sets up a MutationObserver to detect and restore position when CSS is overridden
 */
export function useFloatingButton(): FloatingButtonComposable {
  const fabCurrentIndex = ref(0);

  /**
   * Initialize floating button position protection via MutationObserver
   */
  const initButtonProtection = (): void => {
    initFloatingButtonProtection();
  };

  /**
   * Cleanup resources
   */
  const cleanup = (): void => {
    cleanupFloatingButtonProtection();
  };

  return {
    fabCurrentIndex,
    initButtonProtection,
    cleanup,
  };
}
