import { createApp, h } from "vue";
import PromptPopup from "@/components/modal/PromptPopup.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import type { PopupOptions } from "@/types/ui";

type PopupApp = ReturnType<typeof createApp>;

interface ActivePopup {
  app: PopupApp;
  el: HTMLDivElement;
  onClose: (() => void) | null;
  /** Guard so a user onClose callback can never fire more than once. */
  settled: boolean;
}

let activePopup: ActivePopup | null = null;

// Release toggle - set to false to disable popup functionality
const ENABLE_POPUP = true;

/** Fire a popup's onClose exactly once, even if close is signalled twice
 * (e.g. an auto-close leave animation completing after a manual close). */
const fireOnClose = (popup: ActivePopup): void => {
  if (popup.settled) return;
  popup.settled = true;
  if (popup.onClose) {
    try {
      popup.onClose();
    } catch (e) {
      console.warn("[PopupService] onClose threw:", e);
    }
  }
};

export const showPopup = (options: PopupOptions): void => {
  // If popup functionality is disabled, return immediately
  if (!ENABLE_POPUP) {
    console.info("弹窗功能已禁用");
    return;
  }

  // If a popup already exists, fire its onClose before replacing it —
  // state that depends on onClose (e.g. focus restoration) must not be skipped.
  const previous = activePopup;
  if (previous) {
    activePopup = null;
    fireOnClose(previous);
    previous.app.unmount();
    previous.el.remove();
  }

  // Each popup gets its own identity, so a stale close signal from a replaced
  // popup can never tear down (or fire callbacks of) the popup that replaced it.
  const popup: ActivePopup = { app: null as unknown as PopupApp, el: null as unknown as HTMLDivElement, onClose: options.onClose ?? null, settled: false };

  // Create a new mount point
  const el = document.createElement("div");
  document.body.appendChild(el);
  popup.el = el;

  // Create app instance
  const app = createApp({
    render: () =>
      h(PromptPopup, {
        ...options,
        onClose: () => {
          fireOnClose(popup);
          // Only tear down while this instance is still the live popup.
          if (activePopup === popup) {
            activePopup = null;
            app.unmount();
            el.remove();
          }
        },
      }),
  });

  // Register Font Awesome component
  app.component("FontAwesomeIcon", FontAwesomeIcon);
  popup.app = app;
  activePopup = popup;

  // Mount the app
  app.mount(el);
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
