import { notify } from "../services/notificationService";

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
   * @param {string} message
   * @param {Object} [options]
   * @param {Array<{text:string, onClick:Function}>} [options.actions] - Action buttons
   * @param {string} [options.position] - Notification position
   * @param {number} [options.duration] - Auto-close duration in ms (default: 4000)
   */
  const showSuccess = (message, options = {}) => {
    const { actions, ...rest } = options;
    notify.success(message, {
      position: "top-right",
      ...rest,
      ...(actions ? { actions } : {}),
    });
  };

  /**
   * Show error notification
   * @param {string} message
   * @param {Object} [options]
   */
  const showError = (message, options = {}) => {
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
  const showFolder = (message) => {
    notify.info(message, {
      position: "top-right",
      icon: ["fas", "folder"],
    });
  };

  /**
   * Show info notification
   */
  const showInfo = (message, options = {}) => {
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
  const showWarning = (message, options = {}) => {
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
