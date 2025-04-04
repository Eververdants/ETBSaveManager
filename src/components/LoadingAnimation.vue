<template>
  <div class="loading-container">
    <!-- 扁平现代风格骨架屏 -->
    <div class="skeleton-container">
      <div v-for="i in 20" :key="i" class="skeleton-card">
        <div class="skeleton-title"></div>
        <div class="skeleton-info">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  fullPage: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped>
.loading-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

/* 骨架屏容器 */
.skeleton-container {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}

/* 扁平现代风格骨架屏卡片 */
.skeleton-card {
  width: 288px;
  height: 200px;
  background-color: #ffffff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 骨架屏标题 */
.skeleton-title {
  height: 28px;
  margin-bottom: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 2s infinite;
}

/* 骨架屏信息区域 */
.skeleton-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 骨架屏行 */
.skeleton-line {
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 2s infinite;
}

.skeleton-line:nth-child(1) {
  width: 100%;
  animation-delay: 0.1s;
}

.skeleton-line:nth-child(2) {
  width: 85%;
  animation-delay: 0.2s;
}

.skeleton-line:nth-child(3) {
  width: 70%;
  animation-delay: 0.3s;
}

/* 光晕动画 */
@keyframes glow {
  0%, 100% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.7;
    transform: translate(-50%, -50%) scale(1.5);
  }
}

/* 闪烁动画 */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>