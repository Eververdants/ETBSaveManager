<template>
  <div
    class="quick-archive-card"
    :class="[borderStatusClass, { selected: selected }]"
    @click="$emit('select', archive.id)"
  >
    <!-- 卡片头部：名称和状态图标 -->
    <div class="card-header">
      <div class="card-name-wrapper">
        <span class="card-name" :title="archive.name">{{ archive.name }}</span>
        <div class="status-icons">
          <span
            v-if="hasMissingParams"
            class="status-icon warning"
            :title="$t('quickCreate.card.missingParams')"
          >
            ⚠️
          </span>
          <span
            v-if="archive.hasIndividualSettings"
            class="status-icon modified"
            :title="$t('quickCreate.card.modified')"
          >
            🔧
          </span>
        </div>
      </div>
      <div class="card-checkbox" @click.stop="$emit('select', archive.id)">
        <span class="checkbox-mark" :class="{ checked: selected }">
          <font-awesome-icon :icon="['fas', 'check']" class="check-icon" />
        </span>
      </div>
    </div>

    <!-- 卡片内容：配置信息 -->
    <div class="card-content">
      <!-- 层级 -->
      <div class="config-row">
        <span class="config-label">{{ $t("quickCreate.card.level") }}</span>
        <span class="config-value" :class="getSourceClass('level')">
          <template v-if="isInherited('level')">
            <span class="inherit-indicator">{{
              $t("quickCreate.card.inherit")
            }}</span>
            <span class="inherit-arrow">→</span>
          </template>
          <span class="value-text">{{ displayLevel }}</span>
        </span>
      </div>

      <!-- 存档难度 -->
      <div class="config-row">
        <span class="config-label">{{
          $t("quickCreate.card.difficulty")
        }}</span>
        <span class="config-value" :class="getSourceClass('difficulty')">
          <template v-if="isInherited('difficulty')">
            <span class="inherit-indicator">{{
              $t("quickCreate.card.inherit")
            }}</span>
            <span class="inherit-arrow">→</span>
          </template>
          <span
            class="value-text"
            :class="difficultyClass(archive.finalDifficulty)"
          >
            {{ displayDifficulty }}
          </span>
        </span>
      </div>

      <!-- 实际难度 -->
      <div class="config-row">
        <span class="config-label">{{
          $t("quickCreate.card.actualDifficulty")
        }}</span>
        <span class="config-value" :class="getSourceClass('actualDifficulty')">
          <template v-if="isInherited('actualDifficulty')">
            <span class="inherit-indicator">{{
              $t("quickCreate.card.inherit")
            }}</span>
            <span class="inherit-arrow">→</span>
          </template>
          <span
            class="value-text"
            :class="difficultyClass(archive.finalActualDifficulty)"
          >
            {{ displayActualDifficulty }}
          </span>
        </span>
      </div>

      <!-- 背包状态 -->
      <div class="config-row">
        <span class="config-label">{{ $t("quickCreate.card.inventory") }}</span>
        <span class="config-value" :class="getSourceClass('inventory')">
          <template v-if="isInherited('inventory')">
            <span class="inherit-indicator">{{
              $t("quickCreate.card.inherit")
            }}</span>
            <span class="inherit-arrow">→</span>
          </template>
          <span class="value-text">{{ displayInventory }}</span>
        </span>
      </div>
    </div>

    <!-- 卡片操作按钮 -->
    <div class="card-actions">
      <button
        class="action-btn edit"
        @click.stop="$emit('edit', archive.id)"
        :title="$t('common.edit')"
      >
        <font-awesome-icon :icon="['fas', 'edit']" />
      </button>
      <button
        class="action-btn copy"
        @click.stop="$emit('copy', archive.id)"
        :title="$t('quickCreate.card.copy')"
      >
        <font-awesome-icon :icon="['fas', 'copy']" />
      </button>
      <button
        class="action-btn remove"
        @click.stop="$emit('remove', archive.id)"
        :title="$t('quickCreate.card.remove')"
      >
        <font-awesome-icon :icon="['fas', 'times']" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n({ useScope: "global" });

const props = defineProps({
  archive: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  configSource: {
    type: Object,
    default: () => ({
      level: "default",
      difficulty: "default",
      actualDifficulty: "default",
      inventory: "default",
    }),
  },
});

defineEmits(["select", "edit", "copy", "remove"]);

// 检查是否有缺失参数
const hasMissingParams = computed(() => {
  return (
    props.archive.validationErrors && props.archive.validationErrors.length > 0
  );
});

// 边框状态类
const borderStatusClass = computed(() => {
  if (hasMissingParams.value) {
    return "border-error";
  }
  if (props.archive.hasIndividualSettings) {
    return "border-individual";
  }
  // 检查是否有任何继承的配置
  const source = props.configSource;
  const hasUniform =
    source.level === "uniform" ||
    source.difficulty === "uniform" ||
    source.actualDifficulty === "uniform" ||
    source.inventory === "uniform";
  if (hasUniform) {
    return "border-uniform";
  }
  return "border-default";
});

