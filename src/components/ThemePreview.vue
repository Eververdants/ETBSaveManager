<template>
  <div class="theme-preview" :style="previewStyles" role="img" :aria-label="$t('theme.previewArea')">
    <!-- 模拟窗口 -->
    <div class="preview-window">
      <!-- 标题栏 -->
      <div class="window-titlebar">
        <div class="titlebar-dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <div class="titlebar-placeholder"></div>
      </div>

      <!-- 主体 -->
      <div class="window-body">
        <!-- 侧边栏 -->
        <div class="mock-sidebar">
          <div class="sidebar-item"></div>
          <div class="sidebar-item active"></div>
          <div class="sidebar-item"></div>
          <div class="sidebar-spacer"></div>
          <div class="sidebar-item"></div>
        </div>

        <!-- 内容区 -->
        <div class="mock-content">
          <!-- 卡片网格 -->
          <div class="card-grid">
            <div class="mock-card">
              <div class="card-image"></div>
              <div class="card-body">
                <div class="card-line"></div>
                <div class="card-actions">
                  <span class="action-dot"></span>
                  <span class="action-dot"></span>
                  <span class="action-dot"></span>
                </div>
              </div>
            </div>
            <div class="mock-card">
              <div class="card-image dark"></div>
              <div class="card-body">
                <div class="card-line"></div>
                <div class="card-actions">
                  <span class="action-dot"></span>
                  <span class="action-dot"></span>
                  <span class="action-dot"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- 设置区块 -->
          <div class="mock-settings">
            <div class="setting-row">
              <div class="setting-icon"></div>
              <div class="setting-lines">
                <div class="line long"></div>
                <div class="line short"></div>
              </div>
              <div class="setting-control"></div>
            </div>
            <div class="setting-row">
              <div class="setting-icon"></div>
              <div class="setting-lines">
                <div class="line long"></div>
                <div class="line short"></div>
              </div>
              <div class="setting-control"></div>
            </div>
          </div>

          <!-- 按钮组 -->
          <div class="mock-buttons">
            <div class="btn primary"></div>
            <div class="btn secondary"></div>
            <div class="btn accent"></div>
          </div>

          <!-- 输入框 -->
          <div class="mock-input"></div>

          <!-- 滚动区域 -->
          <div class="mock-scroll">
            <div class="scroll-line"></div>
            <div class="scroll-line"></div>
            <div class="scroll-line"></div>
          </div>
        </div>
      </div>

      <!-- 浮动按钮 -->
      <div class="mock-fab"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { DEFAULT_THEME_TEMPLATE } from '@/services/themeValidator.js';

const props = defineProps({
  colors: {
    type: Object,
    default: () => ({})
  }
});

const previewStyles = computed(() => {
  const c = { ...DEFAULT_THEME_TEMPLATE, ...props.colors };

  return {
    '--p-bg': c.bg,
    '--p-bg-primary': c.bgPrimary,
    '--p-bg-secondary': c.bgSecondary,
    '--p-bg-tertiary': c.bgTertiary,
    '--p-text': c.text,
    '--p-text-primary': c.textPrimary,
    '--p-text-secondary': c.textSecondary,
    '--p-text-tertiary': c.textTertiary,
    '--p-primary': c.primary,
    '--p-accent': c.accentColor,
    '--p-border': c.borderColor,
    '--p-divider': c.dividerColor,
    '--p-sidebar-bg': c.sidebarBg,
    '--p-sidebar-hover': c.sidebarHoverBg,
    '--p-sidebar-active-bg': c.sidebarActiveBg,
    '--p-sidebar-active-color': c.sidebarActiveColor,
    '--p-card-bg': c.cardBg,
    '--p-card-border': c.cardBorder,
    '--p-card-shadow': c.cardShadow,
    '--p-scrollbar-thumb': c.scrollbarThumb
  };
});
</script>

<style scoped>
.theme-preview {
  background: var(--p-bg-tertiary);
  border-radius: 12px;
  padding: 12px;
  pointer-events: none;
  user-select: none;
}

.preview-window {
  background: var(--p-bg);
  border-radius: 8px;
  border: 1px solid var(--p-border);
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 20px var(--p-card-shadow);
}

/* 标题栏 */
.window-titlebar {
  height: 20px;
  background: var(--p-bg-secondary);
  border-bottom: 1px solid var(--p-border);
  display: flex;
  align-items: center;
  padding: 0 8px;
}

