/**
 * CDN配置文件
 * 用于优化第三方依赖的加载
 */

const CDN_CONFIG = {
  // 生产环境使用CDN，开发环境使用本地依赖
  production: {
    fontawesome: {
      baseUrl: "https://cdn.jsdelivr.net/npm/@fortawesome",
      versions: {
        "free-solid-svg-icons": "^7.1.0",
        "free-brands-svg-icons": "^7.1.0",
        "fontawesome-svg-core": "^7.1.0",
      },
    },
    vue: {
      baseUrl: "https://unpkg.com",
      versions: {
        vue: "^3.5.13",
        "vue-router": "^4.5.1",
      },
    },
  },

  // 开发环境配置
  development: {
    useLocal: true,
    localPaths: {
      fontawesome: "@/assets/icons/fontawesome",
      vue: "vue",
      chartjs: "chart.js",
    },
  },
};

// 动态加载CDN资源的工具函数
export const loadCDNResource = async (resourceType, library, version) => {
  if (process.env.NODE_ENV === "development") {
    return null; // 开发环境不使用CDN
  }

  const config = CDN_CONFIG.production[resourceType];
  if (!config) {
    console.warn(`CDN配置未找到: ${resourceType}`);
    return null;
  }

  try {
    const url = `${config.baseUrl}@${config.versions[library]}/dist/${library}.min.js`;
    await loadScript(url);
    console.log(`✅ CDN资源加载成功: ${library}`);
    return true;
  } catch (error) {
    console.error(`❌ CDN资源加载失败: ${library}`, error);
    return false;
  }
};

// 动态加载Script标签的工具函数
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  });
};

// 预加载关键CDN资源
export const preloadCriticalCDNResources = async () => {
  if (process.env.NODE_ENV === "development") return;

  const criticalResources = [
    { type: "fontawesome", library: "fontawesome-svg-core" },
    { type: "vue", library: "vue" },
  ];

  const loadPromises = criticalResources.map(({ type, library }) => {
    const config = CDN_CONFIG.production[type];
    if (config && config.versions[library]) {
      return loadCDNResource(type, library, config.versions[library]);
    }
    return Promise.resolve(false);
  });

  try {
    await Promise.allSettled(loadPromises);
  } catch (error) {
    console.warn("部分CDN资源加载失败，但不影响应用启动");
  }
};

// 检查CDN资源是否可用
export const checkCDNAvailability = () => {
  const checks = {
    fontawesome: () => !!window.FontAwesomeIcon,
  };

  const results = {};

  Object.entries(checks).forEach(([name, checkFn]) => {
    try {
      results[name] = checkFn();
    } catch (error) {
      results[name] = false;
    }
  });

  return results;
};

export default CDN_CONFIG;
