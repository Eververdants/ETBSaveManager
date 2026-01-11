<template>
  <div class="theme-editor-page">
    <!-- Page Header -->
    <div class="page-header">
      <button class="back-btn" @click="goBack" :aria-label="$t('common.back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>{{ $t("common.back") }}</span>
      </button>
      <h1 class="page-title">
        {{
          isEditMode
            ? $t("theme.editThemeTitle")
            : $t("theme.createCustomTheme")
        }}
      </h1>
      <div class="accessibility-badge" :class="accessibilityClass" :title="accessibilityTooltip" role="status"
        :aria-label="$t('theme.accessibilityLevel', { level: accessibilityLevel })
          ">
        <span class="badge-icon">{{ accessibilityIcon }}</span>
        <span class="badge-text">{{ accessibilityLevel }}</span>
      </div>
    </div>

    <!-- Main Editor Content -->
    <div class="editor-content">
      <!-- Left Panel: Color Editor -->
      <div class="color-editor-panel">
        <!-- Theme Name Input -->
        <div class="theme-name-section">
          <label class="section-label" for="theme-name">{{
            $t("theme.themeName")
          }}</label>
          <input id="theme-name" v-model="themeName" type="text" class="theme-name-input"
            :placeholder="$t('theme.themeNamePlaceholder')" :aria-label="$t('theme.themeName')"
            :aria-invalid="!!nameError" @input="validateName" />
          <span v-if="nameError" class="name-error" role="alert">{{
            nameError
          }}</span>
        </div>

        <!-- Color Sections -->
        <div class="color-sections">
          <!-- Background Colors -->
          <ColorSection :title="$t('theme.backgroundColors')" :items="backgroundColorItems" :colors="colors"
            @update:color="handleColorUpdate" />

          <!-- Text Colors -->
          <ColorSection :title="$t('theme.textColors')" :items="textColorItems" :colors="colors"
            @update:color="handleColorUpdate" />

          <!-- Accent Colors -->
          <ColorSection :title="$t('theme.accentColors')" :items="accentColorItems" :colors="colors"
            @update:color="handleColorUpdate" />

          <!-- Sidebar Colors -->
          <ColorSection :title="$t('theme.sidebarColors')" :items="sidebarColorItems" :colors="colors"
            @update:color="handleColorUpdate" />

          <!-- Card Colors -->
          <ColorSection :title="$t('theme.cardColors')" :items="cardColorItems" :colors="colors"
            @update:color="handleColorUpdate" />
        </div>
      </div>

      <!-- Right Panel: Preview -->
      <div class="preview-panel">
        <h3 class="preview-title">{{ $t("theme.preview") }}</h3>
        <ThemePreview :colors="colors" />
      </div>
    </div>

    <!-- Page Footer -->
    <div class="page-footer">
      <button class="btn-reset" @click="handleReset">
        {{ $t("theme.reset") }}
      </button>
      <div class="footer-right">
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
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import ThemePreview from "@/components/ThemePreview.vue";
import ColorSection from "@/components/ColorSection.vue";
import {
  themeValidator,
  DEFAULT_THEME_TEMPLATE,
} from "@/services/themeValidator.js";
import { accessibilityChecker } from "@/services/accessibilityChecker.js";
import themeManager from "@/styles/theme-config.js";
import { themeStorage } from "@/services/themeStorage.js";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

// Determine if we're in edit mode based on route params
const isEditMode = computed(() => !!route.params.themeId);
const themeId = computed(() => route.params.themeId);

// Theme name state
const themeName = ref("");
const nameError = ref("");

// Colors reactive object - initialized with default template
const colors = reactive({ ...DEFAULT_THEME_TEMPLATE });

// Original colors for reset functionality
const originalColors = ref({ ...DEFAULT_THEME_TEMPLATE });
const originalName = ref("");

// Loading state
const isLoading = ref(false);

// Color items configuration for each section
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

// Accessibility score computation
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

