<template>
  <div class="quick-create-container">
    <!-- Header -->
    <header class="quick-create-header">
      <div class="header-left">
        <button class="back-button" @click="goBack">
          <font-awesome-icon :icon="['fas', 'arrow-left']" />
        </button>
        <h1 class="page-title">{{ $t("quickCreate.title") }}</h1>
      </div>
      <div class="header-right">
        <div v-if="quickCreateState.isCreating" class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${quickCreateState.creationProgress}%` }" />
          </div>
        </div>
        <button class="create-btn" :disabled="!canCreate" @click="handleCreate">
          <font-awesome-icon
            :icon="quickCreateState.isCreating ? ['fas', 'spinner'] : ['fas', 'plus']"
            :spin="quickCreateState.isCreating"
          />
          {{
            quickCreateState.isCreating
              ? $t("quickCreate.creating")
              : $t("quickCreate.create", { count: archiveNames.length })
          }}
        </button>
      </div>
    </header>

    <!-- Main content -->
    <main class="quick-create-main">
      <!-- Left: Level grid (7) -->
      <div class="main-left">
        <LevelCheckGrid v-model="simplifiedState.selectedLevelKeys" :levels="currentLevels" />
      </div>

      <!-- Right: Preview + Options (3) -->
      <div class="main-right">
        <!-- Options -->
        <div class="options-panel">
          <div class="option-group">
            <label class="option-label">{{ $t("quickCreate.options.difficulty") }}</label>
            <CustomDropdown
              :model-value="simplifiedState.difficulty"
              :options="difficultyOptions"
              @update:model-value="setDifficulty"
            />
          </div>
          <div class="option-group">
            <label class="option-label">{{ $t("quickCreate.options.copies") }}</label>
            <NumberSelector :model-value="simplifiedState.copies" :min="1" :max="99" @update:model-value="setCopies" />
          </div>
        </div>

        <!-- Preview -->
        <PreviewList :archive-names="archiveNames" />
      </div>
    </main>

    <!-- Result modal -->
    <BaseModal
      :visible="showResultModal"
      max-width="480px"
      overlay-class="result-modal-overlay"
      card-class="result-modal"
      show-close
      @close="closeResultModal"
    >
      <template #title>
        <span class="result-modal-title">
          <font-awesome-icon
            :icon="(creationResult?.failed ?? 0) > 0 ? ['fas', 'exclamation-triangle'] : ['fas', 'check-circle']"
            :class="(creationResult?.failed ?? 0) > 0 ? 'warning-icon' : 'success-icon'"
          />
          {{
            (creationResult?.failed ?? 0) > 0
              ? $t("quickCreate.result.partialTitle")
              : $t("quickCreate.result.successTitle")
          }}
        </span>
      </template>
      <div class="result-modal-body">
        <div class="result-summary">
          <div class="result-stat success">
            <span class="result-value">{{ creationResult?.success || 0 }}</span>
            <span class="result-label">{{ $t("quickCreate.result.successCount") }}</span>
          </div>
          <div v-if="(creationResult?.failed ?? 0) > 0" class="result-stat error">
            <span class="result-value">{{ creationResult?.failed || 0 }}</span>
            <span class="result-label">{{ $t("quickCreate.result.failedCount") }}</span>
          </div>
        </div>
        <div v-if="creationResult?.errors && creationResult.errors.length > 0" class="error-details">
          <h4 class="error-details-title">{{ $t("quickCreate.result.errorDetails") }}</h4>
          <ul class="error-list">
            <li v-for="(err, idx) in creationResult.errors" :key="idx" class="error-item">
              <span class="error-name">{{ err.name }}</span>
              <span class="error-message">{{ err.error }}</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="result-modal-footer">
        <button class="action-btn secondary-btn" @click="closeResultModal">
          {{ $t("quickCreate.result.continueEditing") }}
        </button>
        <button class="action-btn primary-btn" @click="navigateToArchives">
          <font-awesome-icon :icon="['fas', 'list']" />
          {{ $t("quickCreate.result.viewArchives") }}
        </button>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import type { DifficultyLevel, QuickCreateBatchResult } from "@/types";
import { useQuickCreate } from "@/composables/useQuickCreate";
import { notify } from "@/services/notificationService";
import { ENDING_LEVELS } from "@/data/endingsData";
import LevelCheckGrid from "@/components/quickCreate/LevelCheckGrid.vue";
import PreviewList from "@/components/quickCreate/PreviewList.vue";
import CustomDropdown from "@/components/ui/CustomDropdown.vue";
import NumberSelector from "@/components/ui/NumberSelector.vue";
import BaseModal from "@/components/ui/BaseModal.vue";

const router = useRouter();
const { t } = useI18n({ useScope: "global" });

// Simplified mode: use basic level selection and creation
const simplifiedState = ref({
  selectedLevelKeys: [] as string[],
  difficulty: "normal" as DifficultyLevel,
  copies: 1,
});

const {
  state: quickCreateState,
  batchCreateArchives: quickCreateBatchCreate,
  addArchive,
  updateUniformConfig,
  resetState,
} = useQuickCreate();

const creationResult = ref<QuickCreateBatchResult | null>(null);
const showResultModal = ref(false);

const difficultyOptions = computed(() => [
  { value: "easy", label: t("createArchive.difficultyLevels.easy") },
  { value: "normal", label: t("createArchive.difficultyLevels.normal") },
  { value: "hard", label: t("createArchive.difficultyLevels.hard") },
  { value: "nightmare", label: t("createArchive.difficultyLevels.nightmare") },
]);

// Computed properties for simplified mode
const currentLevels = computed(() => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const key of [0, 1, 2, 3] as const) {
    for (const level of ENDING_LEVELS[key] || []) {
      if (!seen.has(level)) {
        seen.add(level);
        result.push(level);
      }
    }
  }
  return result;
});

const archiveNames = computed(() => {
  const names: string[] = [];
  for (const levelKey of simplifiedState.value.selectedLevelKeys) {
    if (simplifiedState.value.copies <= 1) {
      names.push(levelKey);
    } else {
      for (let i = 1; i <= simplifiedState.value.copies; i++) {
        names.push(`${levelKey}(${i})`);
      }
    }
  }
  return names;
});

const canCreate = computed(() => simplifiedState.value.selectedLevelKeys.length > 0 && !quickCreateState.isCreating);

const setDifficulty = (d: string) => {
  simplifiedState.value.difficulty = d as DifficultyLevel;
};

const setCopies = (n: number) => {
  simplifiedState.value.copies = Math.max(1, n);
};

const goBack = () => router.push("/select-create-mode");

const handleCreate = async () => {
  if (!canCreate.value) return;
  try {
    // Add archives to quick create state
    for (const levelKey of simplifiedState.value.selectedLevelKeys) {
      const copies = simplifiedState.value.copies;
      for (let i = 1; i <= copies; i++) {
        const name = copies > 1 ? `${levelKey}(${i})` : levelKey;
        addArchive(name);
      }
    }
    // Set uniform config
    updateUniformConfig("difficulty", { enabled: true, value: simplifiedState.value.difficulty });
    // Create archives
    creationResult.value = await quickCreateBatchCreate();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    creationResult.value = {
      success: 0,
      failed: simplifiedState.value.selectedLevelKeys.length,
      errors: [{ name: "all", error: errorMessage }],
    };
  }
  if (creationResult.value && creationResult.value.success > 0 && creationResult.value.failed === 0) {
    notify.success(t("quickCreate.result.successTitle"));
    setTimeout(() => {
      closeResultModal();
      resetState();
      simplifiedState.value.selectedLevelKeys = [];
      router.push("/");
    }, 1500);
  } else {
    showResultModal.value = true;
  }
};

const closeResultModal = () => {
  showResultModal.value = false;
  creationResult.value = null;
};

const navigateToArchives = () => {
  closeResultModal();
  resetState();
  simplifiedState.value.selectedLevelKeys = [];
  router.push("/");
};
</script>

<style scoped>
.quick-create-container {
  height: calc(100vh - 38px);
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  padding: var(--space-4);
  gap: var(--space-4);
  overflow: hidden;
}

.quick-create-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: var(--bg-tertiary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.page-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.progress-section {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.progress-bar {
  width: 80px;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-xs);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-color);
  border-radius: var(--radius-xs);
  transition: width 0.3s ease;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--accent-color);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-create-main {
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: var(--space-3);
  overflow: hidden;
  min-height: 0;
}

.main-left {
  flex: 7;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-right {
  flex: 3;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  overflow: hidden;
}

.options-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.option-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.option-label {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

:deep(.custom-dropdown) {
  min-width: 130px;
}

/* Result modal: BaseModal overlay/card tweaks (teleported, so :global) */
:global(.result-modal-overlay) {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

:global(.result-modal) {
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--filter-shadow-lg);
  overflow: hidden;
}

.result-modal-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-modal-title .success-icon {
  color: var(--success-color);
}

.result-modal-title .warning-icon {
  color: var(--warning-color);
}

.result-modal-body {
  padding: var(--space-4);
}

.result-summary {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.result-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-3);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.result-stat.success .result-value {
  color: var(--success-color);
}

.result-stat.error .result-value {
  color: var(--error-color);
}

.result-value {
  font-size: 2rem;
  font-weight: 700;
}

.result-label {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: var(--space-1);
}

.error-details {
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  max-height: 150px;
  overflow-y: auto;
}

.error-details-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-2);
}

.error-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.error-item {
  padding: var(--space-1) 0;
  border-bottom: 1px solid var(--divider-light);
}

.error-item:last-child {
  border-bottom: none;
}

.error-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.error-message {
  font-size: 11px;
  color: var(--error-color);
}

.result-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4);
  border-top: 1px solid var(--divider-light);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.secondary-btn {
  background: var(--bg-tertiary);
  border-color: var(--divider-light);
  color: var(--text-secondary);
}

.secondary-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.primary-btn {
  background: var(--accent-color);
  color: white;
}

.primary-btn:hover {
  background: var(--accent-hover);
}
</style>
