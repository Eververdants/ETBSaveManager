/**
 * Console forwarder — sends log messages to the Tauri backend.
 *
 * This module is a UTILITY, not a console hijacker. The actual console
 * override lives in logService.ts, which calls sendToBackend() here.
 * This avoids double-hijacking when both modules are initialized.
 */

// 格式化参数为字符串
function formatArgs(args: unknown[]): string {
  return args
    .map((arg: unknown) => {
      if (arg === null) return "null";
      if (arg === undefined) return "undefined";
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}\n${arg.stack || ""}`;
      }
      if (typeof arg === "object") {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(" ");
}

/**
 * Asynchronously send a log message to the Tauri backend.
 * Called by logService after it captures console output.
 */
export async function sendToBackend(level: string, args: readonly unknown[]): Promise<void> {
  try {
    const message = formatArgs([...args]);
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("add_backend_log", { level, message });
  } catch {
    // 静默失败，避免循环
  }
}

let listenersAdded = false;

/**
 * Install global error listeners (window.error + unhandledrejection)
 * that forward to the backend. Safe to call once.
 */
export function initConsoleForwarder(): void {
  if (listenersAdded) return;
  listenersAdded = true;

  // 捕获未处理的错误
  window.addEventListener("error", (event: ErrorEvent) => {
    const message = `Uncaught Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
    sendToBackend("error", [message]);
  });

  // 捕获未处理的 Promise 拒绝
  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    const message = `Unhandled Promise Rejection: ${event.reason}`;
    sendToBackend("error", [message]);
  });
}
