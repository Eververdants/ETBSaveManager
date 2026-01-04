<template>
  <Teleport to="body">
    <Transition name="tutorial">
      <div v-if="visible" class="tutorial-overlay">
        <!-- 背景遮罩 -->
        <div class="tutorial-backdrop" @click="handleSkip"></div>

        <!-- 高亮区域 -->
        <div
          v-if="currentHighlight"
          class="tutorial-highlight"
          :style="highlightStyle"
        ></div>

        <!-- 引导卡片 -->
        <div class="tutorial-card" :style="cardStyle">
          <!-- 步骤指示器 -->
          <div class="step-indicator">
            <div
              v-for="step in steps"
              :key="step.id"
              class="step-dot"
              :class="{
                active: step.id === currentStep,
                completed: step.id < currentStep,
              }"
            >
              <font-awesome-icon
                v-if="step.id < currentStep"
                :icon="['fas', 'check']"
                class="check-icon"
              />
              <span v-else class="step-number">{{ step.id }}</span>
            </div>
          </div>

          <!-- 卡片内容 -->
          <div class="card-content">
            <div class="step-icon">
              <font-awesome-icon :icon="currentStepData.icon" />
            </div>
            <h3 class="step-title">{{ currentStepData.title }}</h3>
            <p class="step-description">{{ currentStepData.description }}</p>
          </div>

          <!-- 卡片底部操作 -->
          <div class="card-footer">
            <button class="btn btn-text" @click="handleSkip">
              {{ $t("quickCreate.tutorial.skip") }}
            </button>
            <div class="footer-actions">
              <button
                v-if="currentStep > 1"
                class="btn btn-secondary"
                @click="handlePrev"
              >
                <font-awesome-icon :icon="['fas', 'arrow-left']" />
                {{ $t("quickCreate.tutorial.prev") }}
              </button>
              <button
                v-if="currentStep < steps.length"
                class="btn btn-primary"
                @click="handleNext"
              >
                {{ $t("quickCreate.tutorial.next") }}
                <font-awesome-icon :icon="['fas', 'arrow-right']" />
              </button>
              <button
                v-else
                class="btn btn-primary btn-start"
                @click="handleComplete"
              >
                <font-awesome-icon :icon="['fas', 'rocket']" />
                {{ $t("quickCreate.tutorial.start") }}
              </button>
            </div>
          </div>
        </div>

        <!-- 视频教程按钮 -->
        <button class="video-tutorial-btn" @click="handleVideoTutorial">
          <font-awesome-icon :icon="['fas', 'play-circle']" />
          {{ $t("quickCreate.tutorial.watchVideo") }}
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import storage from "../services/storageService";

const { t } = useI18n({ useScope: "global" });

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "next-step", "skip", "complete"]);

// 当前步骤
const currentStep = ref(1);

// 高亮区域位置
const highlightRect = ref(null);

// 定义四个步骤
const steps = computed(() => [
  {
    id: 1,
    title: t("quickCreate.tutorial.step1.title"),
    description: t("quickCreate.tutorial.step1.description"),
    icon: ["fas", "keyboard"],
    targetSelector: ".smart-input-area",
    position: "right",
  },
  {
    id: 2,
    title: t("quickCreate.tutorial.step2.title"),
    description: t("quickCreate.tutorial.step2.description"),
    icon: ["fas", "sliders-h"],
    targetSelector: ".uniform-config-panel",
    position: "right",
  },
  {
    id: 3,
    title: t("quickCreate.tutorial.step3.title"),
    description: t("quickCreate.tutorial.step3.description"),
    icon: ["fas", "th-large"],
    targetSelector: ".card-flow-area",
    position: "left",
  },
  {
    id: 4,
    title: t("quickCreate.tutorial.step4.title"),
    description: t("quickCreate.tutorial.step4.description"),
    icon: ["fas", "play"],
    targetSelector: ".header-actions",
    position: "bottom",
  },
]);

// 当前步骤数据
const currentStepData = computed(() => {
  return steps.value.find((s) => s.id === currentStep.value) || steps.value[0];
});

// 当前高亮区域
const currentHighlight = computed(() => {
  return highlightRect.value;
});

// 高亮区域样式
const highlightStyle = computed(() => {
  if (!highlightRect.value) return {};
  const padding = 8;
  return {
    top: `${highlightRect.value.top - padding}px`,
    left: `${highlightRect.value.left - padding}px`,
    width: `${highlightRect.value.width + padding * 2}px`,
    height: `${highlightRect.value.height + padding * 2}px`,
  };
});

