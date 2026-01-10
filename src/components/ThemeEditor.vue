<template>
  <div class="theme-editor">
    <!-- Header -->
    <div class="editor-header">
      <div class="header-left">
        <input v-model="themeName" type="text" class="theme-name-input" :placeholder="$t('theme.enterThemeName')"
          :aria-label="$t('theme.themeName')" @input="validateName" />
        <span v-if="nameError" class="name-error" role="alert">
          {{ nameError }}
        </span>
      </div>
      <div class="header-right">
        <div class="accessibility-badge" :class="accessibilityClass" :title="accessibilityTooltip">
          <span class="badge-icon">{{ accessibilityIcon }}</span>
          <span class="badge-text">{{ accessibilityLevel }}</span>
        </div>
      </div>
    </div>

    <!-- Color Sections -->
    <div class="color-sections">
      <!-- Background Colors -->
      <div class="color-section">
        <h3 class="section-title">{{ $t("theme.backgroundColors") }}</h3>
        <div class="color-grid">
          <div class="color-item" v-for="item in backgroundColorItems" :key="item.key">
            <label class="color-label">{{ item.label }}</label>
            <div class="color-row">
              <div class="color-swatch" :style="{ backgroundColor: colors[item.key] }" />
              <input type="text" class="color-value-input" v-model="colors[item.key]"
                @input="handleColorChange(item.key)" @blur="validateColor(item.key)" />
            </div>
          </div>
        </div>
      </div>

      <!-- Text Colors -->
      <div class="color-section">
        <h3 class="section-title">{{ $t("theme.textColors") }}</h3>
        <div class="color-grid">
          <div class="color-item" v-for="item in textColorItems" :key="item.key">
            <label class="color-label">{{ item.label }}</label>
            <div class="color-row">
              <div class="color-swatch" :style="{ backgroundColor: colors[item.key] }" />
              <input type="text" class="color-value-input" v-model="colors[item.key]"
                @input="handleColorChange(item.key)" @blur="validateColor(item.key)" />
              <div v-if="item.contrastWith" class="mini-contrast" :class="getContrastClass(colors[item.key], colors[item.contrastWith])
                " :title="getContrastTooltip(
                  colors[item.key],
                  colors[item.contrastWith]
                )
                  ">
                {{
                  getContrastRatio(colors[item.key], colors[item.contrastWith])
                }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Primary/Accent Colors -->
      <div class="color-section">
        <h3 class="section-title">{{ $t("theme.accentColors") }}</h3>
        <div class="color-grid">
          <div class="color-item" v-for="item in accentColorItems" :key="item.key">
            <label class="color-label">{{ item.label }}</label>
            <div class="color-row">
              <div class="color-swatch" :style="{ backgroundColor: colors[item.key] }" />
              <input type="text" class="color-value-input" v-model="colors[item.key]"
                @input="handleColorChange(item.key)" @blur="validateColor(item.key)" />
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar Colors -->
      <div class="color-section">
        <h3 class="section-title">{{ $t("theme.sidebarColors") }}</h3>
        <div class="color-grid">
          <div class="color-item" v-for="item in sidebarColorItems" :key="item.key">
            <label class="color-label">{{ item.label }}</label>
            <div class="color-row">
              <div class="color-swatch" :style="{ backgroundColor: colors[item.key] }" />
              <input type="text" class="color-value-input" v-model="colors[item.key]"
                @input="handleColorChange(item.key)" @blur="validateColor(item.key)" />
            </div>
          </div>
        </div>
      </div>

      <!-- Card Colors -->
      <div class="color-section">
        <h3 class="section-title">{{ $t("theme.cardColors") }}</h3>
        <div class="color-grid">
          <div class="color-item" v-for="item in cardColorItems" :key="item.key">
            <label class="color-label">{{ item.label }}</label>
            <div class="color-row">
              <div class="color-swatch" :style="{ backgroundColor: colors[item.key] }" />
              <input type="text" class="color-value-input" v-model="colors[item.key]"
                @input="handleColorChange(item.key)" @blur="validateColor(item.key)" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Panel -->
    <div class="preview-panel">
      <ThemePreview :colors="colors" />
    </div>

    <!-- Action Buttons -->
    <div class="editor-actions">
      <button class="btn-reset" @click="handleReset">
        {{ $t("theme.reset") }}
      </button>
      <div class="action-right">
        <button class="btn-cancel" @click="handleCancel">
          {{ $t("common.cancel") }}
        </button>
        <button class="btn-save" @click="handleSave" :disabled="!canSave">
          {{ $t("common.save") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import ThemePreview from "./ThemePreview.vue";
import {
  themeValidator,
  DEFAULT_THEME_TEMPLATE,
} from "@/services/themeValidator.js";
import { accessibilityChecker } from "@/services/accessibilityChecker.js";
import themeManager from "@/styles/theme-config.js";

const { t } = useI18n();

const props = defineProps({
  theme: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: "create", // 'create' or 'edit'
    validator: (v) => ["create", "edit"].includes(v),
  },
});

const emit = defineEmits(["save", "cancel", "preview"]);

// Theme name
const themeName = ref("");
const nameError = ref("");

// Colors reactive object
const colors = reactive({ ...DEFAULT_THEME_TEMPLATE });

// Original colors for reset
const originalColors = ref({ ...DEFAULT_THEME_TEMPLATE });

// Color items configuration
const backgroundColorItems = computed(() => [
  { key: "bg", label: t("theme.colorBg") },
  { key: "bgPrimary", label: t("theme.colorBgPrimary") },
  { key: "bgSecondary", label: t("theme.colorBgSecondary") },
  { key: "bgTertiary", label: t("theme.colorBgTertiary") },
  { key: "bgElevated", label: t("theme.colorBgElevated") },
]);

const textColorItems = computed(() => [
  { key: "text", label: t("theme.colorText"), contrastWith: "bg" },
  {
    key: "textPrimary",
    label: t("theme.colorTextPrimary"),
    contrastWith: "bgPrimary",
  },
  {
    key: "textSecondary",
    label: t("theme.colorTextSecondary"),
    contrastWith: "bgSecondary",
  },
  {
    key: "textTertiary",
    label: t("theme.colorTextTertiary"),
    contrastWith: "bgTertiary",
  },
]);

const accentColorItems = computed(() => [
  { key: "primary", label: t("theme.colorPrimary") },
  { key: "primaryHover", label: t("theme.colorPrimaryHover") },
  { key: "accentColor", label: t("theme.colorAccent") },
  { key: "accentHover", label: t("theme.colorAccentHover") },
  { key: "borderColor", label: t("theme.colorBorder") },
  { key: "dividerColor", label: t("theme.colorDivider") },
]);

const sidebarColorItems = computed(() => [
  { key: "sidebarBg", label: t("theme.colorSidebarBg") },
  { key: "sidebarTextColor", label: t("theme.colorSidebarText") },
  { key: "sidebarHoverBg", label: t("theme.colorSidebarHover") },
  { key: "sidebarActiveBg", label: t("theme.colorSidebarActiveBg") },
  { key: "sidebarActiveColor", label: t("theme.colorSidebarActiveColor") },
]);

const cardColorItems = computed(() => [
  { key: "cardBg", label: t("theme.colorCardBg") },
  { key: "cardShadow", label: t("theme.colorCardShadow") },
  { key: "cardBorder", label: t("theme.colorCardBorder") },
]);

// Accessibility score
const accessibilityScore = computed(() => {
  return accessibilityChecker.getThemeAccessibilityScore(colors);
});

const accessibilityLevel = computed(() => accessibilityScore.value.level);

const accessibilityClass = computed(() => ({
  "badge-aaa": accessibilityLevel.value === "AAA",
  "badge-aa": accessibilityLevel.value === "AA",
  "badge-a": accessibilityLevel.value === "A",
  "badge-fail": accessibilityLevel.value === "FAIL",
}));

const accessibilityIcon = computed(() => {
  const icons = { AAA: "✓✓✓", AA: "✓✓", A: "✓", FAIL: "✗" };
  return icons[accessibilityLevel.value] || "?";
});

const accessibilityTooltip = computed(() => {
  return accessibilityChecker.getLevelDescription(accessibilityLevel.value);
});

// Validation
const canSave = computed(() => {
  if (!themeName.value.trim()) return false;
  if (nameError.value) return false;

  // Validate all colors
  const validation = themeValidator.validateAllColors(colors);
  return validation.valid;
});

// Initialize from props
onMounted(() => {
  if (props.theme) {
    themeName.value = props.theme.name || "";
    if (props.theme.colors) {
      Object.assign(colors, props.theme.colors);
      originalColors.value = { ...props.theme.colors };
    }
  }
});

// Watch for theme prop changes
watch(
  () => props.theme,
  (newTheme) => {
    if (newTheme) {
      themeName.value = newTheme.name || "";
      if (newTheme.colors) {
        Object.assign(colors, newTheme.colors);
        originalColors.value = { ...newTheme.colors };
      }
    }
  },
  { deep: true }
);

// Methods
function validateName() {
  if (!themeName.value.trim()) {
    nameError.value = t("theme.nameRequired");
  } else if (themeName.value.length > 50) {
    nameError.value = t("theme.nameTooLong");
  } else {
    nameError.value = "";
  }
}

function handleColorChange(key) {
  // Emit preview event for real-time preview
  emit("preview", { ...colors });

  // Apply preview to theme manager
  themeManager.previewTheme(colors);
}

function validateColor(key) {
  const validation = themeValidator.validateColor(colors[key]);
  if (!validation.valid) {
    // Revert to original or default
    colors[key] = originalColors.value[key] || DEFAULT_THEME_TEMPLATE[key];
  }
}

function getContrastRatio(fg, bg) {
  const ratio = accessibilityChecker.calculateContrastRatio(fg, bg);
  return ratio.toFixed(1);
}

function getContrastClass(fg, bg) {
  const ratio = accessibilityChecker.calculateContrastRatio(fg, bg);
  const level = accessibilityChecker.checkWCAGCompliance(ratio);
  return {
    "contrast-pass": level === "AAA" || level === "AA",
    "contrast-warn": level === "A",
    "contrast-fail": level === "FAIL",
  };
}

function getContrastTooltip(fg, bg) {
  const ratio = accessibilityChecker.calculateContrastRatio(fg, bg);
  const level = accessibilityChecker.checkWCAGCompliance(ratio);
  return `${t("theme.contrastRatio", { ratio: ratio.toFixed(2) })} - ${level}`;
}

function handleReset() {
  Object.assign(colors, DEFAULT_THEME_TEMPLATE);
  themeManager.previewTheme(colors);
}

function handleCancel() {
  themeManager.cancelPreview();
  emit("cancel");
}

function handleSave() {
  if (!canSave.value) return;

  const themeId = props.theme?.id || generateThemeId(themeName.value);

  const themeData = {
    id: themeId,
    name: themeName.value.trim(),
    type: "custom",
    colors: { ...colors },
    version: 1,
    createdAt: props.theme?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  emit("save", themeData);
}

function generateThemeId(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);

  const suffix = Date.now().toString(36).slice(-4);
  return `custom-${base || "theme"}-${suffix}`;
}
</script>

<style scoped>
.theme-editor {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: var(--bg-secondary, #ffffff);
  border-radius: 12px;
  max-height: 80vh;
  overflow-y: auto;
}

/* Header */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.header-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.theme-name-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 18px;
  font-weight: 600;
  border: 2px solid var(--border-color, rgba(60, 60, 67, 0.1));
  border-radius: 10px;
  background: var(--bg-primary, #f8f9fa);
  color: var(--text-primary, #1c1c1e);
  transition: border-color 0.2s ease;
}

.theme-name-input:focus {
  outline: none;
  border-color: var(--primary, #007aff);
}

.name-error {
  font-size: 12px;
  color: #ff3b30;
}

/* Accessibility Badge */
.accessibility-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.badge-aaa {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
}

.badge-aa {
  background: rgba(0, 122, 255, 0.15);
  color: #007aff;
}

.badge-a {
  background: rgba(255, 149, 0, 0.15);
  color: #ff9500;
}

.badge-fail {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
}

/* Color Sections */
.color-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.color-section {
  background: var(--bg-tertiary, #f2f2f7);
  border-radius: 10px;
  padding: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1c1c1e);
  margin: 0 0 12px 0;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
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
}

.color-value-input {
  flex: 1;
  padding: 8px 10px;
  font-size: 12px;
  font-family: "SF Mono", Monaco, "Courier New", monospace;
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  border-radius: 6px;
  background: var(--bg-secondary, #ffffff);
  color: var(--text-primary, #1c1c1e);
  min-width: 0;
}

.color-value-input:focus {
  outline: none;
  border-color: var(--primary, #007aff);
}

.mini-contrast {
  font-size: 10px;
  padding: 3px 6px;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
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

/* Preview Panel */
.preview-panel {
  margin-top: 10px;
}

/* Action Buttons */
.editor-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
}

.action-right {
  display: flex;
  gap: 10px;
}

.btn-reset,
.btn-cancel,
.btn-save {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-reset {
  background: transparent;
  color: var(--text-secondary, #3a3a3c);
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
}

.btn-reset:hover {
  background: var(--bg-tertiary, #f2f2f7);
}

.btn-cancel {
  background: transparent;
  color: var(--text-primary, #1c1c1e);
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
}

.btn-cancel:hover {
  background: var(--bg-tertiary, #f2f2f7);
}

.btn-save {
  background: var(--primary, #007aff);
  color: white;
  border: none;
}

.btn-save:hover:not(:disabled) {
  background: var(--primary-hover, #0066d6);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 600px) {
  .editor-header {
    flex-direction: column;
  }

  .color-grid {
    grid-template-columns: 1fr;
  }

  .editor-actions {
    flex-direction: column;
    gap: 12px;
  }

  .action-right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
