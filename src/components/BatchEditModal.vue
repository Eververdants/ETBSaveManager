<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="handleClose">
        <div class="modal-container">
          <!-- 模态框头部 -->
          <div class="modal-header">
            <h3 class="modal-title">
              <font-awesome-icon :icon="['fas', 'edit']" />
              {{ $t("quickCreate.batchEdit.title") }}
            </h3>
            <span class="selected-info">
              {{
                $t("quickCreate.batchEdit.selectedCount", {
                  count: selectedCount,
                })
              }}
            </span>
            <button class="close-btn" @click="handleClose">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>

          <!-- 模态框内容 -->
          <div class="modal-content">
            <p class="batch-hint">{{ $t("quickCreate.batchEdit.hint") }}</p>

            <!-- 层级选择 -->
            <div class="form-group">
              <label class="form-label">{{
                $t("quickCreate.editModal.level")
              }}</label>
              <div class="batch-field">
                <label class="custom-radio" @click.prevent="batchValues.level = KEEP_ORIGINAL">
                  <span class="radio-mark" :class="{ checked: batchValues.level === KEEP_ORIGINAL }"></span>
                  <span class="radio-text">{{
                    $t("quickCreate.batchEdit.keepOriginal")
                  }}</span>
                </label>
                <CustomDropdown class="batch-dropdown" :model-value="batchValues.level === KEEP_ORIGINAL ? '' : batchValues.level
                  " :options="levelDropdownOptions" :placeholder="$t('quickCreate.batchEdit.selectToChange')"
                  :disabled="batchValues.level === KEEP_ORIGINAL" @update:model-value="handleLevelChange" />
              </div>
            </div>

            <!-- 存档难度 -->
            <div class="form-group">
              <label class="form-label">{{
                $t("quickCreate.editModal.difficulty")
              }}</label>
              <div class="batch-field">
                <label class="custom-radio" @click.prevent="batchValues.difficulty = KEEP_ORIGINAL">
                  <span class="radio-mark" :class="{
                    checked: batchValues.difficulty === KEEP_ORIGINAL,
                  }"></span>
                  <span class="radio-text">{{
                    $t("quickCreate.batchEdit.keepOriginal")
                  }}</span>
                </label>
                <CustomDropdown class="batch-dropdown" :model-value="batchValues.difficulty === KEEP_ORIGINAL
                    ? ''
                    : batchValues.difficulty
                  " :options="difficultyDropdownOptions" :placeholder="$t('quickCreate.batchEdit.selectToChange')"
                  :disabled="batchValues.difficulty === KEEP_ORIGINAL" @update:model-value="handleDifficultyChange" />
              </div>
            </div>

            <!-- 实际难度 -->
            <div class="form-group">
              <label class="form-label">{{
                $t("quickCreate.editModal.actualDifficulty")
              }}</label>
              <div class="batch-field">
                <label class="custom-radio" @click.prevent="batchValues.actualDifficulty = KEEP_ORIGINAL">
                  <span class="radio-mark" :class="{
                    checked: batchValues.actualDifficulty === KEEP_ORIGINAL,
                  }"></span>
                  <span class="radio-text">{{
                    $t("quickCreate.batchEdit.keepOriginal")
                  }}</span>
                </label>
                <CustomDropdown class="batch-dropdown" :model-value="batchValues.actualDifficulty === KEEP_ORIGINAL
                    ? ''
                    : batchValues.actualDifficulty
                  " :options="difficultyDropdownOptions" :placeholder="$t('quickCreate.batchEdit.selectToChange')"
                  :disabled="batchValues.actualDifficulty === KEEP_ORIGINAL"
                  @update:model-value="handleActualDifficultyChange" />
              </div>
            </div>

            <!-- 背包模板 -->
            <div class="form-group">
              <label class="form-label">{{
                $t("quickCreate.editModal.inventory")
              }}</label>
              <div class="batch-field">
                <label class="custom-radio" @click.prevent="batchValues.inventoryTemplate = KEEP_ORIGINAL">
                  <span class="radio-mark" :class="{
                    checked: batchValues.inventoryTemplate === KEEP_ORIGINAL,
                  }"></span>
                  <span class="radio-text">{{
                    $t("quickCreate.batchEdit.keepOriginal")
                  }}</span>
                </label>
                <CustomDropdown class="batch-dropdown" :model-value="batchValues.inventoryTemplate === KEEP_ORIGINAL
                    ? ''
                    : batchValues.inventoryTemplate
                  " :options="inventoryDropdownOptions" :placeholder="$t('quickCreate.batchEdit.selectToChange')"
                  :disabled="batchValues.inventoryTemplate === KEEP_ORIGINAL"
                  @update:model-value="handleInventoryChange" />
              </div>
            </div>
          </div>

          <!-- 模态框底部 -->
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="handleClose">
              {{ $t("common.cancel") }}
            </button>
            <button class="btn btn-primary" @click="handleApply" :disabled="!hasChanges">
              {{ $t("quickCreate.batchEdit.apply") }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import CustomDropdown from "@/components/CustomDropdown.vue";

const { t } = useI18n({ useScope: "global" });

// 保持原样的特殊值
const KEEP_ORIGINAL = "__keep_original__";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  selectedCount: {
    type: Number,
    default: 0,
  },
  availableLevels: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "apply"]);

