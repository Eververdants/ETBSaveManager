<template>
  <div class="step-content" data-step="2">
    <div class="config-grid">
      <!-- 存档名称 - 占满第一行 -->
      <div class="config-card full-width">
        <h3 class="form-section-title">
          {{ $t("createArchive.archiveName") }}
        </h3>
        <div class="form-group">
          <label class="form-label">{{
            $t("createArchive.archiveName")
          }}</label>
          <input :value="archiveName" @input="$emit('update:archiveName', $event.target.value)" type="text"
            class="form-input" :placeholder="$t('createArchive.archiveNamePlaceholder')" maxlength="50" />
          <transition name="error-fade">
            <div v-if="archiveName.includes('_')" class="error-message">
              <font-awesome-icon :icon="['fas', 'exclamation-triangle']" />
              {{ $t("createArchive.archiveNameError") }}
            </div>
          </transition>
        </div>
      </div>

      <!-- 存档难度 -->
      <div class="config-card">
        <h3 class="form-section-title">{{ $t("createArchive.difficulty") }}</h3>
        <div class="difficulty-grid">
          <div v-for="difficulty in difficultyLevels" :key="difficulty.value" class="difficulty-option" :class="{
            selected: selectedDifficulty === difficulty.value,
            disabled:
              selectedGameMode === 'singleplayer' &&
              difficulty.value !== 'normal',
          }" @click="$emit('select-difficulty', difficulty.value)">
            <div class="difficulty-icon">
              <font-awesome-icon :icon="difficulty.icon" />
            </div>
            <span class="difficulty-label">{{
              getDifficultyText(difficulty.value)
            }}</span>
          </div>
        </div>
      </div>

      <!-- 实际难度 -->
      <div class="config-card">
        <h3 class="form-section-title">
          {{ $t("createArchive.actualDifficulty") }}
        </h3>
        <div class="difficulty-grid">
          <div v-for="difficulty in difficultyLevels" :key="`actual-${difficulty.value}`" class="difficulty-option"
            :class="{
              selected: selectedActualDifficulty === difficulty.value,
              disabled:
                selectedGameMode === 'singleplayer' &&
                difficulty.value !== 'normal',
            }" @click="$emit('select-actual-difficulty', difficulty.value)">
            <div class="difficulty-icon">
              <font-awesome-icon :icon="difficulty.icon" />
            </div>
            <span class="difficulty-label">{{
              getDifficultyText(difficulty.value)
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useI18n } from "vue-i18n";

export default {
  name: "Step2ConfigArchive",
  setup() {
    const { t, te } = useI18n();

    const getDifficultyText = (difficultyKey) => {
      const translationKey = `createArchive.difficultyLevels.${difficultyKey}`;
      return te(translationKey) ? t(translationKey) : difficultyKey;
    };

    return {
      getDifficultyText,
    };
  },
  props: {
    archiveName: {
      type: String,
      default: "",
    },
    selectedGameMode: {
      type: String,
      default: "multiplayer",
    },
    selectedDifficulty: {
      type: String,
      default: "normal",
    },
    selectedActualDifficulty: {
      type: String,
      default: "normal",
    },
    difficultyLevels: {
      type: Array,
      default: () => [
        { value: "easy", label: "easy", icon: ["fas", "smile"] },
        { value: "normal", label: "normal", icon: ["fas", "meh"] },
        { value: "hard", label: "hard", icon: ["fas", "frown"] },
        { value: "nightmare", label: "nightmare", icon: ["fas", "skull"] },
      ],
    },
  },
  emits: [
    "update:archiveName",
    "select-difficulty",
    "select-actual-difficulty",
  ],
};
</script>

<style scoped>
/* 配置网格 */
.config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 4px;
}

.config-card {
  background: linear-gradient(145deg,
      var(--bg-secondary) 0%,
      var(--bg-tertiary) 100%);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  transition: all 0.3s ease;
}

.config-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 20px;
  right: 20px;
  height: 1px;
  background: linear-gradient(90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent);
  pointer-events: none;
}

.config-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.config-card.full-width {
  grid-column: 1 / -1;
}

.form-section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 18px 0;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-section-title::before {
  content: "";
  width: 4px;
  height: 16px;
  background: linear-gradient(180deg,
      var(--accent-color),
      rgba(var(--accent-color-rgb), 0.5));
  border-radius: 2px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(145deg,
      var(--bg-tertiary) 0%,
      var(--bg-secondary) 100%);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.form-input:hover {
  border-color: rgba(var(--accent-color-rgb), 0.3);
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.15),
    inset 0 1px 2px rgba(0, 0, 0, 0.05);
  background: var(--bg-tertiary);
}

.form-input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.7;
}

/* 错误消息 */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(255, 59, 48, 0.1);
  border-radius: 8px;
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

/* 难度选择 */
.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.difficulty-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 12px;
  border-radius: 14px;
  background: linear-gradient(145deg,
      var(--bg-tertiary) 0%,
      var(--bg-secondary) 100%);
  border: 2px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.difficulty-option::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center,
      rgba(var(--accent-color-rgb), 0.1) 0%,
      transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.difficulty-option:hover:not(.disabled) {
  transform: translateY(-2px);
  border-color: rgba(var(--accent-color-rgb), 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.difficulty-option:hover:not(.disabled)::before {
  opacity: 1;
}

.difficulty-option.selected {
  border-color: var(--accent-color);
  background: linear-gradient(145deg,
      rgba(var(--accent-color-rgb), 0.15) 0%,
      rgba(var(--accent-color-rgb), 0.08) 100%);
  box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.2),
    0 4px 12px rgba(var(--accent-color-rgb), 0.15);
}

.difficulty-option.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.difficulty-icon {
  font-size: 26px;
  color: var(--text-secondary);
  transition: all 0.25s ease;
}

.difficulty-option:hover:not(.disabled) .difficulty-icon {
  transform: scale(1.1);
}

.difficulty-option.selected .difficulty-icon {
  color: var(--accent-color);
  transform: scale(1.1);
}

.difficulty-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
  transition: color 0.2s ease;
}

.difficulty-option.selected .difficulty-label {
  color: var(--accent-color);
}

@media (max-width: 768px) {
  .config-grid {
    grid-template-columns: 1fr;
  }

  .difficulty-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
