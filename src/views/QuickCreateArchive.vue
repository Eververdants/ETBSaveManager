<template>
  <div class="quick-create-container">
    <!-- 顶部操作栏（圆角矩形，包含导航+统计+操作） -->
    <header class="quick-create-header">
      <!-- 左侧：返回按钮 + 标题 -->
      <div class="header-left">
        <button class="back-button" @click="goBack">
          <font-awesome-icon :icon="['fas', 'arrow-left']" />
        </button>
        <h1 class="page-title">{{ $t("quickCreate.title") }}</h1>
      </div>

      <!-- 中间：统计数据 -->
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-value">{{ state.archives.length }}</span>
          <span class="stat-label">{{ $t("quickCreate.preview.total") }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ summaryStats.uniformCount }}</span>
          <span class="stat-label">{{
            $t("quickCreate.preview.uniform")
            }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ summaryStats.individualCount }}</span>
          <span class="stat-label">{{
            $t("quickCreate.preview.individual")
            }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item" :class="{ 'has-error': summaryStats.missingCount > 0 }">
          <span class="stat-value">{{ summaryStats.missingCount }}</span>
          <span class="stat-label">{{
            $t("quickCreate.preview.missing")
            }}</span>
        </div>
        <div class="stat-divider" v-if="state.archives.length > 0"></div>
        <div class="stat-item estimated-time" v-if="state.archives.length > 0">
          <font-awesome-icon :icon="['fas', 'clock']" class="time-icon" />
          <span class="time-text">{{
            $t("quickCreate.preview.estimatedTime", { time: estimatedTime })
            }}</span>
        </div>
      </div>

      <!-- 右侧：操作按钮 -->
      <div class="header-actions">
        <!-- 进度条 (创建中显示) -->
        <div class="progress-section" v-if="state.isCreating">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${state.creationProgress}%` }"></div>
          </div>
          <span class="progress-text">{{ Math.round(state.creationProgress) }}%</span>
        </div>

        <button class="action-btn template-btn" @click="handleSaveTemplate"
          :disabled="state.isCreating || state.archives.length === 0">
          <font-awesome-icon :icon="['fas', 'save']" />
          {{ $t("quickCreate.preview.saveTemplate") }}
        </button>

        <button class="create-btn" :disabled="!canCreate || state.isCreating" @click="handleCreate"
          :title="createButtonTooltip">
          <font-awesome-icon :icon="state.isCreating ? ['fas', 'spinner'] : ['fas', 'plus']" :spin="state.isCreating" />
          {{ createButtonText }}
        </button>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="quick-create-main">
      <!-- 左侧边栏：智能输入 + 统一配置 -->
      <aside class="left-sidebar">
        <!-- 智能输入区 -->
        <SmartInputArea v-model="inputNames" :archive-count="state.archives.length"
          :level-detected-count="detectedStats.levelCount" :difficulty-detected-count="detectedStats.difficultyCount"
          @parse-complete="onParseComplete" @manual-add="handleManualAdd" @load-template="handleLoadTemplate" />

        <!-- 统一配置区 -->
        <UniformConfigPanel :config="state.uniformConfig" :smart-rules="state.smartRules"
          @update:config="handleConfigUpdate" @update:smart-rules="handleSmartRulesUpdate" />
      </aside>

      <!-- 右侧主体：存档预览卡片流 -->
      <section class="card-flow-area">
        <ArchiveCardFlow :archives="state.archives" :selected-ids="state.selectedArchiveIds"
          :uniform-config="state.uniformConfig" :smart-rules="state.smartRules" @select="toggleArchiveSelection"
          @select-all="selectAll" @invert-selection="invertSelection" @edit="openEditModal" @copy="copyArchive"
          @remove="removeArchive" @batch-edit="openBatchEditModal" />
      </section>
    </main>

    <!-- 单个存档编辑模态框 -->
    <ArchiveEditModal :visible="state.showIndividualEditModal" :archive="editingArchive"
      :available-levels="availableLevels" @close="closeEditModal" @save="handleEditSave" />

    <!-- 批量编辑模态框 -->
    <BatchEditModal :visible="state.showBatchEditModal" :selected-count="state.selectedArchiveIds.size"
      :available-levels="availableLevels" @close="closeBatchEditModal" @apply="handleBatchEditApply" />

    <!-- 创建结果模态框 -->
    <Teleport to="body">
      <div v-if="showResultModal" class="result-modal-overlay" @click.self="closeResultModal">
        <div class="result-modal">
          <div class="result-modal-header">
            <h3 class="result-modal-title">
              <font-awesome-icon :icon="creationResult?.failed > 0
                ? ['fas', 'exclamation-triangle']
                : ['fas', 'check-circle']
                " :class="creationResult?.failed > 0 ? 'warning-icon' : 'success-icon'
                  " />
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
                <span class="result-value">{{
                  creationResult?.success || 0
                  }}</span>
                <span class="result-label">{{
                  $t("quickCreate.result.successCount")
                  }}</span>
              </div>
              <div class="result-stat error" v-if="creationResult?.failed > 0">
                <span class="result-value">{{
                  creationResult?.failed || 0
                  }}</span>
                <span class="result-label">{{
                  $t("quickCreate.result.failedCount")
                  }}</span>
              </div>
            </div>

            <!-- 错误详情 -->
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
            <!-- Requirements 19.3, 19.4: 根据创建数量显示不同的导航按钮 -->
            <button v-if="
              creationResult?.success === 1 && creationResult?.failed === 0
            " class="action-btn primary-btn" @click="editSingleArchive">
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

      <!-- 草稿恢复提示模态框 -->
      <div v-if="showDraftRecoveryPrompt" class="result-modal-overlay" @click.self="ignoreDraft">
        <div class="result-modal draft-recovery-modal">
          <div class="result-modal-header">
            <h3 class="result-modal-title">
              <font-awesome-icon :icon="['fas', 'file-alt']" class="draft-icon" />
              {{ $t("quickCreate.draft.title") }}
            </h3>
            <button class="close-btn" @click="ignoreDraft">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>

          <div class="result-modal-body">
            <p class="draft-message">
              {{
                $t("quickCreate.draft.message", {
                  count: draftInfo?.archiveCount || 0,
                })
              }}
            </p>
            <p class="draft-time" v-if="draftInfo?.savedAt">
              {{ $t("quickCreate.draft.savedAt") }}:
              {{ formatDraftTime(draftInfo.savedAt) }}
            </p>
          </div>

          <div class="result-modal-footer">
            <button class="action-btn secondary-btn" @click="ignoreDraft">
              {{ $t("quickCreate.draft.ignore") }}
            </button>
            <button class="action-btn primary-btn" @click="recoverDraft">
              <font-awesome-icon :icon="['fas', 'undo']" />
              {{ $t("quickCreate.draft.recover") }}
            </button>
          </div>
        </div>
      </div>

      <!-- 大量数据警告模态框 -->
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

    <!-- 新手引导 -->
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

    // 创建结果状态
    const creationResult = ref(null);
    const showResultModal = ref(false);

    // 草稿恢复提示状态
    const showDraftRecoveryPrompt = ref(false);
    const draftInfo = ref(null);

    // 大量数据警告状态
    const showLargeDataWarning = ref(false);
    const largeDataWarningInfo = ref(null);

    // 新手引导状态
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
      // 草稿管理
      saveDraft,
      loadDraft,
      clearDraft,
      hasUnsavedDraft,
      getDraftInfo,
      startAutoSave,
      stopAutoSave,
      // 中断处理
      registerBeforeUnloadWarning,
      unregisterBeforeUnloadWarning,
      // 大量数据警告
      hasLargeData,
      hasVeryLargeData,
      largeDataWarnings,
      LARGE_ARCHIVE_THRESHOLD,
      VERY_LARGE_NAME_THRESHOLD,
      // 重新计算
      recalculateArchives,
    } = useQuickCreate();

    const inputNames = ref([]);

    // 检测统计（从 archives 计算）
    const detectedStats = computed(() => {
      let levelCount = 0;
      let difficultyCount = 0;
      for (const archive of state.archives) {
        if (archive.parsedInfo?.levelKeyword) levelCount++;
        if (archive.parsedInfo?.difficultyKeyword) difficultyCount++;
      }
      return { levelCount, difficultyCount };
    });

    // 计算预计耗时（Rust后端很快，每个存档约0.3秒）
    const estimatedTime = computed(() => {
      const count = state.archives.length;
      if (count === 0) return "0s";

      // 每个存档约0.3秒，加上批处理间隔
      const batches = Math.ceil(count / 5);
      const archiveTime = count * 0.3; // 每个存档0.3秒
      const batchDelay = (batches - 1) * 0.1; // 批次间延迟
      const totalSeconds = Math.ceil(archiveTime + batchDelay);

      if (totalSeconds < 1) {
        return "<1s";
      } else if (totalSeconds < 60) {
        return `${totalSeconds}s`;
      } else {
        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;
        return remainingSeconds > 0
          ? `${minutes}m ${remainingSeconds}s`
          : `${minutes}m`;
      }
    });

    // 创建按钮文本
    const createButtonText = computed(() => {
      if (state.isCreating) {
        return t("quickCreate.preview.creating");
      }
      const count =
        state.selectedArchiveIds.size > 0
          ? state.selectedArchiveIds.size
          : state.archives.length;
      return t("quickCreate.preview.create", { count });
    });

    // 创建按钮提示
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

    // 可用层级列表
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

    // 当前编辑的存档
    const editingArchive = computed(() => {
      if (state.editingArchiveId) {
        return (
          state.archives.find((a) => a.id === state.editingArchiveId) || null
        );
      }
      return null;
    });

    // 标志：是否正在恢复状态（用于禁用 inputNames 的 watch）
    const isRestoringState = ref(false);

    watch(
      inputNames,
      (newNames) => {
        // 如果正在恢复状态，则不处理
        if (isRestoringState.value) {
          return;
        }

        clearArchives();
        if (newNames.length > 0) {
          // 检查是否超过非常大量数据阈值
          if (newNames.length > VERY_LARGE_NAME_THRESHOLD) {
            largeDataWarningInfo.value = {
              type: "very_large_input",
              count: newNames.length,
              threshold: VERY_LARGE_NAME_THRESHOLD,
            };
            showLargeDataWarning.value = true;
          }

          const result = addArchives(newNames);

          // 检查添加后是否有大量数据警告
          if (result.warnings && result.warnings.length > 0) {
            const largeCountWarning = result.warnings.find(
              (w) => w.type === "large_archive_count"
            );
            if (largeCountWarning && !showLargeDataWarning.value) {
              largeDataWarningInfo.value = largeCountWarning;
              showLargeDataWarning.value = true;
            }
          }
        }
      },
      { deep: true }
    );

    const goBack = () => {
      router.push("/select-create-mode");
    };

    /**
     * 切换到经典模式
     * Requirements: 19.1 - 提供模式切换按钮
     * Requirements: 19.2 - 从经典模式带入配置
     */
    const switchToClassicMode = () => {
      // 如果有统一配置，可以通过 query 参数传递给经典模式
      const query = {};

      // 传递统一配置中的层级设置
      if (
        state.uniformConfig.level.enabled &&
        state.uniformConfig.level.value
      ) {
        query.level = state.uniformConfig.level.value;
      }

      // 传递统一配置中的难度设置
      if (
        state.uniformConfig.difficulty.enabled &&
        state.uniformConfig.difficulty.value
      ) {
        query.difficulty = state.uniformConfig.difficulty.value;
      }

      // 传递统一配置中的实际难度设置
      if (
        state.uniformConfig.actualDifficulty.enabled &&
        state.uniformConfig.actualDifficulty.value
      ) {
        query.actualDifficulty = state.uniformConfig.actualDifficulty.value;
      }

      router.push({ path: "/create-archive", query });
    };

    const onParseComplete = (count) => {
      console.log(`Parsed ${count} names`);
    };

    /**
     * 处理手动添加 - 跳转到经典模式配置存档
     * 经典模式完成后会将配置数据传回
     */
    const handleManualAdd = () => {
      // 保存当前状态到 sessionStorage，以便返回时恢复
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
        sessionStorage.setItem(
          "quickModeCurrentState",
          JSON.stringify(currentState)
        );
      }

      // 跳转到经典模式，带上 quickMode 参数表示是从快速模式来的
      router.push({ path: "/create-archive", query: { quickMode: "true" } });
    };

    const handleCreate = async () => {
      if (!canCreate.value || state.isCreating) return;

      try {
        const results = await batchCreateArchives();

        // 保存结果用于显示
        creationResult.value = results;

        if (results.success > 0) {
          // 显示成功 toast
          const successMessage =
            results.failed > 0
              ? t("quickCreate.result.partialSuccess", {
                success: results.success,
                failed: results.failed,
              })
              : t("quickCreate.result.success", { count: results.success });

          showSuccess(successMessage, "✓");

          // 如果全部成功，清空列表
          if (results.failed === 0) {
            resetState();
            inputNames.value = [];

            // 延迟导航，让用户看到成功提示
            setTimeout(() => {
              router.push("/");
            }, 1500);
          } else {
            // 部分失败，显示结果模态框
            showResultModal.value = true;
          }
        } else if (results.failed > 0) {
          // 全部失败，显示错误
          showError(t("quickCreate.result.failed"), "✗");
          showResultModal.value = true;
        }
      } catch (error) {
        console.error("批量创建失败:", error);
        showError(
          t("quickCreate.result.error") + ": " + (error.message || "未知错误"),
          "✗"
        );
      }
    };

    // 关闭结果模态框
    const closeResultModal = () => {
      showResultModal.value = false;
      creationResult.value = null;
    };

    // 导航到存档管理页面
    const navigateToArchives = () => {
      closeResultModal();
      resetState();
      inputNames.value = [];
      router.push("/");
    };

    /**
     * 编辑单个存档 - 导航到经典模式编辑
     * Requirements: 19.3 - 单个存档时显示"编辑此存档"
     */
    const editSingleArchive = () => {
      closeResultModal();
      // 获取最后创建的存档名称，用于在存档列表中定位
      const lastCreatedName = creationResult.value?.lastCreatedName;
      resetState();
      inputNames.value = [];
      // 导航到首页（存档列表），可以在那里编辑存档
      router.push({ path: "/", query: { highlight: lastCreatedName } });
    };

    /**
     * 保存为模板
     * 让用户选择保存路径，将当前配置保存为 JSON 模板文件
     */
    const handleSaveTemplate = async () => {
      if (state.archives.length === 0) {
        showError(t("quickCreate.template.noArchives"), "⚠️");
        return;
      }

      try {
        // 动态导入 Tauri API
        const { save } = await import("@tauri-apps/plugin-dialog");
        const { writeTextFile } = await import("@tauri-apps/plugin-fs");

        // 打开保存对话框
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
          // 用户取消了保存
          return;
        }

        // 构建模板数据
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

        // 写入文件
        await writeTextFile(filePath, JSON.stringify(templateData, null, 2));

        showSuccess(t("quickCreate.template.saved"), "✓");
      } catch (error) {
        console.error("保存模板失败:", error);
        showError(
          t("quickCreate.template.saveFailed") +
          ": " +
          (error.message || "未知错误"),
          "✗"
        );
      }
    };

    /**
     * 加载模板
     * 从 JSON 模板文件恢复存档配置
     * @param {Object} templateData - 模板数据
     */
    const handleLoadTemplate = async (templateData) => {
      try {
        // 验证模板格式
        if (
          !templateData.version ||
          !templateData.archives ||
          !Array.isArray(templateData.archives)
        ) {
          showError(t("quickCreate.template.invalidFormat"), "⚠️");
          return;
        }

        // 设置恢复状态标志，防止 watch(inputNames) 触发 clearArchives
        isRestoringState.value = true;

        // 清空当前存档
        clearArchives();

        // 恢复统一配置
        if (templateData.uniformConfig) {
          for (const key of Object.keys(templateData.uniformConfig)) {
            if (
              state.uniformConfig[key] &&
              typeof templateData.uniformConfig[key] === "object"
            ) {
              Object.assign(
                state.uniformConfig[key],
                templateData.uniformConfig[key]
              );
            } else {
              state.uniformConfig[key] = templateData.uniformConfig[key];
            }
          }
        }

        // 恢复智能规则
        if (templateData.smartRules) {
          Object.assign(state.smartRules, templateData.smartRules);
        }

        // 添加存档
        const names = templateData.archives.map((a) => a.name);
        addArchives(names);

        // 恢复每个存档的个别配置
        for (
          let i = 0;
          i < templateData.archives.length && i < state.archives.length;
          i++
        ) {
          const archiveData = templateData.archives[i];
          const archive = state.archives[i];
          if (archiveData.level) archive.level = archiveData.level;
          if (archiveData.difficulty)
            archive.difficulty = archiveData.difficulty;
          if (archiveData.actualDifficulty)
            archive.actualDifficulty = archiveData.actualDifficulty;
          if (archiveData.inventoryTemplate)
            archive.inventoryTemplate = archiveData.inventoryTemplate;
        }

        // 重新计算所有存档
        recalculateArchives();

        // 更新输入框显示
        inputNames.value = state.archives.map((a) => a.name);

        // 等待 Vue 完成响应式更新
        await nextTick();

        showSuccess(t("quickCreate.template.loaded"), "✓");
      } catch (error) {
        console.error("加载模板失败:", error);
        showError(
          t("quickCreate.template.loadFailed") +
          ": " +
          (error.message || "未知错误"),
          "✗"
        );
      } finally {
        // 重置恢复状态标志
        isRestoringState.value = false;
      }
    };

    // 处理统一配置更新
    const handleConfigUpdate = (newConfig) => {
      for (const [field, value] of Object.entries(newConfig)) {
        if (state.uniformConfig[field]) {
          updateUniformConfig(field, value);
        }
      }
    };

    // 处理智能规则更新
    const handleSmartRulesUpdate = (newRules) => {
      updateSmartRules(newRules);
    };

    // 打开单个存档编辑模态框
    const openEditModal = (archiveId) => {
      state.editingArchiveId = archiveId;
      state.showIndividualEditModal = true;
    };

    // 关闭单个存档编辑模态框
    const closeEditModal = () => {
      state.showIndividualEditModal = false;
      state.editingArchiveId = null;
    };

    // 处理单个存档编辑保存
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

    // 打开批量编辑模态框
    const openBatchEditModal = () => {
      if (state.selectedArchiveIds.size > 0) {
        state.showBatchEditModal = true;
      }
    };

    // 关闭批量编辑模态框
    const closeBatchEditModal = () => {
      state.showBatchEditModal = false;
    };

    // 处理批量编辑应用
    const handleBatchEditApply = (updates) => {
      batchUpdateSelected(updates);
    };

    // ==================== 草稿管理 ====================

    /**
     * 恢复草稿
     * Requirements: 16.4 - 页面加载时检测并提示恢复
     */
    const recoverDraft = async () => {
      // 设置恢复状态标志，防止 watch(inputNames) 触发 clearArchives
      isRestoringState.value = true;

      if (loadDraft()) {
        // 从恢复的存档中提取名称用于输入区显示
        inputNames.value = state.archives.map((a) => a.name);

        // 等待 Vue 完成响应式更新，确保 watch 不会被触发
        await nextTick();

        showInfo(t("quickCreate.draft.recovered"), "📋");
      }
      showDraftRecoveryPrompt.value = false;
      draftInfo.value = null;

      // 重置恢复状态标志
      isRestoringState.value = false;
    };

    /**
     * 忽略草稿
     */
    const ignoreDraft = () => {
      clearDraft();
      showDraftRecoveryPrompt.value = false;
      draftInfo.value = null;
    };

    /**
     * 关闭大量数据警告
     * Requirements: 16.5, 17.1
     */
    const dismissLargeDataWarning = () => {
      showLargeDataWarning.value = false;
      largeDataWarningInfo.value = null;
    };

    /**
     * 格式化草稿保存时间
     * @param {Date} date - 保存时间
     * @returns {string} 格式化后的时间字符串
     */
    const formatDraftTime = (date) => {
      if (!date) return "";
      const now = new Date();
      const diff = now - date;

      // 小于1分钟
      if (diff < 60000) {
        return t("quickCreate.draft.justNow");
      }
      // 小于1小时
      if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return t("quickCreate.draft.minutesAgo", { count: minutes });
      }
      // 小于24小时
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return t("quickCreate.draft.hoursAgo", { count: hours });
      }
      // 超过24小时，显示日期
      return date.toLocaleDateString();
    };

    // 检查是否需要显示新手引导
    // Requirements: 18.1 - 首次访问时显示教程
    const checkTutorial = () => {
      const tutorialCompleted = storage.getItem(
        "quick_create_tutorial_completed"
      );
      if (!tutorialCompleted) {
        showTutorial.value = true;
      }
    };

    // 关闭新手引导
    const closeTutorial = () => {
      showTutorial.value = false;
    };

    // 组件挂载时检查草稿并启动自动保存
    onMounted(async () => {
      // 检查是否有从经典模式返回的配置数据
      // Requirements: 19.2 - 从经典模式带入配置
      const quickModeConfigJson = sessionStorage.getItem(
        "quickModeArchiveConfig"
      );
      const previousStateJson = sessionStorage.getItem("quickModeCurrentState");

      if (quickModeConfigJson) {
        // 设置恢复状态标志，防止 watch(inputNames) 触发 clearArchives
        isRestoringState.value = true;

        try {
          const archiveConfig = JSON.parse(quickModeConfigJson);
          // 清除 sessionStorage 中的数据
          sessionStorage.removeItem("quickModeArchiveConfig");
          sessionStorage.removeItem("quickModeCurrentState");

          // 先恢复之前的状态（如果有）
          if (previousStateJson) {
            try {
              const previousState = JSON.parse(previousStateJson);

              // 恢复存档列表 - 直接添加名称，不设置配置
              const namesToRestore =
                previousState.archives?.map((a) => a.name) || [];
              if (namesToRestore.length > 0) {
                addArchives(namesToRestore);

                // 恢复每个存档的配置
                for (
                  let i = 0;
                  i < previousState.archives.length &&
                  i < state.archives.length;
                  i++
                ) {
                  const archiveData = previousState.archives[i];
                  const archive = state.archives[i];
                  if (archiveData.level) archive.level = archiveData.level;
                  if (archiveData.difficulty)
                    archive.difficulty = archiveData.difficulty;
                  if (archiveData.actualDifficulty)
                    archive.actualDifficulty = archiveData.actualDifficulty;
                  if (archiveData.inventoryTemplate)
                    archive.inventoryTemplate = archiveData.inventoryTemplate;
                }
              }

              // 恢复统一配置
              if (previousState.uniformConfig) {
                Object.assign(state.uniformConfig, previousState.uniformConfig);
              }

              // 恢复智能规则
              if (previousState.smartRules) {
                Object.assign(state.smartRules, previousState.smartRules);
              }

              // 恢复完所有配置后，重新计算
              recalculateArchives();
            } catch (e) {
              console.error("恢复之前状态失败:", e);
            }
          }

          // 添加从经典模式返回的新存档
          const archiveName = archiveConfig.name || "未命名存档";
          const result = addArchives([archiveName]);

          // 如果添加成功，更新存档的配置
          if (result.added > 0 && state.archives.length > 0) {
            const newArchive = state.archives[state.archives.length - 1];

            // 设置个别配置
            if (archiveConfig.level) {
              newArchive.level = archiveConfig.level;
            }
            if (archiveConfig.difficulty) {
              newArchive.difficulty = archiveConfig.difficulty;
            }
            if (archiveConfig.actualDifficulty) {
              newArchive.actualDifficulty = archiveConfig.actualDifficulty;
            }

            // 重新计算最终配置值
            recalculateArchives();

            // 等待 DOM 更新
            await nextTick();

            // 更新输入框显示
            inputNames.value = state.archives.map((a) => a.name);

            // 显示成功提示
            showSuccess(t("quickCreate.result.success", { count: 1 }), "✓");
          }
        } catch (error) {
          console.error("解析经典模式配置数据失败:", error);
        }

        // 从经典模式返回时，清除草稿（因为我们已经恢复了状态）
        clearDraft();
      } else {
        // 清理可能残留的状态
        sessionStorage.removeItem("quickModeCurrentState");

        // 只有在不是从经典模式返回时，才检查是否有未保存的草稿
        if (hasUnsavedDraft()) {
          draftInfo.value = getDraftInfo();
          if (draftInfo.value && draftInfo.value.archiveCount > 0) {
            showDraftRecoveryPrompt.value = true;
          }
        } else {
          // 如果没有草稿恢复提示，检查是否需要显示新手引导
          // Requirements: 18.1 - 首次访问时显示教程
          checkTutorial();
        }
      }

      // 启动自动保存
      startAutoSave();

      // 注册 beforeunload 警告
      // Requirements: 17.2 - 浏览器关闭时警告用户
      registerBeforeUnloadWarning();
    });

    // 组件卸载时停止自动保存并保存当前草稿
    onUnmounted(() => {
      stopAutoSave();

      // 取消注册 beforeunload 警告
      unregisterBeforeUnloadWarning();

      // 如果有未保存的存档，保存草稿
      if (state.archives.length > 0 && !state.isCreating) {
        saveDraft();
      }
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
      showDraftRecoveryPrompt,
      draftInfo,
      // 大量数据警告
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
      // 草稿管理
      recoverDraft,
      ignoreDraft,
      formatDraftTime,
      // 大量数据警告
      dismissLargeDataWarning,
      // 新手引导
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

/* 顶部操作栏 - 圆角矩形 */
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

/* 模式切换按钮 - Requirements: 19.1 */
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

/* 中间统计数据 */
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

/* 右侧操作按钮 */
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* 进度条区域 */
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

/* 操作按钮通用样式 */
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

/* 取消按钮 */
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

/* 保存模板按钮 */
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

/* 预计耗时 */
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

/* 主内容区域 */
.quick-create-main {
  flex: 1;
  display: flex;
  gap: var(--space-4);
  overflow: hidden;
  min-height: 0;
}

/* 左侧边栏 */
.left-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  overflow: hidden;
}

/* 区域通用样式 */
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

/* 存档卡片流 */
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

/* 响应式布局 */
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

  .left-sidebar>* {
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

  .left-sidebar>* {
    flex: none;
  }

  .left-sidebar :deep(.uniform-config-panel) {
    max-height: 180px;
  }
}

/* 创建结果模态框 */
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

/* 草稿恢复模态框样式 */
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

/* 大量数据警告模态框样式 */
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

.tip-item+.tip-item {
  margin-top: var(--space-2);
}

.tip-item svg {
  color: var(--warning-color);
  flex-shrink: 0;
  margin-top: 2px;
}
</style>
