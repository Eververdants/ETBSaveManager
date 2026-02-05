<template>
  <BlueprintNodeShell
    :title="$t('blueprintCreate.nodes.randomPickArchives')"
    :subtitle="$t('blueprintCreate.nodes.transform')"
    variant="transform"
    :selected="selected"
  >
    <div class="bp-node-metric">{{ countLabel }}</div>
    <div class="bp-node-sub">{{ dupLabel }}</div>
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

const countLabel = computed(() =>
  t("blueprintCreate.nodes.randomCount", {
    count: Number(props.data?.count ?? 0),
  })
);

const dupLabel = computed(() =>
  props.data?.allowDuplicates
    ? t("blueprintCreate.random.allowDuplicates")
    : t("blueprintCreate.random.unique")
);
</script>

<style scoped>
.bp-node-metric {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.bp-node-sub {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
}
</style>
