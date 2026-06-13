/**
 * Frontend log service
 * Captures console output and window errors for debug panel and feedback system
 */

class LogService {
  constructor() {
    this.logs = [];
    this.maxLogs = import.meta.env.PROD ? 200 : 1000;
    this.isVisible = false;
    this.clickCount = 0;
    this.clickTimeout = null;
    this._consoleHijacked = false;
    this._windowErrorHandlersAdded = false;

    this.hijackConsole();
    this.captureWindowErrors();
  }

  /**
   * Override console methods to capture logs while preserving original behavior
   */
  hijackConsole() {
    if (this._consoleHijacked) return;

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    console.log = (...args) => {
      this.addLog("log", args);
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      this.addLog("error", args);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      this.addLog("warn", args);
      originalWarn.apply(console, args);
    };

    console.info = (...args) => {
      this.addLog("info", args);
      originalInfo.apply(console, args);
    };

    this._consoleHijacked = true;
  }

  /**
   * Capture uncaught window errors and unhandled promise rejections
   */
  captureWindowErrors() {
    if (this._windowErrorHandlersAdded) return;

    window.addEventListener("error", (event) => {
      const message = event.message || "Unknown error";
      const source = event.filename ? ` at ${event.filename}:${event.lineno}:${event.colno}` : "";
      this.addLog("error", [`[Uncaught]${source} ${message}`]);
    });

    window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      this.addLog("error", [`[Unhandled Promise] ${message}`]);
    });

    this._windowErrorHandlersAdded = true;
  }

  /**
   * Serialize arguments to a single message string
   */
  _serializeArgs(args) {
    return args
      .map((arg) => {
        if (typeof arg === "object" && arg !== null) {
          try {
            const seen = new WeakSet();
            return JSON.stringify(
              arg,
              (key, value) => {
                if (typeof value === "object" && value !== null) {
                  if (seen.has(value)) return "[Circular]";
                  seen.add(value);
                }
                if (value?.constructor?.name) {
                  const name = value.constructor.name;
                  if (["ComputedRefImpl", "RefImpl", "ReactiveEffect"].includes(name)) {
                    return `[${name}]`;
                  }
                }
                return value;
              },
              2,
            );
          } catch {
            return `[Object: ${Object.prototype.toString.call(arg)}]`;
          }
        }
        return String(arg);
      })
      .join(" ");
  }

  /**
   * Add a log entry
   */
  addLog(type, args) {
    this.logs.push({
      id: Date.now() + Math.random(),
      type,
      message: this._serializeArgs(args),
      timestamp: new Date().toLocaleTimeString(),
      date: new Date(),
    });

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.emitUpdate();
  }

  getLogs(type = null) {
    if (type) return this.logs.filter((log) => log.type === type);
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    this.emitUpdate();
  }

  toggleVisibility() {
    this.isVisible = !this.isVisible;
    this.emitUpdate();
  }

  setVisibility(visible) {
    this.isVisible = visible;
    this.emitUpdate();
  }

  /**
   * Secret 5-click trigger to show/hide log panel
   */
  handleIconClick() {
    this.clickCount++;

    if (this.clickTimeout) clearTimeout(this.clickTimeout);
    this.clickTimeout = setTimeout(() => {
      this.clickCount = 0;
    }, 2000);

    if (this.clickCount === 5) {
      this.toggleVisibility();
      this.clickCount = 0;
      console.log(this.isVisible ? "Log panel opened" : "Log panel hidden");
    }
  }

  emitUpdate() {
    if (window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent("logs-updated", {
          detail: { logs: this.getLogs(), isVisible: this.isVisible },
        }),
      );
    }
  }

  /**
   * Export logs to a downloadable .txt file
   */
  exportLogs() {
    const content = this.logs.map((log) => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`).join("\n");

    try {
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ETBSaveManager-logs-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log("Logs exported to downloads folder");
    } catch (error) {
      console.error("Failed to export logs:", error);
    }
  }

  /**
   * Get recent logs as formatted text (for feedback system)
   */
  getRecentLogs(count = 100) {
    return this.logs
      .slice(-count)
      .map((log) => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`)
      .join("\n");
  }

  /**
   * Get recent logs as structured array (for feedback system)
   */
  getRecentLogsArray(count = 100) {
    return this.logs.slice(-count).map((log) => ({
      timestamp: log.timestamp,
      type: log.type,
      message: log.message,
    }));
  }
}

export const logService = new LogService();

export default {
  install(app) {
    app.config.globalProperties.$logService = logService;
    app.provide("logService", logService);
  },
};