// 检查字段是否继承
const isInherited = (field) => {
  const source = props.configSource[field];
  return source === "uniform" || source === "smart";
};

// 获取来源样式类
const getSourceClass = (field) => {
  return `source-${props.configSource[field]}`;
};

// 难度样式类
const difficultyClass = (difficulty) => {
  return `difficulty-${difficulty}`;
};

// 显示层级
const displayLevel = computed(() => {
  const level = props.archive.finalLevel;
  if (!level) {
    return t("quickCreate.card.notSet");
  }
  return t(`LevelName_Display.${level}`) || level;
});

// 显示存档难度
const displayDifficulty = computed(() => {
  const difficulty = props.archive.finalDifficulty;
  if (!difficulty) {
    return t("quickCreate.card.notSet");
  }
  return t(`createArchive.difficultyLevels.${difficulty}`) || difficulty;
});

// 显示实际难度
const displayActualDifficulty = computed(() => {
  const difficulty = props.archive.finalActualDifficulty;
  if (!difficulty) {
    return t("quickCreate.card.notSet");
  }
  return t(`createArchive.difficultyLevels.${difficulty}`) || difficulty;
});

// 显示背包状态
const displayInventory = computed(() => {
  const template = props.archive.finalInventory;
  if (!template || (Array.isArray(template) && template.length === 0)) {
    return t("quickCreate.card.emptyInventory");
  }
  if (typeof template === "string") {
    return template;
  }
  return t("quickCreate.card.customInventory");
});
</script>

<style scoped>
.quick-archive-card {
  position: relative;
  background: var(--bg-tertiary);
  border: 2px solid var(--divider-light);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 200px;
}

.quick-archive-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 边框状态颜色 */
.quick-archive-card.border-default {
  border-color: var(--divider-light);
}

.quick-archive-card.border-uniform {
  border-color: var(--accent-color);
  background: rgba(var(--accent-color-rgb), 0.05);
}

.quick-archive-card.border-individual {
  border-color: #af52de;
  background: rgba(175, 82, 222, 0.05);
}

.quick-archive-card.border-error {
  border-color: var(--error-color);
  background: rgba(var(--error-color-rgb), 0.05);
}

.quick-archive-card.selected {
  border-color: var(--accent-color);
  background: rgba(var(--accent-color-rgb), 0.1);
  box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.2);
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
}

.card-name-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-icons {
  display: flex;
  gap: var(--space-1);
  flex-shrink: 0;
}

.status-icon {
  font-size: 12px;
  cursor: help;
}

.card-checkbox {
  flex-shrink: 0;
  cursor: pointer;
}

.card-checkbox .checkbox-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-xs, 4px);
  border: 2px solid var(--checkbox-border, var(--divider-medium));
  background: var(--checkbox-bg, var(--bg-secondary));
  transition: all 0.2s var(--ease-default);
}

.card-checkbox .checkbox-mark .check-icon {
  font-size: 10px;
  color: var(--checkbox-checkmark-color, white);
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.2s var(--ease-default);
}

.card-checkbox:hover .checkbox-mark {
  border-color: var(--accent-color);
}

.card-checkbox .checkbox-mark.checked {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

.card-checkbox .checkbox-mark.checked .check-icon {
  opacity: 1;
  transform: scale(1);
}

/* 卡片内容 */
.card-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  font-size: 12px;
}

.config-label {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.config-value {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text-secondary);
  min-width: 0;
}

.inherit-indicator {
  font-size: 10px;
  color: var(--text-tertiary);
  opacity: 0.7;
}

.inherit-arrow {
  font-size: 10px;
  color: var(--text-tertiary);
  opacity: 0.5;
}

.value-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 来源样式 */
.source-individual .value-text {
  color: #af52de;
  font-weight: 500;
}

.source-smart .value-text {
  color: #ff9500;
}

.source-uniform .value-text {
  color: var(--accent-color);
}

.source-default .value-text {
  color: var(--text-tertiary);
}

/* 难度颜色 */
.difficulty-easy {
  color: #34c759 !important;
}

.difficulty-normal {
  color: #ff9500 !important;
}

.difficulty-hard {
  color: #ff3b30 !important;
}

.difficulty-nightmare {
  color: #af52de !important;
}

/* 卡片操作按钮 */
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--divider-light);
  margin-top: auto;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
}

.action-btn:hover {
  transform: translateY(-1px);
}

.action-btn.edit:hover {
  background: rgba(52, 199, 89, 0.1);
  color: #34c759;
  border-color: rgba(52, 199, 89, 0.3);
}

.action-btn.copy:hover {
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
  border-color: rgba(0, 122, 255, 0.3);
}

.action-btn.remove:hover {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
  border-color: rgba(255, 59, 48, 0.3);
}

/* 响应式 */
@media (max-width: 600px) {
  .quick-archive-card {
    padding: var(--space-2);
  }

  .card-name {
    font-size: 13px;
  }

  .config-row {
    font-size: 11px;
  }

  .action-btn {
    width: 24px;
    height: 24px;
    font-size: 11px;
  }
}
</style>
