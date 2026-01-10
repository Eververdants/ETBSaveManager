import { notify } from "../services/notificationService";

/**
 * Toast 通知 composable
 * 现在使用统一的八向通知服务
 */
export function useToast() {
  /**
   * 显示成功提示
   */
  const showSuccess = (message, icon = "✓") => {
    notify.success(message, { position: 'top-right' });
  };

  /**
   * 显示错误提示
   */
  const showError = (message, icon = "✗") => {
    notify.error(message, { position: 'top-right' });
  };

  /**
   * 显示文件夹提示
   */
  const showFolder = (message, icon = "📁") => {
    notify.info(message, { 
      position: 'top-right',
      icon: ['fas', 'folder']
    });
  };

  /**
   * 显示信息提示
   */
  const showInfo = (message, icon = "ℹ️") => {
    notify.info(message, { position: 'top-right' });
  };

  /**
   * 显示警告提示
   */
  const showWarning = (message, icon = "⚠️") => {
    notify.warning(message, { position: 'top-right' });
  };

  return {
    showSuccess,
    showError,
    showFolder,
    showInfo,
    showWarning,
  };
}
