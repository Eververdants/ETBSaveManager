<template>
  <div class="theme-selector">
    <div class="theme-scroll-container">
      <button 
        v-show="needsScroll && canScrollLeft" 
        class="scroll-btn scroll-left" 
        @click="scrollLeft"
        aria-label="向左滚动"
      >
        <font-awesome-icon :icon="['fas', 'chevron-left']" />
      </button>
      <div class="theme-scroll" ref="scrollContainer" @scroll="updateScrollState">
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
            <div class="theme-name" :key="locale + '-' + theme.id">{{ getThemeName(theme.id) }}</div>
          </transition>
        </div>
      </div>
      <button 
        v-show="needsScroll && canScrollRight" 
        class="scroll-btn scroll-right" 
        @click="scrollRight"
        aria-label="向右滚动"
      >
        <font-awesome-icon :icon="['fas', 'chevron-right']" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { getInstalledThemePlugins, PluginStatus } from '../plugins';

const { t, locale } = useI18n();

const props = defineProps({
  modelValue: {
    type: String,
    default: 'light'
  },
  showNewYear: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const currentTheme = computed(() => props.modelValue);

// 滚动相关
const scrollContainer = ref(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const needsScroll = ref(false);

const updateScrollState = () => {
  if (!scrollContainer.value) return;
  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value;
  needsScroll.value = scrollWidth > clientWidth;
  canScrollLeft.value = scrollLeft > 0;
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 1;
};

const scrollLeft = () => {
  if (!scrollContainer.value) return;
  scrollContainer.value.scrollBy({ left: -224, behavior: 'smooth' });
};

const scrollRight = () => {
  if (!scrollContainer.value) return;
  scrollContainer.value.scrollBy({ left: 224, behavior: 'smooth' });
};

// 刷新触发器
const refreshTrigger = ref(0);

// 插件主题列表 - 使用 computed 确保响应式
const pluginThemes = computed(() => {
  // 依赖 refreshTrigger 以支持手动刷新
  refreshTrigger.value;
  
  const installed = getInstalledThemePlugins();
  return installed
    .filter(p => p.status === PluginStatus.ACTIVE)
    .map(p => ({
      id: p.themeId,
      name: p.name,
      isPlugin: true,
      colors: p.data?.previewColors || {
        bg: '#1a1a25',
        sidebar: '#12121a',
        header: '#1e1e2a',
        card: '#12121a',
        accent: '#ff00ff'
      }
    }));
});

// 刷新插件主题
const refreshPluginThemes = () => {
  refreshTrigger.value++;
};

// 监听主题插件变化事件
const handleThemePluginChanged = () => {
  refreshPluginThemes();
  // DOM 更新后重新计算滚动状态
  nextTick(() => {
    updateScrollState();
  });
};

onMounted(() => {
  window.addEventListener('theme-plugin-changed', handleThemePluginChanged);
  nextTick(() => {
    updateScrollState();
  });
});

onUnmounted(() => {
  window.removeEventListener('theme-plugin-changed', handleThemePluginChanged);
});

// 暴露刷新方法
defineExpose({ refreshPluginThemes });

const getThemeName = (themeId) => {
  // 先检查是否是插件主题
  const pluginTheme = pluginThemes.value.find(t => t.id === themeId);
  if (pluginTheme) {
    return pluginTheme.name;
  }
  
  if (themeId === 'new-year') {
    return t('common.newYear');
  }
  return t(`common.${themeId}`);
};

const themeColors = {
  light: {
    bg: '#f8f8fa',
    sidebar: '#f0f0f2',
    header: '#ffffff',
    card: '#ffffff',
    accent: '#4b5563'
  },
  dark: {
    bg: '#0d0d0f',
    sidebar: '#161618',
    header: '#1f1f23',
    card: '#161618',
    accent: '#6b7280'
  },
  ocean: {
    bg: '#0c1929',
    sidebar: '#132337',
    header: '#1a3048',
    card: '#132337',
    accent: '#38bdf8'
  },
  forest: {
    bg: '#0f1a14',
    sidebar: '#162920',
    header: '#1e382c',
    card: '#162920',
    accent: '#4ade80'
  },
  sunset: {
    bg: '#1a1210',
    sidebar: '#261a16',
    header: '#33221c',
    card: '#261a16',
    accent: '#fb923c'
  },
  lavender: {
    bg: '#14101a',
    sidebar: '#1e1826',
    header: '#282033',
    card: '#1e1826',
    accent: '#a78bfa'
  },
  rose: {
    bg: '#1a1215',
    sidebar: '#261a1f',
    header: '#33222a',
    card: '#261a1f',
    accent: '#fb7185'
  },
  mint: {
    bg: '#f0fdf4',
    sidebar: '#dcfce7',
    header: '#ffffff',
    card: '#ffffff',
    accent: '#16a34a'
  },
  peach: {
    bg: '#fff5f5',
    sidebar: '#ffe4e6',
    header: '#ffffff',
    card: '#ffffff',
    accent: '#e11d48'
  },
  sky: {
    bg: '#f0f9ff',
    sidebar: '#e0f2fe',
    header: '#ffffff',
    card: '#ffffff',
    accent: '#0284c7'
  },
  'new-year': {
    bg: '#1a0a0a',
    sidebar: '#2d1515',
    header: '#3d1f1f',
    card: '#2d1515',
    accent: '#ffd700'
  }
};

const themes = computed(() => {
  const baseThemes = [
    { id: 'light', colors: themeColors.light },
    { id: 'dark', colors: themeColors.dark },
    { id: 'mint', colors: themeColors.mint },
    { id: 'peach', colors: themeColors.peach },
    { id: 'sky', colors: themeColors.sky },
    { id: 'ocean', colors: themeColors.ocean },
    { id: 'forest', colors: themeColors.forest },
    { id: 'sunset', colors: themeColors.sunset },
    { id: 'lavender', colors: themeColors.lavender },
    { id: 'rose', colors: themeColors.rose },
  ];
  
  if (props.showNewYear) {
    baseThemes.push({ id: 'new-year', colors: themeColors['new-year'] });
  }
  
  // 添加插件主题
  baseThemes.push(...pluginThemes.value);
  
  return baseThemes;
});

const getPreviewStyle = (theme) => ({
  background: theme.colors.bg
});

const selectTheme = (themeId) => {
  emit('update:modelValue', themeId);
  emit('change', { value: themeId });
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
}

/* 滚动按钮 */
.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
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
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

/* 隐藏滚动条 */
.theme-scroll::-webkit-scrollbar {
  display: none;
}

.theme-card {
  flex-shrink: 0;
  width: 100px;
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
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
  border-radius: 2px;
}

.preview-card {
  flex: 1;
  border-radius: 2px;
}

.preview-accent {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
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
