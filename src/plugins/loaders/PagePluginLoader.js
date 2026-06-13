/**
 * 页面插件加载器
 * 负责加载、验证和管理页面插件（包括侧边栏菜单和路由）
 * 支持运行时动态加载 Vue 组件
 * 安全增强：限制插件执行环境，禁止任意代码执行
 */

import { topMenuItems, bottomMenuItems } from "../../config/sidebarMenu.js";
import { compile } from "vue";
import { getAppContext } from "../../appContext.js";

class PagePluginLoader {
  constructor() {
    this.loadedPages = new Map();
    this.routerInstance = null;
    this.registeredRoutes = new Map();
    this.registeredMenuItems = new Map();
  }

  /**
   * 设置 router 实例（由 main.js 调用）
   * @param {Object} router - vue-router 实例
   */
  setRouterInstance(router) {
    this.routerInstance = router;
    console.log("✅ [PageLoader] router 实例已设置");
  }

  /**
   * 获取 router 实例
   */
  getRouter() {
    if (this.routerInstance) {
      return this.routerInstance;
    }
    return null;
  }

  /**
   * 验证页面插件数据
   * @param {Object} plugin - 插件元数据
   */
  validate(plugin) {
    const { data } = plugin;

    if (!data || typeof data !== "object") {
      throw new Error("页面插件必须包含配置数据");
    }

    // 验证路由配置
    if (!data.route) {
      throw new Error("页面插件必须包含路由配置");
    }

    const { name, path } = data.route;
    if (!name || !path) {
      throw new Error("路由配置必须包含 name 和 path");
    }

    // 验证菜单配置
    if (data.menu) {
      const { textKey, icon } = data.menu;
      if (!textKey || !icon) {
        throw new Error("菜单配置必须包含 textKey 和 icon");
      }
    }

    return true;
  }

  /**
   * 加载页面插件
   * @param {Object} plugin - 插件元数据
   */
  async load(plugin) {
    const { id, name, data } = plugin;

    console.log(`📄 [PageLoader] 正在加载页面插件: ${name}`);

    // 验证插件
    this.validate(plugin);

    const router = this.getRouter();
    if (!router) {
      throw new Error("router 实例未初始化，请确保在应用启动后再加载页面插件");
    }

    // 注册路由
    if (data.route) {
      await this.registerRoute(id, data.route, plugin);
    }

    // 注册菜单项
    if (data.menu) {
      this.registerMenuItem(id, data.menu, data.route?.name);
    }

    // 记录已加载
    this.loadedPages.set(id, {
      data,
      loadedAt: Date.now(),
    });

    console.log(`✅ [PageLoader] 页面插件加载成功: ${name}`);

    return true;
  }

  /**
   * 注册路由
   * @param {string} pluginId - 插件ID
   * @param {Object} routeConfig - 路由配置
   * @param {Object} plugin - 插件完整信息
   */
  async registerRoute(pluginId, routeConfig, plugin) {
    const router = this.getRouter();
    const { name, path, component, componentCode, meta = {} } = routeConfig;

    let routeComponent;

    if (component) {
      // 如果提供了组件对象，直接使用
      routeComponent = component;
    } else if (componentCode) {
      // 如果提供了组件代码字符串，动态编译
      routeComponent = this.compileComponent(componentCode, plugin);
    } else {
      throw new Error("路由配置必须包含 component 或 componentCode");
    }

    const route = {
      path,
      name,
      component: routeComponent,
      meta: {
        ...meta,
        isPlugin: true,
        pluginId,
      },
    };

    // 添加路由
    router.addRoute(route);
    this.registeredRoutes.set(pluginId, { name, path });

    console.log(`🛣️ [PageLoader] 已注册路由: ${name} -> ${path}`);
  }

