<template>
  <div class="theme-selector">
    <div class="theme-scroll-container">
      <button
        v-show="needsScroll && canScrollLeft"
        class="scroll-btn scroll-left"
        :aria-label="$t('common.scrollLeft')"
        @click="scrollLeft"
      >
        <font-awesome-icon :icon="['fas', 'chevron-left']" />
      </button>
      <div ref="scrollContainer" class="theme-scroll" @scroll="updateScrollState">
        <div
          v-for="theme in themes"
          :key="theme.id"
          class="theme-card"
          :class="{ active: currentTheme === theme.id }"
          @click="selectTheme(theme.id)"
        >
          <div class="theme-preview" :style="getPreviewStyle(theme)">
            <div class="preview-sidebar" :style="{ background: theme.colors.sidebar }"></div>
            <div class="preview-content">
              <div class="preview-header" :style="{ background: theme.colors.header }"></div>
              <div class="preview-card" :style="{ background: theme.colors.card }"></div>
            </div>
            <div class="preview-accent" :style="{ background: theme.colors.accent }"></div>
          </div>
          <transition name="text-swift" mode="out-in">
            <div :key="locale + '-' + theme.id" class="theme-name">
              {{ getThemeName(theme.id) }}
            </div>
          </transition>
        </div>
      </div>
      <button
        v-show="needsScroll && canScrollRight"
        class="scroll-btn scroll-right"
        :aria-label="$t('common.scrollRight')"
        @click="scrollRight"
      >
        <font-awesome-icon :icon="['fas', 'chevron-right']" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";
const { t, te, locale } = useI18n();

