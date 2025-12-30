<template>
  <section class="smart-input-area">
    <div class="section-header">
      <h2 class="section-title">
        <font-awesome-icon :icon="['fas', 'keyboard']" />
        {{ $t("quickCreate.inputArea.title") }}
      </h2>
      <span class="section-badge" v-if="nameCount > 0">
        {{ nameCount }}
      </span>
    </div>

    <div class="section-content">
      <!-- 输入方式按钮 -->
      <div class="input-methods">
        <button
          class="input-method-btn"
          @click="handlePasteNames"
          :title="$t('quickCreate.inputArea.pasteNames')"
        >
          <font-awesome-icon :icon="['fas', 'paste']" />
          <span>{{ $t("quickCreate.inputArea.pasteNames") }}</span>
        </button>
        <button
          class="input-method-btn"
          @click="handleImportFile"
          :title="$t('quickCreate.inputArea.importFile')"
        >
          <font-awesome-icon :icon="['fas', 'file-import']" />
          <span>{{ $t("quickCreate.inputArea.importFile") }}</span>
        </button>
        <button
          class="input-method-btn"
          @click="handleManualAdd"
          :title="$t('quickCreate.inputArea.manualAdd')"
        >
          <font-awesome-icon :icon="['fas', 'plus']" />
          <span>{{ $t("quickCreate.inputArea.manualAdd") }}</span>
        </button>
      </div>

      <!-- 拖放区域 -->
      <div
        class="drop-zone"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
        @drop.prevent="onDrop"
        :class="dropZoneClass"
      >
        <!-- 空状态 -->
        <template v-if="nameCount === 0 && !hasErrors">
          <font-awesome-icon
            :icon="['fas', 'cloud-upload-alt']"
            class="drop-icon"
          />
          <p class="drop-hint">{{ $t("quickCreate.inputArea.emptyHint") }}</p>
          <p class="drop-sub-hint">
            {{ $t("quickCreate.inputArea.supportedFormats") }}
          </p>
          <p class="drop-sub-hint">
            {{ $t("quickCreate.inputArea.sequenceHint") }}
          </p>
        </template>

        <!-- 错误状态 -->
        <template v-else-if="hasErrors">
          <div class="status-info">
            <font-awesome-icon
              :icon="['fas', 'exclamation-circle']"
              class="status-icon error"
            />
            <span class="status-text error">{{
              $t("quickCreate.inputArea.importFailed")
            }}</span>
          </div>
          <div class="error-list">
            <p
              v-for="(err, idx) in lastParseResult.errors"
              :key="idx"
              class="error-item"
            >
              {{ err }}
            </p>
          </div>
          <button class="retry-btn" @click="handleClear">
            <font-awesome-icon :icon="['fas', 'redo']" />
            重试
          </button>
        </template>

        <!-- 有数据状态 -->
        <template v-else>
          <div class="status-info">
            <font-awesome-icon
              :icon="['fas', 'check-circle']"
              class="status-icon success"
            />
            <span class="status-text">
              {{ $t("quickCreate.inputArea.recognized", { count: nameCount }) }}
            </span>
          </div>

          <div
            class="detected-info"
            v-if="levelDetectedCount > 0 || difficultyDetectedCount > 0"
          >
            <span v-if="levelDetectedCount > 0" class="detected-tag level">
              <font-awesome-icon :icon="['fas', 'map-marker-alt']" />
              {{ levelDetectedCount }} 个层级
            </span>
            <span
              v-if="difficultyDetectedCount > 0"
              class="detected-tag difficulty"
            >
              <font-awesome-icon :icon="['fas', 'skull']" />
              {{ difficultyDetectedCount }} 个难度
            </span>
          </div>

          <div class="warning-list" v-if="hasWarnings">
            <p
              v-for="(warn, idx) in displayWarnings"
              :key="idx"
              class="warning-item"
            >
              <font-awesome-icon :icon="['fas', 'exclamation-triangle']" />
              {{ warn }}
            </p>
            <p v-if="lastParseResult.warnings.length > 3" class="warning-more">
              还有 {{ lastParseResult.warnings.length - 3 }} 条警告...
            </p>
          </div>

          <div class="info-list" v-if="hasInfo">
            <p
              v-for="(info, idx) in lastParseResult.info"
              :key="idx"
              class="info-item"
            >
              <font-awesome-icon :icon="['fas', 'info-circle']" />
              {{ info }}
            </p>
          </div>

          <button class="clear-btn" @click="handleClear">
            <font-awesome-icon :icon="['fas', 'trash-alt']" />
            {{ $t("quickCreate.inputArea.clear") }}
          </button>
        </template>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".txt,.csv,.json"
      style="display: none"
      @change="onFileSelected"
    />
    <textarea
      ref="pasteArea"
      class="hidden-paste-area"
      @paste="onPaste"
    ></textarea>
  </section>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { useNameParser, parseMultiple } from "@/composables/useNameParser";

