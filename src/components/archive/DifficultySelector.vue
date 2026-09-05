<template>
  <div class="settings-section">
    <h3 class="section-title">
      <font-awesome-icon :icon="['fas', 'gauge-high']" />
      {{ title }}
    </h3>
    <div class="difficulty-row" :class="{ 'difficulty-row--merged': FEATURES.MERGE_DIFFICULTY }">
      <div class="settings-card">
        <label class="card-label">{{ difficultyLabel }}</label>
        <div class="diff-grid">
          <div
            v-for="d in difficultyLevels"
            :key="d.value"
            class="diff-option"
            :class="{ selected: archiveDifficulty === d.value }"
            @click="$emit('update:archiveDifficulty', d.value)"
          >
            <font-awesome-icon :icon="d.icon" class="diff-icon" />
            <span class="diff-text">{{ getDifficultyText(d.value) }}</span>
          </div>
        </div>
      </div>
      <div v-if="!FEATURES.MERGE_DIFFICULTY" class="settings-card">
        <label class="card-label">{{ actualDifficultyLabel }}</label>
        <div class="diff-grid">
          <div
            v-for="d in difficultyLevels"
            :key="`actual-${d.value}`"
            class="diff-option"
            :class="{ selected: actualDifficulty === d.value }"
            @click="$emit('update:actualDifficulty', d.value)"
          >
            <font-awesome-icon :icon="d.icon" class="diff-icon" />
            <span class="diff-text">{{ getDifficultyText(d.value) }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- 难度提示：NSU 模组已安装并启用时隐藏；探测完成前也不显示 -->
    <div v-if="FEATURES.MERGE_DIFFICULTY && nsuProbed && !nsuActive" class="difficulty-hint">
      <font-awesome-icon :icon="['fas', 'info-circle']" />
      <span>{{ mergeHint }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { FEATURES } from "@/config/features";
import { useNsuStatus } from "@/composables/useNsuStatus";

const props = defineProps({
  title: { type: String, default: "" },
  // i18n namespace of the host page: "editArchive" | "createArchive"
  i18nPrefix: { type: String, required: true },
  archiveDifficulty: { type: String, default: "normal" },
  actualDifficulty: { type: String, default: "normal" },
  difficultyLevels: {
    type: Array,
    default: () => [
      { value: "easy", label: "easy", icon: ["fas", "smile"] },
      { value: "normal", label: "normal", icon: ["fas", "meh"] },
      { value: "hard", label: "hard", icon: ["fas", "frown"] },
      { value: "nightmare", label: "nightmare", icon: ["fas", "skull"] },
    ],
  },
});

defineEmits(["update:archiveDifficulty", "update:actualDifficulty"]);

const { t, te } = useI18n({ useScope: "global" });

const difficultyLabel = computed(() => t(`${props.i18nPrefix}.difficulty`));
const actualDifficultyLabel = computed(() => t(`${props.i18nPrefix}.actualDifficulty`));
const mergeHint = computed(() => t(`${props.i18nPrefix}.difficultyMergeHint`));

const getDifficultyText = (difficultyKey) => {
  const translationKey = `${props.i18nPrefix}.difficultyLevels.${difficultyKey}`;
  return te(translationKey) ? t(translationKey) : difficultyKey;
};

// NSU 模组状态：未安装并启用时，难度修改无法被游戏识别。
// 组件随宿主页面/步骤挂载时探测一次。
const { nsuActive, nsuProbed, refreshNsuStatus } = useNsuStatus();

onMounted(() => {
  refreshNsuStatus();
});
</script>

<style scoped>
/* ── 区域分组 ── */
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 区域标题（带 accent 竖条装饰） */
.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  padding-left: 14px;
  position: relative;
  letter-spacing: -0.02em;
}

.section-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background: var(--accent-color);
  border-radius: var(--radius-xs);
}

.section-title svg {
  color: var(--accent-color);
  font-size: 16px;
}

/* ── 设置卡片 ── */
.settings-card {
  background: linear-gradient(145deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 1px solid var(--border-color);
  filter: drop-shadow(var(--filter-card-shadow));
  position: relative;
  transition: all var(--transition-normal) var(--ease-default);
}

/* 顶部微光描边 */
.settings-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 24px;
  right: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  pointer-events: none;
}

.settings-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  filter: drop-shadow(var(--filter-card-shadow-hover, 0 8px 32px rgba(0, 0, 0, 0.12)));
}

/* 卡片标签 */
.card-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 14px;
}

/* ── 难度双列布局 ── */
.difficulty-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* When difficulty merge is active, use single column for full-width selector */
.difficulty-row--merged {
  grid-template-columns: 1fr;
  max-width: 500px;
}

/* Merge difficulty hint */
.difficulty-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(var(--warning-color-rgb, 255, 159, 10), 0.1);
  border: 1px solid rgba(var(--warning-color-rgb, 255, 159, 10), 0.2);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  max-width: 500px;
}

.difficulty-hint svg {
  color: #ff9f0a;
  font-size: 14px;
  flex-shrink: 0;
}

/* ── 难度网格 4 列 ── */
.diff-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

/* ── 难度选项 ── */
.diff-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: var(--radius-md);
  background: linear-gradient(145deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
  border: 2px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all var(--transition-normal) var(--ease-default);
  position: relative;
  overflow: hidden;
  user-select: none;
}

.diff-option::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at center,
    color-mix(in srgb, var(--accent-color) 10%, transparent) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.diff-option:hover:not(.disabled) {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--accent-color) 30%, transparent);
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
}

.diff-option:hover:not(.disabled)::before {
  opacity: 1;
}

.diff-option.selected {
  border-color: var(--accent-color);
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--accent-color) 15%, transparent) 0%,
    color-mix(in srgb, var(--accent-color) 8%, transparent) 100%
  );
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--accent-color) 20%, transparent);
  filter: drop-shadow(0 4px 12px color-mix(in srgb, var(--accent-color) 15%, transparent));
}

.diff-option.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.diff-icon {
  font-size: 24px;
  color: var(--text-secondary);
  transition: all var(--transition-normal) var(--ease-default);
}

.diff-option:hover:not(.disabled) .diff-icon {
  transform: scale(1.1);
}

.diff-option.selected .diff-icon {
  color: var(--accent-color);
  transform: scale(1.1);
}

.diff-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
  transition: color var(--transition-fast) var(--ease-default);
}

.diff-option.selected .diff-text {
  color: var(--accent-color);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .difficulty-row {
    grid-template-columns: 1fr;
  }

  .diff-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 480px) {
  .diff-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .settings-card {
    padding: 20px;
  }
}
</style>
