<template>
  <div class="color-picker" role="group" :aria-label="label" @keydown="handleKeydown">
    <!-- Color Preview Swatch -->
    <div class="color-preview" :style="{ backgroundColor: currentColor }" :title="currentColor" @click="focusInput"
      role="button" :aria-label="$t('theme.colorPreview', { color: currentColor })" tabindex="0">
      <span v-if="!isValidColor" class="invalid-indicator">!</span>
    </div>

    <!-- Color Input -->
    <div class="color-input-wrapper">
      <input ref="inputRef" type="text" class="color-input" v-model="inputValue" @input="handleInput" @blur="handleBlur"
        @focus="handleFocus" :placeholder="placeholder" :aria-label="`${label} ${$t('theme.colorValue')}`"
        :aria-invalid="!isValidColor" :aria-describedby="errorId" />
      <span v-if="!isValidColor && showError" :id="errorId" class="error-message" role="alert">
        {{ $t('theme.invalidColor') }}
      </span>
    </div>

    <!-- Contrast Indicator -->
    <div v-if="contrastWith" class="contrast-indicator" :class="contrastClass"
      :aria-label="$t('theme.contrastRatio', { ratio: contrastRatio })" :title="contrastTooltip">
      <span class="contrast-value">{{ contrastRatio }}:1</span>
      <span class="contrast-level">{{ contrastLevel }}</span>
    </div>

    <!-- Preset Colors Panel -->
    <div v-if="showPresets" class="preset-panel" role="listbox" :aria-label="$t('theme.presetColors')">
      <button v-for="(color, index) in presetColors" :key="color" class="preset-color"
        :style="{ backgroundColor: color }" @click="selectPreset(color)" @keydown.enter="selectPreset(color)"
        @keydown.space.prevent="selectPreset(color)" role="option" :aria-selected="currentColor === color"
        :aria-label="$t('theme.selectColor', { color })" :tabindex="index === 0 ? 0 : -1" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { themeValidator } from '@/services/themeValidator.js';
import { accessibilityChecker } from '@/services/accessibilityChecker.js';

const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: String,
    default: '#000000'
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '#RRGGBB'
  },
  contrastWith: {
    type: String,
    default: null
  },
  showPresets: {
    type: Boolean,
    default: true
  },
  presetColors: {
    type: Array,
    default: () => [
      '#000000', '#ffffff', '#1c1c1e', '#f8f9fa',
      '#007aff', '#34c759', '#ff9500', '#ff3b30',
      '#5856d6', '#af52de', '#ff2d55', '#a2845e',
      '#8e8e93', '#636366', '#48484a', '#3a3a3c'
    ]
  }
});

const emit = defineEmits(['update:modelValue', 'change', 'validationError']);

// Refs
const inputRef = ref(null);
const inputValue = ref(props.modelValue);
const lastValidColor = ref(props.modelValue);
const showError = ref(false);
const isFocused = ref(false);

// Generate unique error ID for accessibility
const errorId = computed(() => `color-error-${Math.random().toString(36).substr(2, 9)}`);

// Current color (validated)
const currentColor = computed(() => {
  const validation = themeValidator.validateColor(inputValue.value);
  return validation.valid ? inputValue.value : lastValidColor.value;
});

// Validation state
const isValidColor = computed(() => {
  if (!inputValue.value || inputValue.value.trim() === '') return true;
  return themeValidator.validateColor(inputValue.value).valid;
});

// Contrast ratio calculation
const contrastRatio = computed(() => {
  if (!props.contrastWith) return null;
  const ratio = accessibilityChecker.calculateContrastRatio(currentColor.value, props.contrastWith);
  return ratio.toFixed(2);
});

// WCAG compliance level
const contrastLevel = computed(() => {
  if (!contrastRatio.value) return '';
  return accessibilityChecker.checkWCAGCompliance(parseFloat(contrastRatio.value));
});

// Contrast indicator CSS class
const contrastClass = computed(() => {
  if (!contrastLevel.value) return '';
  return {
    'contrast-aaa': contrastLevel.value === 'AAA',
    'contrast-aa': contrastLevel.value === 'AA',
    'contrast-a': contrastLevel.value === 'A',
    'contrast-fail': contrastLevel.value === 'FAIL'
  };
});

// Contrast tooltip
const contrastTooltip = computed(() => {
  if (!contrastLevel.value) return '';
  const descriptions = {
    'AAA': t('theme.contrastAAA'),
    'AA': t('theme.contrastAA'),
    'A': t('theme.contrastA'),
    'FAIL': t('theme.contrastFail')
  };
  return descriptions[contrastLevel.value] || '';
});

