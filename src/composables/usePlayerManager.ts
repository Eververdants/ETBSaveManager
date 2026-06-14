import { computed } from "vue";
import type { ComputedRef, Ref } from "vue";

interface PlayerManagerProps {
  titleKey?: string;
  emptyHintKey?: string;
  steamIdPlaceholderKey?: string;
  [key: string]: unknown;
}

interface PlayerManagerReturn {
  title: ComputedRef<string>;
  emptyHint: ComputedRef<string>;
  steamIdPlaceholder: ComputedRef<string>;
  getSanityClass: (val: number) => string;
}

export function usePlayerManager(
  props: Ref<PlayerManagerProps | undefined>,
  t: (key: string) => string,
): PlayerManagerReturn {
  const getPropValue = (key: string, defaultValue: string): string => {
    const val = props.value?.[key] ?? defaultValue;
    return val as string;
  };

  const title = computed((): string => {
    const key = getPropValue("titleKey", "editArchive.playerManagement");
    return t(key);
  });

  const emptyHint = computed((): string => {
    const key = getPropValue("emptyHintKey", "editArchive.noPlayersHint");
    return t(key);
  });

  const steamIdPlaceholder = computed((): string => {
    const key = getPropValue("steamIdPlaceholderKey", "editArchive.steamIdPlaceholder");
    return t(key);
  });

  const getSanityClass = (val: number): string => {
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
