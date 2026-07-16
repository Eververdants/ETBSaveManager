<template>
  <div class="step-content" data-step="2">
    <div class="basic-sections">
      <!-- Archive name -->
      <div class="settings-section">
        <h3 class="section-title">
          <font-awesome-icon :icon="['fas', 'info-circle']" />
          {{ $t("createArchive.archiveName") }}
        </h3>
        <div class="settings-card">
          <label class="card-label">{{ $t("createArchive.archiveName") }}</label>
          <input
            :value="archiveName"
            type="text"
            class="settings-input"
            :placeholder="$t('createArchive.archiveNamePlaceholder')"
            maxlength="50"
            @input="$emit('update:archiveName', $event.target.value)"
          />
          <transition name="error-fade">
            <div v-if="archiveName.includes('_')" class="error-message">
              <font-awesome-icon :icon="['fas', 'exclamation-triangle']" />
              {{ $t("createArchive.archiveNameError") }}
            </div>
          </transition>
        </div>
      </div>

      <!-- Difficulty Settings -->
      <div class="settings-section">
        <h3 class="section-title">
          <font-awesome-icon :icon="['fas', 'gauge-high']" />
          {{ $t("createArchive.difficulty") }}
        </h3>
        <div class="difficulty-row">
          <div class="settings-card">
            <label class="card-label">{{ $t("createArchive.difficulty") }}</label>
            <div class="diff-grid">
              <div
                v-for="difficulty in difficultyLevels"
                :key="difficulty.value"
                class="diff-option"
                :class="{
                  selected: selectedDifficulty === difficulty.value,
                  disabled: selectedGameMode === 'singleplayer' && difficulty.value !== 'normal',
                }"
                @click="$emit('select-difficulty', difficulty.value)"
              >
                <font-awesome-icon :icon="difficulty.icon" class="diff-icon" />
                <span class="diff-text">{{ getDifficultyText(difficulty.value) }}</span>
              </div>
            </div>
          </div>
          <div class="settings-card">
            <label class="card-label">{{ $t("createArchive.actualDifficulty") }}</label>
            <div class="diff-grid">
              <div
                v-for="difficulty in difficultyLevels"
                :key="`actual-${difficulty.value}`"
                class="diff-option"
                :class="{
                  selected: selectedActualDifficulty === difficulty.value,
                  disabled: selectedGameMode === 'singleplayer' && difficulty.value !== 'normal',
                }"
                @click="$emit('select-actual-difficulty', difficulty.value)"
              >
                <font-awesome-icon :icon="difficulty.icon" class="diff-icon" />
                <span class="diff-text">{{ getDifficultyText(difficulty.value) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";

defineProps({
  archiveName: { type: String, default: "" },
  selectedGameMode: { type: String, default: "multiplayer" },
  selectedDifficulty: { type: String, default: "normal" },
  selectedActualDifficulty: { type: String, default: "normal" },
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

defineEmits(["update:archiveName", "select-difficulty", "select-actual-difficulty"]);

const { t, te } = useI18n();

const getDifficultyText = (difficultyKey) => {
  const translationKey = `createArchive.difficultyLevels.${difficultyKey}`;
  return te(translationKey) ? t(translationKey) : difficultyKey;
};
</script>

<style scoped>
/* ==========================================
 * 基础设置 — 同心圆角三段式布局
 *    Card: 36px(lg) → Inner: 28px(md) → 8px 递减
 * ========================================== */

/* 外层容器 */
.basic-sections {
  display: flex;
  flex-direction: column;
  gap: 26px;
  max-width: 780px;
  margin: 0 auto;
  padding: 4px;
}

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

/* ── 设置卡片 — 36px (lg) 大圆角连续曲率 ── */
.settings-card {
  background: linear-gradient(145deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-card);
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
  box-shadow: var(--shadow-card-hover, 0 8px 32px rgba(0, 0, 0, 0.12));
}

/* 卡片标签 */
.card-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 14px;
}

/* ── 输入框 — 28px (md) 同心第二层 ── */
.settings-input {
  width: 100%;
  padding: 14px 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: linear-gradient(145deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
  color: var(--text-primary);
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all var(--transition-normal) var(--ease-default);
}

.settings-input:hover {
  border-color: var(--accent-color);
}

.settings-input:focus {
  border-color: var(--accent-color);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--accent-color) 15%, transparent),
    inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.settings-input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.7;
}

/* ── 错误消息 ── */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 12px;
  background: rgba(255, 59, 48, 0.1);
  border-radius: var(--radius-xs);
  color: var(--error-color);
  font-size: 13px;
}

.error-fade-enter-active,
.error-fade-leave-active {
  transition: all 0.3s ease;
}

.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ── 难度双列布局 ── */
.difficulty-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* ── 难度网格 4 列 ── */
.diff-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

/* ── 难度选项 — 28px (md) 同心第二层 ── */
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--accent-color) 20%, transparent),
    0 4px 12px color-mix(in srgb, var(--accent-color) 15%, transparent);
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
  .basic-sections {
    max-width: 100%;
    gap: 24px;
  }

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
