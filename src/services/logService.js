// 前端日志服务
class LogService {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.isVisible = false;
    this.clickCount = 0;
    this.clickTimeout = null;
    
    // 重写console方法以捕获日志
    this.hijackConsole();
  }

  hijackConsole() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    console.log = (...args) => {
      this.addLog('log', args);
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      this.addLog('error', args);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      this.addLog('warn', args);
      originalWarn.apply(console, args);
    };

    console.info = (...args) => {
      this.addLog('info', args);
      originalInfo.apply(console, args);
    };
  }

  addLog(type, args) {
    const timestamp = new Date().toLocaleTimeString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          // 使用自定义序列化器处理可能的循环引用
          const seen = new WeakSet();
          return JSON.stringify(arg, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) {
                return '[Circular]';
              }
              seen.add(value);
            }
            // 处理特殊对象
            if (value && typeof value === 'object' && value.constructor) {
              const constructorName = value.constructor.name;
              if (constructorName === 'ComputedRefImpl' || 
                  constructorName === 'RefImpl' || 
                  constructorName === 'ReactiveEffect') {
                return `[${constructorName}]`;
              }
            }
            return value;
          }, 2);
        } catch (error) {
          return `[Object: ${Object.prototype.toString.call(arg)}]`;
        }
      }
      return String(arg);
    }).join(' ');

    this.logs.push({
      id: Date.now() + Math.random(),
      type,
      message,
      timestamp,
      date: new Date()
    });

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs); // 保留最后的maxLogs条日志
    }

    // 触发更新事件
    this.emitUpdate();
  }

  getLogs(type = null) {
    if (type) {
      return this.logs.filter(log => log.type === type);
    }
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

  // 触发器相关
  handleIconClick() {
    this.clickCount++;
    
    // 重置计数器
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
    }
    
    this.clickTimeout = setTimeout(() => {
      this.clickCount = 0;
    }, 2000);

    if (this.clickCount === 5) {
      this.toggleVisibility();
      this.clickCount = 0;
      
      // 显示提示
      if (this.isVisible) {
        console.log('📝 日志面板已开启');
      } else {
        console.log('📝 日志面板已隐藏');
      }
    }
  }

  emitUpdate() {
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('logs-updated', {
        detail: {
          logs: this.getLogs(),
          isVisible: this.isVisible
        }
      }));
    }
  }

  // 导出日志为文件
  exportLogs() {
    const content = this.logs
      .map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`)
      .join('\n');
    
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ETBSaveManager-logs-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a); // 添加到DOM以确保兼容性
      a.click();
      document.body.removeChild(a); // 清理
      URL.revokeObjectURL(url);
      
      console.log('✅ 日志已导出到下载文件夹');
    } catch (error) {
      console.error('❌ 导出日志失败:', error);
    }
  }
}

// 创建全局实例
export const logService = new LogService();

// Vue插件
export default {
  install(app) {
    app.config.globalProperties.$logService = logService;
    app.provide('logService', logService);
  }
};