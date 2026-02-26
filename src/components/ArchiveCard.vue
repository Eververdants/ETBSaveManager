<template>
  <div class="archive-card" :class="{
    'archive-hidden': !localVisible,
    'visibility-transitioning': isAnimating,
  }" @click="handleCardClick">
    <!-- 上半背景区域 -->
    <div class="card-background">
      <LazyImage :src="backgroundImage" :alt="currentLevelName" image-class="background-image" />
      <div class="background-overlay"></div>

      <!-- 存档信息 -->
      <div class="archive-info">
        <h3 class="archive-name">{{ archive.name }}</h3>
        <div class="game-mode-info">
          <span class="difficulty-tag" :class="archiveDifficultyClass" :style="tagStyle(
            archiveDifficultyText,
            t('archiveCard.archiveDifficulty')
          )
            ">
            <span class="tag-short">{{ archiveDifficultyText }}</span>
            <span class="tag-full">{{ t("archiveCard.archiveDifficulty") }}：{{
              archiveDifficultyText
            }}</span>
          </span>
          <span class="difficulty-tag" :class="actualDifficultyClass" :style="tagStyle(actualDifficultyText, t('archiveCard.actualDifficulty'))
            ">
            <span class="tag-short">{{ actualDifficultyText }}</span>
            <span class="tag-full">{{ t("archiveCard.actualDifficulty") }}：{{
              actualDifficultyText
            }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- 下半信息区域 -->
    <div class="card-info">
      <span class="current-level">{{ currentLevelName }}</span>
      <div class="action-buttons">
        <button class="action-btn edit" @click.stop="editArchive" type="button">
          <font-awesome-icon icon="fa-solid fa-edit" />
        </button>
        <button class="action-btn copy" @click.stop="toggleVisibility" type="button">
          <font-awesome-icon :icon="isVisible ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'" />
        </button>
        <button class="action-btn delete" @click.stop="deleteArchive" type="button">
          <font-awesome-icon icon="fa-solid fa-trash" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import LazyImage from "./LazyImage.vue";

const props = defineProps({
  archive: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["toggle-visibility", "edit", "delete", "select"]);
const { t, te } = useI18n({ useScope: "global" });

const getLevelName = (levelKey) => {
  const translationKey = `LevelName_Display.${levelKey}`;
  return te(translationKey) ? t(translationKey) : levelKey;
};

const getDifficultyText = (difficultyKey) => {
  const translationKey = `createArchive.difficultyLevels.${difficultyKey}`;
  return te(translationKey) ? t(translationKey) : difficultyKey;
};

// 本地可见性状态，用于动画过渡
const localVisible = ref(props.archive.isVisible);
const isAnimating = ref(false);

// 文本宽度缓存 - 模块级共享
const textWidthCache = new Map();

// 计算文本宽度（使用 canvas 更高效）
const getTextWidth = (() => {
  let canvas = null;
  let ctx = null;
  return (text) => {
    if (textWidthCache.has(text)) return textWidthCache.get(text);
    if (!canvas) {
      canvas = document.createElement("canvas");
      ctx = canvas.getContext("2d");
      ctx.font = "500 11px system-ui, -apple-system, sans-serif";
    }
    const width = Math.ceil(ctx.measureText(text).width);
    textWidthCache.set(text, width);
    return width;
  };
})();

// 计算标签样式
const tagStyle = (shortText, prefix) => {
  const shortWidth = Math.max(30, getTextWidth(shortText) + 16);
  const fullText = `${prefix}：${shortText}`;
  const fullWidth = Math.max(shortWidth, getTextWidth(fullText) + 24);
  return {
    "--w-short": `${shortWidth}px`,
    "--w-full": `${fullWidth}px`,
  };
};

// Computed - 简化计算属性
const isVisible = computed(() => props.archive.isVisible);

const currentLevelName = computed(
  () => getLevelName(props.archive.currentLevel)
);

const backgroundImage = computed(
  () => `/images/ETB/${props.archive.currentLevel}.jpg`
);

const archiveDifficultyText = computed(
  () => getDifficultyText(props.archive.archiveDifficulty)
);

const actualDifficultyText = computed(
  () => getDifficultyText(props.archive.actualDifficulty)
);

const archiveDifficultyClass = computed(
  () => `difficulty-${props.archive.archiveDifficulty}`
);

const actualDifficultyClass = computed(
  () => `difficulty-${props.archive.actualDifficulty}`
);

// 监听 props 变化，触发动画
watch(
  () => props.archive.isVisible,
  (newVal) => {
    if (newVal !== localVisible.value) {
      isAnimating.value = true;
      localVisible.value = newVal;
      setTimeout(() => {
        isAnimating.value = false;
      }, 250);
    }
  },
  { immediate: true }
);

// 初始化时同步状态
onMounted(() => {
  localVisible.value = props.archive.isVisible;
});

// Methods - 简化事件处理
const toggleVisibility = () => {
  emit("toggle-visibility", {
    ...props.archive,
    isVisible: !props.archive.isVisible,
  });
};

const editArchive = () => emit("edit", props.archive);
const deleteArchive = () => emit("delete", props.archive);
const handleCardClick = () => emit("select", props.archive);
</script>

<style scoped>
/* 卡片容器 - 优化 GPU 加速 */
.archive-card {
  position: relative;
  width: 100%;
  min-width: 320px;
  height: 160px;
  border-radius: var(--radius-card);
  overflow: hidden;
  cursor: pointer;
  background: var(--card-bg);
  border: var(--card-border);
  box-shadow: var(--card-shadow);
  transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.5s ease,
    filter 0.5s ease;
  transform: translateZ(0);
  will-change: transform, opacity, filter;
  contain: layout style;
  isolation: isolate;
}

/* 删除时禁用所有 transform 相关动画，避免与 GSAP 冲突 */
.archive-card.deleting,
.archive-card.deleting *,
.archive-card.deleting *::before,
.archive-card.deleting *::after {
  transition: opacity 0.2s linear !important;
  animation: none !important;
}

.archive-card.deleting:hover {
  transform: none !important;
}

.archive-card.deleting .card-background :deep(.lazy-image-container),
.archive-card.deleting .archive-info,
.archive-card.deleting .action-btn {
  transform: none !important;
  transition: none !important;
}

/* 光泽扫过效果 - 仅悬浮时激活 */
.archive-card::before {
  content: "";
  position: absolute;
  inset: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.03) 50%,
      transparent 70%);
  transform: rotate(45deg) translate(-100%, -100%);
  pointer-events: none;
  z-index: 10;
  opacity: 0;
}

