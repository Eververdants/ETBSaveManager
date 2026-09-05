import { createApp, h } from "vue";
import PromptPopup from "@/components/modal/PromptPopup.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import type { PopupOptions } from "@/types/ui";

let popupApp: ReturnType<typeof createApp> | null = null;
let mountPoint: HTMLDivElement | null = null;
let currentOnClose: (() => void) | null = null;

// Release toggle - set to false to disable popup functionality
const ENABLE_POPUP = true;

export const showPopup = (options: PopupOptions): void => {
  // If popup functionality is disabled, return immediately
  if (!ENABLE_POPUP) {
    console.info("弹窗功能已禁用");
    return;
  }

  // If a popup already exists, fire its onClose before replacing it —
  // state that depends on onClose (e.g. focus restoration) must not be skipped.
  if (popupApp && mountPoint) {
    if (currentOnClose) {
      const close = currentOnClose;
      currentOnClose = null;
      try {
        close();
      } catch (e) {
        console.warn("[PopupService] previous onClose threw:", e);
      }
    }
    popupApp.unmount();
    document.body.removeChild(mountPoint);
  }

  // Create a new mount point
  mountPoint = document.createElement("div");
  document.body.appendChild(mountPoint);

  // Track the user's onClose so we can call it if this popup is replaced
  currentOnClose = options.onClose ?? null;

  // Create app instance
  popupApp = createApp({
    render: () =>
      h(PromptPopup, {
        ...options,
        onClose: () => {
          currentOnClose = null;
          if (options.onClose) {
            try {
              options.onClose();
            } catch (e) {
              console.warn("[PopupService] onClose threw:", e);
            }
          }
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
export const showSuccess = (message: string, options: Partial<PopupOptions> = {}): void => {
  showPopup({
    message,
    type: "success",
    icon: ["fas", "check-circle"],
    ...options,
  });
};

export const showError = (message: string, options: Partial<PopupOptions> = {}): void => {
  showPopup({
    message,
    type: "error",
    icon: ["fas", "times-circle"],
    ...options,
  });
};

export const showWarning = (message: string, options: Partial<PopupOptions> = {}): void => {
  showPopup({
    message,
    type: "warning",
    icon: ["fas", "exclamation-triangle"],
    ...options,
  });
};

export const showInfo = (message: string, options: Partial<PopupOptions> = {}): void => {
  showPopup({
    message,
    type: "info",
    icon: ["fas", "info-circle"],
    ...options,
  });
};
