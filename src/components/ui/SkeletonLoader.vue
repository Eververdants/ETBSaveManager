<script setup>
/**
 * SkeletonLoader - 加载占位骨架屏组件
 * 使用 shimmer 动画模拟内容加载，减少用户等待感知
 */
import { computed } from "vue";

const props = defineProps({
  /** 布局类型: grid | card | list */
  type: {
    type: String,
    default: "grid",
  },
  /** 显示数量（grid 模式 = 卡片数，list 模式 = 行数） */
  count: {
    type: Number,
    default: 8,
  },
  /** 每行列数（grid 模式，0 = 自动填充） */
  columns: {
    type: Number,
    default: 0,
  },
});

const rows = computed(() => {
  if (props.type === "grid") {
    const cols = props.columns || 4;
    return Math.ceil(props.count / cols);
  }
  return props.count;
});

const cols = computed(() => {
  if (props.type === "grid") {
    return props.columns || 4;
  }
  return 1;
});

const gridStyle = computed(() => {
  if (props.type !== "grid") return {};
  return {
    gridTemplateColumns: `repeat(${cols.value}, 1fr)`,
  };
});

const items = computed(() => {
  return Array.from({ length: props.count }, (_, i) => i);
});
</script>

<template>
  <div
    class="skeleton-loader"
    :class="[`skeleton-${type}`]"
    :style="gridStyle"
    role="status"
    aria-label="加载中"
  >
    <!-- Grid 模式：卡片骨架 -->
    <template v-if="type === 'grid'">
      <div v-for="i in items" :key="i" class="skeleton-card">
        <div class="skeleton-card-banner">
          <div class="skeleton-shimmer" />
        </div>
        <div class="skeleton-card-body">
          <div class="skeleton-line skeleton-line-title" />
          <div class="skeleton-line skeleton-line-subtitle" />
          <div class="skeleton-card-footer">
            <div class="skeleton-tag" />
            <div class="skeleton-tag skeleton-tag-short" />
          </div>
        </div>
      </div>
    </template>

    <!-- Card 模式：大卡片骨架 -->
    <template v-else-if="type === 'card'">
      <div v-for="i in items" :key="i" class="skeleton-single-card">
        <div class="skeleton-single-card-left">
          <div class="skeleton-shimmer" />
        </div>
        <div class="skeleton-single-card-right">
          <div class="skeleton-line skeleton-line-lg" />
          <div class="skeleton-line" />
          <div class="skeleton-line skeleton-line-short" />
        </div>
      </div>
    </template>

    <!-- List 模式：行骨架 -->
    <template v-else>
      <div v-for="i in items" :key="i" class="skeleton-row">
        <div class="skeleton-row-icon" />
        <div class="skeleton-row-content">
          <div class="skeleton-line skeleton-line-title" />
          <div class="skeleton-line skeleton-line-short" />
        </div>
        <div class="skeleton-row-action" />
      </div>
    </template>

    <span class="sr-only">加载中…</span>
  </div>
</template>

<style scoped>
/* Screen reader only utility */
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

.skeleton-loader {
  width: 100%;
}

/* Grid layout */
.skeleton-grid {
  display: grid;
  gap: 16px;
  padding: 16px;
}

/* ===== Card Skeleton ===== */
.skeleton-card {
  border-radius: var(--radius-card, 16px);
  overflow: hidden;
  background: var(--bg-secondary, #f3f4f6);
  border: 1px solid var(--border, #e5e7eb);
  min-height: 260px;
}

.skeleton-card-banner {
  position: relative;
  width: 100%;
  height: 140px;
  overflow: hidden;
  background: var(--bg-tertiary, #e5e7eb);
}

.skeleton-card-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-card-footer {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* ===== Single Card Skeleton ===== */
.skeleton-single-card {
  display: flex;
  gap: 20px;
  padding: 16px;
  border-radius: var(--radius-card, 16px);
  background: var(--bg-secondary, #f3f4f6);
  border: 1px solid var(--border, #e5e7eb);
  margin-bottom: 12px;
  min-height: 120px;
}

.skeleton-single-card-left {
  width: 120px;
  min-height: 100px;
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  position: relative;
  background: var(--bg-tertiary, #e5e7eb);
  flex-shrink: 0;
}

.skeleton-single-card-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
}

/* ===== Row Skeleton ===== */
.skeleton-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border, #e5e7eb);
}

.skeleton-row-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md, 8px);
  background: var(--bg-tertiary, #e5e7eb);
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}

.skeleton-row-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-row-action {
  width: 60px;
  height: 28px;
  border-radius: var(--radius-button, 8px);
  background: var(--bg-tertiary, #e5e7eb);
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}

/* ===== Shared ===== */
.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: var(--bg-tertiary, #e5e7eb);
  position: relative;
  overflow: hidden;
}

.skeleton-line-title {
  width: 65%;
  height: 16px;
}

.skeleton-line-subtitle {
  width: 45%;
}

.skeleton-line-lg {
  height: 18px;
  width: 80%;
}

.skeleton-line-short {
  width: 30%;
}

.skeleton-tag {
  height: 22px;
  width: 56px;
  border-radius: var(--radius-tag, 6px);
  background: var(--bg-tertiary, #e5e7eb);
  position: relative;
  overflow: hidden;
}

.skeleton-tag-short {
  width: 42px;
}

/* ===== Shimmer overlay ===== */
.skeleton-shimmer,
.skeleton-line::after,
.skeleton-tag::after,
.skeleton-row-icon::after,
.skeleton-row-action::after,
.skeleton-single-card-left::after {
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

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Dark theme shimmer adjustment */
[data-theme="dark"] .skeleton-line::after,
[data-theme="dark"] .skeleton-tag::after,
[data-theme="dark"] .skeleton-shimmer,
[data-theme="dark"] .skeleton-row-icon::after,
[data-theme="dark"] .skeleton-row-action::after,
[data-theme="dark"] .skeleton-single-card-left::after {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.06) 50%,
    transparent 100%
  );
}

/* Performance-aware: skip shimmer animation on low-power mode */
[data-performance-mode="low"] .skeleton-shimmer,
[data-performance-mode="low"] .skeleton-line::after,
[data-performance-mode="low"] .skeleton-tag::after {
  animation: none;
  background: none;
}
</style>