export default {
  name: "SmartInputArea",
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    archiveCount: {
      type: Number,
      default: 0,
    },
    levelDetectedCount: {
      type: Number,
      default: 0,
    },
    difficultyDetectedCount: {
      type: Number,
      default: 0,
    },
  },
  emits: [
    "update:modelValue",
    "parse-complete",
    "parse-result",
    "manual-add",
    "load-template",
  ],
  setup(props, { emit }) {
    const { t } = useI18n();

    const { parsedNames, addName, clearNames } = useNameParser();

    const fileInput = ref(null);
    const pasteArea = ref(null);
    const isDragOver = ref(false);
    const lastParseResult = ref(null);
    const isProcessing = ref(false);

    // 使用父组件传入的计数
    const displayNameCount = computed(() => props.archiveCount);
    const displayLevelCount = computed(() => props.levelDetectedCount);
    const displayDifficultyCount = computed(
      () => props.difficultyDetectedCount
    );

    // 计算属性
    const hasErrors = computed(() => lastParseResult.value?.errors?.length > 0);
    const hasWarnings = computed(
      () => lastParseResult.value?.warnings?.length > 0
    );
    const hasInfo = computed(() => lastParseResult.value?.info?.length > 0);
    const displayWarnings = computed(
      () => lastParseResult.value?.warnings?.slice(0, 3) || []
    );

    const dropZoneClass = computed(() => ({
      "drag-over": isDragOver.value,
      "has-names": displayNameCount.value > 0,
      "has-errors": hasErrors.value,
    }));

    const syncToParent = () => {
      const names = parsedNames.value.map((p) => p.originalName);
      emit("update:modelValue", names);
      emit("parse-complete", names.length);
      if (lastParseResult.value) {
        emit("parse-result", lastParseResult.value);
      }
    };

    const handlePasteNames = () => {
      if (pasteArea.value) {
        pasteArea.value.focus();
        navigator.clipboard
          .readText()
          .then((text) => {
            if (text && text.trim()) {
              processTextInput(text);
            }
          })
          .catch(() => {});
      }
    };

    const handleImportFile = () => {
      fileInput.value?.click();
    };

    const handleManualAdd = () => {
      // 触发事件，让父组件处理跳转到经典模式
      emit("manual-add");
    };

    const handleClear = () => {
      clearNames();
      lastParseResult.value = null;
      syncToParent();
    };

    const processTextInput = (text) => {
      if (!text || !text.trim() || isProcessing.value) return;

      isProcessing.value = true;

      try {
        const result = parseMultiple(text);
        lastParseResult.value = result;

        if (result.records.length > 0) {
          clearNames();

          const CHUNK_SIZE = 100;
          const records = result.records;

          if (records.length > CHUNK_SIZE) {
            let index = 0;
            const addChunk = () => {
              const chunk = records.slice(index, index + CHUNK_SIZE);
              for (const record of chunk) {
                addName(record.name);
              }
              index += CHUNK_SIZE;

              if (index < records.length) {
                setTimeout(addChunk, 0);
              } else {
                syncToParent();
                isProcessing.value = false;
              }
            };
            addChunk();
          } else {
            for (const record of records) {
              addName(record.name);
            }
            syncToParent();
            isProcessing.value = false;
          }
        } else {
          isProcessing.value = false;
        }
      } catch (error) {
        lastParseResult.value = {
          records: [],
          errors: ["解析失败: " + error.message],
          warnings: [],
          info: [],
          stats: { total: 0 },
        };
        isProcessing.value = false;
      }
    };

    const onPaste = (event) => {
      event.preventDefault();
      const text = event.clipboardData.getData("text");
      processTextInput(text);
      if (pasteArea.value) pasteArea.value.value = "";
    };

    const handleGlobalPaste = (event) => {
      const el = document.activeElement;
      if (
        el &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA") &&
        el !== pasteArea.value
      ) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        navigator.clipboard
          .readText()
          .then((text) => {
            if (text && text.trim()) processTextInput(text);
          })
          .catch(() => {});
      }
    };

    const readFileContent = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          let content = e.target.result;
          if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
          resolve(content);
        };
        reader.onerror = () => reject(new Error("文件读取失败"));
        reader.readAsText(file, "UTF-8");
      });
    };

    const onFileSelected = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const text = await readFileContent(file);

        // 检查是否是 JSON 模板文件
        if (file.name.toLowerCase().endsWith(".json")) {
          try {
            const templateData = JSON.parse(text);
            // 验证是否是有效的模板格式
            if (
              templateData.version &&
              templateData.archives &&
              Array.isArray(templateData.archives)
            ) {
              // 这是一个模板文件，通知父组件加载
              emit("load-template", templateData);
              return;
            }
          } catch (jsonError) {
            // JSON 解析失败，当作普通文本处理
            console.log("JSON 解析失败，当作普通文本处理");
          }
        }

        // 普通文本文件处理
        processTextInput(text);
      } catch (error) {
        lastParseResult.value = {
          records: [],
          errors: ["文件读取失败: " + error.message],
          warnings: [],
          info: [],
          stats: { total: 0 },
        };
      }

      if (fileInput.value) fileInput.value.value = "";
    };

    const onDragOver = () => {
      isDragOver.value = true;
    };
    const onDragLeave = () => {
      isDragOver.value = false;
    };

    const onDrop = async (event) => {
      isDragOver.value = false;
      const files = event.dataTransfer.files;
      if (files.length === 0) return;

      const file = files[0];
      const valid = [".txt", ".csv", ".json"].some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (!valid) {
        lastParseResult.value = {
          records: [],
          errors: ["不支持的文件格式，请使用 .txt、.csv 或 .json"],
          warnings: [],
          info: [],
          stats: { total: 0 },
        };
        return;
      }

      try {
        const text = await readFileContent(file);

        // 检查是否是 JSON 模板文件
        if (file.name.toLowerCase().endsWith(".json")) {
          try {
            const templateData = JSON.parse(text);
            // 验证是否是有效的模板格式
            if (
              templateData.version &&
              templateData.archives &&
              Array.isArray(templateData.archives)
            ) {
              // 这是一个模板文件，通知父组件加载
              emit("load-template", templateData);
              return;
            }
          } catch (jsonError) {
            // JSON 解析失败，当作普通文本处理
            console.log("JSON 解析失败，当作普通文本处理");
          }
        }

        // 普通文本文件处理
        processTextInput(text);
      } catch (error) {
        lastParseResult.value = {
          records: [],
          errors: ["文件读取失败: " + error.message],
          warnings: [],
          info: [],
          stats: { total: 0 },
        };
      }
    };

    onMounted(() => {
      document.addEventListener("keydown", handleGlobalPaste);
      if (props.modelValue?.length > 0) {
        for (const name of props.modelValue) addName(name);
      }
    });

    onUnmounted(() => {
      document.removeEventListener("keydown", handleGlobalPaste);
    });

    return {
      parsedNames,
      nameCount: displayNameCount,
      levelDetectedCount: displayLevelCount,
      difficultyDetectedCount: displayDifficultyCount,
      isDragOver,
      lastParseResult,
      isProcessing,
      hasErrors,
      hasWarnings,
      hasInfo,
      displayWarnings,
      dropZoneClass,
      fileInput,
      pasteArea,
      handlePasteNames,
      handleImportFile,
      handleManualAdd,
      handleClear,
      onPaste,
      onFileSelected,
      onDragOver,
      onDragLeave,
      onDrop,
    };
  },
};
</script>

