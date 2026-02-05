<template>
  <BlueprintNodeShell
    :title="$t('blueprintCreate.nodes.setActualDifficulty')"
    :subtitle="$t('blueprintCreate.nodes.transform')"
    variant="transform"
    :selected="selected"
  >
    <div class="bp-node-metric">{{ difficultyLabel }}</div>
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

const difficultyLabel = computed(() => {
  const difficulty = props.data?.actualDifficulty || "normal";
  if (difficulty === "easy") return t("blueprintCreate.difficulty.easy");
  if (difficulty === "hard") return t("blueprintCreate.difficulty.hard");
  if (difficulty === "nightmare") return t("blueprintCreate.difficulty.nightmare");
  return t("blueprintCreate.difficulty.normal");
});
</script>

<style scoped>
.bp-node-metric {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}
</style>