.titlebar-dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot.red {
  background: #ff5f57;
}

.dot.yellow {
  background: #febc2e;
}

.dot.green {
  background: #28c840;
}

.titlebar-placeholder {
  flex: 1;
  height: 6px;
  background: var(--p-bg-tertiary);
  border-radius: 3px;
  margin: 0 30px;
}

/* 主体 */
.window-body {
  display: flex;
  height: 220px;
}

/* 侧边栏 */
.mock-sidebar {
  width: 40px;
  background: var(--p-sidebar-bg);
  border-right: 1px solid var(--p-border);
  padding: 6px 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.sidebar-item {
  height: 22px;
  border-radius: 5px;
  background: transparent;
  pointer-events: none;
}

.sidebar-item.active {
  background: var(--p-sidebar-active-bg);
  box-shadow: inset 0 0 0 1.5px var(--p-sidebar-active-color);
}

.sidebar-spacer {
  flex: 1;
}

/* 内容区 */
.mock-content {
  flex: 1;
  padding: 8px;
  background: var(--p-bg-primary);
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

/* 卡片网格 */
.card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.mock-card {
  background: var(--p-card-bg);
  border: 1px solid var(--p-card-border);
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 2px 6px var(--p-card-shadow);
}

.card-image {
  height: 28px;
  background: linear-gradient(135deg, #4a90d9 0%, #67b26f 100%);
}

.card-image.dark {
  background: linear-gradient(135deg, #2c3e50 0%, #4a5568 100%);
}

.card-body {
  padding: 4px 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-line {
  width: 50%;
  height: 5px;
  background: var(--p-text-tertiary);
  border-radius: 2px;
  opacity: 0.4;
}

.card-actions {
  display: flex;
  gap: 2px;
}

.action-dot {
  width: 10px;
  height: 8px;
  background: var(--p-bg-tertiary);
  border: 1px solid var(--p-border);
  border-radius: 2px;
}

/* 设置区块 */
.mock-settings {
  background: var(--p-bg-secondary);
  border-radius: 5px;
  padding: 6px;
  border: 1px solid var(--p-border);
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.setting-row:not(:last-child) {
  border-bottom: 1px solid var(--p-divider);
}

.setting-icon {
  width: 12px;
  height: 12px;
  background: var(--p-primary);
  border-radius: 3px;
  opacity: 0.6;
}

.setting-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.line {
  height: 3px;
  background: var(--p-text-tertiary);
  border-radius: 1px;
  opacity: 0.3;
}

.line.long {
  width: 70%;
}

.line.short {
  width: 40%;
}

.setting-control {
  width: 32px;
  height: 12px;
  background: var(--p-bg-tertiary);
  border: 1px solid var(--p-border);
  border-radius: 3px;
}

/* 按钮组 */
.mock-buttons {
  display: flex;
  gap: 5px;
}

.btn {
  height: 16px;
  border-radius: 4px;
  flex: 1;
}

.btn.primary {
  background: var(--p-primary);
}

.btn.secondary {
  background: transparent;
  border: 1px solid var(--p-border);
}

.btn.accent {
  background: var(--p-accent);
}

/* 输入框 */
.mock-input {
  height: 18px;
  background: var(--p-bg-secondary);
  border: 1px solid var(--p-border);
  border-radius: 4px;
}

/* 滚动区域 */
.mock-scroll {
  flex: 1;
  min-height: 20px;
  background: var(--p-bg-secondary);
  border: 1px solid var(--p-border);
  border-radius: 4px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  position: relative;
  overflow: hidden;
}

.scroll-line {
  height: 6px;
  background: var(--p-text-tertiary);
  border-radius: 3px;
  opacity: 0.2;
}

.mock-scroll::after {
  content: '';
  position: absolute;
  right: 2px;
  top: 4px;
  bottom: 4px;
  width: 3px;
  background: var(--p-scrollbar-thumb);
  border-radius: 1px;
  opacity: 0.6;
}

/* 浮动按钮 */
.mock-fab {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 22px;
  height: 22px;
  background: var(--p-primary);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 响应式 */
@media (max-width: 400px) {
  .card-grid {
    grid-template-columns: 1fr;
  }

  .mock-sidebar {
    width: 32px;
  }
}
</style>
