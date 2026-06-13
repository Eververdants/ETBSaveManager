import { notify } from "../services/notificationService";

/**
 * Toast notification composable
 * Now using unified eight-direction notification service
 */
export function useToast() {
  /**
   * Show success notification
   */
  const showSuccess = (message, icon = "✓") => {
    notify.success(message, { position: "top-right" });
  };

  /**
   * Show error notification
   */
  const showError = (message, icon = "✗") => {
    notify.error(message, { position: "top-right" });
  };

  /**
   * Show folder notification
   */
  const showFolder = (message, icon = "📁") => {
    notify.info(message, {
      position: "top-right",
      icon: ["fas", "folder"],
    });
  };

  /**
   * Show info notification
   */
  const showInfo = (message, icon = "ℹ️") => {
    notify.info(message, { position: "top-right" });
  };

  /**
   * Show warning notification
   */
  const showWarning = (message, icon = "⚠️") => {
    notify.warning(message, { position: "top-right" });
  };

  return {
    showSuccess,
    showError,
    showFolder,
    showInfo,
    showWarning,
  };
}
