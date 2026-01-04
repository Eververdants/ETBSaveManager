/**
 * 更新公告数据管理 composable
 * 统一管理公告数据的加载和访问，避免重复代码
 */
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";

// 单例缓存，避免重复创建
let releaseNotesCache = null;

/**
 * 获取公告数据的 composable
 * @returns {Object} 公告数据和相关方法
 */
export function useReleaseNotes() {
  const { locale } = useI18n();

  // 使用单例模式缓存数据
  if (!releaseNotesCache) {
    releaseNotesCache = {
      "zh-CN": [],
      "en-US": [],
      "zh-TW": [],
    };

    // 从 Vite 全局常量加载数据（只执行一次）
    try {
      if (typeof __RELEASE_NOTES_ZH_CN__ !== "undefined") {
        releaseNotesCache["zh-CN"] = Array.isArray(__RELEASE_NOTES_ZH_CN__)
          ? __RELEASE_NOTES_ZH_CN__
          : [];
      }
      if (typeof __RELEASE_NOTES_EN_US__ !== "undefined") {
        releaseNotesCache["en-US"] = Array.isArray(__RELEASE_NOTES_EN_US__)
          ? __RELEASE_NOTES_EN_US__
          : [];
      }
      if (typeof __RELEASE_NOTES_ZH_TW__ !== "undefined") {
        releaseNotesCache["zh-TW"] = Array.isArray(__RELEASE_NOTES_ZH_TW__)
          ? __RELEASE_NOTES_ZH_TW__
          : [];
      }
    } catch (error) {
      console.error("[useReleaseNotes] 加载公告数据失败:", error.message);
    }
  }

  // 当前语言的公告数据（响应式）
  // 中文显示中文公告，其他语言显示英文公告
  const releaseNotes = computed(() => {
    const currentLocale = locale.value || "zh-CN";
    
    // 中文语言使用对应的中文公告
    if (currentLocale === "zh-CN") {
      return releaseNotesCache["zh-CN"] || [];
    }
    if (currentLocale === "zh-TW") {
      return releaseNotesCache["zh-TW"] || releaseNotesCache["zh-CN"] || [];
    }
    
    // 其他所有语言（包括插件语言）使用英文公告
    return releaseNotesCache["en-US"] || [];
  });

  // 最新版本公告
  const latestRelease = computed(() => {
    return releaseNotes.value.length > 0 ? releaseNotes.value[0] : null;
  });

  // 公告总数
  const totalCount = computed(() => releaseNotes.value.length);

  // 格式化日期
  const formatDate = (dateString, options = {}) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const defaultOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...options,
    };
    return date.toLocaleDateString(locale.value || "zh-CN", defaultOptions);
  };

  // 格式化短日期
  const formatShortDate = (dateString) => {
    return formatDate(dateString, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // 按类型筛选公告
  const filterByType = (type) => {
    if (!type) return releaseNotes.value;
    return releaseNotes.value.filter((note) => note.type === type);
  };

  // 获取精选公告
  const featuredReleases = computed(() => {
    return releaseNotes.value.filter((note) => note.isHighlight);
  });

  return {
    releaseNotes,
    latestRelease,
    totalCount,
    featuredReleases,
    formatDate,
    formatShortDate,
    filterByType,
  };
}
