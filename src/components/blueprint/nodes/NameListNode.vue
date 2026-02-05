<template>
  <BlueprintNodeShell
    :title="$t('blueprintCreate.nodes.nameList')"
    :subtitle="$t('blueprintCreate.nodes.source')"
    variant="source"
    :selected="selected"
  >
    <div class="bp-node-metric">
      {{ $t('blueprintCreate.nodes.count', { count: nameCount }) }}
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

const nameCount = computed(() => {
  const raw = props.data?.namesText || "";
  return raw
    .split(/\r?\n|,|;/)
    .map((s) => s.trim())
    .filter(Boolean).length;
});
</script>

<style scoped>
.bp-node-metric {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}
</style>
