<template>
  <div class="level-check-grid">
    <div class="grid-header">
      <label class="select-all-checkbox" @click="toggleSelectAll">
        <span class="checkbox-mark" :class="{ checked: isAllSelected }">
          <font-awesome-icon v-if="isAllSelected" :icon="['fas', 'check']" class="check-icon" />
        </span>
        <span>{{ $t("quickCreate.levelGrid.selectAll") }}</span>
      </label>
      <span class="selection-count">
        {{ $t("quickCreate.levelGrid.selected", { count: modelValue.length, total: levels.length }) }}
      </span>
      <button v-if="modelValue.length > 0" class="clear-btn" @click="$emit('update:modelValue', [])">
        {{ $t("quickCreate.levelGrid.clearAll") }}
      </button>
    </div>

    <div class="level-grid">
      <div
        v-for="levelKey in levels"
        :key="levelKey"
        class="level-card"
        :class="{ selected: isSelected(levelKey) }"
        @click="toggleLevel(levelKey)"
      >
        <div class="level-image-container">
          <LazyImage :src="`/images/ETB/${levelKey}.webp`" :alt="getLevelName(levelKey)" image-class="level-image" />
          <div class="level-overlay">
            <div class="check-circle" :class="{ checked: isSelected(levelKey) }">
              <font-awesome-icon v-if="isSelected(levelKey)" :icon="['fas', 'check']" />
            </div>
          </div>
        </div>
        <div class="level-info">
          <h3 class="level-name">{{ getLevelName(levelKey) }}</h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import LazyImage from "@/components/ui/LazyImage.vue";
import { useLevelUtils } from "@/utils/levelUtils";

const props = defineProps({
  levels: { type: Array, required: true },
  modelValue: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue"]);

const { getLevelName } = useLevelUtils();

const isAllSelected = computed(() => props.levels.length > 0 && props.modelValue.length === props.levels.length);

const isSelected = (levelKey) => props.modelValue.includes(levelKey);

const toggleLevel = (levelKey) => {
  const current = [...props.modelValue];
  const idx = current.indexOf(levelKey);
  if (idx === -1) {
    current.push(levelKey);
  } else {
    current.splice(idx, 1);
  }
  emit("update:modelValue", current);
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    emit("update:modelValue", []);
  } else {
    emit("update:modelValue", [...props.levels]);
  }
};
</script>

<style scoped>
.level-check-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.grid-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--divider-light);
}
.select-all-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  user-select: none;
}
.checkbox-mark {
  width: 18px;
  height: 18px;
  border-radius: var(--radius-xs);
  border: 2px solid var(--divider-medium);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.checkbox-mark.checked {
  background: var(--accent-color);
  border-color: var(--accent-color);
}
.checkbox-mark .check-icon {
  color: white;
  font-size: 10px;
}
.selection-count {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-left: auto;
}
.clear-btn {
  font-size: 12px;
  color: var(--error-color);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-xs);
}
.clear-btn:hover {
  background: rgba(var(--error-color-rgb), 0.1);
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  padding: 4px 0;
  align-content: start;
}
.level-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.03);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}
.level-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}
.level-card.selected {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.2);
}
.level-image-container {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
}
.level-image-container :deep(.level-image) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.level-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
.check-circle {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-circle);
  border: 2px solid rgba(255, 255, 255, 0.6);
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.check-circle.checked {
  background: var(--accent-color);
  border-color: var(--accent-color);
}
.check-circle svg {
  color: white;
  font-size: 14px;
}
.level-info {
  padding: 10px 12px;
}
.level-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  text-align: center;
}
</style>
