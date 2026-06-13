/**
 * Release notes data management composable
 * Unified management of release notes data loading and access, avoiding code duplication
 * Now only retains the current version's release notes data
 */
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

// Directly import release notes data
import releaseNotesZhCN from "@/i18n/locales/release-notes.zh-CN.json";
import releaseNotesEnUS from "@/i18n/locales/release-notes.en-US.json";
import releaseNotesZhTW from "@/i18n/locales/release-notes.zh-TW.json";

// Cache data
const releaseNotesCache = {
  "zh-CN": releaseNotesZhCN,
  "en-US": releaseNotesEnUS,
  "zh-TW": releaseNotesZhTW,
};

/**
 * Get release notes data composable
 * @returns {Object} Release notes data and related methods
 */
export function useReleaseNotes() {
  const { locale } = useI18n();

  // Current language release notes data (reactive) - now a single object
  // Chinese shows Chinese release notes, other languages show English release notes
  const currentRelease = computed(() => {
    const currentLocale = locale.value || "zh-CN";

    // Chinese language uses the corresponding Chinese release notes
    if (currentLocale === "zh-CN") {
      return releaseNotesCache["zh-CN"] || null;
    }
    if (currentLocale === "zh-TW") {
      return releaseNotesCache["zh-TW"] || releaseNotesCache["zh-CN"] || null;
    }

    // All other languages (including plugin languages) use English release notes
    return releaseNotesCache["en-US"] || null;
  });

  // Backward compatibility: latestRelease now directly returns the current version release notes
  const latestRelease = computed(() => currentRelease.value);

  // Total release notes count (now only 1)
  const totalCount = computed(() => (currentRelease.value ? 1 : 0));

  // Format date
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

  // Format short date
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
