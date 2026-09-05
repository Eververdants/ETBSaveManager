/**
 * UI types
 * Shared types for toasts, popups, notifications, menus, and animations.
 */

/** Sidebar menu item configuration */
export interface MenuConfig {
  id: number;
  textKey: string;
  icon: [string, string];
  action: string;
  descriptionKey: string;
  route: string;
}

/** Toast notification options */
export interface ToastOptions {
  actions?: Array<{ text: string; onClick: (id: string) => void }>;
  position?: string;
  duration?: number;
  icon?: [string, string];
  type?: string;
}

/** Popup dialog options */
export interface PopupOptions {
  message: string;
  type?: string;
  icon?: [string, string];
  title?: string;
  direction?: string;
  duration?: number;
  maxWidth?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

/** Notification popup options */
export interface NotificationOptions {
  message: string;
  type?: string;
  position?: string;
  duration?: number;
  icon?: [string, string];
  actions?: Array<{ text: string; onClick: (id: string) => void }>;
  onClose?: (id: string) => void;
}

/** Animation parameters for GSAP */
export interface AnimationParams {
  duration: number;
  ease: string;
  delay: number;
  force3D: boolean;
  stagger?: number;
}

/** Log entry for the logging service */
export interface LogEntry {
  id: number;
  type: "log" | "error" | "warn" | "info";
  message: string;
  timestamp: string;
  date: Date;
}

/** Undo action for the undo/redo composable */
export interface UndoAction {
  description: string;
  undo: () => Promise<void>;
  redo?: () => Promise<void>;
}

/** Type for vue-i18n translation function */
export type TranslateFn = (key: string, ...args: unknown[]) => string;