// 卡片位置样式
const cardStyle = computed(() => {
  if (!highlightRect.value) {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const position = currentStepData.value.position;
  const rect = highlightRect.value;
  const cardWidth = 360;
  const cardHeight = 280;
  const gap = 20;

  let style = {};

  switch (position) {
    case "right":
      style = {
        top: `${Math.max(rect.top, 100)}px`,
        left: `${rect.right + gap}px`,
      };
      break;
    case "left":
      style = {
        top: `${Math.max(rect.top, 100)}px`,
        left: `${rect.left - cardWidth - gap}px`,
      };
      break;
    case "bottom":
      style = {
        top: `${rect.bottom + gap}px`,
        left: `${rect.left + (rect.width - cardWidth) / 2}px`,
      };
      break;
    case "top":
      style = {
        top: `${rect.top - cardHeight - gap}px`,
        left: `${rect.left + (rect.width - cardWidth) / 2}px`,
      };
      break;
    default:
      style = {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
  }

  return style;
});

// 更新高亮区域位置
const updateHighlightRect = () => {
  const selector = currentStepData.value.targetSelector;
  const element = document.querySelector(selector);

  if (element) {
    const rect = element.getBoundingClientRect();
    highlightRect.value = {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  } else {
    highlightRect.value = null;
  }
};

// 下一步
const handleNext = () => {
  if (currentStep.value < steps.value.length) {
    currentStep.value++;
    emit("next-step", currentStep.value);
    updateHighlightRect();
  }
};

// 上一步
const handlePrev = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
    updateHighlightRect();
  }
};

// 跳过教程
const handleSkip = () => {
  saveTutorialCompleted();
  emit("skip");
  emit("close");
};

// 完成教程
const handleComplete = () => {
  saveTutorialCompleted();
  emit("complete");
  emit("close");
};

// 查看视频教程
const handleVideoTutorial = () => {
  // 可以打开视频教程链接
  console.log("Open video tutorial");
};

// 保存教程完成状态到 localStorage
const saveTutorialCompleted = () => {
  storage.setItem("quick_create_tutorial_completed", "true");
};

// 监听 visible 变化
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      currentStep.value = 1;
      // 延迟更新高亮区域，等待 DOM 渲染
      setTimeout(updateHighlightRect, 100);
    }
  }
);

// 监听窗口大小变化
onMounted(() => {
  window.addEventListener("resize", updateHighlightRect);
  if (props.visible) {
    setTimeout(updateHighlightRect, 100);
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", updateHighlightRect);
});
</script>

<style scoped>
/* 教程遮罩层 */
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  pointer-events: none;
}

/* 背景遮罩 */
.tutorial-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  pointer-events: auto;
}

/* 高亮区域 */
.tutorial-highlight {
  position: absolute;
  border-radius: var(--radius-lg);
  box-shadow: 0 0 0 4px var(--accent-color), 0 0 0 9999px rgba(0, 0, 0, 0.7);
  pointer-events: none;
  transition: all 0.4s var(--ease-default);
  z-index: 1;
}

/* 引导卡片 */
.tutorial-card {
  position: absolute;
  width: 360px;
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
  z-index: 2;
  animation: cardSlideIn 0.4s var(--ease-default);
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 步骤指示器 */
.step-indicator {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--divider-light);
}

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s var(--ease-default);
  background: var(--bg-tertiary);
  border: 2px solid var(--divider-medium);
  color: var(--text-tertiary);
}

.step-dot.active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 0 0 4px rgba(var(--accent-color-rgb), 0.2);
}

.step-dot.completed {
  background: var(--color-success);
  border-color: var(--color-success);
  color: white;
}

.step-dot .check-icon {
  font-size: 11px;
}

.step-number {
  line-height: 1;
}

/* 卡片内容 */
.card-content {
  padding: var(--space-5);
  text-align: center;
}

.step-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--accent-color-rgb), 0.1);
  border-radius: 50%;
  color: var(--accent-color);
  font-size: 24px;
}

.step-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-3);
}

.step-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-top: 1px solid var(--divider-light);
  background: var(--bg-tertiary);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}

.footer-actions {
  display: flex;
  gap: var(--space-2);
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
  border: none;
}

.btn-text {
  background: transparent;
  color: var(--text-tertiary);
  padding: var(--space-2);
}

.btn-text:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.btn-secondary {
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--bg-hover);
  border-color: var(--divider-medium);
}

.btn-primary {
  background: var(--accent-color);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-start {
  padding: var(--space-2) var(--space-4);
}

/* 视频教程按钮 */
.video-tutorial-btn {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  /* display: flex; */
  display: none;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.2s var(--ease-default);
  box-shadow: var(--shadow-md);
  z-index: 3;
}

.video-tutorial-btn:hover {
  background: var(--bg-hover);
  color: var(--accent-color);
  border-color: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.video-tutorial-btn svg {
  font-size: 16px;
}

/* 过渡动画 */
.tutorial-enter-active,
.tutorial-leave-active {
  transition: all 0.3s var(--ease-default);
}

.tutorial-enter-from,
.tutorial-leave-to {
  opacity: 0;
}

.tutorial-enter-from .tutorial-card,
.tutorial-leave-to .tutorial-card {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .tutorial-card {
    width: calc(100% - var(--space-8));
    max-width: 360px;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
  }

  .video-tutorial-btn {
    bottom: var(--space-4);
    right: var(--space-4);
    padding: var(--space-2) var(--space-3);
    font-size: 12px;
  }
}
</style>
