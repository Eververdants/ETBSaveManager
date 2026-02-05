<template>
  <BlueprintNodeShell
    :title="$t('blueprintCreate.nodes.playerSetup')"
    :subtitle="$t('blueprintCreate.nodes.transform')"
    variant="transform"
    :selected="selected"
  >
    <div class="bp-node-metric">{{ playerLabel }}</div>
    <div class="bp-node-sub">{{ sanityLabel }}</div>
    <div class="bp-node-sub">{{ inventoryLabel }}</div>
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

const playerCount = computed(() => Number(props.data?.playerCount ?? 1) || 1);

const playerLabel = computed(() =>
  t("blueprintCreate.nodes.playersCount", { count: playerCount.value })
);

const sanityLabel = computed(() =>
  t("blueprintCreate.nodes.sanityLabel", {
    value: Number(props.data?.sanity ?? 100),
  })
);

const inventoryLabel = computed(() => {
  const mode = props.data?.inventoryMode || "empty";
  return t(`blueprintCreate.inventoryMode.${mode}`);
});
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
