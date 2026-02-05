<template>
  <BlueprintNodeShell
    :title="$t('blueprintCreate.nodes.replaceNames')"
    :subtitle="$t('blueprintCreate.nodes.transform')"
    variant="transform"
    :selected="selected"
  >
    <div class="bp-node-metric">
      {{ label }}
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

const label = computed(() => {
  const search = props.data?.search || "";
  const replace = props.data?.replace || "";
  if (!search) return t("blueprintCreate.nodes.replaceEmpty");
  return t("blueprintCreate.nodes.replaceLabel", { search, replace });
});
</script>

<style scoped>
.bp-node-metric {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}
</style>
