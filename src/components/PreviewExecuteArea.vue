<template>
  <section class="preview-execute-area">
    <!-- 摘要统计 -->
    <div class="summary-section">
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-value">{{ archives.length }}</span>
          <span class="stat-label">{{ $t("quickCreate.preview.total") }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ uniformCount }}</span>
          <span class="stat-label">{{
            $t("quickCreate.preview.uniform")
          }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ individualCount }}</span>
          <span class="stat-label">{{
            $t("quickCreate.preview.individual")
          }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item" :class="{ 'has-error': missingCount > 0 }">
          <span class="stat-value">{{ missingCount }}</span>
          <span class="stat-label">{{
            $t("quickCreate.preview.missing")
          }}</span>
        </div>
      </div>

      <!-- 预计耗时 -->
      <div class="estimated-time" v-if="archives.length > 0">
        <font-awesome-icon :icon="['fas', 'clock']" class="time-icon" />
        <span class="time-text">{{
          $t("quickCreate.preview.estimatedTime", { time: estimatedTime })
        }}</span>
      </div>
    </div>

    <!-- 进度条 (创建中显示) -->
    <div class="progress-section" v-if="isCreating">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <span class="progress-text">{{ Math.round(progress) }}%</span>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="action-btn cancel-btn" @click="handleCancel" :disabled="isCreating">
        <font-awesome-icon :icon="['fas', 'times']" />
        {{ $t("common.cancel") }}
      </button>

      <button class="action-btn template-btn" @click="handleSaveTemplate"
        :disabled="isCreating || archives.length === 0">
        <font-awesome-icon :icon="['fas', 'save']" />
        {{ $t("quickCreate.preview.saveTemplate") }}
      </button>

      <button class="action-btn create-btn" @click="handleCreate" :disabled="!canCreate || isCreating"
        :title="createButtonTooltip">
        <font-awesome-icon :icon="isCreating ? ['fas', 'spinner'] : ['fas', 'plus']" :spin="isCreating" />
        {{ createButtonText }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n({ useScope: "global" });

const props = defineProps({
  archives: {
    type: Array,
    required: true,
    default: () => [],
  },
  selectedCount: {
    type: Number,
    default: 0,
  },
  isCreating: {
    type: Boolean,
    default: false,
  },
  progress: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["cancel", "create", "save-template"]);

// 计算统一配置数量
const uniformCount = computed(() => {
  return props.archives.filter((a) => !a.hasIndividualSettings).length;
});

// 计算个别设置数量
const individualCount = computed(() => {
  return props.archives.filter((a) => a.hasIndividualSettings).length;
});

// 计算缺失参数数量
const missingCount = computed(() => {
  return props.archives.filter(
    (a) => a.validationErrors && a.validationErrors.length > 0
  ).length;
});

// 计算是否可以创建
const canCreate = computed(() => {
  if (props.archives.length === 0) return false;
  return missingCount.value === 0;
});

// 计算预计耗时（每个存档约0.5秒，批量处理每批5个）
const estimatedTime = computed(() => {
  const count = props.archives.length;
  if (count === 0) return "0s";

  // 每批5个，每批约2秒（包含处理和UI更新时间）
  const batches = Math.ceil(count / 5);
  const seconds = batches * 2;

  if (seconds < 60) {
    return `${seconds}s`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
});

// 创建按钮文本
const createButtonText = computed(() => {
  if (props.isCreating) {
    return t("quickCreate.preview.creating");
  }
  const count =
    props.selectedCount > 0 ? props.selectedCount : props.archives.length;
  return t("quickCreate.preview.create", { count });
});

// 创建按钮提示
const createButtonTooltip = computed(() => {
  if (props.archives.length === 0) {
    return t("quickCreate.preview.noArchives");
  }
  if (missingCount.value > 0) {
    return t("quickCreate.preview.hasMissingParams", {
      count: missingCount.value,
    });
  }
  return "";
});

// 事件处理
const handleCancel = () => {
  emit("cancel");
};

const handleCreate = () => {
  if (canCreate.value && !props.isCreating) {
    emit("create");
  }
};

const handleSaveTemplate = () => {
  emit("save-template");
};
</script>

<style scoped>
.preview-execute-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  gap: var(--space-4);
  flex-wrap: wrap;
}

/* 摘要统计区域 */
.summary-section {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex: 1;
  min-width: 0;
}

.summary-stats {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.stat-value {
  font-size: 1rem;
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

.stat-item.has-error .stat-label {
  color: var(--error-color);
}

.stat-divider {
  width: 1px;
  height: 20px;
  background: var(--divider-light);
}

/* 预计耗时 */
.estimated-time {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-secondary);
}

.time-icon {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* 进度条区域 */
.progress-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  min-width: 200px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
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
  min-width: 40px;
  text-align: right;
}

/* 操作按钮区域 */
.action-buttons {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
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

/* 创建按钮 */
.create-btn {
  background: var(--accent-color);
  color: white;
  font-weight: 600;
}

.create-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* 响应式布局 */
@media (max-width: 900px) {
  .preview-execute-area {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }

  .summary-section {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .action-buttons {
    justify-content: flex-end;
  }
}

@media (max-width: 600px) {
  .summary-stats {
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .stat-divider {
    display: none;
  }

  .stat-item {
    padding: var(--space-1) var(--space-2);
    background: var(--bg-tertiary);
    border-radius: var(--radius-sm);
  }

  .action-buttons {
    flex-wrap: wrap;
    width: 100%;
  }

  .action-btn {
    flex: 1;
    justify-content: center;
    min-width: 100px;
  }

  .create-btn {
    flex: 2;
  }
}
</style>