.archive-card:hover::before {
  opacity: 1;
  animation: shine-sweep 0.6s ease-out forwards;
}

@keyframes shine-sweep {
  to {
    transform: rotate(45deg) translate(100%, 100%);
  }
}

.archive-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.4),
    0 4px 8px -4px rgba(0, 0, 0, 0.3);
  z-index: 2;
}

/* 背景区域 */
.card-background {
  position: relative;
  width: 100%;
  height: 100px;
  overflow: hidden;
}

.card-background :deep(.lazy-image-container) {
  width: 100%;
  height: 100%;
  filter: blur(1px);
  transform: scale(1.005);
  transition: filter 0.3s ease, transform 0.3s ease;
}

.archive-card:hover .card-background :deep(.lazy-image-container) {
  filter: blur(0);
  transform: scale(1.02);
}

/* 背景渐变遮罩 */
.background-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg,
      transparent 0%,
      rgba(0, 0, 0, 0.1) 30%,
      rgba(0, 0, 0, 0.4) 60%,
      rgba(0, 0, 0, 0.7) 100%);
  transition: opacity 0.3s ease;
}

.archive-card:hover .background-overlay {
  opacity: 0.85;
}

/* 存档信息 */
.archive-info {
  position: absolute;
  bottom: var(--space-2);
  left: var(--space-3);
  right: var(--space-3);
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  transition: transform 0.3s ease;
}

.archive-card:hover .archive-info {
  transform: translateY(-2px);
}

.archive-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 var(--space-1) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 游戏模式信息 */
.game-mode-info {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
}

/* 难度标签 */
.difficulty-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  min-width: 30px;
  padding: 0 8px;
  border-radius: var(--radius-tag);
  font-size: 11px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  white-space: nowrap;
  overflow: hidden;
  position: relative;
  width: var(--w-short, auto);
  transition: width 0.25s ease, background 0.25s ease, color 0.25s ease,
    border-color 0.25s ease, box-shadow 0.25s ease;
}

.tag-short,
.tag-full {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transition: opacity 0.2s ease;
  white-space: nowrap;
}

.tag-short {
  opacity: 1;
}

.tag-full {
  opacity: 0;
}

.archive-card:hover .difficulty-tag {
  width: var(--w-full, var(--w-short, auto));
  padding: 0 12px;
  backdrop-filter: blur(8px);
}

.archive-card:hover .tag-short {
  opacity: 0;
}

.archive-card:hover .tag-full {
  opacity: 1;
}

/* 难度颜色 - 悬浮时显示 */
.archive-card:hover .difficulty-easy {
  background: rgba(52, 199, 89, 0.25);
  color: #34c759;
  border-color: rgba(52, 199, 89, 0.5);
  box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
}

