import { computed } from "vue";

export function usePlayerManager(props, t) {
  const title = computed(() => t(props.titleKey));
  const emptyHint = computed(() => t(props.emptyHintKey));
  const steamIdPlaceholder = computed(() => t(props.steamIdPlaceholderKey));

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
