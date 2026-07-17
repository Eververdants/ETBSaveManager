<template>
  <div class="ending-selector">
    <div class="ending-label">{{ $t("quickCreate.endingSelector.label") }}</div>
    <div ref="endingGroupRef" class="ending-group">
      <div class="ending-slider" :style="sliderStyle" />
      <div
v-for="ending in endings" :key="ending.id" class="ending-tab" :class="{ active: modelValue === ending.id }"
        @click="handleSelect(ending.id)">
        <span class="ending-label-text">{{ ending.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  endings: { type: Array, required: true },
});

const emit = defineEmits(["update:modelValue"]);

const endingGroupRef = ref(null);
const sliderWidth = ref(0);
const sliderLeft = ref(0);
const sliderActive = ref(false);

const sliderStyle = computed(() => ({
  width: `${sliderWidth.value}px`,
  transform: `translateX(${sliderLeft.value}px)`,
  opacity: sliderActive.value ? 1 : 0,
}));

const updateSlider = () => {
  if (!endingGroupRef.value) return;
  const container = endingGroupRef.value;
  const activeTab = container.querySelector(".ending-tab.active");
  if (!activeTab) return;
  const containerRect = container.getBoundingClientRect();
  const tabRect = activeTab.getBoundingClientRect();
  sliderWidth.value = tabRect.width;
  sliderLeft.value = tabRect.left - containerRect.left;
  sliderActive.value = true;
};

watch(
  () => props.modelValue,
  () => nextTick(updateSlider),
);

onMounted(() => {
  nextTick(() => requestAnimationFrame(() => requestAnimationFrame(updateSlider)));
  window.addEventListener("resize", updateSlider);
});

onUnmounted(() => window.removeEventListener("resize", updateSlider));

const handleSelect = (id) => {
  if (props.modelValue !== id) emit("update:modelValue", id);
};
</script>

<style scoped>
.ending-selector {
  margin-bottom: 16px;
}

.ending-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.ending-group {
  position: relative;
  display: inline-flex;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 4px;
  gap: 2px;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.08);
}

.ending-slider {
  position: absolute;
  top: 4px;
  left: 0;
  height: calc(100% - 8px);
  background: var(--accent-color);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px rgba(var(--accent-color-rgb), 0.35);
  pointer-events: none;
  transition:
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.2s ease;
  z-index: 0;
}

.ending-tab {
  position: relative;
  z-index: 1;
  padding: 8px 18px;
  border-radius: var(--radius-md);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.ending-label-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.25s ease;
}

.ending-tab.active .ending-label-text {
  color: #ffffff;
  font-weight: 600;
}

.ending-tab:not(.active):hover .ending-label-text {
  color: var(--text-primary);
}
</style>