// Validation - can save only if name is valid and colors are valid
const canSave = computed(() => {
  if (!themeName.value.trim()) return false;
  if (nameError.value) return false;

  const validation = themeValidator.validateAllColors(colors);
  return validation.valid;
});

// Initialize component
onMounted(async () => {
  if (isEditMode.value && themeId.value) {
    await loadThemeForEditing();
  }
});

// Cleanup on unmount - cancel any preview
onBeforeUnmount(() => {
  themeManager.cancelPreview();
});

// Load existing theme for editing
async function loadThemeForEditing() {
  isLoading.value = true;
  try {
    const theme = await themeStorage.getCustomTheme(themeId.value);
    if (theme) {
      themeName.value = theme.name || "";
      originalName.value = theme.name || "";
      if (theme.colors) {
        Object.assign(colors, themeValidator.mergeWithTemplate(theme.colors));
        originalColors.value = { ...colors };
      }
    } else {
      // Theme not found, redirect back
      console.warn("Theme not found:", themeId.value);
      goBack();
    }
  } catch (error) {
    console.error("Failed to load theme:", error);
    goBack();
  } finally {
    isLoading.value = false;
  }
}

// Validate theme name
function validateName() {
  const name = themeName.value.trim();
  if (!name) {
    nameError.value = t("theme.nameRequired");
  } else if (name.length > 50) {
    nameError.value = t("theme.nameTooLong");
  } else {
    nameError.value = "";
  }
}

// Handle color update from ColorSection
function handleColorUpdate({ key, value }) {
  const validation = themeValidator.validateColor(value);
  if (validation.valid) {
    colors[key] = value;
    // Apply preview in real-time
    themeManager.previewTheme(colors);
  }
}

// Reset colors to original/default
function handleReset() {
  if (isEditMode.value) {
    // Reset to original loaded values
    Object.assign(colors, originalColors.value);
    themeName.value = originalName.value;
  } else {
    // Reset to default template
    Object.assign(colors, DEFAULT_THEME_TEMPLATE);
    themeName.value = "";
  }
  nameError.value = "";
  themeManager.previewTheme(colors);
}

// Cancel and go back
function handleCancel() {
  themeManager.cancelPreview();
  goBack();
}

// Save theme
async function handleSave() {
  if (!canSave.value) return;

  isLoading.value = true;
  try {
    const id = isEditMode.value
      ? themeId.value
      : await generateThemeId(themeName.value);

    const themeData = {
      id,
      name: themeName.value.trim(),
      type: "custom",
      colors: { ...colors },
      version: 1,
      createdAt: isEditMode.value ? undefined : Date.now(),
      updatedAt: Date.now(),
    };

    // If editing, preserve original createdAt
    if (isEditMode.value) {
      const existingTheme = await themeStorage.getCustomTheme(themeId.value);
      if (existingTheme) {
        themeData.createdAt = existingTheme.createdAt;
      }
    }

    const result = await themeManager.addCustomTheme(themeData);

    if (result.success) {
      // Apply the saved theme
      await themeManager.setTheme(id);
      // Navigate back
      goBack();
    } else {
      console.error("Failed to save theme:", result.error);
      // Could show a toast notification here
    }
  } catch (error) {
    console.error("Failed to save theme:", error);
  } finally {
    isLoading.value = false;
  }
}

// Generate unique theme ID
async function generateThemeId(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);

  const suffix = Date.now().toString(36).slice(-4);
  return `custom-${base || "theme"}-${suffix}`;
}

// Navigate back to settings
function goBack() {
  router.push("/settings");
}
</script>

