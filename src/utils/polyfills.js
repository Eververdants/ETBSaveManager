/**
 * Polyfills - 确保关键 API 可用
 */

// requestIdleCallback polyfill
if (typeof window !== 'undefined' && !window.requestIdleCallback) {
  window.requestIdleCallback = (callback, options) => {
    const timeout = options?.timeout || 50;
    const start = Date.now();
    
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      });
    }, Math.min(timeout, 1));
  };
  
  window.cancelIdleCallback = (id) => {
    clearTimeout(id);
  };
}

export {};
