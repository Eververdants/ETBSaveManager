import { createApp, h } from "vue";
import PromptPopup from "@/components/PromptPopup.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

let popupApp = null;
let mountPoint = null;

// 发行版开关 - 设置为false禁用弹窗功能
const ENABLE_POPUP = true;

export const showPopup = (options) => {
  // 如果弹窗功能被禁用，直接返回
  if (!ENABLE_POPUP) {
    console.log("弹窗功能已禁用");
    return;
  }

  // 如果已有弹窗，先卸载
  if (popupApp && mountPoint) {
    popupApp.unmount();
    document.body.removeChild(mountPoint);
  }

  // 创建新的挂载点
  mountPoint = document.createElement("div");
  document.body.appendChild(mountPoint);

  // 创建应用实例
  popupApp = createApp({
    render: () =>
      h(PromptPopup, {
        ...options,
        onClose: () => {
          if (popupApp && mountPoint) {
            popupApp.unmount();
            document.body.removeChild(mountPoint);
            popupApp = null;
            mountPoint = null;
          }
        },
      }),
  });

  // 注册Font Awesome组件
  popupApp.component("font-awesome-icon", FontAwesomeIcon);

  // 挂载应用
  popupApp.mount(mountPoint);
};

// 快捷方法
export const showSuccess = (message, options = {}) => {
  return showPopup({
    message,
    type: "success",
    icon: ["fas", "check-circle"],
    ...options,
  });
};

export const showError = (message, options = {}) => {
  return showPopup({
    message,
    type: "error",
    icon: ["fas", "times-circle"],
    ...options,
  });
};

export const showWarning = (message, options = {}) => {
  return showPopup({
    message,
    type: "warning",
    icon: ["fas", "exclamation-triangle"],
    ...options,
  });
};

export const showInfo = (message, options = {}) => {
  return showPopup({
    message,
    type: "info",
    icon: ["fas", "info-circle"],
    ...options,
  });
};
