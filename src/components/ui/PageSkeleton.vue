<script setup>
/**
 * PageSkeleton - 路由级骨架屏组件
 * 在懒加载路由组件加载期间展示，替代白屏
 * 支持不同路由的自定义骨架布局
 */
import { computed } from "vue";
import { useRoute } from "vue-router";
import SkeletonLoader from "./SkeletonLoader.vue";

const route = useRoute();

const skeletonType = computed(() => {
  switch (route.name) {
    case "Home":
      return "grid";
    case "Settings":
      return "settings";
    case "Log":
      return "log";
    case "CreateArchive":
    case "QuickCreateArchive":
      return "form";
    case "About":
      return "page";
    default:
      return "page";
  }
});
</script>

<template>
  <div class="page-skeleton" :class="`page-skeleton-${skeletonType}`" role="status" aria-label="页面加载中">
    <!-- Settings 页面骨架 -->
    <template v-if="skeletonType === 'settings'">
      <div class="setting-group-skeleton">
        <div class="skeleton-section-header" />
        <div v-for="i in 2" :key="i" class="setting-item-skeleton">
          <div class="skeleton-icon-box" />
          <div class="skeleton-text-block">
            <div class="skeleton-line skeleton-line-title" />
            <div class="skeleton-line skeleton-line-subtitle" />
          </div>
          <div class="skeleton-action-box" />
        </div>
      </div>
      <div class="setting-group-skeleton">
        <div class="skeleton-section-header" />
        <div v-for="i in 2" :key="i + 10" class="setting-item-skeleton">
          <div class="skeleton-icon-box" />
          <div class="skeleton-text-block">
            <div class="skeleton-line skeleton-line-title" />
            <div class="skeleton-line skeleton-line-subtitle" />
          </div>
          <div class="skeleton-action-box" />
        </div>
      </div>
    </template>

    <!-- Log 页面终端风格骨架 -->
    <template v-else-if="skeletonType === 'log'">
      <div class="log-skeleton-header">
        <div class="skeleton-line log-title-line" />
        <div class="skeleton-line log-btn-line" />
      </div>
      <div class="log-skeleton-terminal">
        <div class="terminal-prompt">
          <span class="terminal-dollar">$</span>
          <span class="terminal-loading-text">loading logs...</span>
          <span class="terminal-cursor" />
        </div>
        <div v-for="i in 6" :key="i" class="terminal-line" :style="{ '--line-delay': `${i * 0.15}s` }">
          <span class="terminal-time-skel" />
          <span class="terminal-level-skel" :style="{ width: `${40 + Math.random() * 30}px` }" />
          <span class="terminal-msg-skel" :style="{ width: `${120 + Math.random() * 180}px` }" />
        </div>
      </div>
    </template>

    <!-- 表单页面骨架 (CreateArchive 等) -->
    <template v-else-if="skeletonType === 'form'">
      <div class="form-skeleton">
        <div class="skeleton-section-header" />
        <div class="form-field-skeleton">
          <div class="skeleton-line form-label-line" />
          <div class="skeleton-line form-input-line" />
        </div>
        <div class="form-field-skeleton">
          <div class="skeleton-line form-label-line" />
          <div class="skeleton-line form-input-line form-input-wide" />
        </div>
        <div class="form-field-skeleton">
          <div class="skeleton-line form-label-line" />
          <div class="form-row">
            <div class="skeleton-line form-select-line" />
            <div class="skeleton-line form-select-line" />
          </div>
        </div>
      </div>
    </template>

    <!-- 普通页面骨架 (About 等) -->
    <template v-else-if="skeletonType === 'page'">
      <div class="page-content-skeleton">
        <div class="skeleton-line page-title-line" />
        <div class="skeleton-line page-text-line" />
        <div class="skeleton-line page-text-line page-text-short" />
        <div class="skeleton-line page-text-line" />
        <div class="skeleton-line page-text-line page-text-short" />
      </div>
    </template>

    <!-- Grid 骨架 (Home 等) — 复用 SkeletonLoader -->
    <template v-else>
      <SkeletonLoader type="grid" :count="8" />
    </template>

    <span class="sr-only">页面加载中…</span>
  </div>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.page-skeleton {
  width: 100%;
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
}

