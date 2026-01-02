<template>
  <div class="color-section">
    <h3 class="section-title">{{ title }}</h3>
    <div class="color-grid">
      <div class="color-item" v-for="item in items" :key="item.key">
        <label class="color-label" :for="`color-${item.key}`">
          {{ item.label }}
        </label>
        <div class="color-row">
          <div class="color-swatch" :style="{ backgroundColor: colors[item.key] }" :title="colors[item.key]" />
          <input :id="`color-${item.key}`" type="text" class="color-value-input" :value="colors[item.key]"
            @input="handleInput(item.key, $event)" @blur="handleBlur(item.key, $event)" :aria-label="item.label" />
          <div v-if="item.contrastWith && colors[item.contrastWith]" class="mini-contrast"
            :class="getContrastClass(colors[item.key], colors[item.contrastWith])"
            :title="getContrastTooltip(colors[item.key], colors[item.contrastWith])">
            {{ getContrastRatio(colors[item.key], colors[item.contrastWith]) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { themeValidator } from '@/services/themeValidator.js';
import { accessibilityChecker } from '@/services/accessibilityChecker.js';

const { t } = useI18n();

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    required: true
  },
  colors: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:color']);

// Store last valid values for each color
const lastValidValues = {};

// Handle input changes
function handleInput(key, event) {
  const value = event.target.value;
  const validation = themeValidator.validateColor(value);

  if (validation.valid) {
    lastValidValues[key] = value;
    emit('update:color', { key, value });
  }
}

// Handle blur - revert to last valid if invalid
function handleBlur(key, event) {
  const value = event.target.value;
  const validation = themeValidator.validateColor(value);

  if (!validation.valid) {
    // Revert to last valid value or current color
    const revertValue = lastValidValues[key] || props.colors[key];
    event.target.value = revertValue;
  }
}

// Calculate contrast ratio
function getContrastRatio(fg, bg) {
  if (!fg || !bg) return '-';
  const ratio = accessibilityChecker.calculateContrastRatio(fg, bg);
  return ratio.toFixed(1);
}

// Get contrast CSS class
function getContrastClass(fg, bg) {
  if (!fg || !bg) return '';
  const ratio = accessibilityChecker.calculateContrastRatio(fg, bg);
  const level = accessibilityChecker.checkWCAGCompliance(ratio);
  return {
    'contrast-pass': level === 'AAA' || level === 'AA',
    'contrast-warn': level === 'A',
    'contrast-fail': level === 'FAIL'
  };
}

// Get contrast tooltip
function getContrastTooltip(fg, bg) {
  if (!fg || !bg) return '';
  const ratio = accessibilityChecker.calculateContrastRatio(fg, bg);
  const level = accessibilityChecker.checkWCAGCompliance(ratio);
  return `${t('theme.contrastRatio', { ratio: ratio.toFixed(2) })} - ${level}`;
}
</script>

<style scoped>
.color-section {
  background: var(--bg-tertiary, #f2f2f7);
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1c1c1e);
  margin: 0 0 14px 0;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.color-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.color-label {
  font-size: 12px;
  color: var(--text-secondary, #3a3a3c);
  font-weight: 500;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
}

.color-value-input {
  flex: 1;
  padding: 8px 10px;
  font-size: 12px;
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  border-radius: 6px;
  background: var(--bg-secondary, #ffffff);
  color: var(--text-primary, #1c1c1e);
  min-width: 0;
  transition: border-color 0.2s ease;
}

.color-value-input:focus {
  outline: none;
  border-color: var(--primary, #007aff);
}

.mini-contrast {
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.contrast-pass {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
}

.contrast-warn {
  background: rgba(255, 149, 0, 0.15);
  color: #ff9500;
}

.contrast-fail {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
}

/* Responsive */
@media (max-width: 600px) {
  .color-grid {
    grid-template-columns: 1fr;
  }
}
</style>