<style scoped>
.smart-input-area {
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--divider-light);
  margin-bottom: var(--space-2);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.section-badge {
  background: var(--accent-color);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: var(--radius-pill);
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.input-methods {
  display: flex;
  gap: var(--space-1);
}

.input-method-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--bg-tertiary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
}

.input-method-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3);
  border: 2px dashed var(--divider-light);
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  transition: all 0.2s var(--ease-default);
  min-height: 70px;
}

.drop-zone.drag-over {
  border-color: var(--accent-color);
  background: rgba(var(--accent-color-rgb), 0.05);
}

.drop-zone.has-names {
  border-style: solid;
  border-color: var(--success-color);
}

.drop-zone.has-errors {
  border-style: solid;
  border-color: var(--error-color);
}

.drop-icon {
  font-size: 1.25rem;
  color: var(--text-tertiary);
  margin-bottom: var(--space-1);
}

.drop-hint {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.drop-sub-hint {
  margin: 2px 0 0;
  font-size: 10px;
  color: var(--text-tertiary);
}

.status-info {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-bottom: var(--space-1);
}

.status-icon {
  font-size: 1rem;
}

.status-icon.success {
  color: var(--success-color);
}
.status-icon.error {
  color: var(--error-color);
}

.status-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.status-text.error {
  color: var(--error-color);
}

.detected-info {
  display: flex;
  gap: var(--space-1);
  margin-bottom: var(--space-1);
}

.detected-tag {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 1px var(--space-1);
  border-radius: 3px;
  font-size: 10px;
  font-weight: 500;
}

.detected-tag.level {
  background: rgba(var(--warning-color-rgb, 245, 158, 11), 0.15);
  color: var(--warning-color);
}

.detected-tag.difficulty {
  background: rgba(var(--error-color-rgb, 239, 68, 68), 0.15);
  color: var(--error-color);
}

.error-list,
.warning-list,
.info-list {
  width: 100%;
  margin-bottom: var(--space-1);
}

.error-item,
.warning-item,
.info-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin: 2px 0;
  font-size: 11px;
  text-align: left;
}

.error-item {
  color: var(--error-color);
}
.warning-item {
  color: var(--warning-color);
}
.info-item {
  color: var(--accent-color);
}

.warning-more {
  font-size: 10px;
  color: var(--text-tertiary);
  margin: 2px 0;
}

.clear-btn,
.retry-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px var(--space-2);
  background: transparent;
  border: 1px solid var(--error-color);
  border-radius: 3px;
  color: var(--error-color);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
  margin-top: var(--space-1);
}

.clear-btn:hover,
.retry-btn:hover {
  background: var(--error-color);
  color: white;
}

.retry-btn {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.retry-btn:hover {
  background: var(--accent-color);
  color: white;
}

.hidden-paste-area {
  position: absolute;
  left: -9999px;
  top: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
}

@media (max-width: 768px) {
  .input-methods {
    flex-direction: column;
    gap: 2px;
  }

  .input-method-btn {
    padding: var(--space-1);
    font-size: 11px;
  }

  .drop-zone {
    min-height: 60px;
    padding: var(--space-2);
  }
}
</style>
