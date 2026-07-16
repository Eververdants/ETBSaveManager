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
        <div v-if="state.isCreating" class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${state.creationProgress}%` }" />
          </div>
        </div>
        <button
          class="create-btn"
          :disabled="!canCreate"
          @click="handleCreate"
        >
          <font-awesome-icon
            :icon="state.isCreating ? ['fas', 'spinner'] : ['fas', 'plus']"
            :spin="state.isCreating"
          />
          {{ state.isCreating ? $t("quickCreate.creating") : $t("quickCreate.create", { count: archiveNames.length }) }}
        </button>
      </div>
    </header>

    <!-- Main content -->
    <main class="quick-create-main">
      <!-- Ending selector: use :model-value + @update instead of v-model to avoid
           v-model updating state.selectedEnding before selectEnding() can re-select levels -->
      <EndingSelector
        :model-value="state.selectedEnding"
        :endings="endingLabels"
        @update:model-value="selectEnding"
      />

      <!-- Level grid -->
      <LevelCheckGrid
        v-model="state.selectedLevelKeys"
        :levels="currentLevels"
      />

      <!-- Options row -->
      <div class="options-row">
        <div class="option-group">
          <label class="option-label">{{ $t("quickCreate.options.difficulty") }}</label>
          <CustomDropdown
            :model-value="state.difficulty"
            :options="difficultyOptions"
            @update:model-value="setDifficulty"
          />
        </div>
        <div class="option-group">
          <label class="option-label">{{ $t("quickCreate.options.copies") }}</label>
          <NumberSelector
            :model-value="state.copies"
            :min="1"
            :max="99"
            @update:model-value="setCopies"
          />
        </div>
      </div>

      <!-- Preview -->
      <PreviewList :archive-names="archiveNames" />
    </main>

    <!-- Result modal -->
    <Teleport to="body">
      <div v-if="showResultModal" class="result-modal-overlay" @click.self="closeResultModal">
        <div class="result-modal">
          <div class="result-modal-header">
            <h3 class="result-modal-title">
              <font-awesome-icon
                :icon="creationResult?.failed > 0 ? ['fas', 'exclamation-triangle'] : ['fas', 'check-circle']"
                :class="creationResult?.failed > 0 ? 'warning-icon' : 'success-icon'"
              />
              {{ creationResult?.failed > 0 ? $t("quickCreate.result.partialTitle") : $t("quickCreate.result.successTitle") }}
            </h3>
            <button class="close-btn" @click="closeResultModal">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>
          <div class="result-modal-body">
            <div class="result-summary">
              <div class="result-stat success">
                <span class="result-value">{{ creationResult?.success || 0 }}</span>
                <span class="result-label">{{ $t("quickCreate.result.successCount") }}</span>
              </div>
              <div v-if="creationResult?.failed > 0" class="result-stat error">
                <span class="result-value">{{ creationResult?.failed || 0 }}</span>
                <span class="result-label">{{ $t("quickCreate.result.failedCount") }}</span>
              </div>
            </div>
            <div v-if="creationResult?.errors?.length > 0" class="error-details">
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
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ENDINGS_CONFIG } from "@/data/endingsData";
import { useLevelUtils } from "@/utils/levelUtils";
import { useQuickCreateSimplified } from "@/composables/useQuickCreateSimplified";
import { notify } from "@/services/notificationService";
import EndingSelector from "@/components/quickCreate/EndingSelector.vue";
import LevelCheckGrid from "@/components/quickCreate/LevelCheckGrid.vue";
import PreviewList from "@/components/quickCreate/PreviewList.vue";
import CustomDropdown from "@/components/ui/CustomDropdown.vue";
import NumberSelector from "@/components/ui/NumberSelector.vue";

const router = useRouter();
const { t } = useI18n({ useScope: "global" });
const { getLevelName } = useLevelUtils();

const {
  state,
  currentLevels,
  archiveNames,
  canCreate,
  selectEnding,
  setDifficulty,
  setCopies,
  batchCreate,
  reset,
} = useQuickCreateSimplified();

const creationResult = ref(null);
const showResultModal = ref(false);

const endingLabels = computed(() =>
  ENDINGS_CONFIG.map((e) => ({
    id: e.id,
    label: t(`createArchive.endings.${e.labelKey}`),
  }))
);

const difficultyOptions = [
  { value: "easy", label: t("createArchive.difficultyLevels.easy") },
  { value: "normal", label: t("createArchive.difficultyLevels.normal") },
  { value: "hard", label: t("createArchive.difficultyLevels.hard") },
  { value: "nightmare", label: t("createArchive.difficultyLevels.nightmare") },
];

const goBack = () => router.push("/select-create-mode");

const handleCreate = async () => {
  if (!canCreate.value) return;
  try {
    creationResult.value = await batchCreate();
  } catch (error) {
    creationResult.value = {
      success: 0,
      failed: state.selectedLevelKeys.length,
      errors: [{ name: "all", error: String(error?.message || "Unknown error") }],
    };
  }
  if (creationResult.value.success > 0 && creationResult.value.failed === 0) {
    notify.success(t("quickCreate.result.successTitle"));
    setTimeout(() => {
      closeResultModal();
      reset();
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
  reset();
  router.push("/");
};
</script>

<style scoped>
.quick-create-container {
  height: calc(100vh - 38px);
  display: flex; flex-direction: column;
  background: var(--bg-primary);
  padding: var(--space-4);
  gap: var(--space-4);
  overflow: hidden;
}
.quick-create-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}
.header-left { display: flex; align-items: center; gap: var(--space-3); }
.back-button {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; padding: 0;
  background: var(--bg-tertiary); border: 1px solid var(--divider-light);
  border-radius: var(--radius-md); color: var(--text-primary);
  cursor: pointer; transition: all 0.2s ease;
}
.back-button:hover { background: var(--bg-hover); border-color: var(--accent-color); color: var(--accent-color); }
.page-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0; }
.header-right { display: flex; align-items: center; gap: var(--space-3); }
.progress-section { display: flex; align-items: center; gap: var(--space-2); }
.progress-bar { width: 80px; height: 6px; background: var(--bg-tertiary); border-radius: var(--radius-xs); overflow: hidden; }
.progress-fill { height: 100%; background: var(--accent-color); border-radius: var(--radius-xs); transition: width 0.3s ease; }
.create-btn {
  display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--accent-color); border: none;
  border-radius: var(--radius-md); color: white;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s ease;
}
.create-btn:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); }
.create-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.quick-create-main {
  flex: 1; display: flex; flex-direction: column;
  gap: var(--space-3); overflow: hidden; min-height: 0;
}

.options-row {
  display: flex; gap: var(--space-4);
  flex-shrink: 0;
}
.option-group {
  display: flex; align-items: center; gap: var(--space-2);
}
.option-label { font-size: 12px; color: var(--text-secondary); white-space: nowrap; }
:deep(.custom-dropdown) { min-width: 130px; }

/* Result modal */
.result-modal-overlay { /* same as existing */ position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.result-modal { background: var(--bg-secondary); border: 1px solid var(--divider-light); border-radius: var(--radius-lg); width: 90%; max-width: 480px; box-shadow: var(--shadow-lg); animation: modalSlideIn 0.3s ease-out; }
@keyframes modalSlideIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
.result-modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4); border-bottom: 1px solid var(--divider-light); }
.result-modal-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px; }
.result-modal-title .success-icon { color: var(--success-color); }
.result-modal-title .warning-icon { color: var(--warning-color); }
.close-btn { width: 32px; height: 32px; background: transparent; border: none; color: var(--text-tertiary); cursor: pointer; border-radius: var(--radius-sm); }
.close-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }
.result-modal-body { padding: var(--space-4); }
.result-summary { display: flex; gap: var(--space-4); margin-bottom: var(--space-4); }
.result-stat { flex: 1; display: flex; flex-direction: column; align-items: center; padding: var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-md); }
.result-stat.success .result-value { color: var(--success-color); }
.result-stat.error .result-value { color: var(--error-color); }
.result-value { font-size: 2rem; font-weight: 700; }
.result-label { font-size: 12px; color: var(--text-tertiary); margin-top: var(--space-1); }
.error-details { background: var(--bg-tertiary); border-radius: var(--radius-md); padding: var(--space-3); max-height: 150px; overflow-y: auto; }
.error-details-title { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0 0 var(--space-2); }
.error-list { list-style: none; padding: 0; margin: 0; }
.error-item { padding: var(--space-1) 0; border-bottom: 1px solid var(--divider-light); }
.error-item:last-child { border-bottom: none; }
.error-name { font-size: 12px; font-weight: 500; color: var(--text-primary); }
.error-message { font-size: 11px; color: var(--error-color); }
.result-modal-footer { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-4); border-top: 1px solid var(--divider-light); }
.action-btn { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; transition: all 0.2s ease; }
.secondary-btn { background: var(--bg-tertiary); border-color: var(--divider-light); color: var(--text-secondary); }
.secondary-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.primary-btn { background: var(--accent-color); color: white; }
.primary-btn:hover { background: var(--accent-hover); }
</style>
