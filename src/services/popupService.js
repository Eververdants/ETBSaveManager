import { createApp, h } from "vue";
import PromptPopup from "@/components/modal/PromptPopup.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

let popupApp = null;
let mountPoint = null;

// Release toggle - set to false to disable popup functionality
const ENABLE_POPUP = true;

export const showPopup = (options) => {
  // If popup functionality is disabled, return immediately
  if (!ENABLE_POPUP) {
    console.log("弹窗功能已禁用");
    return;
  }

  // If a popup already exists, unmount it first
  if (popupApp && mountPoint) {
    popupApp.unmount();
    document.body.removeChild(mountPoint);
  }

  // Create a new mount point
  mountPoint = document.createElement("div");
  document.body.appendChild(mountPoint);

  // Create app instance
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

  // Register Font Awesome component
  popupApp.component("FontAwesomeIcon", FontAwesomeIcon);

  // Mount the app
  popupApp.mount(mountPoint);
};

// Convenience methods
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