<style scoped>
.theme-editor-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 38px);
  background: var(--bg-primary, #f8f9fa);
  color: var(--text-primary, #1c1c1e);
  overflow: hidden;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: var(--bg-secondary, #ffffff);
  border-bottom: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  gap: 16px;
  flex-shrink: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  border-radius: 8px;
  color: var(--text-primary, #1c1c1e);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: var(--bg-tertiary, #f2f2f7);
}

.back-btn:focus {
  outline: 2px solid var(--primary, #007aff);
  outline-offset: 2px;
}

.back-btn svg {
  flex-shrink: 0;
}

.page-title {
  flex: 1;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary, #1c1c1e);
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
  flex-shrink: 0;
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

.badge-icon {
  font-size: 12px;
}

/* Editor Content */
.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Color Editor Panel (Left) */
.color-editor-panel {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Theme Name Section */
.theme-name-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1c1c1e);
}

.theme-name-input {
  width: 100%;
  max-width: 400px;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 500;
  border: 2px solid var(--border-color, rgba(60, 60, 67, 0.1));
  border-radius: 10px;
  background: var(--bg-secondary, #ffffff);
  color: var(--text-primary, #1c1c1e);
  transition: border-color 0.2s ease;
}

.theme-name-input:focus {
  outline: none;
  border-color: var(--primary, #007aff);
}

.theme-name-input::placeholder {
  color: var(--text-tertiary, #8e8e93);
}

.name-error {
  font-size: 12px;
  color: #ff3b30;
}

/* Color Sections Container */
.color-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Preview Panel (Right) */
.preview-panel {
  width: 380px;
  padding: 24px;
  border-left: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  background: var(--bg-secondary, #ffffff);
  overflow-y: auto;
  flex-shrink: 0;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1c1c1e);
  margin: 0 0 16px 0;
}

/* Page Footer */
.page-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--bg-secondary, #ffffff);
  border-top: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  flex-shrink: 0;
}

.footer-right {
  display: flex;
  gap: 12px;
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

.btn-reset:focus {
  outline: 2px solid var(--primary, #007aff);
  outline-offset: 2px;
}

.btn-cancel {
  background: transparent;
  color: var(--text-primary, #1c1c1e);
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
}

.btn-cancel:hover {
  background: var(--bg-tertiary, #f2f2f7);
}

.btn-cancel:focus {
  outline: 2px solid var(--primary, #007aff);
  outline-offset: 2px;
}

.btn-save {
  background: var(--primary, #007aff);
  color: white;
  border: none;
}

.btn-save:hover:not(:disabled) {
  background: var(--primary-hover, #0066d6);
}

.btn-save:focus:not(:disabled) {
  outline: 2px solid var(--primary, #007aff);
  outline-offset: 2px;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 900px) {
  .editor-content {
    flex-direction: column;
  }

  .preview-panel {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
    max-height: 300px;
  }

  .color-editor-panel {
    padding: 16px;
  }

  .preview-panel {
    padding: 16px;
  }
}

@media (max-width: 600px) {
  .page-header {
    flex-wrap: wrap;
    padding: 12px 16px;
  }

  .back-btn span {
    display: none;
  }

  .page-title {
    font-size: 18px;
    order: 3;
    width: 100%;
    margin-top: 8px;
  }

  .accessibility-badge {
    margin-left: auto;
  }

  .page-footer {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }

  .btn-reset {
    width: 100%;
  }

  .footer-right {
    width: 100%;
    justify-content: flex-end;
  }

  .theme-name-input {
    max-width: 100%;
  }
}

/* Scrollbar styling */
.color-editor-panel::-webkit-scrollbar,
.preview-panel::-webkit-scrollbar {
  width: 8px;
}

.color-editor-panel::-webkit-scrollbar-track,
.preview-panel::-webkit-scrollbar-track {
  background: var(--scrollbar-track, rgba(200, 200, 205, 0.3));
  border-radius: 4px;
}

.color-editor-panel::-webkit-scrollbar-thumb,
.preview-panel::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, rgba(180, 180, 185, 0.5));
  border-radius: 4px;
}

.color-editor-panel::-webkit-scrollbar-thumb:hover,
.preview-panel::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, rgba(160, 160, 165, 0.7));
}
</style>
