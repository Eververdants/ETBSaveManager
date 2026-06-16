<template>
  <div class="quick-create-container">
    <!-- Top action bar (rounded rectangle with navigation + stats + actions) -->
    <header class="quick-create-header">
      <!-- Left side: back button + title -->
      <div class="header-left">
        <button class="back-button" @click="goBack">
          <font-awesome-icon :icon="['fas', 'arrow-left']" />
        </button>
        <h1 class="page-title">{{ $t("quickCreate.title") }}</h1>
      </div>

      <!-- Center: statistics -->
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-value">{{ state.archives.length }}</span>
          <span class="stat-label">{{ $t("quickCreate.preview.total") }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ summaryStats.uniformCount }}</span>
          <span class="stat-label">{{ $t("quickCreate.preview.uniform") }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ summaryStats.individualCount }}</span>
          <span class="stat-label">{{ $t("quickCreate.preview.individual") }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item" :class="{ 'has-error': summaryStats.missingCount > 0 }">
          <span class="stat-value">{{ summaryStats.missingCount }}</span>
          <span class="stat-label">{{ $t("quickCreate.preview.missing") }}</span>
        </div>
        <div v-if="state.archives.length > 0" class="stat-divider"></div>
        <div v-if="state.archives.length > 0" class="stat-item estimated-time">
          <font-awesome-icon :icon="['fas', 'clock']" class="time-icon" />
          <span class="time-text">{{ $t("quickCreate.preview.estimatedTime", { time: estimatedTime }) }}</span>
        </div>
      </div>

      <!-- Right side: action buttons -->
      <div class="header-actions">
        <!-- Progress bar (shown during creation) -->
        <div v-if="state.isCreating" class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${state.creationProgress}%` }"></div>
          </div>
          <span class="progress-text">{{ Math.round(state.creationProgress) }}%</span>
        </div>

        <button
          class="action-btn template-btn"
          :disabled="state.isCreating || state.archives.length === 0"
          @click="handleSaveTemplate"
        >
          <font-awesome-icon :icon="['fas', 'save']" />
          {{ $t("quickCreate.preview.saveTemplate") }}
        </button>

        <button
          class="create-btn"
          :disabled="!canCreate || state.isCreating"
          :title="createButtonTooltip"
          @click="handleCreate"
        >
          <font-awesome-icon :icon="state.isCreating ? ['fas', 'spinner'] : ['fas', 'plus']" :spin="state.isCreating" />
          {{ createButtonText }}
        </button>
      </div>
    </header>

    <!-- Main content area -->
    <main class="quick-create-main">
      <!-- Left sidebar: smart input + uniform config -->
      <aside class="left-sidebar">
        <!-- Smart input area -->
        <SmartInputArea
          v-model="inputNames"
          :archive-count="state.archives.length"
          :level-detected-count="detectedStats.levelCount"
          :difficulty-detected-count="detectedStats.difficultyCount"
          @parse-complete="onParseComplete"
          @manual-add="handleManualAdd"
          @load-template="handleLoadTemplate"
        />

        <!-- Uniform config area -->
        <UniformConfigPanel
          :config="state.uniformConfig"
          :smart-rules="state.smartRules"
          @update:config="handleConfigUpdate"
          @update:smart-rules="handleSmartRulesUpdate"
        />
      </aside>

      <!-- Right main area: archive preview card flow -->
      <section class="card-flow-area">
        <ArchiveCardFlow
          :archives="state.archives"
          :selected-ids="state.selectedArchiveIds"
          :uniform-config="state.uniformConfig"
          :smart-rules="state.smartRules"
          @select="toggleArchiveSelection"
          @select-all="selectAll"
          @invert-selection="invertSelection"
          @edit="openEditModal"
          @copy="copyArchive"
          @remove="removeArchive"
          @batch-edit="openBatchEditModal"
        />
      </section>
    </main>

    <!-- Individual archive edit modal -->
    <ArchiveEditModal
      :visible="state.showIndividualEditModal"
      :archive="editingArchive"
      :available-levels="availableLevels"
      @close="closeEditModal"
      @save="handleEditSave"
    />

    <!-- Batch edit modal -->
    <BatchEditModal
      :visible="state.showBatchEditModal"
      :selected-count="state.selectedArchiveIds.size"
      :available-levels="availableLevels"
      @close="closeBatchEditModal"
      @apply="handleBatchEditApply"
    />

    <!-- Creation result modal -->
    <Teleport to="body">
      <div v-if="showResultModal" class="result-modal-overlay" @click.self="closeResultModal">
        <div class="result-modal">
          <div class="result-modal-header">
            <h3 class="result-modal-title">
              <font-awesome-icon
                :icon="creationResult?.failed > 0 ? ['fas', 'exclamation-triangle'] : ['fas', 'check-circle']"
                :class="creationResult?.failed > 0 ? 'warning-icon' : 'success-icon'"
              />
              {{
                creationResult?.failed > 0
                  ? $t("quickCreate.result.partialTitle")
                  : $t("quickCreate.result.successTitle")
              }}
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

            <!-- Error details -->
            <div v-if="creationResult?.errors?.length > 0" class="error-details">
              <h4 class="error-details-title">
                {{ $t("quickCreate.result.errorDetails") }}
              </h4>
              <ul class="error-list">
                <li v-for="(error, index) in creationResult.errors" :key="index" class="error-item">
                  <span class="error-name">{{ error.name }}</span>
                  <span class="error-message">{{ error.error }}</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="result-modal-footer">
            <button class="action-btn secondary-btn" @click="closeResultModal">
              {{ $t("quickCreate.result.continueEditing") }}
            </button>
            <!-- Requirements 19.3, 19.4: Show different navigation buttons based on creation count -->
            <button
              v-if="creationResult?.success === 1 && creationResult?.failed === 0"
              class="action-btn primary-btn"
              @click="editSingleArchive"
            >
              <font-awesome-icon :icon="['fas', 'edit']" />
              {{ $t("quickCreate.result.editArchive") }}
            </button>
            <button v-else class="action-btn primary-btn" @click="navigateToArchives">
              <font-awesome-icon :icon="['fas', 'list']" />
              {{ $t("quickCreate.result.viewArchives") }}
            </button>
          </div>
        </div>
      </div>

      <!-- Large data warning modal -->
      <div v-if="showLargeDataWarning" class="result-modal-overlay" @click.self="dismissLargeDataWarning">
        <div class="result-modal large-data-warning-modal">
          <div class="result-modal-header">
            <h3 class="result-modal-title">
              <font-awesome-icon :icon="['fas', 'exclamation-triangle']" class="warning-icon" />
              {{ $t("quickCreate.largeData.title") }}
            </h3>
            <button class="close-btn" @click="dismissLargeDataWarning">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>

          <div class="result-modal-body">
            <p class="large-data-message">
              <template v-if="largeDataWarningInfo?.type === 'very_large_input'">
                {{
                  $t("quickCreate.largeData.veryLargeMessage", {
                    count: largeDataWarningInfo?.count || 0,
                    threshold: VERY_LARGE_NAME_THRESHOLD,
                  })
                }}
              </template>
              <template v-else>
                {{
                  $t("quickCreate.largeData.largeMessage", {
                    count: largeDataWarningInfo?.count || 0,
                    threshold: LARGE_ARCHIVE_THRESHOLD,
                  })
                }}
              </template>
            </p>
            <div class="large-data-tips">
              <p class="tip-item">
                <font-awesome-icon :icon="['fas', 'lightbulb']" />
                {{ $t("quickCreate.largeData.tip1") }}
              </p>
              <p class="tip-item">
                <font-awesome-icon :icon="['fas', 'lightbulb']" />
                {{ $t("quickCreate.largeData.tip2") }}
              </p>
            </div>
          </div>

          <div class="result-modal-footer">
            <button class="action-btn primary-btn" @click="dismissLargeDataWarning">
              <font-awesome-icon :icon="['fas', 'check']" />
              {{ $t("quickCreate.largeData.understand") }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Tutorial overlay -->
    <TutorialOverlay :visible="showTutorial" @close="closeTutorial" @skip="closeTutorial" @complete="closeTutorial" />
  </div>
</template>

<script>
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useQuickCreate } from "@/composables/useQuickCreate";
import { useToast } from "@/composables/useToast";
import storage from "@/services/storageService";
import SmartInputArea from "@/components/feature/SmartInputArea.vue";
import UniformConfigPanel from "@/components/system/UniformConfigPanel.vue";
import ArchiveCardFlow from "@/components/archive/ArchiveCardFlow.vue";
import ArchiveEditModal from "@/components/modal/ArchiveEditModal.vue";
import BatchEditModal from "@/components/modal/BatchEditModal.vue";
import TutorialOverlay from "@/components/feature/TutorialOverlay.vue";

export default {
  name: "QuickCreateArchive",
  components: {
    SmartInputArea,
    UniformConfigPanel,
    ArchiveCardFlow,
    ArchiveEditModal,
    BatchEditModal,
    TutorialOverlay,
  },
  setup() {
    const router = useRouter();
    const { t, te } = useI18n({ useScope: "global" });
    const { showSuccess, showError, showInfo } = useToast();

    const getLevelName = (levelKey) => {
      const translationKey = `LevelName_Display.${levelKey}`;
      return te(translationKey) ? t(translationKey) : levelKey;
    };

    // Creation result state
    const creationResult = ref(null);
    const showResultModal = ref(false);

    // Large data warning state
    const showLargeDataWarning = ref(false);
    const largeDataWarningInfo = ref(null);

    // Tutorial state
    const showTutorial = ref(false);

    const {
      state,
      summaryStats,
      canCreate,
      addArchives,
      removeArchive,
      clearArchives,
      updateUniformConfig,
      updateSmartRules,
      selectAll,
      invertSelection,
      toggleArchiveSelection,
      resetState,
      copyArchive,
      updateArchive,
      batchUpdateSelected,
      batchCreateArchives,
      // Interruption handling
      registerBeforeUnloadWarning,
      unregisterBeforeUnloadWarning,
      // Large data warnings
      hasLargeData,
      hasVeryLargeData,
      largeDataWarnings,
      LARGE_ARCHIVE_THRESHOLD,
      VERY_LARGE_NAME_THRESHOLD,
      // Recalculate
      recalculateArchives,
    } = useQuickCreate();

    const inputNames = ref([]);

    // Detection statistics (computed from archives)
    const detectedStats = computed(() => {
      let levelCount = 0;
      let difficultyCount = 0;
      for (const archive of state.archives) {
        if (archive.parsedInfo?.levelKeyword) levelCount++;
        if (archive.parsedInfo?.difficultyKeyword) difficultyCount++;
      }
      return { levelCount, difficultyCount };
    });

    // Calculate estimated time (Rust backend is fast, ~0.3s per archive)
    const estimatedTime = computed(() => {
      const count = state.archives.length;
      if (count === 0) return "0s";

      // ~0.3s per archive, plus batch processing delay
      const batches = Math.ceil(count / 5);
      const archiveTime = count * 0.3; // 0.3 seconds per archive
      const batchDelay = (batches - 1) * 0.1; // Delay between batches
      const totalSeconds = Math.ceil(archiveTime + batchDelay);

      if (totalSeconds < 1) {
        return "<1s";
      } else if (totalSeconds < 60) {
        return `${totalSeconds}s`;
      } else {
        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
      }
    });

    // Create button text
    const createButtonText = computed(() => {
      if (state.isCreating) {
        return t("quickCreate.preview.creating");
      }
      const count = state.selectedArchiveIds.size > 0 ? state.selectedArchiveIds.size : state.archives.length;
      return t("quickCreate.preview.create", { count });
    });

    // Create button tooltip
    const createButtonTooltip = computed(() => {
      if (state.archives.length === 0) {
        return t("quickCreate.preview.noArchives");
      }
      if (summaryStats.value.missingCount > 0) {
        return t("quickCreate.preview.hasMissingParams", {
          count: summaryStats.value.missingCount,
        });
      }
      return "";
    });

    // Available levels list
    const availableLevels = computed(() => {
      const levels = [
        "Level0",
        "TopFloor",
        "MiddleFloor",
        "GarageLevel2",
        "BottomFloor",
        "TheHub",
        "Pipes1",
        "ElectricalStation",
        "Office",
        "Hotel",
        "Floor3",
        "BoilerRoom",
        "Pipes2",
        "LevelFun",
        "Poolrooms",
        "LevelRun",
        "TheEnd",
        "Level922",
        "Level94",
        "AnimatedKingdom",
        "LightsOut",
        "OceanMap",
        "CaveLevel",
        "Level05",
        "Level9",
        "AbandonedBase",
        "Level10",
        "Level3999",
        "Level07",
        "Snackrooms",
        "LevelDash",
        "Level188_Expanded",
        "Poolrooms_Expanded",
        "WaterPark_Level01_P",
        "WaterPark_Level02_P",
        "WaterPark_Level03_P",
        "LevelFun_Expanded",
        "Zone1_Modified",
        "Zone2_Modified",
        "Zone3_Baked",
        "Zone4",
        "Level52",
        "TunnelLevel",
        "Bunker",
        "GraffitiLevel",
        "Grassrooms_Expanded",
        "Level974",
        "LevelCheat",
      ];
      return levels.map((level) => ({
        value: level,
        label: getLevelName(level),
      }));
    });

    // Currently editing archive
    const editingArchive = computed(() => {
      if (state.editingArchiveId) {
        return state.archives.find((a) => a.id === state.editingArchiveId) || null;
      }
      return null;
    });

    // Flag: whether state is being restored (used to disable inputNames watcher)
    const isRestoringState = ref(false);

    watch(
      inputNames,
      (newNames) => {
        // If restoring state, skip processing
        if (isRestoringState.value) {
          return;
        }

        clearArchives();
        if (newNames.length > 0) {
          // Check if exceeding very large data threshold
          if (newNames.length > VERY_LARGE_NAME_THRESHOLD) {
            largeDataWarningInfo.value = {
              type: "very_large_input",
              count: newNames.length,
              threshold: VERY_LARGE_NAME_THRESHOLD,
            };
            showLargeDataWarning.value = true;
          }

          const result = addArchives(newNames);

          // Check for large data warnings after adding
          if (result.warnings && result.warnings.length > 0) {
            const largeCountWarning = result.warnings.find((w) => w.type === "large_archive_count");
            if (largeCountWarning && !showLargeDataWarning.value) {
              largeDataWarningInfo.value = largeCountWarning;
              showLargeDataWarning.value = true;
            }
          }
        }
      },
      { deep: true },
    );

    const goBack = () => {
      router.push("/select-create-mode");
    };

    /**
     * Switch to classic mode
     * Requirements: 19.1 - Provide mode switch button
     * Requirements: 19.2 - Bring config from classic mode
     */
    const switchToClassicMode = () => {
      // If there's a uniform config, pass it to classic mode via query params
      const query = {};

      // Pass level settings from uniform config
      if (state.uniformConfig.level.enabled && state.uniformConfig.level.value) {
        query.level = state.uniformConfig.level.value;
      }

      // Pass difficulty settings from uniform config
      if (state.uniformConfig.difficulty.enabled && state.uniformConfig.difficulty.value) {
        query.difficulty = state.uniformConfig.difficulty.value;
      }

      // Pass actual difficulty settings from uniform config
      if (state.uniformConfig.actualDifficulty.enabled && state.uniformConfig.actualDifficulty.value) {
        query.actualDifficulty = state.uniformConfig.actualDifficulty.value;
      }

      router.push({ path: "/create-archive", query });
    };

    const onParseComplete = (count) => {
      console.log(`Parsed ${count} names`);
    };

    /**
     * Handle manual add - navigate to classic mode to configure archive
     * Classic mode will send configuration data back when done
     */
    const handleManualAdd = () => {
      // Save current state to sessionStorage for restoration when returning
      if (state.archives.length > 0) {
        const currentState = {
          archives: state.archives.map((a) => ({
            id: a.id,
            name: a.name,
            level: a.level,
            difficulty: a.difficulty,
            actualDifficulty: a.actualDifficulty,
            inventoryTemplate: a.inventoryTemplate,
            parsedInfo: a.parsedInfo,
          })),
          uniformConfig: state.uniformConfig,
          smartRules: state.smartRules,
        };
        sessionStorage.setItem("quickModeCurrentState", JSON.stringify(currentState));
      }

      // Navigate to classic mode with quickMode parameter indicating it came from quick mode
      router.push({ path: "/create-archive", query: { quickMode: "true" } });
    };

    const handleCreate = async () => {
      if (!canCreate.value || state.isCreating) return;

      try {
        const results = await batchCreateArchives();

        // Save results for display
        creationResult.value = results;

        if (results.success > 0) {
          // Show success toast
          const successMessage =
            results.failed > 0
              ? t("quickCreate.result.partialSuccess", {
                  success: results.success,
                  failed: results.failed,
                })
              : t("quickCreate.result.success", { count: results.success });

          showSuccess(successMessage, "✓");

          // If all succeeded, clear the list
          if (results.failed === 0) {
            resetState();
            inputNames.value = [];

            // Delay navigation so user can see success notification
            setTimeout(() => {
              router.push("/");
            }, 1500);
          } else {
            // Partial failure, show result modal
            showResultModal.value = true;
          }
        } else if (results.failed > 0) {
          // All failed, show error
          showError(t("quickCreate.result.failed"), "✗");
          showResultModal.value = true;
        }
      } catch (error) {
        console.error("Batch creation failed:", error);
        showError(t("quickCreate.result.error") + ": " + (error.message || "Unknown error"), "✗");
      }
    };

    // Close result modal
    const closeResultModal = () => {
      showResultModal.value = false;
      creationResult.value = null;
    };

    // Navigate to archive management page
    const navigateToArchives = () => {
      closeResultModal();
      resetState();
      inputNames.value = [];
      router.push("/");
    };

    /**
     * Edit single archive - navigate to classic mode for editing
     * Requirements: 19.3 - Show "Edit this archive" when only one archive exists
     */
    const editSingleArchive = () => {
      closeResultModal();
      // Get the last created archive name for locating in archive list
      const lastCreatedName = creationResult.value?.lastCreatedName;
      resetState();
      inputNames.value = [];
      // Navigate to home (archive list), where archives can be edited
      router.push({ path: "/", query: { highlight: lastCreatedName } });
    };

    /**
     * Save as template
     * Let user choose save path and save current configuration as a JSON template file
     */
    const handleSaveTemplate = async () => {
      if (state.archives.length === 0) {
        showError(t("quickCreate.template.noArchives"), "⚠️");
        return;
      }

      try {
        // Dynamically import Tauri API
        const { save } = await import("@tauri-apps/plugin-dialog");
        const { writeTextFile } = await import("@tauri-apps/plugin-fs");

        // Open save dialog
        const filePath = await save({
          title: t("quickCreate.template.saveTitle"),
          defaultPath: "quick-create-template.json",
          filters: [
            {
              name: "JSON",
              extensions: ["json"],
            },
          ],
        });

        if (!filePath) {
          // User cancelled the save
          return;
        }

        // Build template data
        const templateData = {
          version: "1.0",
          createdAt: new Date().toISOString(),
          archives: state.archives.map((archive) => ({
            name: archive.name,
            level: archive.level,
            difficulty: archive.difficulty,
            actualDifficulty: archive.actualDifficulty,
            inventoryTemplate: archive.inventoryTemplate,
          })),
          uniformConfig: JSON.parse(JSON.stringify(state.uniformConfig)),
          smartRules: JSON.parse(JSON.stringify(state.smartRules)),
        };

        // Write to file
        await writeTextFile(filePath, JSON.stringify(templateData, null, 2));

        showSuccess(t("quickCreate.template.saved"), "✓");
      } catch (error) {
        console.error("Failed to save template:", error);
        showError(t("quickCreate.template.saveFailed") + ": " + (error.message || "Unknown error"), "✗");
      }
    };

    /**
     * Load template
     * Restore archive configuration from a JSON template file
     * @param {Object} templateData - Template data
     */
    const handleLoadTemplate = async (templateData) => {
      try {
        // Validate template format
        if (!templateData.version || !templateData.archives || !Array.isArray(templateData.archives)) {
          showError(t("quickCreate.template.invalidFormat"), "⚠️");
          return;
        }

        // Set restoring state flag to prevent watch(inputNames) from triggering clearArchives
        isRestoringState.value = true;

        // Clear current archives
        clearArchives();

        // Restore uniform config
        if (templateData.uniformConfig) {
          for (const key of Object.keys(templateData.uniformConfig)) {
            if (state.uniformConfig[key] && typeof templateData.uniformConfig[key] === "object") {
              Object.assign(state.uniformConfig[key], templateData.uniformConfig[key]);
            } else {
              state.uniformConfig[key] = templateData.uniformConfig[key];
            }
          }
        }

        // Restore smart rules
        if (templateData.smartRules) {
          Object.assign(state.smartRules, templateData.smartRules);
        }

        // Add archives
        const names = templateData.archives.map((a) => a.name);
        addArchives(names);

        // Restore individual config for each archive
        for (let i = 0; i < templateData.archives.length && i < state.archives.length; i++) {
          const archiveData = templateData.archives[i];
          const archive = state.archives[i];
          if (archiveData.level) archive.level = archiveData.level;
          if (archiveData.difficulty) archive.difficulty = archiveData.difficulty;
          if (archiveData.actualDifficulty) archive.actualDifficulty = archiveData.actualDifficulty;
          if (archiveData.inventoryTemplate) archive.inventoryTemplate = archiveData.inventoryTemplate;
        }

        // Recalculate all archives
        recalculateArchives();

        // Update input display
        inputNames.value = state.archives.map((a) => a.name);

        // Wait for Vue to complete reactive updates
        await nextTick();

        showSuccess(t("quickCreate.template.loaded"), "✓");
      } catch (error) {
        console.error("Failed to load template:", error);
        showError(t("quickCreate.template.loadFailed") + ": " + (error.message || "Unknown error"), "✗");
      } finally {
        // Reset restoring state flag
        isRestoringState.value = false;
      }
    };

    // Handle uniform config update
    const handleConfigUpdate = (newConfig) => {
      for (const [field, value] of Object.entries(newConfig)) {
        if (state.uniformConfig[field]) {
          updateUniformConfig(field, value);
        }
      }
    };

    // Handle smart rules update
    const handleSmartRulesUpdate = (newRules) => {
      updateSmartRules(newRules);
    };

    // Open individual archive edit modal
    const openEditModal = (archiveId) => {
      state.editingArchiveId = archiveId;
      state.showIndividualEditModal = true;
    };

    // Close individual archive edit modal
    const closeEditModal = () => {
      state.showIndividualEditModal = false;
      state.editingArchiveId = null;
    };

    // Handle individual archive edit save
    const handleEditSave = (updates) => {
      if (updates.id) {
        updateArchive(updates.id, {
          name: updates.name,
          level: updates.level,
          difficulty: updates.difficulty,
          actualDifficulty: updates.actualDifficulty,
          inventoryTemplate: updates.inventoryTemplate,
        });
      }
    };

    // Open batch edit modal
    const openBatchEditModal = () => {
      if (state.selectedArchiveIds.size > 0) {
        state.showBatchEditModal = true;
      }
    };

    // Close batch edit modal
    const closeBatchEditModal = () => {
      state.showBatchEditModal = false;
    };

    // Handle batch edit apply
    const handleBatchEditApply = (updates) => {
      batchUpdateSelected(updates);
    };

    /**
     * Dismiss large data warning
     * Requirements: 16.5, 17.1
     */
    const dismissLargeDataWarning = () => {
      showLargeDataWarning.value = false;
      largeDataWarningInfo.value = null;
    };

    // Check if tutorial should be shown
    // Requirements: 18.1 - Show tutorial on first visit
    const checkTutorial = () => {
      const tutorialCompleted = storage.getItem("quick_create_tutorial_completed");
      if (!tutorialCompleted) {
        showTutorial.value = true;
      }
    };

    // Close tutorial
    const closeTutorial = () => {
      showTutorial.value = false;
    };

    // Check draft and start auto-save on mount
    onMounted(async () => {
      // Check if there's config data returned from classic mode
      // Requirements: 19.2 - Bring config from classic mode
      const quickModeConfigJson = sessionStorage.getItem("quickModeArchiveConfig");
      const previousStateJson = sessionStorage.getItem("quickModeCurrentState");

      if (quickModeConfigJson) {
        // Set restoring state flag to prevent watch(inputNames) from triggering clearArchives
        isRestoringState.value = true;

        try {
          const archiveConfig = JSON.parse(quickModeConfigJson);
          // Clear sessionStorage data
          sessionStorage.removeItem("quickModeArchiveConfig");
          sessionStorage.removeItem("quickModeCurrentState");

          // Restore previous state first (if any)
          if (previousStateJson) {
            try {
              const previousState = JSON.parse(previousStateJson);

              // Restore archive list - add names only, don't set config
              const namesToRestore = previousState.archives?.map((a) => a.name) || [];
              if (namesToRestore.length > 0) {
                addArchives(namesToRestore);

                // Restore each archive's config
                for (let i = 0; i < previousState.archives.length && i < state.archives.length; i++) {
                  const archiveData = previousState.archives[i];
                  const archive = state.archives[i];
                  if (archiveData.level) archive.level = archiveData.level;
                  if (archiveData.difficulty) archive.difficulty = archiveData.difficulty;
                  if (archiveData.actualDifficulty) archive.actualDifficulty = archiveData.actualDifficulty;
                  if (archiveData.inventoryTemplate) archive.inventoryTemplate = archiveData.inventoryTemplate;
                }
              }

              // Restore uniform config
              if (previousState.uniformConfig) {
                Object.assign(state.uniformConfig, previousState.uniformConfig);
              }

              // Restore smart rules
              if (previousState.smartRules) {
                Object.assign(state.smartRules, previousState.smartRules);
              }

              // After restoring all config, recalculate
              recalculateArchives();
            } catch (e) {
              console.error("Failed to restore previous state:", e);
            }
          }

          // Add new archive returned from classic mode
          const archiveName = archiveConfig.name || "Unnamed archive";
          const result = addArchives([archiveName]);

          // If added successfully, update archive config
          if (result.added > 0 && state.archives.length > 0) {
            const newArchive = state.archives[state.archives.length - 1];

            // Set individual config
            if (archiveConfig.level) {
              newArchive.level = archiveConfig.level;
            }
            if (archiveConfig.difficulty) {
              newArchive.difficulty = archiveConfig.difficulty;
            }
            if (archiveConfig.actualDifficulty) {
              newArchive.actualDifficulty = archiveConfig.actualDifficulty;
            }

            // Recalculate final config values
            recalculateArchives();

            // Wait for DOM update
            await nextTick();

            // Update input display
            inputNames.value = state.archives.map((a) => a.name);

            // Show success notification
            showSuccess(t("quickCreate.result.success", { count: 1 }), "✓");
          }
        } catch (error) {
          console.error("Failed to parse classic mode config data:", error);
        }

      } else {
        // Clean up any residual state
        sessionStorage.removeItem("quickModeCurrentState");

        // Check if tutorial should be shown on first visit
        // Requirements: 18.1 - Show tutorial on first visit
        checkTutorial();
      }

      // Register beforeunload warning
      // Requirements: 17.2 - Warn user when closing browser
      registerBeforeUnloadWarning();
    });

    // Unregister beforeunload warning on unmount
    onUnmounted(() => {
      unregisterBeforeUnloadWarning();
    });

    return {
      state,
      summaryStats,
      canCreate,
      inputNames,
      detectedStats,
      estimatedTime,
      createButtonText,
      createButtonTooltip,
      availableLevels,
      editingArchive,
      creationResult,
      showResultModal,
      // Large data warnings
      showLargeDataWarning,
      largeDataWarningInfo,
      hasLargeData,
      hasVeryLargeData,
      LARGE_ARCHIVE_THRESHOLD,
      VERY_LARGE_NAME_THRESHOLD,
      goBack,
      onParseComplete,
      handleManualAdd,
      updateUniformConfig,
      updateSmartRules,
      selectAll,
      invertSelection,
      toggleArchiveSelection,
      handleCreate,
      handleSaveTemplate,
      handleLoadTemplate,
      handleConfigUpdate,
      handleSmartRulesUpdate,
      addArchives,
      removeArchive,
      copyArchive,
      openEditModal,
      closeEditModal,
      handleEditSave,
      openBatchEditModal,
      closeBatchEditModal,
      handleBatchEditApply,
      closeResultModal,
      navigateToArchives,
      editSingleArchive,
      // Large data warnings
      dismissLargeDataWarning,
      // Tutorial
      showTutorial,
      closeTutorial,
    };
  },
};
</script>

<style scoped>
.quick-create-container {
  height: calc(100vh - 38px);
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;
  padding: var(--space-4);
  gap: var(--space-4);
}

/* Top action bar - rounded rectangle */
.quick-create-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
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
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
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

/* Mode switch button - Requirements: 19.1 */
.mode-switch-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-tertiary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
}

.mode-switch-btn:hover {
  background: rgba(var(--accent-color-rgb), 0.1);
  border-color: rgba(var(--accent-color-rgb), 0.3);
  color: var(--accent-color);
}

.mode-switch-text {
  white-space: nowrap;
}

/* Center statistics */
.header-stats {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: 0 var(--space-4);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.stat-item.has-error .stat-value {
  color: var(--error-color);
}

.stat-divider {
  width: 1px;
  height: 20px;
  background: var(--divider-light);
}

/* Right action buttons */
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* Progress bar area */
.progress-section {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 120px;
  margin-right: var(--space-2);
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
  min-width: 80px;
}

.progress-fill {
  height: 100%;
  background: var(--accent-color);
  border-radius: 3px;
  transition: width 0.3s var(--ease-default);
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-color);
  min-width: 36px;
  text-align: right;
}

/* Common action button styles */
.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
  border: 1px solid transparent;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Cancel button */
.cancel-btn {
  background: var(--bg-tertiary);
  border-color: var(--divider-light);
  color: var(--text-secondary);
}

.cancel-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--divider-medium);
}

/* Save template button */
.template-btn {
  background: var(--bg-tertiary);
  border-color: var(--divider-light);
  color: var(--text-secondary);
}

.template-btn:hover:not(:disabled) {
  background: rgba(var(--accent-color-rgb), 0.1);
  color: var(--accent-color);
  border-color: rgba(var(--accent-color-rgb), 0.3);
}

/* Estimated time */
.estimated-time {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-secondary);
}

.estimated-time .time-icon {
  font-size: 11px;
  color: var(--text-tertiary);
}

.estimated-time .time-text {
  white-space: nowrap;
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
  transition: all 0.2s var(--ease-default);
}

.create-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Main content area */
.quick-create-main {
  flex: 1;
  display: flex;
  gap: var(--space-4);
  overflow: hidden;
  min-height: 0;
}

/* Left sidebar */
.left-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  overflow: hidden;
}

/* Common section styles */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--divider-light);
  margin-bottom: var(--space-3);
  flex-shrink: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* Archive card flow */
.card-flow-area {
  flex: 1;
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* Responsive layout */
@media (max-width: 1100px) {
  .header-stats {
    display: none;
  }

  .template-btn {
    display: none;
  }

  .mode-switch-text {
    display: none;
  }
}

@media (max-width: 900px) {
  .quick-create-main {
    flex-direction: column;
  }

  .left-sidebar {
    width: 100%;
    flex-direction: row;
    gap: var(--space-3);
    flex-shrink: 0;
  }

  .left-sidebar > * {
    flex: 1;
    min-width: 0;
  }

  .left-sidebar :deep(.uniform-config-panel) {
    max-height: 200px;
  }

  .cancel-btn span,
  .template-btn span {
    display: none;
  }
}

@media (max-width: 600px) {
  .quick-create-container {
    padding: var(--space-3);
    gap: var(--space-3);
  }

  .quick-create-header {
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .header-left {
    flex: 1;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .progress-section {
    flex: 1;
    min-width: 100px;
  }

  .left-sidebar {
    flex-direction: column;
  }

  .left-sidebar > * {
    flex: none;
  }

  .left-sidebar :deep(.uniform-config-panel) {
    max-height: 180px;
  }
}

/* Creation result modal */
.result-modal-overlay {
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
  backdrop-filter: blur(4px);
}

.result-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 480px;
  box-shadow: var(--shadow-lg);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.result-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--divider-light);
}

.result-modal-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.result-modal-title .success-icon {
  color: var(--success-color);
}

.result-modal-title .warning-icon {
  color: var(--warning-color);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
}

.close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
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
  line-height: 1;
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
}

.error-details-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
}

.error-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
}

.error-item {
  display: flex;
  flex-direction: column;
  padding: var(--space-2);
  border-bottom: 1px solid var(--divider-light);
}

.error-item:last-child {
  border-bottom: none;
}

.error-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.error-message {
  font-size: 12px;
  color: var(--error-color);
  margin-top: 2px;
}

.result-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4);
  border-top: 1px solid var(--divider-light);
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

/* Draft recovery modal styles */
.draft-recovery-modal .draft-icon {
  color: var(--accent-color);
}

.draft-message {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
  line-height: 1.5;
}

.draft-time {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0;
}

/* Large data warning modal styles */
.large-data-warning-modal .warning-icon {
  color: var(--warning-color);
}

.large-data-message {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0 0 var(--space-3) 0;
  line-height: 1.5;
}

.large-data-tips {
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.tip-item + .tip-item {
  margin-top: var(--space-2);
}

.tip-item svg {
  color: var(--warning-color);
  flex-shrink: 0;
  margin-top: 2px;
}
</style>
