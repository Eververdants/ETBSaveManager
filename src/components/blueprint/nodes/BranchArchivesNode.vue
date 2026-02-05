<template>
  <BlueprintNodeShell
    :title="$t('blueprintCreate.nodes.branchArchives')"
    :subtitle="$t('blueprintCreate.nodes.logic')"
    variant="logic"
    :selected="selected"
  >
    <div class="bp-node-metric">{{ ruleLabel }}</div>
    <div class="bp-node-legend">
      <span>{{ $t('blueprintCreate.branch.true') }}</span>
      <span>{{ $t('blueprintCreate.branch.false') }}</span>
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
        id="true"
        class="bp-handle"
        :style="{ top: '35%' }"
      />
      <Handle
        type="source"
        :position="Position.Right"
        id="false"
        class="bp-handle"
        :style="{ top: '70%' }"
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

const ruleLabel = computed(() => {
  const field = props.data?.field || "name";
  const operator = props.data?.operator || "contains";
  const value = props.data?.value || "";
  if (!value) return t("blueprintCreate.branch.ruleEmpty");
  const fieldLabel = t(`blueprintCreate.branchField.${field}`);
  const opLabel = t(`blueprintCreate.branchOperator.${operator}`);
  return `${fieldLabel} ${opLabel} ${value}`;
});
</script>

<style scoped>
.bp-node-metric {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.bp-node-legend {
  margin-top: 6px;
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-tertiary);
}
</style>
