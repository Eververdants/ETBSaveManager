import { ref, onUnmounted } from "vue";
import { initFloatingButtonProtection, cleanupFloatingButtonProtection } from "../utils/floatingButtonProtection.js";

/**
 * Floating button protection composable
 * Sets up a MutationObserver to detect and restore position when CSS is overridden
 */
export function useFloatingButton() {
  const fabCurrentIndex = ref(0);

  /**
   * Initialize floating button position protection via MutationObserver
   */
  const initButtonProtection = () => {
    initFloatingButtonProtection();
  };

  /**
   * Cleanup resources
   */
  const cleanup = () => {
    cleanupFloatingButtonProtection();
  };

  return {
    fabCurrentIndex,
    initButtonProtection,
    cleanup,
  };
}
