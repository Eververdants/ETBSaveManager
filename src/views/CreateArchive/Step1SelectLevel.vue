<template>
  <div class="step-content" data-step="1">
    <!-- 结局选择器 -->
    <transition name="ending-selector" appear>
      <div class="ending-selector">
        <div class="ending-tabs">
          <div v-for="(ending, index) in endings" :key="index" class="ending-tab"
            :class="{ active: selectedEnding === index }" @click="$emit('select-ending', index)"
            :style="{ '--index': index }">
            <span class="ending-icon">{{ ending.icon }}</span>
            <span class="ending-label">{{ ending.label }}</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- 层级选择卡片 -->
    <div class="section-card">
      <div class="level-grid">
        <div v-for="(level, index) in availableLevels" :key="level.levelKey" class="level-card"
          :class="{ selected: selectedLevel === index }" @click="handleSelectLevel(index, $event)">
          <div class="level-image-container">
            <LazyImage :src="level.image" :alt="level.name" image-class="level-image" />
            <div class="level-overlay">
              <font-awesome-icon :icon="['fas', 'check']" class="check-icon" v-if="selectedLevel === index" />
            </div>
          </div>
          <div class="level-info">
            <h3 class="level-name">{{ level.name }}</h3>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { gsap } from 'gsap'
import LazyImage from '@/components/LazyImage.vue'

export default {
  name: 'Step1SelectLevel',
  components: {
    LazyImage
  },
  props: {
    selectedLevel: {
      type: Number,
      default: -1
    },
    selectedEnding: {
      type: Number,
      default: 0
    },
    availableLevels: {
      type: Array,
      default: () => []
    },
    endings: {
      type: Array,
      default: () => []
    }
  },
  emits: ['select-level', 'select-ending'],
  methods: {
    handleSelectLevel(index, event) {
      const card = event.currentTarget
      // 先清除可能存在的动画
      gsap.killTweensOf(card)
      // 执行点击反馈动画
      gsap.timeline()
        .to(card, {
          scale: 1.08,
          duration: 0.1,
          ease: "power2.out",
          overwrite: true
        })
        .to(card, {
          scale: 1,
          duration: 0.2,
          ease: "elastic.out(1, 0.5)"
        })
      // 触发事件
      this.$emit('select-level', index)
    }
  }
}
</script>

<style scoped>
/* 结局选择器动画 */
.ending-selector-enter-active {
  transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.ending-selector-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0.055, 0.675, 0.19);
}

.ending-selector-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.ending-selector-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* 结局选择器样式 */
.ending-selector {
  margin-bottom: 20px;
  overflow: hidden;
}

.ending-tabs {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 0 20px;
  position: relative;
}

.ending-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.ending-tab.active {
  background: var(--accent-color) !important;
  border-color: var(--accent-color) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(var(--accent-color-rgb), 0.3) !important;
  z-index: 10 !important;
  position: relative !important;
}

.ending-tab:active {
  transform: scale(0.98);
}

.ending-tab:hover {
  background: var(--bg-tertiary);
}

.ending-icon {
  font-size: 18px;
  line-height: 1;
}

.ending-label {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

/* 卡片样式 - 优化版 */
.section-card {
  background: linear-gradient(145deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  height: calc(100vh - 280px);
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

/* 顶部高光效果 */
.section-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20px;
  right: 20px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  pointer-events: none;
}

/* 自定义滚动条 */
.section-card::-webkit-scrollbar {
  width: 6px;
}

.section-card::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}

.section-card::-webkit-scrollbar-thumb {
  background: rgba(var(--accent-color-rgb), 0.3);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.section-card::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--accent-color-rgb), 0.5);
}

/* 层级网格 */
.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 18px;
  padding: 4px;
}

.level-card {
  background: linear-gradient(160deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.level-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.12),
    0 4px 10px rgba(0, 0, 0, 0.08);
  border-color: rgba(var(--accent-color-rgb), 0.3);
}

.level-card.selected {
  border-color: var(--accent-color);
  box-shadow:
    0 0 0 3px rgba(var(--accent-color-rgb), 0.25),
    0 8px 20px rgba(var(--accent-color-rgb), 0.2);
  transform: translateY(-2px);
}

.level-image-container {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.level-image-container :deep(.level-image) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.level-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.level-card.selected .level-overlay {
  opacity: 1;
  background: rgba(var(--accent-color-rgb), 0.4);
}

.check-icon {
  color: white;
  font-size: 32px;
}

.level-info {
  padding: 14px 12px;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.02) 100%);
}

.level-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  text-align: center;
  line-height: 1.4;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.level-card:hover .level-name {
  color: var(--accent-color);
}

.level-card.selected .level-name {
  color: var(--accent-color);
  font-weight: 700;
}
</style>
