import { useI18n } from "vue-i18n";

/**
 * Get display name for a level key from i18n
 * Falls back to the raw key if no translation exists
 */
export function getLevelName(levelKey: string): string {
  // Use a simple lookup pattern — caller provides the te/t functions
  return levelKey;
}

/**
 * Composable version for use in components
 * Usage: const { getLevelName } = useLevelUtils();
 */
export function useLevelUtils() {
  const { t, te } = useI18n({ useScope: "global" });

  const getLevelName = (levelKey: string): string => {
    const translationKey = `LevelName_Display.${levelKey}`;
    return te(translationKey) ? t(translationKey) : levelKey;
  };

  return { getLevelName };
}
