import { computed, watch } from "vue";

const ICONS = {
  language: "globe",
  theme: "palette",
  feature: "puzzle-piece",
};

export function usePluginDetailModal(props, emit) {
  const typeClass = computed(() => `type-${props.plugin?.type || "feature"}`);

  const iconName = computed(() => ICONS[props.plugin?.type] || "puzzle-piece");

  const typeLabel = computed(() => {
    const key = `plugin.type.${props.plugin?.type}`;
    return key;
  });

  watch(
    () => props.show,
    (val) => {
      document.body.style.overflow = val ? "hidden" : "";
    }
  );

  return {
    typeClass,
    iconName,
    typeLabel,
  };
}
