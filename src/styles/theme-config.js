// 主题配置系统 - 支持用户自定义配色
export const themePresets = {
  // 苹果原生风格 (默认)
  apple: {
    light: {
      "--bg": "#f8f9fa",
      "--card-bg": "#ffffff",
      "--text": "#1c1c1e",
      "--primary": "#007aff",
      "--sidebar-bg": "rgba(240, 240, 245, 0.8)",
      "--sidebar-item-hover-bg": "rgba(220, 220, 225, 0.9)",
      "--sidebar-text-color": "#1c1c1e",
      "--sidebar-border-color": "rgba(210, 210, 215, 0.9)",
      "--sidebar-hover-bg": "rgba(220, 220, 225, 0.9)",
      "--sidebar-active-bg": "rgba(0, 122, 255, 0.1)",
      "--sidebar-active-color": "#007aff",
      "--sidebar-active-border": "rgba(0, 122, 255, 0.5)",
      "--sidebar-active-hover-bg": "rgba(0, 122, 255, 0.15)",
      "--titlebar-bg": "rgba(248, 249, 250, 0.8)",
      "--titlebar-border": "rgba(125, 125, 125, 0.3)",
      "--titlebar-button-hover": "rgba(255, 255, 255, 0.1)",
      "--scrollbar-track": "rgba(200, 200, 205, 0.3)",
      "--scrollbar-thumb": "rgba(180, 180, 185, 0.5)",
      "--scrollbar-thumb-hover": "rgba(160, 160, 165, 0.7)",
    },
    dark: {
      "--bg": "#1c1c1e",
      "--card-bg": "#2c2c2e",
      "--text": "#f5f5f7",
      "--primary": "#0a84ff",
      "--sidebar-bg": "rgba(40, 40, 45, 0.8)",
      "--sidebar-item-hover-bg": "rgba(70, 70, 75, 0.9)",
      "--sidebar-text-color": "#f5f5f7",
      "--sidebar-border-color": "rgba(80, 80, 85, 0.9)",
      "--sidebar-hover-bg": "rgba(70, 70, 75, 0.9)",
      "--sidebar-active-bg": "rgba(10, 132, 255, 0.1)",
      "--sidebar-active-color": "#0a84ff",
      "--sidebar-active-border": "rgba(10, 132, 255, 0.5)",
      "--sidebar-active-hover-bg": "rgba(10, 132, 255, 0.15)",
      "--titlebar-bg": "rgba(28, 28, 30, 0.8)",
      "--titlebar-border": "rgba(125, 125, 125, 0.3)",
      "--titlebar-button-hover": "rgba(255, 255, 255, 0.1)",
      "--scrollbar-track": "rgba(60, 60, 65, 0.3)",
      "--scrollbar-thumb": "rgba(100, 100, 105, 0.5)",
      "--scrollbar-thumb-hover": "rgba(120, 120, 125, 0.7)",
    },
  },

  // 深色模式
  dark: {
    light: {
      "--bg": "#1a1a1a",
      "--card-bg": "#2d2d2d",
      "--text": "#ffffff",
      "--primary": "#ff6b6b",
      "--sidebar-bg": "rgba(30, 30, 30, 0.9)",
      "--sidebar-item-hover-bg": "rgba(60, 60, 60, 0.9)",
      "--sidebar-text-color": "#ffffff",
      "--sidebar-border-color": "rgba(50, 50, 50, 0.9)",
      "--sidebar-hover-bg": "rgba(60, 60, 60, 0.9)",
      "--sidebar-active-bg": "rgba(255, 107, 107, 0.15)",
      "--sidebar-active-color": "#ff6b6b",
      "--sidebar-active-border": "rgba(255, 107, 107, 0.5)",
      "--sidebar-active-hover-bg": "rgba(255, 107, 107, 0.2)",
      "--titlebar-bg": "rgba(26, 26, 26, 0.9)",
      "--titlebar-border": "rgba(80, 80, 80, 0.3)",
      "--titlebar-button-hover": "rgba(255, 255, 255, 0.1)",
      "--scrollbar-track": "rgba(40, 40, 40, 0.3)",
      "--scrollbar-thumb": "rgba(80, 80, 80, 0.5)",
      "--scrollbar-thumb-hover": "rgba(100, 100, 100, 0.7)",
    },
    dark: {
      "--bg": "#0a0a0a",
      "--card-bg": "#1a1a1a",
      "--text": "#e0e0e0",
      "--primary": "#ff6b6b",
      "--sidebar-bg": "rgba(20, 20, 20, 0.9)",
      "--sidebar-item-hover-bg": "rgba(40, 40, 40, 0.9)",
      "--sidebar-text-color": "#e0e0e0",
      "--sidebar-border-color": "rgba(30, 30, 30, 0.9)",
      "--sidebar-hover-bg": "rgba(40, 40, 40, 0.9)",
      "--sidebar-active-bg": "rgba(255, 107, 107, 0.1)",
      "--sidebar-active-color": "#ff6b6b",
      "--sidebar-active-border": "rgba(255, 107, 107, 0.4)",
      "--sidebar-active-hover-bg": "rgba(255, 107, 107, 0.15)",
      "--titlebar-bg": "rgba(10, 10, 10, 0.9)",
      "--titlebar-border": "rgba(60, 60, 60, 0.3)",
      "--titlebar-button-hover": "rgba(255, 255, 255, 0.1)",
      "--scrollbar-track": "rgba(25, 25, 25, 0.3)",
      "--scrollbar-thumb": "rgba(60, 60, 60, 0.5)",
      "--scrollbar-thumb-hover": "rgba(80, 80, 80, 0.7)",
    },
  },

  // 莫兰迪风格
  morandi: {
    light: {
      "--bg": "#f5f2ed",
      "--card-bg": "#faf8f3",
      "--text": "#4a4a4a",
      "--primary": "#a8b5a0",
      "--sidebar-bg": "rgba(245, 242, 237, 0.9)",
      "--sidebar-item-hover-bg": "rgba(220, 225, 215, 0.9)",
      "--sidebar-text-color": "#4a4a4a",
      "--sidebar-border-color": "rgba(200, 205, 195, 0.9)",
      "--sidebar-hover-bg": "rgba(220, 225, 215, 0.9)",
      "--sidebar-active-bg": "rgba(168, 181, 160, 0.15)",
      "--sidebar-active-color": "#a8b5a0",
      "--sidebar-active-border": "rgba(168, 181, 160, 0.5)",
      "--sidebar-active-hover-bg": "rgba(168, 181, 160, 0.2)",
      "--titlebar-bg": "rgba(245, 242, 237, 0.9)",
      "--titlebar-border": "rgba(200, 205, 195, 0.3)",
      "--titlebar-button-hover": "rgba(255, 255, 255, 0.1)",
      "--scrollbar-track": "rgba(210, 215, 205, 0.3)",
      "--scrollbar-thumb": "rgba(190, 195, 185, 0.5)",
      "--scrollbar-thumb-hover": "rgba(170, 175, 165, 0.7)",
    },
    dark: {
      "--bg": "#2a2a2a",
      "--card-bg": "#3a3a3a",
      "--text": "#d0d0d0",
      "--primary": "#a8b5a0",
      "--sidebar-bg": "rgba(35, 35, 35, 0.9)",
      "--sidebar-item-hover-bg": "rgba(55, 60, 50, 0.9)",
      "--sidebar-text-color": "#d0d0d0",
      "--sidebar-border-color": "rgba(45, 50, 40, 0.9)",
      "--sidebar-hover-bg": "rgba(55, 60, 50, 0.9)",
      "--sidebar-active-bg": "rgba(168, 181, 160, 0.1)",
      "--sidebar-active-color": "#a8b5a0",
      "--sidebar-active-border": "rgba(168, 181, 160, 0.4)",
      "--sidebar-active-hover-bg": "rgba(168, 181, 160, 0.15)",
      "--titlebar-bg": "rgba(42, 42, 42, 0.9)",
      "--titlebar-border": "rgba(65, 70, 60, 0.3)",
      "--titlebar-button-hover": "rgba(255, 255, 255, 0.1)",
      "--scrollbar-track": "rgba(40, 45, 35, 0.3)",
      "--scrollbar-thumb": "rgba(65, 70, 60, 0.5)",
      "--scrollbar-thumb-hover": "rgba(85, 90, 80, 0.7)",
    },
  },
};