// 批量编辑值
const batchValues = ref({
  level: KEEP_ORIGINAL,
  difficulty: KEEP_ORIGINAL,
  actualDifficulty: KEEP_ORIGINAL,
  inventoryTemplate: KEEP_ORIGINAL,
});

// 难度选项
const difficultyOptions = computed(() => [
  { value: "easy", label: t("createArchive.difficultyLevels.easy") },
  { value: "normal", label: t("createArchive.difficultyLevels.normal") },
  { value: "hard", label: t("createArchive.difficultyLevels.hard") },
  { value: "nightmare", label: t("createArchive.difficultyLevels.nightmare") },
]);

// 层级下拉选项
const levelDropdownOptions = computed(() => {
  const options = [
    { value: null, label: t("quickCreate.editModal.inheritFromUniform") },
  ];
  props.availableLevels.forEach((level) => {
    options.push({
      value: level.value,
      label: level.label,
    });
  });
  return options;
});

// 难度下拉选项
const difficultyDropdownOptions = computed(() => {
  return [
    { value: null, label: t("quickCreate.editModal.inheritFromUniform") },
    ...difficultyOptions.value,
  ];
});

// 背包模板下拉选项
const inventoryDropdownOptions = computed(() => [
  { value: null, label: t("quickCreate.editModal.inheritFromUniform") },
  { value: "empty", label: t("quickCreate.card.emptyInventory") },
]);

// 检查是否有更改
const hasChanges = computed(() => {
  return (
    batchValues.value.level !== KEEP_ORIGINAL ||
    batchValues.value.difficulty !== KEEP_ORIGINAL ||
    batchValues.value.actualDifficulty !== KEEP_ORIGINAL ||
    batchValues.value.inventoryTemplate !== KEEP_ORIGINAL
  );
});

// 处理下拉框变化
const handleLevelChange = (value) => {
  batchValues.value.level = value;
};

const handleDifficultyChange = (value) => {
  batchValues.value.difficulty = value;
};

const handleActualDifficultyChange = (value) => {
  batchValues.value.actualDifficulty = value;
};

const handleInventoryChange = (value) => {
  batchValues.value.inventoryTemplate = value;
};

// 重置批量值
const resetBatchValues = () => {
  batchValues.value = {
    level: KEEP_ORIGINAL,
    difficulty: KEEP_ORIGINAL,
    actualDifficulty: KEEP_ORIGINAL,
    inventoryTemplate: KEEP_ORIGINAL,
  };
};

// 监听 visible 变化，重置值
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      resetBatchValues();
    }
  }
);

// 关闭模态框
const handleClose = () => {
  emit("close");
};

// 应用批量编辑
const handleApply = () => {
  emit("apply", { ...batchValues.value });
  handleClose();
};
</script>

<style scoped>
/* 模态框遮罩 */
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
  backdrop-filter: blur(4px);
}

/* 模态框容器 */
.modal-container {
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

/* 模态框头部 */
.modal-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--divider-light);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.selected-info {
  font-size: 12px;
  color: var(--accent-color);
  background: rgba(var(--accent-color-rgb), 0.1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
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
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
  margin-left: auto;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* 模态框内容 */
.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.batch-hint {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
  padding: var(--space-3);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--accent-color);
}

/* 表单组 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.batch-field {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* 自定义单选框样式 */
.custom-radio {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.radio-mark {
  width: var(--radio-size, 16px);
  height: var(--radio-size, 16px);
  border-radius: 50%;
  border: 2px solid var(--checkbox-border, var(--divider-medium));
  background: var(--checkbox-bg, var(--bg-tertiary));
  transition: all 0.2s var(--ease-default);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.radio-mark::after {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-color);
  transform: scale(0);
  transition: transform 0.2s var(--ease-default);
}

.custom-radio:hover .radio-mark {
  border-color: var(--checkbox-border-hover, var(--accent-color));
}

.radio-mark.checked {
  border-color: var(--accent-color);
}

.radio-mark.checked::after {
  transform: scale(1);
}

.radio-text {
  font-size: 12px;
  color: var(--text-secondary);
  transition: color 0.2s var(--ease-default);
}

.custom-radio:hover .radio-text {
  color: var(--text-primary);
}

.radio-mark.checked~.radio-text {
  color: var(--text-primary);
}

.batch-dropdown {
  flex: 1;
}

.batch-dropdown:deep(.dropdown-display) {
  opacity: 1;
  transition: opacity 0.2s var(--ease-default);
}

.batch-dropdown[disabled]:deep(.dropdown-display) {
  opacity: 0.5;
  pointer-events: none;
}

/* 模态框底部 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4);
  border-top: 1px solid var(--divider-light);
}

.btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
}

.btn-secondary {
  background: var(--bg-tertiary);
  border: 1px solid var(--divider-light);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-primary {
  background: var(--accent-color);
  border: none;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s var(--ease-default);
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: all 0.3s var(--ease-default);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(20px);
  opacity: 0;
}

/* 响应式 */
@media (max-width: 480px) {
  .modal-container {
    width: 95%;
    max-height: 95vh;
  }

  .modal-header,
  .modal-content,
  .modal-footer {
    padding: var(--space-3);
  }

  .batch-field {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .batch-dropdown {
    width: 100%;
  }
}
</style>
