/**
 * 更新公告数据管理 composable
 * 统一管理公告数据的加载和访问，避免重复代码
 * 现在只保留当前版本的公告数据
 */
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

// 直接导入公告数据
import releaseNotesZhCN from "@/i18n/locales/release-notes.zh-CN.json";
import releaseNotesEnUS from "@/i18n/locales/release-notes.en-US.json";
import releaseNotesZhTW from "@/i18n/locales/release-notes.zh-TW.json";

// 缓存数据
const releaseNotesCache = {
  "zh-CN": releaseNotesZhCN,
  "en-US": releaseNotesEnUS,
  "zh-TW": releaseNotesZhTW,
};

/**
 * 获取公告数据的 composable
 * @returns {Object} 公告数据和相关方法
 */
export function useReleaseNotes() {
  const { locale } = useI18n();

  // 当前语言的公告数据（响应式）- 现在是单个对象
  // 中文显示中文公告，其他语言显示英文公告
  const currentRelease = computed(() => {
    const currentLocale = locale.value || "zh-CN";
    
    // 中文语言使用对应的中文公告
    if (currentLocale === "zh-CN") {
      return releaseNotesCache["zh-CN"] || null;
    }
    if (currentLocale === "zh-TW") {
      return releaseNotesCache["zh-TW"] || releaseNotesCache["zh-CN"] || null;
    }
    
    // 其他所有语言（包括插件语言）使用英文公告
    return releaseNotesCache["en-US"] || null;
  });

  // 兼容旧代码：latestRelease 现在直接返回当前版本公告
  const latestRelease = computed(() => currentRelease.value);

  // 公告总数（现在只有1个）
  const totalCount = computed(() => currentRelease.value ? 1 : 0);

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

  return {
    currentRelease,
    latestRelease,
    totalCount,
    formatDate,
    formatShortDate,
  };
}