// 用户自定义主题存储
export const userThemeStorage = {
  save: (theme) => {
    localStorage.setItem("user-custom-theme", JSON.stringify(theme));
  },

  load: () => {
    const saved = localStorage.getItem("user-custom-theme");
    return saved ? JSON.parse(saved) : null;
  },

  clear: () => {
    localStorage.removeItem("user-custom-theme");
  },
};

// 主题应用工具
export const themeManager = {
  applyTheme: (theme, isDark = false) => {
    const root = document.documentElement;
    const themeColors = themePresets[theme] || themePresets.apple;
    const colors = isDark ? themeColors.dark : themeColors.light;

    Object.entries(colors).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  },

  applyCustomTheme: (customColors) => {
    const root = document.documentElement;
    Object.entries(customColors).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  },

  resetToSystem: () => {
    const root = document.documentElement;
    // 移除所有自定义样式，恢复CSS默认值
    Object.keys(themePresets.apple.light).forEach((property) => {
      root.style.removeProperty(property);
    });
  },
};

// 颜色验证工具
export const colorValidator = {
  isValidHex: (hex) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex),

  isValidRgba: (rgba) => /^rgba?\(([^)]+)\)$/.test(rgba),

  toRgba: (hex, alpha = 1) => {
    if (!colorValidator.isValidHex(hex)) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },
};