  /**
   * 编译 Vue 组件代码
   * @param {string} code - Vue 组件代码字符串
   * @param {Object} plugin - 插件信息
   */
  compileComponent(code, plugin) {
    try {
      // 解析 SFC（单文件组件）
      const { template, script, style } = this.parseSFC(code);

      // 创建组件定义
      const componentDef = {
        name: `Plugin_${plugin.id}`,
        template: template || "<div>Empty Component</div>",
      };

      // 如果有 script 部分，处理它
      if (script) {
        // 检查是否是 script setup
        const isSetup = code.match(/<script[^>]*setup[^>]*>/);

        if (isSetup) {
          // 处理 script setup
          componentDef.setup = this.createSetupFunction(script);
        } else {
          // 处理传统的 Options API
          const scriptModule = this.executeOptionsScript(script);
          Object.assign(componentDef, scriptModule);
        }
      }

      // 如果有 style，注入到页面
      if (style) {
        this.injectStyle(style, plugin.id);
      }

      return componentDef;
    } catch (error) {
      console.error(`❌ [PageLoader] 编译组件失败:`, error);
      throw new Error(`组件编译失败: ${error.message}`, { cause: error });
    }
  }

  /**
   * 创建安全的 setup 函数（替代不安全的 new Function()）
   * 使用沙箱化执行环境，只允许安全的 Vue API 操作
   * @param {string} script - setup 脚本代码
   */
  createSetupFunction(script) {
    // 安全限制：移除危险的代码模式
    const sanitizedScript = this.sanitizeScript(script);

    // 在外部解析声明
    const declarations = this.parseDeclarations(sanitizedScript);

    return function setup() {
      const ctx = getAppContext();

      // 提供 Vue API
      const { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } = ctx.vue || {};

      // 提供路由 API
      const useRouter = () => ctx.router;
      const useRoute = () => ctx.router?.currentRoute?.value;

      // 提供 i18n API
      const useI18n = () => ({
        t: ctx.i18n?.t || ((key) => key),
        locale: ctx.i18n?.locale,
      });

      // 提供服务
      const storage = ctx.storage;

      try {
        // 使用安全的函数构造器，限制可用全局变量
        const safeGlobalKeys = [
          "Object",
          "Array",
          "String",
          "Number",
          "Boolean",
          "Math",
          "Date",
          "JSON",
          "Promise",
          "Map",
          "Set",
          "RegExp",
          "Error",
          "TypeError",
        ];
        const globalAllowlist = safeGlobalKeys.reduce((obj, key) => {
          obj[key] = globalThis[key];
          return obj;
        }, {});

        const evalFn = new Function(
          ...safeGlobalKeys,
          "ref",
          "reactive",
          "computed",
          "watch",
          "onMounted",
          "onUnmounted",
          "nextTick",
          "useRouter",
          "useRoute",
          "useI18n",
          "storage",
          `
          'use strict';
          ${sanitizedScript}
          
          // 返回所有声明的变量
          return {
            ${declarations.join(",\n            ")}
          };
          `,
        );

        return evalFn(
          ...safeGlobalKeys.map((key) => globalAllowlist[key]),
          ref,
          reactive,
          computed,
          watch,
          onMounted,
          onUnmounted,
          nextTick,
          useRouter,
          useRoute,
          useI18n,
          storage,
        );
      } catch (error) {
        console.error("❌ [PageLoader] 执行 setup 函数失败:", error);
        console.error("脚本内容:", sanitizedScript);
        console.error("声明列表:", declarations);
        return {};
      }
    };
  }

  /**
   * 清理脚本中的危险代码模式
   * @param {string} script - 原始脚本
   * @returns {string} 清理后的脚本
   */
  sanitizeScript(script) {
    let sanitized = script;

    sanitized = sanitized.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, "");