.archive-card:hover .difficulty-normal {
  background: rgba(255, 149, 0, 0.25);
  color: #ff9500;
  border-color: rgba(255, 149, 0, 0.5);
  box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
}

.archive-card:hover .difficulty-hard {
  background: rgba(255, 59, 48, 0.25);
  color: #ff3b30;
  border-color: rgba(255, 59, 48, 0.5);
  box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);
}

.archive-card:hover .difficulty-nightmare {
  background: rgba(175, 82, 222, 0.25);
  color: #af52de;
  border-color: rgba(175, 82, 222, 0.5);
  box-shadow: 0 2px 8px rgba(175, 82, 222, 0.3);
}

/* 下半信息区域 */
.card-info {
  height: 60px;
  padding: var(--space-3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
  transition: background-color 0.3s ease;
}

.archive-card:hover .card-info {
  background-color: rgba(255, 255, 255, 0.02);
}

.current-level {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 26px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-button);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: rgba(128, 128, 128, 0.1);
  color: rgba(128, 128, 128, 0.7);
  border: 1px solid rgba(128, 128, 128, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease,
    color 0.2s ease, border-color 0.2s ease;
  position: relative;
  overflow: hidden;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* 按钮光泽效果 */
.action-btn::after {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent);
  transition: left 0.4s ease;
}

.action-btn:hover::after {
  left: 100%;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 按钮悬浮时显示颜色 - 只有按钮自身 hover 时才变色 */
.action-btn.edit:hover {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
  border-color: rgba(52, 199, 89, 0.3);
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
}

.action-btn.copy:hover {
  background: rgba(0, 122, 255, 0.15);
  color: #007aff;
  border-color: rgba(0, 122, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.action-btn.delete:hover {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
  border-color: rgba(255, 59, 48, 0.3);
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
}

/* 按钮按下时的样式 */
.action-btn.edit:active {
  background: rgba(52, 199, 89, 0.25);
  transform: scale(0.95);
}

.action-btn.copy:active {
  background: rgba(0, 122, 255, 0.25);
  transform: scale(0.95);
}

.action-btn.delete:active {
  background: rgba(255, 59, 48, 0.25);
  transform: scale(0.95);
}

/* 隐藏状态 */
.archive-hidden {
  opacity: 0.5;
  filter: grayscale(0.9) brightness(0.8);
}

.archive-hidden .archive-name {
  color: rgba(255, 255, 255, 0.5);
}

.archive-hidden .card-background :deep(.lazy-image-container) {
  filter: grayscale(1) brightness(0.6) blur(2px);
}

/* 可见性切换过渡动画 */
.visibility-transitioning {
  transition: opacity 0.25s ease, filter 0.25s ease !important;
}

.visibility-transitioning .card-background :deep(.lazy-image-container) {
  transition: filter 0.25s ease !important;
}

.visibility-transitioning .archive-name {
  transition: color 0.25s ease !important;
}

/* 响应式 */
@media (max-width: 768px) {
  .archive-card {
    min-width: 280px;
    height: 140px;
  }

  .card-background {
    height: 90px;
  }

  .card-info {
    height: 50px;
    padding: var(--space-2) var(--space-3);
  }

  .archive-name {
    font-size: 14px;
  }

  .current-level {
    font-size: 13px;
  }

  .difficulty-tag {
    height: 18px;
    font-size: 10px;
  }

  .archive-card:hover {
    transform: translateY(-2px);
  }
}

@media (max-width: 480px) {
  .archive-card {
    min-width: 100%;
    max-width: 320px;
    height: 130px;
  }

  .card-background {
    height: 80px;
  }

  .card-info {
    height: 50px;
    padding: var(--space-2);
  }

  .archive-name {
    font-size: 13px;
  }

  .current-level {
    font-size: 12px;
  }

  .difficulty-tag {
    height: 16px;
    font-size: 9px;
    min-width: 26px;
  }

  .archive-info {
    left: var(--space-2);
    right: var(--space-2);
    bottom: var(--space-1);
  }
}

/* 触摸设备 */
@media (hover: none) and (pointer: coarse) {
  .action-btn {
    min-width: 40px;
    height: 32px;
  }

  .archive-card:hover {
    transform: none;
  }

  /* 触摸设备标签始终展开 */
  .difficulty-tag {
    width: var(--w-full, var(--w-short, auto));
    padding: 0 12px;
  }

  .tag-short {
    opacity: 0;
  }

  .tag-full {
    opacity: 1;
  }
}
</style>
