import { createApp, h } from 'vue';
import PromptPopup from '@/components/PromptPopup.vue';
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

let popupInstance = null;

// 发行版开关 - 设置为false禁用弹窗功能
const ENABLE_POPUP = false;

export const showPopup = (options) => {
  // 如果弹窗功能被禁用，直接返回
  if (!ENABLE_POPUP) {
    console.log('弹窗功能已禁用');
    return;
  }
  
  if (popupInstance) {
    popupInstance.unmount();
  }

  const mountPoint = document.createElement('div');
  document.body.appendChild(mountPoint);

  const app = createApp({
    render: () => h(PromptPopup, {
      ...options,
      onClose: () => {
        app.unmount();
        document.body.removeChild(mountPoint);
        popupInstance = null;
      },
    }),
  });
  
  // 注册Font Awesome组件
  app.component('font-awesome-icon', FontAwesomeIcon);

  popupInstance = app.mount(mountPoint);
};

// 快捷方法
export const showSuccess = (message, options = {}) => {
  return showPopup({
    message,
    type: 'success',
    icon: ['fas', 'check-circle'],
    ...options
  });
};

export const showError = (message, options = {}) => {
  return showPopup({
    message,
    type: 'error',
    icon: ['fas', 'times-circle'],
    ...options
  });
};

export const showWarning = (message, options = {}) => {
  return showPopup({
    message,
    type: 'warning',
    icon: ['fas', 'exclamation-triangle'],
    ...options
  });
};

export const showInfo = (message, options = {}) => {
  return showPopup({
    message,
    type: 'info',
    icon: ['fas', 'info-circle'],
    ...options
  });
};