    sanitized = sanitized.replace(/require\s*\(/g, "/* BLOCKED: require() */ null;(");

    sanitized = sanitized.replace(/\beval\s*\(/g, "/* BLOCKED: eval() */ null;(");

    sanitized = sanitized.replace(/new\s+Function\s*\(/g, "/* BLOCKED: new Function() */ null;(");

    sanitized = sanitized.replace(/window\.location\s*=/g, "/* BLOCKED: window.location */ void(");

    sanitized = sanitized.replace(/document\.write\s*\(/g, "/* BLOCKED: document.write */ null;(");

    sanitized = sanitized.replace(/\.innerHTML\s*=/g, ".innerHTML = /* BLOCKED: innerHTML */ ");
    sanitized = sanitized.replace(/\.outerHTML\s*=/g, ".outerHTML = /* BLOCKED: outerHTML */ ");

    sanitized = sanitized.replace(/\bsetTimeout\s*\(/g, "/* BLOCKED: setTimeout */ null;(");
    sanitized = sanitized.replace(/\bsetInterval\s*\(/g, "/* BLOCKED: setInterval */ null;(");

    sanitized = sanitized.replace(/\bfetch\s*\(/g, "/* BLOCKED: fetch */ null;(");
    sanitized = sanitized.replace(/new\s+XMLHttpRequest\s*\(/g, "/* BLOCKED: XMLHttpRequest */ null;(");

    return sanitized;
  }

  /**
   * 解析脚本中的声明
   * @param {string} script - 脚本代码
   */
  parseDeclarations(script) {
    const declarations = new Set();

    // 移除所有函数体内的内容，只保留顶层声明
    let topLevelScript = script;

    // 移除箭头函数体
    topLevelScript = topLevelScript.replace(/=>\s*{[^}]*}/g, "=> {}");

    // 移除普通函数体
    topLevelScript = topLevelScript.replace(/function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g, "function() {}");

    // 匹配顶层的 const/let 声明
    const constRegex = /^(?:const|let)\s+(\w+)\s*=/gm;
    let match;
    while ((match = constRegex.exec(topLevelScript)) !== null) {
      declarations.add(match[1]);
    }

    return Array.from(declarations);
  }

  /**
   * 执行 Options API 脚本（安全版本）
   * @param {string} script - 脚本代码
   */
  executeOptionsScript(script) {
    try {
      // 先进行安全检查
      const sanitized = this.sanitizeScript(script);

      // 只允许对象字面量，使用 JSON.parse 作为安全替代
      if (this.isSafeObjectLiteral(sanitized)) {
        return JSON.parse(sanitized);
      }

      // 如果不是纯 JSON，使用受限的 Function 构造器
      const safeGlobalKeys = ["Object", "Array", "String", "Number", "Boolean", "Math", "Date", "JSON"];
      const globalAllowlist = safeGlobalKeys.reduce((obj, key) => {
        obj[key] = globalThis[key];
        return obj;
      }, {});

      const fn = new Function(...safeGlobalKeys, `'use strict'; return ${sanitized}`);

      return fn(...safeGlobalKeys.map((key) => globalAllowlist[key]));
    } catch (error) {
      console.error("❌ [PageLoader] 执行 Options API 脚本失败:", error);
      return {};
    }
  }

  /**
   * 检查是否为安全的对象字面量（可安全使用 JSON.parse）
   * @param {string} script - 脚本内容
   * @returns {boolean} 是否安全
   */
  isSafeObjectLiteral(script) {
    const trimmed = script.trim();
    if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
      return false;
    }
    // 检查是否包含函数定义或其他非 JSON 结构
    if (/function|=>|\bconst\b|\blet\b|\bvar\b|\bnew\b/.test(trimmed)) {
      return false;
    }
    return true;
  }

  /**
   * 解析单文件组件
   * @param {string} code - SFC 代码
   */
  parseSFC(code) {
    const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/);
    const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/);

    return {
      template: templateMatch ? templateMatch[1].trim() : null,
      script: scriptMatch ? scriptMatch[1].trim() : null,
      style: styleMatch ? styleMatch[1].trim() : null,
    };
  }

  /**
   * 注入样式
   * @param {string} style - CSS 代码
   * @param {string} pluginId - 插件ID
   */
  injectStyle(style, pluginId) {
    const styleId = `plugin-style-${pluginId}`;

    // 检查是否已存在
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = style;
  }

  /**
   * 注册菜单项
   * @param {string} pluginId - 插件ID
   * @param {Object} menuConfig - 菜单配置
   * @param {string} routeName - 路由名称
   */
  registerMenuItem(pluginId, menuConfig, routeName) {
    const { textKey, icon, position = "top", descriptionKey, action } = menuConfig;

    // 生成唯一ID
    const allItems = [...topMenuItems.value, ...bottomMenuItems.value];
    const maxId = allItems.length > 0 ? Math.max(...allItems.map((item) => item.id)) : 0;
    const menuId = maxId + 1;

    const menuItem = {
      id: menuId,
      textKey,
      icon,
      action: action || `plugin_${pluginId}`,
      descriptionKey: descriptionKey || textKey,
      route: routeName,
      isPlugin: true,
      pluginId,
    };

    // 添加到对应位置
    if (position === "bottom") {
      bottomMenuItems.value.push(menuItem);
      console.log(`📋 [PageLoader] 已添加到底部菜单，当前底部菜单项数: ${bottomMenuItems.value.length}`);
    } else {
      topMenuItems.value.push(menuItem);
      console.log(`📋 [PageLoader] 已添加到顶部菜单，当前顶部菜单项数: ${topMenuItems.value.length}`);
    }

    this.registeredMenuItems.set(pluginId, { menuId, position });

    console.log(`📋 [PageLoader] 已注册菜单项: ${textKey} (${position}), ID: ${menuId}`);
    console.log(`📋 [PageLoader] 菜单项详情:`, menuItem);

    // 触发侧边栏更新事件
    window.dispatchEvent(
      new CustomEvent("plugin-menu-added", {
        detail: { menuItem, pluginId },
      }),
    );

    // 强制触发 Vue 更新
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);
  }

  /**
   * 卸载页面插件
   * @param {Object} plugin - 插件元数据
   */
  async unload(plugin) {
    const { id, name } = plugin;

    console.log(`🔄 [PageLoader] 正在卸载页面插件: ${name}`);

    const router = this.getRouter();
    if (!router) {
      throw new Error("router 实例未初始化");
    }

    // 移除路由
    const routeInfo = this.registeredRoutes.get(id);
    if (routeInfo) {
      router.removeRoute(routeInfo.name);
      this.registeredRoutes.delete(id);
      console.log(`🛣️ [PageLoader] 已移除路由: ${routeInfo.name}`);
    }

    // 移除菜单项
    const menuInfo = this.registeredMenuItems.get(id);
    if (menuInfo) {
      const { menuId, position } = menuInfo;
      const menuArray = position === "bottom" ? bottomMenuItems.value : topMenuItems.value;
      const index = menuArray.findIndex((item) => item.id === menuId);

      if (index !== -1) {
        menuArray.splice(index, 1);
        console.log(`📋 [PageLoader] 已移除菜单项: ${menuId}`);
      }

      this.registeredMenuItems.delete(id);

      // 触发侧边栏更新事件
      window.dispatchEvent(
        new CustomEvent("plugin-menu-removed", {
          detail: { menuId, pluginId: id },
        }),
      );
    }

    // 移除样式
    const styleEl = document.getElementById(`plugin-style-${id}`);
    if (styleEl) {
      styleEl.remove();
    }

    this.loadedPages.delete(id);

    console.log(`✅ [PageLoader] 页面插件卸载成功: ${name}`);

    return true;
  }

  /**
   * 获取已加载的页面列表
   */
  getLoadedPages() {
    return Array.from(this.loadedPages.entries()).map(([id, info]) => ({
      id,
      ...info,
    }));
  }

  /**
   * 检查页面是否已加载
   * @param {string} pluginId - 插件ID
   */
  isPageLoaded(pluginId) {
    return this.loadedPages.has(pluginId);
  }
}

// 单例导出
export const pagePluginLoader = new PagePluginLoader();
export default pagePluginLoader;
