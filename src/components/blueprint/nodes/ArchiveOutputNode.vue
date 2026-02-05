<template>
  <BlueprintNodeShell
    :title="$t('blueprintCreate.nodes.archiveOutput')"
    :subtitle="$t('blueprintCreate.nodes.output')"
    variant="output"
    :selected="selected"
  >
    <div class="bp-node-metric">
      {{ $t('blueprintCreate.nodes.outputHint') }}
    </div>
    <template #handles>
      <Handle
        type="target"
        :position="Position.Left"
        id="in"
        class="bp-handle"
        :style="{ top: '50%' }"
      />
    </template>
  </BlueprintNodeShell>
</template>

<script setup>
import { Handle, Position } from "@vue-flow/core";
import BlueprintNodeShell from "./BlueprintNodeShell.vue";

defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  selected: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.bp-node-metric {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}
</style>
