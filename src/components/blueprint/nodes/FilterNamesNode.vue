<template>
  <BlueprintNodeShell
    :title="$t('blueprintCreate.nodes.filterNames')"
    :subtitle="$t('blueprintCreate.nodes.transform')"
    variant="logic"
    :selected="selected"
  >
    <div class="bp-node-metric">
      {{ modeLabel }}
    </div>
    <template #handles>
      <Handle
        type="target"
        :position="Position.Left"
        id="in"
        class="bp-handle"
        :style="{ top: '50%' }"
      />
      <Handle
        type="source"
        :position="Position.Right"
        id="out"
        class="bp-handle"
        :style="{ top: '50%' }"
      />
    </template>
  </BlueprintNodeShell>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Handle, Position } from "@vue-flow/core";
import BlueprintNodeShell from "./BlueprintNodeShell.vue";

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  selected: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n({ useScope: "global" });

const modeLabel = computed(() => {
  const mode = props.data?.mode || "include";
  return mode === "exclude"
    ? t("blueprintCreate.filterMode.exclude")
    : t("blueprintCreate.filterMode.include");
});
</script>

<style scoped>
.bp-node-metric {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}
</style>
