/**
 * 语言插件加载器
 * 负责加载、验证和管理语言插件
 */

import storage from "../../services/storageService";

// 语言插件必需的字段（用于验证翻译完整性）
const REQUIRED_FIELDS = ["common", "sidebar", "settings"];

class LanguagePluginLoader {
  constructor() {
    this.loadedLanguages = new Map();
    this.originalMessages = new Map();
    this.i18nInstance = null;
  }

  /**
   * 设置 i18n 实例（由 main.js 调用）
   * @param {Object} i18n - vue-i18n 实例
   */
  setI18nInstance(i18n) {
    this.i18nInstance = i18n;
    console.log("✅ [LanguageLoader] i18n 实例已设置");
  }

  /**
   * 获取 i18n 实例
   */
  getI18n() {
    // 优先使用设置的实例，其次尝试从 window 获取
    if (this.i18nInstance) {
      return this.i18nInstance;
    }
    if (window.$i18n) {
      return { global: window.$i18n };
    }
    return null;
  }

  /**
   * 验证语言插件数据
   * @param {Object} plugin - 插件元数据
   */
  validate(plugin) {
    const { data, locale } = plugin;

    if (!locale) {
      throw new Error("语言插件必须指定 locale");
    }

    if (!data || typeof data !== "object") {
      throw new Error("语言插件必须包含翻译数据");
    }

    // 检查必需字段
    const missingFields = REQUIRED_FIELDS.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      console.warn(
        `⚠️ [LanguageLoader] 语言插件缺少字段: ${missingFields.join(", ")}`
      );
    }

    return true;
  }

  /**
   * 加载语言插件
   * @param {Object} plugin - 插件元数据
   */
  async load(plugin) {
    const { id, locale, data, name } = plugin;

    console.log(`🌍 [LanguageLoader] 正在加载语言插件: ${name} (${locale})`);

    // 验证插件
    this.validate(plugin);

    const i18n = this.getI18n();
    if (!i18n) {
      throw new Error("i18n 实例未初始化，请确保在应用启动后再加载语言插件");
    }

    // 获取 messages 对象（兼容不同的 i18n 结构）
    const messages =
      i18n.global?.messages?.value || i18n.global?.messages || {};

    // 备份原有语言数据（如果存在）
    const existingMessages = messages[locale];
    if (existingMessages) {
      this.originalMessages.set(locale, { ...existingMessages });
    }

    // 合并语言数据
    const mergedMessages = this.mergeMessages(existingMessages || {}, data);

    // 设置语言消息（兼容不同的 i18n 结构）
    if (i18n.global?.setLocaleMessage) {
      i18n.global.setLocaleMessage(locale, mergedMessages);
    } else if (typeof i18n.setLocaleMessage === "function") {
      i18n.setLocaleMessage(locale, mergedMessages);
    } else {
      // 直接设置到 messages 对象
      if (i18n.global?.messages?.value) {
        i18n.global.messages.value[locale] = mergedMessages;
      }
    }

    // 记录已加载
    this.loadedLanguages.set(id, {
      locale,
      data,
      loadedAt: Date.now(),
    });

    console.log(`✅ [LanguageLoader] 语言插件加载成功: ${name}`);
    console.log(
      `📊 [LanguageLoader] 当前支持的语言:`,
      this.getSupportedLocales()
    );

    return true;
  }

  /**
   * 卸载语言插件
   * @param {Object} plugin - 插件元数据
   */
  async unload(plugin) {
    const { id, locale, name } = plugin;

    console.log(`🔄 [LanguageLoader] 正在卸载语言插件: ${name}`);

    const i18n = this.getI18n();
    if (!i18n) {
      throw new Error("i18n 实例未初始化");
    }

    // 获取当前语言
    const currentLocale = i18n.global?.locale?.value || i18n.global?.locale;

    // 恢复原有语言数据或移除
    if (this.originalMessages.has(locale)) {
      if (i18n.global?.setLocaleMessage) {
        i18n.global.setLocaleMessage(locale, this.originalMessages.get(locale));
      }
      this.originalMessages.delete(locale);
    } else {
      // 如果是新增的语言，检查当前语言是否是该语言
      if (currentLocale === locale) {
        // 切换到默认语言
        if (i18n.global?.locale) {
          if (
            typeof i18n.global.locale === "object" &&
            "value" in i18n.global.locale
          ) {
            i18n.global.locale.value = "zh-CN";
          } else {
            i18n.global.locale = "zh-CN";
          }
        }
        storage.setItem("locale", "zh-CN");
      }
      // 移除语言
      const messages = i18n.global?.messages?.value || i18n.global?.messages;
      if (messages) {
        delete messages[locale];
      }
    }

    this.loadedLanguages.delete(id);

    console.log(`✅ [LanguageLoader] 语言插件卸载成功: ${name}`);

    return true;
  }

  /**
   * 深度合并消息对象
   * @param {Object} target - 目标对象
   * @param {Object} source - 源对象
   */
  mergeMessages(target, source) {
    const result = { ...target };

    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        result[key] = this.mergeMessages(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * 获取已加载的语言列表
   */
  getLoadedLanguages() {
    return Array.from(this.loadedLanguages.entries()).map(([id, info]) => ({
      id,
      ...info,
    }));
  }

  /**
   * 获取支持的语言代码列表
   */
  getSupportedLocales() {
    const i18n = this.getI18n();
    if (!i18n) return ["zh-CN", "zh-TW", "en-US"];
    const messages =
      i18n.global?.messages?.value || i18n.global?.messages || {};
    return Object.keys(messages);
  }

  /**
   * 检查语言是否已加载
   * @param {string} locale - 语言代码
   */
  isLocaleLoaded(locale) {
    const i18n = this.getI18n();
    if (!i18n) return false;
    const messages =
      i18n.global?.messages?.value || i18n.global?.messages || {};
    return !!messages[locale];
  }

  /**
   * 切换到指定语言
   * @param {string} locale - 语言代码
   */
  switchLocale(locale) {
    const i18n = this.getI18n();
    if (!i18n) {
      throw new Error("i18n 实例未初始化");
    }

    if (!this.isLocaleLoaded(locale)) {
      throw new Error(`语言 ${locale} 未加载`);
    }

    if (i18n.global?.locale) {
      if (
        typeof i18n.global.locale === "object" &&
        "value" in i18n.global.locale
      ) {
        i18n.global.locale.value = locale;
      } else {
        i18n.global.locale = locale;
      }
    }
    storage.setItem("locale", locale);

    console.log(`🌍 [LanguageLoader] 已切换语言: ${locale}`);

    return true;
  }
}

// 单例导出
export const languagePluginLoader = new LanguagePluginLoader();
export default languagePluginLoader;
