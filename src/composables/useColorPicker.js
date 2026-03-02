import { ref, computed, watch } from "vue";
import { themeValidator } from "@/services/themeValidator.js";
import { accessibilityChecker } from "@/services/accessibilityChecker.js";

const DEFAULT_PRESET_COLORS = [
  "#000000",
  "#ffffff",
  "#1c1c1e",
  "#f8f9fa",
  "#007aff",
  "#34c759",
  "#ff9500",
  "#ff3b30",
  "#5856d6",
  "#af52de",
  "#ff2d55",
  "#a2845e",
  "#8e8e93",
  "#636366",
  "#48484a",
  "#3a3a3c",
];

export function useColorPicker(props, emit) {
  const inputRef = ref(null);
  const inputValue = ref(props.modelValue);
  const lastValidColor = ref(props.modelValue);
  const showError = ref(false);
  const isFocused = ref(false);

  const errorId = computed(
    () => `color-error-${Math.random().toString(36).substr(2, 9)}`
  );

  const currentColor = computed(() => {
    const validation = themeValidator.validateColor(inputValue.value);
    return validation.valid ? inputValue.value : lastValidColor.value;
  });

  const isValidColor = computed(() => {
    if (!inputValue.value || inputValue.value.trim() === "") return true;
    return themeValidator.validateColor(inputValue.value).valid;
  });

  const contrastRatio = computed(() => {
    if (!props.contrastWith) return null;
    const ratio = accessibilityChecker.calculateContrastRatio(
      currentColor.value,
      props.contrastWith
    );
    return ratio.toFixed(2);
  });

  const contrastLevel = computed(() => {
    if (!contrastRatio.value) return "";
    return accessibilityChecker.checkWCAGCompliance(
      parseFloat(contrastRatio.value)
    );
  });

  const contrastClass = computed(() => {
    if (!contrastLevel.value) return "";
    return {
      "contrast-aaa": contrastLevel.value === "AAA",
      "contrast-aa": contrastLevel.value === "AA",
      "contrast-a": contrastLevel.value === "A",
      "contrast-fail": contrastLevel.value === "FAIL",
    };
  });

  const contrastTooltip = computed(() => {
    if (!contrastLevel.value) return "";
    const descriptions = {
      AAA: "AAA",
      AA: "AA",
      A: "A",
      FAIL: "FAIL",
    };
    return descriptions[contrastLevel.value] || "";
  });

  watch(
    () => props.modelValue,
    (newValue) => {
      if (newValue !== inputValue.value) {
        inputValue.value = newValue;
        const validation = themeValidator.validateColor(newValue);
        if (validation.valid) {
          lastValidColor.value = newValue;
        }
      }
    }
  );

  function handleInput() {
    const validation = themeValidator.validateColor(inputValue.value);

    if (validation.valid) {
      lastValidColor.value = inputValue.value;
      showError.value = false;
      emit("update:modelValue", inputValue.value);
      emit("change", inputValue.value);
    } else if (inputValue.value.trim() !== "") {
      showError.value = true;
    }
  }

  function handleBlur() {
    isFocused.value = false;
    const validation = themeValidator.validateColor(inputValue.value);

    if (!validation.valid && inputValue.value.trim() !== "") {
      emit("validationError", {
        value: inputValue.value,
        error: validation.error,
      });
      inputValue.value = lastValidColor.value;
      showError.value = false;
    }
  }

  function handleFocus() {
    isFocused.value = true;
    showError.value = false;
  }

  function focusInput() {
    inputRef.value?.focus();
  }

  function selectPreset(color) {
    inputValue.value = color;
    lastValidColor.value = color;
    showError.value = false;
    emit("update:modelValue", color);
    emit("change", color);
  }

  return {
    inputRef,
    inputValue,
    lastValidColor,
    showError,
    isFocused,
    errorId,
    currentColor,
    isValidColor,
    contrastRatio,
    contrastLevel,
    contrastClass,
    contrastTooltip,
    handleInput,
    handleBlur,
    handleFocus,
    focusInput,
    selectPreset,
    presetColors: DEFAULT_PRESET_COLORS,
  };
}
