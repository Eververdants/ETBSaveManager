/**
 * 控制台日志转发器
 * 将前端 console 输出转发到 Tauri 后端控制台
 */

let isInitialized = false;

/**
 * 初始化控制台转发
 * 拦截 console.log/warn/error/info/debug，转发到后端
 */
export function initConsoleForwarder() {
  if (isInitialized) return;
  isInitialized = true;

  // 保存原始方法
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;
  const originalDebug = console.debug;

  // 格式化参数为字符串
  const formatArgs = (args) => {
    return args
      .map((arg) => {
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
  };

  // 异步发送日志到后端
  const sendToBackend = async (level, message) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("add_backend_log", { level, message });
    } catch {
      // 静默失败，避免循环
    }
  };

  // 重写 console 方法
  console.log = (...args) => {
    originalLog.apply(console, args);
    sendToBackend("info", formatArgs(args));
  };

  console.warn = (...args) => {
    originalWarn.apply(console, args);
    sendToBackend("warn", formatArgs(args));
  };

  console.error = (...args) => {
    originalError.apply(console, args);
    sendToBackend("error", formatArgs(args));
  };

  console.info = (...args) => {
    originalInfo.apply(console, args);
    sendToBackend("info", formatArgs(args));
  };

  console.debug = (...args) => {
    originalDebug.apply(console, args);
    sendToBackend("debug", formatArgs(args));
  };

  // 捕获未处理的错误
  window.addEventListener("error", (event) => {
    const message = `Uncaught Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
    sendToBackend("error", message);
  });

  // 捕获未处理的 Promise 拒绝
  window.addEventListener("unhandledrejection", (event) => {
    const message = `Unhandled Promise Rejection: ${event.reason}`;
    sendToBackend("error", message);
  });

  console.log("[ConsoleForwarder] 已初始化，前端日志将转发到后端控制台");
}
