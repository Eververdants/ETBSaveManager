import { computed } from "vue";

const ICONS = {
  language: "globe",
  theme: "palette",
  feature: "puzzle-piece",
};

export function usePluginCard(plugin, showStatus, t) {
  const typeClass = computed(() => `type-${plugin.value?.type || "feature"}`);

  const iconName = computed(() => ICONS[plugin.value?.type] || "puzzle-piece");

  const typeLabel = computed(() => {
    const key = `plugin.type.${plugin.value?.type}`;
    const translated = t(key);
    return translated !== key ? translated : t("plugin.type.plugin");
  });

  const isInstalled = computed(
    () => plugin.value?.installed || plugin.value?.status !== undefined
  );

  const statusIcon = computed(() =>
    plugin.value?.status === "active" ? "check-circle" : "pause-circle"
  );

  const statusText = computed(() =>
    plugin.value?.status === "active" ? t("plugin.enabled") : t("plugin.disabled")
  );

  return {
    typeClass,
    iconName,
    typeLabel,
    isInstalled,
    statusIcon,
    statusText,
  };
}