/* ===== Shared skeleton line shimmer ===== */
.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: var(--bg-tertiary, #e5e7eb);
  position: relative;
  overflow: hidden;
}

.skeleton-line::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

[data-theme="dark"] .skeleton-line::after {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.06) 50%,
    transparent 100%
  );
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-line-title {
  width: 65%;
  height: 16px;
}

.skeleton-line-subtitle {
  width: 45%;
  height: 10px;
}

/* ===== Settings skeleton ===== */
.setting-group-skeleton {
  margin-bottom: 32px;
}

.skeleton-section-header {
  width: 200px;
  height: 20px;
  border-radius: 6px;
  background: var(--bg-tertiary, #e5e7eb);
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.skeleton-section-header::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

[data-theme="dark"] .skeleton-section-header::after {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.06) 50%,
    transparent 100%
  );
}

.setting-item-skeleton {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 16px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.skeleton-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--bg-tertiary, #e5e7eb);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.skeleton-icon-box::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

[data-theme="dark"] .skeleton-icon-box::after {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.06) 50%,
    transparent 100%
  );
}

.skeleton-text-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-action-box {
  width: 60px;
  height: 30px;
  border-radius: 6px;
  background: var(--bg-tertiary, #e5e7eb);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.skeleton-action-box::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

[data-theme="dark"] .skeleton-action-box::after {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.06) 50%,
    transparent 100%
  );
}

/* ===== Log terminal skeleton ===== */
.log-skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0 16px;
  gap: 16px;
}

.log-title-line {
  width: 120px;
  height: 16px;
}

.log-btn-line {
  width: 160px;
  height: 28px;
  border-radius: 4px;
}

.log-skeleton-terminal {
  padding: 20px;
  background: var(--log-bg, #1a1a2e);
  border: 1px solid var(--log-border, #2a2a4a);
  border-radius: 8px;
  font-family: "Consolas", "Monaco", "Lucida Console", monospace;
}

.terminal-prompt {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--log-border, #2a2a4a);
}

.terminal-dollar {
  color: #4ade80;
  font-size: 14px;
  font-weight: bold;
}

.terminal-loading-text {
  color: #94a3b8;
  font-size: 13px;
}

.terminal-cursor {
  display: inline-block;
  width: 8px;
  height: 16px;
  background: #4ade80;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.terminal-line {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  opacity: 0;
  animation: terminalFadeIn 0.3s ease forwards;
  animation-delay: var(--line-delay);
}

@keyframes terminalFadeIn {
  to { opacity: 0.6; }
}

.terminal-time-skel {
  width: 100px;
  height: 14px;
  border-radius: 2px;
  background: var(--log-border, #2a2a4a);
  flex-shrink: 0;
}

.terminal-level-skel {
  height: 14px;
  border-radius: 2px;
  background: var(--log-border, #2a2a4a);
  flex-shrink: 0;
}

.terminal-msg-skel {
  height: 14px;
  border-radius: 2px;
  background: var(--log-border, #2a2a4a);
}

/* ===== Form skeleton ===== */
.form-skeleton {
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 0;
}

.form-field-skeleton {
  margin-bottom: 24px;
}

.form-label-line {
  width: 100px;
  height: 14px;
  margin-bottom: 8px;
}

.form-input-line {
  width: 100%;
  height: 40px;
  border-radius: 8px;
}

.form-input-wide {
  height: 80px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-select-line {
  flex: 1;
  height: 40px;
  border-radius: 8px;
}

/* ===== Page skeleton ===== */
.page-content-skeleton {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-title-line {
  width: 50%;
  height: 32px;
  margin-bottom: 16px;
}

.page-text-line {
  width: 100%;
  height: 14px;
}

.page-text-short {
  width: 70%;
}

/* Low-power mode */
[data-performance-mode="low"] .skeleton-line::after,
[data-performance-mode="low"] .skeleton-section-header::after,
[data-performance-mode="low"] .skeleton-icon-box::after,
[data-performance-mode="low"] .skeleton-action-box::after {
  animation: none;
  background: none;
}
</style>
