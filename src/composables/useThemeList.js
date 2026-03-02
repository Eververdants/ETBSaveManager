import { ref, computed } from "vue";
import themeManager from "@/styles/theme-config.js";

const THEME_ID_TO_KEY = {
  light: "light",
  dark: "dark",
  "new-year": "newYear",
  "high-contrast": "highContrast",
  "spring-festival-dark": "springFestivalDark",
  "spring-festival-light": "springFestivalLight",
};

export function useThemeList(emit, t, te) {
  const showDeleteConfirm = ref(false);
  const themeToDelete = ref(null);

  const getThemeName = (themeId) => {
    const translationKey = `common.${THEME_ID_TO_KEY[themeId] || themeId}`;
    return te(translationKey) ? t(translationKey) : themeId;
  };

  const presetThemes = computed(() => {
    return themeManager
      .getAllThemes()
      .filter((theme) => theme.type === "preset")
      .map((theme) => {
        const themeName = getThemeName(theme.id);
        return {
          ...theme,
          name: themeName,
          displayName: theme.icon
            ? `${theme.icon} ${themeName}`
            : themeName,
        };
      });
  });

  const customThemes = computed(() => themeManager.customThemes.value);

  const currentThemeId = computed(() => themeManager.currentThemeId.value);

  function selectTheme(themeId) {
    themeManager.setTheme(themeId);
    emit("select", themeId);
  }

  function handleCreate() {
    if (customThemes.value.length >= 10) {
      return;
    }
    emit("create");
  }

  function handleEdit(theme) {
    emit("edit", theme);
  }

  function handleDelete(theme) {
    themeToDelete.value = theme;
    showDeleteConfirm.value = true;
  }

  function cancelDelete() {
    themeToDelete.value = null;
    showDeleteConfirm.value = false;
  }

  async function confirmDelete() {
    if (!themeToDelete.value) return;

    const success = await themeManager.deleteCustomTheme(themeToDelete.value.id);

    if (success) {
      emit("delete", themeToDelete.value);
    }

    showDeleteConfirm.value = false;
    themeToDelete.value = null;
  }

  function handleExport(theme) {
    const themeData = JSON.stringify(theme, null, 2);
    const blob = new Blob([themeData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${theme.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    emit("export", theme);
  }

  function getCustomPreviewStyle(theme) {
    return {
      backgroundColor: theme.colors?.bg || "var(--bg-color)",
      borderColor: theme.colors?.borderColor || "var(--border-color)",
    };
  }

  return {
    showDeleteConfirm,
    themeToDelete,
    presetThemes,
    customThemes,
    currentThemeId,
    getThemeName,
    selectTheme,
    handleCreate,
    handleEdit,
    handleDelete,
    cancelDelete,
    confirmDelete,
    handleExport,
    getCustomPreviewStyle,
  };
}
