import { computed } from "vue";

export function usePlayerManager(props, t) {
  const getPropValue = (key, defaultValue) => {
    const val = props.value?.[key] ?? defaultValue;
    return val;
  };

  const title = computed(() => {
    const key = getPropValue('titleKey', "editArchive.playerManagement");
    return t(key);
  });
  
  const emptyHint = computed(() => {
    const key = getPropValue('emptyHintKey', "editArchive.noPlayersHint");
    return t(key);
  });
  
  const steamIdPlaceholder = computed(() => {
    const key = getPropValue('steamIdPlaceholderKey', "editArchive.steamIdPlaceholder");
    return t(key);
  });

  const getSanityClass = (val) => {
    if (val >= 80) return "sanity-high";
    if (val >= 50) return "sanity-medium";
    if (val >= 20) return "sanity-low";
    return "sanity-critical";
  };

  return {
    title,
    emptyHint,
    steamIdPlaceholder,
    getSanityClass,
  };
}
