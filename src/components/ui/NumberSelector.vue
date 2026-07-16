<template>
  <div class="number-selector" :class="{ disabled }">
    <div class="number-display">
      <button
        class="number-btn decrement"
        :class="{ disabled: modelValue <= min }"
        :disabled="disabled || modelValue <= min"
        @click="decrement"
      >
        <font-awesome-icon :icon="['fas', 'minus']" />
      </button>
      <div class="number-value">
        <transition name="text-swift" mode="out-in">
          <span :key="modelValue">{{ modelValue }}</span>
        </transition>
      </div>
      <button
        class="number-btn increment"
        :class="{ disabled: modelValue >= max }"
        :disabled="disabled || modelValue >= max"
        @click="increment"
      >
        <font-awesome-icon :icon="['fas', 'plus']" />
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Number,
    default: 1,
  },
  min: {
    type: Number,
    default: 1,
  },
  max: {
    type: Number,
    default: 99,
  },
  step: {
    type: Number,
    default: 1,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const clamp = (value) => Math.max(props.min, Math.min(props.max, value));

const increment = () => {
  const newValue = clamp(props.modelValue + props.step);
  emit("update:modelValue", newValue);
  emit("change", newValue);
};

const decrement = () => {
  const newValue = clamp(props.modelValue - props.step);
  emit("update:modelValue", newValue);
  emit("change", newValue);
};
</script>

<style scoped>
.number-selector {
  display: inline-flex;
}

.number-selector.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.number-display {
  display: flex;
  align-items: center;
  background: var(--dropdown-bg, var(--bg-secondary));
  border: 1px solid var(--dropdown-border, var(--divider-light));
  border-radius: var(--radius-dropdown, var(--radius-md));
  overflow: hidden;
  transition: all 0.2s ease;
}

.number-display:hover {
  border-color: var(--dropdown-border-hover, var(--accent-color));
}

.number-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--dropdown-text, var(--text-primary));
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
  padding: 0;
}

.number-btn:hover:not(.disabled) {
  background: var(--dropdown-hover-bg, var(--bg-hover));
  color: var(--accent-color);
}

.number-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.number-value {
  min-width: 40px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--dropdown-text, var(--text-primary));
  padding: 0 4px;
  user-select: none;
  line-height: 36px;
}

[data-theme="dark"] .number-display {
  border-color: rgba(255, 255, 255, 0.1);
}
</style>