// Watch for external value changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== inputValue.value) {
    inputValue.value = newValue;
    const validation = themeValidator.validateColor(newValue);
    if (validation.valid) {
      lastValidColor.value = newValue;
    }
  }
});

// Handle input changes
function handleInput() {
  const validation = themeValidator.validateColor(inputValue.value);

  if (validation.valid) {
    lastValidColor.value = inputValue.value;
    showError.value = false;
    emit('update:modelValue', inputValue.value);
    emit('change', inputValue.value);
  } else if (inputValue.value.trim() !== '') {
    showError.value = true;
  }
}

// Handle blur - revert to last valid if invalid
function handleBlur() {
  isFocused.value = false;
  const validation = themeValidator.validateColor(inputValue.value);

  if (!validation.valid && inputValue.value.trim() !== '') {
    emit('validationError', {
      value: inputValue.value,
      error: validation.error
    });
    // Revert to last valid color
    inputValue.value = lastValidColor.value;
    showError.value = false;
  }
}

// Handle focus
function handleFocus() {
  isFocused.value = true;
  showError.value = false;
}

// Focus input programmatically
function focusInput() {
  inputRef.value?.focus();
}

// Select preset color
function selectPreset(color) {
  inputValue.value = color;
  lastValidColor.value = color;
  showError.value = false;
  emit('update:modelValue', color);
  emit('change', color);
}

// Keyboard navigation for presets
function handleKeydown(event) {
  if (!props.showPresets) return;

  const presets = document.querySelectorAll('.preset-color');
  const currentIndex = Array.from(presets).findIndex(el => el === document.activeElement);

  if (currentIndex === -1) return;

  let newIndex = currentIndex;

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      newIndex = (currentIndex + 1) % presets.length;
      event.preventDefault();
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      newIndex = (currentIndex - 1 + presets.length) % presets.length;
      event.preventDefault();
      break;
    case 'Home':
      newIndex = 0;
      event.preventDefault();
      break;
    case 'End':
      newIndex = presets.length - 1;
      event.preventDefault();
      break;
  }

  if (newIndex !== currentIndex) {
    presets[newIndex]?.focus();
  }
}

// Initialize
onMounted(() => {
  const validation = themeValidator.validateColor(props.modelValue);
  if (validation.valid) {
    lastValidColor.value = props.modelValue;
  }
});
</script>

<style scoped>
.color-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid var(--border-color, rgba(60, 60, 67, 0.1));
  cursor: pointer;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  flex-shrink: 0;
}

.color-preview:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.color-preview:focus {
  outline: 2px solid var(--primary, #007aff);
  outline-offset: 2px;
}

.invalid-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ff3b30;
  font-weight: bold;
  font-size: 18px;
  text-shadow: 0 0 2px white;
}

.color-input-wrapper {
  flex: 1;
  position: relative;
}

.color-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  border-radius: 8px;
  font-size: 14px;
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  background: var(--bg-secondary, #ffffff);
  color: var(--text-primary, #1c1c1e);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.color-input:focus {
  outline: none;
  border-color: var(--primary, #007aff);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.color-input[aria-invalid="true"] {
  border-color: #ff3b30;
}

.color-input::placeholder {
  color: var(--text-tertiary, #8e8e93);
}

.error-message {
  position: absolute;
  bottom: -20px;
  left: 0;
  font-size: 12px;
  color: #ff3b30;
}

.contrast-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: var(--bg-tertiary, #f2f2f7);
}

.contrast-value {
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
}

.contrast-level {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.contrast-aaa {
  background: rgba(52, 199, 89, 0.1);
  color: #34c759;
}

.contrast-aaa .contrast-level {
  background: #34c759;
  color: white;
}

.contrast-aa {
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
}

.contrast-aa .contrast-level {
  background: #007aff;
  color: white;
}

.contrast-a {
  background: rgba(255, 149, 0, 0.1);
  color: #ff9500;
}

.contrast-a .contrast-level {
  background: #ff9500;
  color: white;
}

.contrast-fail {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.contrast-fail .contrast-level {
  background: #ff3b30;
  color: white;
}

.preset-panel {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
  padding: 8px;
  background: var(--bg-tertiary, #f2f2f7);
  border-radius: 8px;
}

.preset-color {
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
  padding: 0;
  background: none;
}

.preset-color:hover {
  transform: scale(1.1);
  border-color: var(--primary, #007aff);
}

.preset-color:focus {
  outline: none;
  border-color: var(--primary, #007aff);
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
}

.preset-color[aria-selected="true"] {
  border-color: var(--primary, #007aff);
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .preset-panel {
    grid-template-columns: repeat(6, 1fr);
  }
}
</style>
