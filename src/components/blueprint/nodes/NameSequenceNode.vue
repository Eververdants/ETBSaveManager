<template>
  <BlueprintNodeShell
    :title="$t('blueprintCreate.nodes.nameSequence')"
    :subtitle="$t('blueprintCreate.nodes.source')"
    variant="source"
    :selected="selected"
  >
    <div class="bp-node-metric">
      {{ $t('blueprintCreate.nodes.count', { count: safeCount }) }}
    </div>
    <template #handles>
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

const safeCount = computed(() => {
  const count = Number(props.data?.count);
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
});
</script>

<style scoped>
.bp-node-metric {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}
</style>
