/**
 * CDN configuration file
 * Used to optimize loading of third-party dependencies
 */

interface CDNLibraryVersions {
  [library: string]: string;
}

interface CDNLibraryConfig {
  baseUrl: string;
  versions: CDNLibraryVersions;
}

interface ProductionConfig {
  [resourceType: string]: CDNLibraryConfig;
}

interface DevelopmentConfig {
  useLocal: boolean;
  localPaths: {
    [key: string]: string;
  };
}

interface CDNConfig {
  production: ProductionConfig;
  development: DevelopmentConfig;
}

const CDN_CONFIG: CDNConfig = {
  // Use CDN in production, local dependencies in development
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

  // Development environment configuration
  development: {
    useLocal: true,
    localPaths: {
      fontawesome: "@/assets/icons/fontawesome",
      vue: "vue",
      chartjs: "chart.js",
    },
  },
};

// Utility function for dynamically loading CDN resources
export const loadCDNResource = async (
  resourceType: string,
  library: string,
  version: string
): Promise<boolean | null> => {
  if (import.meta.env.DEV) {
    return null; // CDN not used in development
  }

  const config = CDN_CONFIG.production[resourceType];
  if (!config) {
    console.warn(`CDN config not found: ${resourceType}`);
    return null;
  }

  try {
    const url = `${config.baseUrl}@${config.versions[library]}/dist/${library}.min.js`;
    await loadScript(url);
    console.log(`✅ CDN resource loaded successfully: ${library}`);
    return true;
  } catch (error) {
    console.error(`❌ CDN resource failed to load: ${library}`, error);
    return false;
  }
};

// Utility function for dynamically loading script tags
const loadScript = (src: string): Promise<void> => {
  return new Promise<void>((resolve: () => void, reject: (err: Error) => void) => {
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

// Preload critical CDN resources
export const preloadCriticalCDNResources = async (): Promise<void> => {
  if (import.meta.env.DEV) return;

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
    console.warn("Some CDN resources failed to load, but application startup is not affected");
  }
};

// Check if CDN resources are available
export const checkCDNAvailability = (): Record<string, boolean> => {
  const checks: Record<string, () => boolean> = {
    fontawesome: () => !!(window as unknown as Record<string, unknown>).FontAwesomeIcon,
  };

  const results: Record<string, boolean> = {};

  (Object.entries(checks) as Array<[string, () => boolean]>).forEach(([name, checkFn]) => {
    try {
      results[name] = checkFn();
    } catch (error) {
      results[name] = false;
    }
  });

  return results;
};

export default CDN_CONFIG;
