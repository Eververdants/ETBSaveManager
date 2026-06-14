/**
 * Polyfills - 确保关键 API 可用
 */

interface IdleDeadline {
  didTimeout: boolean;
  timeRemaining: () => number;
}

interface Window {
  requestIdleCallback: (callback: (deadline: IdleDeadline) => void, options?: { timeout?: number }) => number;
  cancelIdleCallback: (id: number) => void;
}

// requestIdleCallback polyfill
if (typeof window !== "undefined" && !window.requestIdleCallback) {
  window.requestIdleCallback = (callback: (deadline: IdleDeadline) => void, options?: { timeout?: number }): number => {
    const timeout = options?.timeout || 50;
    const start = Date.now();

    return setTimeout(
      () => {
        callback({
          didTimeout: false,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
        });
      },
      Math.min(timeout, 1),
    );
  };

  window.cancelIdleCallback = (id: number): void => {
    clearTimeout(id);
  };
}

export {};