const props = defineProps({
  modelValue: {
    type: String,
    default: "light",
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const currentTheme = computed(() => props.modelValue);

// 滚动相关
const scrollContainer = ref(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const needsScroll = ref(false);
let resizeObserver = null;

const updateScrollState = () => {
  if (!scrollContainer.value) return;

  // 使用 requestAnimationFrame 确保 DOM 已完全渲染
  requestAnimationFrame(() => {
    if (!scrollContainer.value) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value;
    // 添加一个小的容差值，避免浮点数精度问题
    const tolerance = 2;

    const newNeedsScroll = scrollWidth > clientWidth + tolerance;
    const newCanScrollLeft = scrollLeft > tolerance;
    const newCanScrollRight = scrollLeft + clientWidth < scrollWidth - tolerance;

    // 只在值真正改变时更新，避免不必要的重渲染
    if (needsScroll.value !== newNeedsScroll) {
      needsScroll.value = newNeedsScroll;
    }
    if (canScrollLeft.value !== newCanScrollLeft) {
      canScrollLeft.value = newCanScrollLeft;
    }
    if (canScrollRight.value !== newCanScrollRight) {
      canScrollRight.value = newCanScrollRight;
    }
  });
};

const scrollLeft = () => {
  if (!scrollContainer.value) return;
  scrollContainer.value.scrollBy({ left: -224, behavior: "smooth" });
};

const scrollRight = () => {
  if (!scrollContainer.value) return;
  scrollContainer.value.scrollBy({ left: 224, behavior: "smooth" });
};

onMounted(() => {
  // 使用 ResizeObserver 监听容器大小变化
  if (scrollContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(scrollContainer.value);
  }

  // 初始化时多次检查，确保正确计算
  nextTick(() => {
    updateScrollState();
    // 延迟再次检查，确保插件主题已加载
    setTimeout(() => {
      updateScrollState();
    }, 100);
    setTimeout(() => {
      updateScrollState();
    }, 300);
  });
});

onUnmounted(() => {
  if (resizeObserver && scrollContainer.value) {
    resizeObserver.unobserve(scrollContainer.value);
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

const getThemeName = (themeId) => {
  const themeIdToKey = {
    light: "light",
    dark: "dark",
    ocean: "ocean",
    forest: "forest",
    sunset: "sunset",
    lavender: "lavender",
    rose: "rose",
    mint: "mint",
    peach: "peach",
    sky: "sky",
  };

  const translationKey = `common.${themeIdToKey[themeId] || themeId}`;
  return te(translationKey) ? t(translationKey) : themeId;
};

const themeColors = {
  light: {
    bg: "#F2F0EB",
    sidebar: "#E8E4E0",
    header: "#F0ECE8",
    card: "#F0ECE8",
    accent: "#8B8178",
  },
  dark: {
    bg: "#0a0c10",
    sidebar: "#13161c",
    header: "#1c2028",
    card: "#13161c",
    accent: "#6b8fa8",
  },
  ocean: {
    bg: "#0c1929",
    sidebar: "#132337",
    header: "#1a3048",
    card: "#132337",
    accent: "#38bdf8",
  },
  forest: {
    bg: "#0f1a14",
    sidebar: "#162920",
    header: "#1e382c",
    card: "#162920",
    accent: "#4ade80",
  },
  sunset: {
    bg: "#1a1210",
    sidebar: "#261a16",
    header: "#33221c",
    card: "#261a16",
    accent: "#fb923c",
  },
  lavender: {
    bg: "#14101a",
    sidebar: "#1e1826",
    header: "#282033",
    card: "#1e1826",
    accent: "#a78bfa",
  },
  rose: {
    bg: "#1a1215",
    sidebar: "#261a1f",
    header: "#33222a",
    card: "#261a1f",
    accent: "#fb7185",
  },
  mint: {
    bg: "#f0fdf4",
    sidebar: "#dcfce7",
    header: "#ffffff",
    card: "#ffffff",
    accent: "#16a34a",
  },
  peach: {
    bg: "#fff5f5",
    sidebar: "#ffe4e6",
    header: "#ffffff",
    card: "#ffffff",
    accent: "#e11d48",
  },
  sky: {
    bg: "#f0f9ff",
    sidebar: "#e0f2fe",
    header: "#ffffff",
    card: "#ffffff",
    accent: "#0284c7",
  },
};

const themes = computed(() => {
  const baseThemes = [
    { id: "light", colors: themeColors.light },
    { id: "dark", colors: themeColors.dark },
    { id: "mint", colors: themeColors.mint },
    { id: "peach", colors: themeColors.peach },
    { id: "sky", colors: themeColors.sky },
    { id: "ocean", colors: themeColors.ocean },
    { id: "forest", colors: themeColors.forest },
    { id: "sunset", colors: themeColors.sunset },
    { id: "lavender", colors: themeColors.lavender },
    { id: "rose", colors: themeColors.rose },
  ];

  return baseThemes;
});

// 监听主题列表变化，重新计算滚动状态
watch(
  themes,
  () => {
    // 使用多次 nextTick 和延迟确保 DOM 完全更新
    nextTick(() => {
      nextTick(() => {
        updateScrollState();
        // 额外延迟检查，确保动画和渲染完成
        setTimeout(() => {
          updateScrollState();
        }, 50);
      });
    });
  },
  { deep: true },
);

// 监听 showSeasonalThemes 变化
watch(
  () => props.showSeasonalThemes,
  () => {
    nextTick(() => {
      nextTick(() => {
        updateScrollState();
      });
    });
  },
);

const getPreviewStyle = (theme) => ({
  background: theme.colors.bg,
});

const selectTheme = (themeId) => {
  emit("update:modelValue", themeId);
  emit("change", { value: themeId });
};
</script>

<style scoped>
.theme-selector {
  width: 100%;
}

.theme-scroll-container {
  position: relative;
  margin: 0 -4px;
  padding: 4px;
  overflow: visible;
  /* 确保按钮不被裁剪 */
}

/* 滚动按钮 */
.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  /* 提高 z-index 确保按钮在最上层 */
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-circle);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  pointer-events: auto;
  /* 确保按钮可点击 */
}

.scroll-btn:hover {
  background: var(--bg-tertiary);
  transform: translateY(-50%) scale(1.1);
}

.scroll-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.scroll-left {
  left: -8px;
}

.scroll-right {
  right: -8px;
}

.theme-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 8px 8px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE/Edge */
}

/* 隐藏滚动条 */
.theme-scroll::-webkit-scrollbar {
  display: none;
}

.theme-card {
  flex-shrink: 0;
  width: 100px;
  cursor: pointer;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid transparent;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  background: var(--card-bg);
}

.theme-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.theme-card.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb, 75, 85, 99), 0.15);
}

.theme-preview {
  position: relative;
  height: 60px;
  display: flex;
  overflow: hidden;
}

.preview-sidebar {
  width: 22%;
  height: 100%;
}

.preview-content {
  flex: 1;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-header {
  height: 8px;
  border-radius: var(--radius-xs);
}

.preview-card {
  flex: 1;
  border-radius: var(--radius-xs);
}

.preview-accent {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 16px;
  height: 16px;
  border-radius: var(--radius-circle);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.theme-name {
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 480px) {
  .theme-card {
    width: 85px;
  }

  .theme-preview {
    height: 50px;
  }

  .theme-name {
    font-size: 10px;
    padding: 5px 6px;
  }
}

/* 语言切换过渡动画 */
.text-swift-enter-active {
  transition: opacity 0.2s ease-out;
}

.text-swift-leave-active {
  transition: opacity 0.15s ease-in;
}

.text-swift-enter-from,
.text-swift-leave-to {
  opacity: 0;
}
</style>
