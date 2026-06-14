import { notify } from "../services/notificationService";
import type { NotificationOptions } from "@/types";

/**
 * Toast notification composable
 * Using unified eight-direction notification service.
 * Supports action callbacks for undo-style notifications.
 *
 * Action format: { text: string, onClick: (notificationId) => void }
 * The NotificationPopup renders action buttons and calls onClick on click.
 */
export function useToast() {
  /**
   * Show success notification
   */
  const showSuccess = (message: string, options: Omit<NotificationOptions, "message"> = {}): void => {
    const { actions, ...rest } = options;
    notify.success(message, {
      position: "top-right",
      ...rest,
      ...(actions ? { actions } : {}),
    });
  };

  /**
   * Show error notification
   */
  const showError = (message: string, options: Omit<NotificationOptions, "message"> = {}): void => {
    const { actions, ...rest } = options;
    notify.error(message, {
      position: "top-right",
      ...rest,
      ...(actions ? { actions } : {}),
    });
  };

  /**
   * Show folder notification
   */
  const showFolder = (message: string): void => {
    notify.info(message, {
      position: "top-right",
      icon: ["fas", "folder"],
    });
  };

  /**
   * Show info notification
   */
  const showInfo = (message: string, options: Omit<NotificationOptions, "message"> = {}): void => {
    const { actions, ...rest } = options;
    notify.info(message, {
      position: "top-right",
      ...rest,
      ...(actions ? { actions } : {}),
    });
  };

  /**
   * Show warning notification
   */
  const showWarning = (message: string, options: Omit<NotificationOptions, "message"> = {}): void => {
    const { actions, ...rest } = options;
    notify.warning(message, {
      position: "top-right",
      ...rest,
      ...(actions ? { actions } : {}),
    });
  };

  return {
    showSuccess,
    showError,
    showFolder,
    showInfo,
    showWarning,
  };
}