// 主题管理器 - 只做响应式更新，不做初始化
class ThemeManager {
  constructor() {
    // 从DOM获取当前主题，不再从localStorage初始化
    this.currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    this.init();
  }

  init() {
    // 不再初始化主题，只做必要的同步
    // 主题初始化已经在HTML的内联脚本中完成
    this.syncThemeState();
  }

  syncThemeState() {
    // 同步当前主题状态到DOM
    const actualTheme = document.documentElement.getAttribute('data-theme');
    if (actualTheme && actualTheme !== this.currentTheme) {
      this.currentTheme = actualTheme;
    }
  }

  setTheme(newTheme) {
    this.currentTheme = newTheme;
    try {
      localStorage.setItem("theme", newTheme);
    } catch (e) {
      // localStorage不可用时忽略错误
      console.warn('无法保存主题设置到localStorage:', e);
    }
    
    // 更新DOM主题属性
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // 确保主题初始化标记存在
    if (!document.documentElement.classList.contains('theme-initialized')) {
      document.documentElement.classList.add('theme-initialized');
    }
    
    // 强制触发主题背景更新
    this.forceBackgroundUpdate(newTheme);
  }

  forceBackgroundUpdate(theme) {
    // 强制更新html和body的背景色
    const root = document.documentElement;
    const body = document.body;
    
    if (theme === 'dark') {
      root.style.backgroundColor = '#1c1c1e';
      if (body) body.style.backgroundColor = '#1c1c1e';
    } else {
      root.style.backgroundColor = '#f8f9fa';
      if (body) body.style.backgroundColor = '#f8f9fa';
    }
    
    // 延迟移除内联样式，让CSS变量接管
    setTimeout(() => {
      root.style.backgroundColor = '';
      if (body) body.style.backgroundColor = '';
    }, 50);
  }

  // 获取当前主题，优先使用系统主题（如果用户未设置）
  getCurrentTheme() {
    return this.currentTheme;
  }

  // 获取系统主题偏好
  getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}

// 创建全局主题管理器实例
window.themeManager = new ThemeManager();

// 导出供其他模块使用
export default window.themeManager;
