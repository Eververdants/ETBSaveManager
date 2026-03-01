<template>
  <div class="theme-list">
    <!-- Header with Import/Export -->
    <div class="list-header">
      <h3 class="list-title">{{ $t("theme.themeList") }}</h3>
      <div class="header-actions">
        <button class="btn-icon" @click="handleImport" :title="$t('theme.importTheme')"
          :aria-label="$t('theme.importTheme')">
          <span class="icon">📥</span>
        </button>
      </div>
    </div>

    <!-- Preset Themes Section -->
    <div class="theme-section">
      <h4 class="section-title">{{ $t("theme.presetThemes") }}</h4>
      <div class="theme-grid">
        <div v-for="theme in presetThemes" :key="theme.id" class="theme-card"
          :class="{ active: currentThemeId === theme.id }" @click="selectTheme(theme.id)" role="button"
          :aria-pressed="currentThemeId === theme.id" :aria-label="theme.name" tabindex="0"
          @keydown.enter="selectTheme(theme.id)" @keydown.space.prevent="selectTheme(theme.id)">
          <div class="theme-preview-mini" :class="`preview-${theme.id}`">
            <div class="mini-sidebar"></div>
            <div class="mini-content">
              <div class="mini-card"></div>
            </div>
          </div>
          <div class="theme-info">
            <span class="theme-name">{{ theme.name }}</span>
            <span v-if="currentThemeId === theme.id" class="active-indicator">
              {{ $t("theme.current") }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Themes Section -->
    <div class="theme-section" v-if="customThemes.length > 0 || showEmptyState">
      <h4 class="section-title">
        {{ $t("theme.customThemes") }}
        <span class="theme-count">({{ customThemes.length }}/10)</span>
      </h4>

      <div v-if="customThemes.length === 0" class="empty-state">
        <span class="empty-icon">🎨</span>
        <p class="empty-text">{{ $t("theme.noCustomThemes") }}</p>
      </div>

      <div v-else class="theme-grid">
        <div v-for="theme in customThemes" :key="theme.id" class="theme-card custom"
          :class="{ active: currentThemeId === theme.id }" @click="selectTheme(theme.id)" role="button"
          :aria-pressed="currentThemeId === theme.id" :aria-label="theme.name" tabindex="0"
          @keydown.enter="selectTheme(theme.id)" @keydown.space.prevent="selectTheme(theme.id)">
          <div class="theme-preview-mini custom-preview" :style="getCustomPreviewStyle(theme)">
            <div class="mini-sidebar"></div>
            <div class="mini-content">
              <div class="mini-card"></div>
            </div>
          </div>
          <div class="theme-info">
            <span class="theme-name">{{ theme.name }}</span>
            <span v-if="currentThemeId === theme.id" class="active-indicator">
              {{ $t("theme.current") }}
            </span>
          </div>
          <div class="theme-actions" @click.stop>
            <button class="btn-action" @click="handleEdit(theme)" :title="$t('common.edit')"
              :aria-label="$t('theme.editTheme', { name: theme.name })">
              ✏️
            </button>
            <button class="btn-action" @click="handleExport(theme)" :title="$t('theme.exportTheme')"
              :aria-label="$t('theme.exportThemeNamed', { name: theme.name })">
              📤
            </button>
            <button class="btn-action delete" @click="handleDelete(theme)" :title="$t('common.delete')"
              :aria-label="$t('theme.deleteTheme', { name: theme.name })">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Button -->
    <button class="btn-create" @click="handleCreate" :disabled="customThemes.length >= 10">
      <span class="create-icon">+</span>
      {{ $t("theme.createCustomTheme") }}
    </button>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal-content" role="dialog" aria-modal="true">
        <h3 class="modal-title">{{ $t("theme.confirmDelete") }}</h3>
        <p class="modal-text">
          {{ $t("theme.deleteConfirmText", { name: themeToDelete?.name }) }}
        </p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelDelete">
            {{ $t("common.cancel") }}
          </button>
          <button class="btn-delete" @click="confirmDelete">
            {{ $t("common.delete") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import themeManager, { PRESET_THEMES } from "@/styles/theme-config.js";
import { themeStorage } from "@/services/themeStorage.js";

const { t, te } = useI18n();

const props = defineProps({
  showEmptyState: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  "create",
  "edit",
  "delete",
  "select",
  "import",
  "export",
]);

const getThemeName = (themeId) => {
  const themeIdToKey = {
    light: "light",
    dark: "dark",
    "new-year": "newYear",
    "high-contrast": "highContrast",
    "spring-festival-dark": "springFestivalDark",
    "spring-festival-light": "springFestivalLight",
  };
  const translationKey = `common.${themeIdToKey[themeId] || themeId}`;
  return te(translationKey) ? t(translationKey) : themeId;
};

// State
const showDeleteConfirm = ref(false);
const themeToDelete = ref(null);

// Computed
const presetThemes = computed(() => {
  return themeManager
    .getAllThemes()
    .filter((theme) => theme.type === "preset")
    .map((theme) => {
      const themeName = getThemeName(theme.id);
      return {
        ...theme,
        name: themeName,
        displayName: theme.icon
          ? `${theme.icon} ${themeName}`
          : themeName,
      };
    });
});

const customThemes = computed(() => themeManager.customThemes.value);

const currentThemeId = computed(() => themeManager.currentThemeId.value);

// Methods
function selectTheme(themeId) {
  themeManager.setTheme(themeId);
  emit("select", themeId);
}

function handleCreate() {
  if (customThemes.value.length >= 10) {
    return;
  }
  emit("create");
}

function handleEdit(theme) {
  emit("edit", theme);
}

function handleDelete(theme) {
  themeToDelete.value = theme;
  showDeleteConfirm.value = true;
}

function cancelDelete() {
  showDeleteConfirm.value = false;
  themeToDelete.value = null;
}

async function confirmDelete() {
  if (!themeToDelete.value) return;

  const success = await themeManager.deleteCustomTheme(themeToDelete.value.id);

  if (success) {
    emit("delete", themeToDelete.value);
  }

  showDeleteConfirm.value = false;
  themeToDelete.value = null;
}

async function handleImport() {
  emit("import");
}

function handleExport(theme) {
  emit("export", theme);
}

function getCustomPreviewStyle(theme) {
  if (!theme.colors) return {};

  return {
    "--preview-bg": theme.colors.bg || "#f8f9fa",
    "--preview-sidebar": theme.colors.sidebarBg || "rgba(240, 240, 245, 0.8)",
    "--preview-card": theme.colors.cardBg || "#ffffff",
    "--preview-primary": theme.colors.primary || "#007aff",
  };
}

// Initialize
onMounted(async () => {
  await themeManager.refreshCustomThemes();
});
</script>

<style scoped>
.theme-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Header */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1c1c1e);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary, #f2f2f7);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-icon:hover {
  background: var(--bg-secondary, #ffffff);
}

.icon {
  font-size: 16px;
}

/* Sections */
.theme-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #3a3a3c);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.theme-count {
  font-weight: 400;
  color: var(--text-tertiary, #8e8e93);
}

/* Theme Grid */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

/* Theme Card */
.theme-card {
  background: var(--bg-secondary, #ffffff);
  border: 2px solid var(--border-color, rgba(60, 60, 67, 0.1));
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.theme-card:hover {
  border-color: var(--primary, #007aff);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.theme-card:focus {
  outline: none;
  border-color: var(--primary, #007aff);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
}

.theme-card.active {
  border-color: var(--primary, #007aff);
  background: rgba(0, 122, 255, 0.05);
}

/* Mini Preview */
.theme-preview-mini {
  width: 100%;
  height: 70px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  margin-bottom: 8px;
}

.mini-sidebar {
  width: 25%;
  height: 100%;
}

.mini-content {
  flex: 1;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-card {
  width: 80%;
  height: 60%;
  border-radius: 4px;
}

/* Preset theme previews */
.preview-light {
  background: #f8f9fa;
}

.preview-light .mini-sidebar {
  background: rgba(240, 240, 245, 0.8);
}

.preview-light .mini-card {
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.preview-dark {
  background: #1c1c1e;
}

.preview-dark .mini-sidebar {
  background: rgba(44, 44, 46, 0.9);
}

.preview-dark .mini-card {
  background: #2c2c2e;
}

.preview-new-year {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%);
}

.preview-new-year .mini-sidebar {
  background: rgba(255, 255, 255, 0.2);
}

.preview-new-year .mini-card {
  background: rgba(255, 255, 255, 0.9);
}

/* 春节深色主题预览 - 紫檀+琥珀 */
.preview-spring-festival-dark {
  background: linear-gradient(135deg, #1c0a14 0%, #2d1020 100%);
}

.preview-spring-festival-dark .mini-sidebar {
  background: rgba(202, 138, 4, 0.12);
}

.preview-spring-festival-dark .mini-card {
  background: rgba(45, 16, 32, 0.9);
  border: 1px solid rgba(202, 138, 4, 0.35);
}

/* 春节浅色主题预览 - 宣纸+大红 */
.preview-spring-festival-light {
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
}

.preview-spring-festival-light .mini-sidebar {
  background: rgba(190, 18, 60, 0.08);
}

.preview-spring-festival-light .mini-card {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(190, 18, 60, 0.2);
}

/* Custom theme preview */
.custom-preview {
  background: var(--preview-bg, #f8f9fa);
}

.custom-preview .mini-sidebar {
  background: var(--preview-sidebar, rgba(240, 240, 245, 0.8));
}

.custom-preview .mini-card {
  background: var(--preview-card, #ffffff);
  border: 1px solid var(--preview-primary, #007aff);
}

/* Theme Info */
.theme-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.theme-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, #1c1c1e);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.active-indicator {
  font-size: 11px;
  color: var(--primary, #007aff);
  font-weight: 500;
}

/* Theme Actions */
.theme-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.theme-card:hover .theme-actions {
  opacity: 1;
}

.btn-action {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary, #ffffff);
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s ease;
}

.btn-action:hover {
  background: var(--bg-tertiary, #f2f2f7);
}

.btn-action.delete:hover {
  background: rgba(255, 59, 48, 0.1);
  border-color: #ff3b30;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
  background: var(--bg-tertiary, #f2f2f7);
  border-radius: 12px;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 14px;
  color: var(--text-secondary, #3a3a3c);
  margin: 0;
}

/* Create Button */
.btn-create {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: var(--primary, #007aff);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-create:hover:not(:disabled) {
  background: var(--primary-hover, #0066d6);
}

.btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.create-icon {
  font-size: 18px;
  font-weight: 300;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-secondary, #ffffff);
  border-radius: 14px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #1c1c1e);
  margin: 0 0 12px 0;
}

.modal-text {
  font-size: 14px;
  color: var(--text-secondary, #3a3a3c);
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel,
.btn-delete {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: var(--bg-tertiary, #f2f2f7);
  color: var(--text-primary, #1c1c1e);
  border: none;
}

.btn-cancel:hover {
  background: var(--border-color, rgba(60, 60, 67, 0.1));
}

.btn-delete {
  background: #ff3b30;
  color: white;
  border: none;
}

.btn-delete:hover {
  background: #e0342b;
}

/* Responsive */
@media (max-width: 480px) {
  .theme-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
