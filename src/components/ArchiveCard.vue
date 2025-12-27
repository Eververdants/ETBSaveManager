<template>
  <transition appear @before-enter="animateCard" :css="false">
    <div class="archive-card" :data-archive-id="archive.id" @click="handleCardClick"
      :class="{ 'archive-hidden': !archive.isVisible }">
      <!-- 上半背景区域 -->
      <div class="card-background">
        <LazyImage :src="backgroundImage" :alt="currentLevelName" image-class="background-image" />
        <div class="background-overlay"></div>

        <!-- 存档信息 -->
        <div class="archive-info">
          <h3 class="archive-name">{{ archive.name }}</h3>
          <div class="game-mode-info">
            <span class="difficulty-tags">
              <span class="difficulty-tag archive-difficulty" :class="archiveDifficultyClass">
                <span class="tag-short">{{ archiveDifficultyText }}</span>
                <span class="tag-full">{{ t('archiveCard.archiveDifficulty') }}：{{ archiveDifficultyText }}</span>
              </span>
              <span class="difficulty-tag actual-difficulty" :class="actualDifficultyClass">
                <span class="tag-short">{{ actualDifficultyText }}</span>
                <span class="tag-full">{{ t('archiveCard.actualDifficulty') }}：{{ actualDifficultyText }}</span>
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- 下半信息区域 -->
      <div class="card-info">
        <div class="level-info">
          <span class="current-level">{{ currentLevelName }}</span>
        </div>

        <div class="action-buttons">
          <button class="action-btn edit" @click="editArchive">
            <font-awesome-icon icon="fa-solid fa-edit" />
            <span class="shine"></span>
          </button>
          <button class="action-btn copy" @click="toggleVisibility">
            <transition name="icon-switch" mode="out-in">
              <font-awesome-icon :key="isVisible ? 'eye' : 'eye-slash'"
                :icon="isVisible ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'" class="visibility-icon" />
            </transition>
            <span class="shine"></span>
          </button>
          <button class="action-btn delete" @click="deleteArchive">
            <font-awesome-icon icon="fa-solid fa-trash" />
            <span class="shine"></span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import LazyImage from './LazyImage.vue'

// Props
const props = defineProps({
  archive: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits(['toggle-visibility', 'edit', 'delete', 'select'])

// 防重复点击控制
const clickTimeouts = new Map()
const isProcessingClick = new Set()

// Computed
// 使用i18n翻译，避免硬编码
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const isVisible = computed(() => props.archive.isVisible)

const currentLevelName = computed(() => {
  return t(`LevelName_Display.${props.archive.currentLevel}`) || props.archive.currentLevel
})

const backgroundImage = computed(() => {
  // 现在所有关卡都使用关卡名称作为图片文件名
  return `/images/ETB/${props.archive.currentLevel}.jpg`
})

const archiveDifficultyText = computed(() => {
  return t(`createArchive.difficultyLevels.${props.archive.archiveDifficulty}`) || props.archive.archiveDifficulty
})

const actualDifficultyText = computed(() => {
  return t(`createArchive.difficultyLevels.${props.archive.actualDifficulty}`) || props.archive.actualDifficulty
})

const archiveDifficultyClass = computed(() => {
  return `difficulty-${props.archive.archiveDifficulty}`
})

const actualDifficultyClass = computed(() => {
  return `difficulty-${props.archive.actualDifficulty}`
})

// Methods
const toggleVisibility = () => {
  // 创建一个新的存档对象，切换isVisible状态
  const updatedArchive = {
    ...props.archive,
    isVisible: !props.archive.isVisible
  }
  emit('toggle-visibility', updatedArchive)
}

const editArchive = () => {
  emit('edit', props.archive)
}

const deleteArchive = () => {
  emit('delete', props.archive)
}

const handleCardClick = (event) => {
  // 阻止事件冒泡
  event.stopPropagation()

  // 防止重复点击
  if (isProcessingClick.has(props.archive.id)) {
    return
  }

  isProcessingClick.add(props.archive.id)

  // 清除之前的定时器
  if (clickTimeouts.has(props.archive.id)) {
    clearTimeout(clickTimeouts.get(props.archive.id))
  }

  // 直接触发选择事件，不执行动画
  emit('select', props.archive)

  // 延迟清理点击状态
  setTimeout(() => {
    isProcessingClick.delete(props.archive.id)
  }, 300)
}

// 优化后的标签宽度计算
let resizeObserver = null
let intersectionObserver = null
const hasRendered = ref(false)
const cardElement = ref(null)

// 全局共享的测量元素（避免重复创建/销毁）
let sharedMeasureElement = null
const getMeasureElement = () => {
  if (!sharedMeasureElement) {
    sharedMeasureElement = document.createElement('div')
    sharedMeasureElement.style.cssText = 'position:absolute;visibility:hidden;height:auto;width:auto;white-space:nowrap;padding:0;margin:0;font-size:12px;font-weight:500;pointer-events:none'
    document.body.appendChild(sharedMeasureElement)
  }
  return sharedMeasureElement
}

// 文本宽度缓存
const textWidthCache = new Map()
const measureTextWidth = (text) => {
  if (textWidthCache.has(text)) {
    return textWidthCache.get(text)
  }
  const el = getMeasureElement()
  el.textContent = text
  const width = el.offsetWidth
  textWidthCache.set(text, width)
  return width
}

// 优化后的标签宽度计算函数
const updateTagWidths = () => {
  if (!cardElement.value) return

  const difficultyTag = cardElement.value.querySelector('.difficulty-tag.archive-difficulty')
  const actualTag = cardElement.value.querySelector('.difficulty-tag.actual-difficulty')

  // 批量读取 DOM
  const tags = [
    { el: difficultyTag, short: difficultyTag?.querySelector('.tag-short')?.textContent || '', full: difficultyTag?.querySelector('.tag-full')?.textContent || '' },
    { el: actualTag, short: actualTag?.querySelector('.tag-short')?.textContent || '', full: actualTag?.querySelector('.tag-full')?.textContent || '' }
  ]

  // 批量写入 DOM（使用 requestAnimationFrame 避免强制同步布局）
  requestAnimationFrame(() => {
    tags.forEach(({ el, short, full }) => {
      if (!el) return
      const shortWidth = Math.max(30, measureTextWidth(short) + 16)
      const fullWidth = Math.max(shortWidth, measureTextWidth(full) + 5)
      el.style.setProperty('--w-short', `${shortWidth}px`)
      el.style.setProperty('--w-full', `${fullWidth}px`)
    })
  })
}

// 卡片入场动画（简化版，减少性能开销）
const animateCard = (el, done) => {
  // 检查用户是否偏好减少动画
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    done?.()
    return
  }

  // 简化动画：只使用 opacity 和 transform，避免 filter
  gsap.fromTo(el, 
    { opacity: 0, y: 10 },
    { 
      opacity: 1, 
      y: 0, 
      duration: 0.2,
      ease: "power2.out",
      onComplete: done,
      force3D: true
    }
  )
}

// 卡片退场动画
const animateCardLeave = (el, done) => {
  // 检查用户是否偏好减少动画
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  gsap.to(el, {
    opacity: 0,
    scale: 0.9,
    y: -10,
    filter: 'blur(2px)',
    duration: prefersReducedMotion ? 0 : 0.25,
    ease: "power2.in",
    onComplete: done,
    force3D: true,
    willChange: 'transform, opacity, filter'
  })
}

onMounted(() => {
  // 使用 requestIdleCallback 延迟非关键初始化
  const initCard = () => {
    cardElement.value = document.querySelector(`[data-archive-id="${props.archive.id}"]`)
    if (!cardElement.value) return

    // 直接计算标签宽度，不再使用 IntersectionObserver（简化逻辑）
    updateTagWidths()
    hasRendered.value = true
  }

  // 优先使用 requestIdleCallback，降低初始化优先级
  if ('requestIdleCallback' in window) {
    requestIdleCallback(initCard, { timeout: 100 })
  } else {
    // 降级：使用 setTimeout
    setTimeout(initCard, 16)
  }
})

// 当文案变动时，重测 - 添加防抖优化
let tagWidthUpdateTimer = null

watch([() => archiveDifficultyText.value, () => actualDifficultyText.value], () => {
  clearTimeout(tagWidthUpdateTimer)
  tagWidthUpdateTimer = setTimeout(updateTagWidths, 100)
})

onBeforeUnmount(() => {
  // 清理定时器
  if (tagWidthUpdateTimer) {
    clearTimeout(tagWidthUpdateTimer)
    tagWidthUpdateTimer = null
  }
})
</script>

<style scoped>
/* 组件根容器 */
.archive-card {
  position: relative;
  width: 100%;
  min-width: 320px;
  height: 160px;
  border-radius: var(--radius-card);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    box-shadow 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform, box-shadow;
  background: var(--card-bg);
  border: var(--card-border);
  box-shadow: var(--card-shadow);
  transform: translateZ(0);
  backface-visibility: hidden;
  contain: layout style paint;
  min-height: 160px;
  z-index: 1;
  isolation: isolate;
  /* 简化呼吸灯效果，减少性能开销 */
  animation: card-subtle-pulse 6s infinite alternate;
  /* 优化文字渲染，防止缩放时模糊 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 简化卡片光泽扫过效果 */
.archive-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg,
      rgba(255, 255, 255, 0) 30%,
      rgba(255, 255, 255, 0.02) 50%,
      rgba(255, 255, 255, 0) 70%);
  transform: rotate(45deg) translate(-100%, -100%);
  transition: transform 0.8s ease;
  pointer-events: none;
  z-index: 3;
}

.archive-card:hover::before {
  transform: rotate(45deg) translate(100%, 100%);
}

@keyframes card-subtle-pulse {
  0% {
    box-shadow: var(--card-shadow);
  }

  100% {
    box-shadow: 0 4px 12px -5px rgba(0, 0, 0, 0.2);
  }
}

.archive-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.4), 0 4px 8px -4px rgba(0, 0, 0, 0.3);
  z-index: 2;
  /* 简化光泽效果，减少性能开销 */
  background: linear-gradient(145deg, var(--card-bg) 0%, rgba(255, 255, 255, 0.03) 50%, var(--card-bg) 100%);
  /* 优化缩放后的文字渲染 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 卡片删除动画期间的尺寸固定 */
.archive-card.v-leave-active {
  position: absolute;
  height: 160px !important;
  min-height: 160px !important;
  max-height: 160px !important;
  box-sizing: border-box !important;
  transform: translateZ(0);
  backface-visibility: hidden;
  contain: layout style paint;
}

/* 上半背景区域 */
.card-background {
  position: relative;
  width: 100%;
  height: 100px;
  overflow: hidden;
}

/* 确保在删除动画期间背景容器保持固定尺寸 */
.archive-card.v-leave-active .card-background {
  width: 100% !important;
  height: 100px !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

/* LazyImage容器样式 */
.card-background .lazy-image-container {
  width: 100%;
  height: 100%;
  filter: blur(1px);
  transition: filter 0.3s ease, transform 0.3s ease;
  box-sizing: border-box;
  display: block;
  transform: scale(1.005);
}

/* 悬浮时移除模糊效果并添加放大效果 */
.archive-card:hover .lazy-image-container {
  filter: blur(0);
  transform: scale(1.01);
}

/* 背景叠加层 */
.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0.1) 30%,
      rgba(0, 0, 0, 0.3) 50%,
      rgba(0, 0, 0, 0.5) 70%,
      rgba(0, 0, 0, 0.7) 90%,
      rgba(0, 0, 0, 0.8) 100%);
  transition: opacity 0.3s ease;
}

/* 悬浮时背景叠加层变化 */
.archive-card:hover .background-overlay {
  opacity: 0.9;
}

/* 存档信息区域 */
.archive-info {
  position: absolute;
  bottom: var(--space-2);
  left: var(--space-3);
  right: var(--space-3);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  transition: transform 0.3s ease;
}

/* 悬浮时信息区域变化 */
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
  /* 优化文字渲染，防止缩放时模糊 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 游戏模式信息区域 */
.game-mode-info {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  flex-wrap: wrap;
}

/* 难度标签容器 */
.difficulty-tags {
  display: flex;
  gap: 4px;
  align-items: center;
}

/* 难度标签基础样式 */
.difficulty-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-tag);
  font-size: 11px;
  font-weight: 500;
  border: 1px solid;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  white-space: nowrap;
  overflow: hidden;
  position: relative;
  inline-size: var(--w-short, auto);
  height: 20px;
  line-height: 1;
  vertical-align: top;
  min-width: 30px;
  padding: 0 16px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  /* 优化文字渲染，防止缩放时模糊 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 标签文本样式 */
.tag-short,
.tag-full {
  position: absolute;
  left: 50%;
  top: 50%;
  transition: opacity 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%) translateY(-1px);
  /* 优化文字渲染，防止缩放时模糊 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.tag-short {
  opacity: 1;
}

.tag-full {
  opacity: 0;
}

/* 悬浮时标签展开动画 */
.archive-card:hover .difficulty-tag {
  inline-size: var(--w-full, var(--w-short, auto));
  padding: 6px 20px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* 文字切换动画 */
.archive-card:hover .tag-short {
  opacity: 0;
}

.archive-card:hover .tag-full {
  opacity: 1;
}

/* 难度标签默认状态 */
.difficulty-tag {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 难度标签悬浮状态 - 使用CSS变量定义颜色 */
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
  padding: var(--space-3) var(--space-3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
  transition: background-color 0.3s ease;
}

/* 悬浮时下半信息区域变化 */
.archive-card:hover .card-info {
  background-color: rgba(255, 255, 255, 0.02);
}

.level-info {
  flex: 1;
  display: flex;
  align-items: center;
  height: 100%;
}

.current-level {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  /* 优化文字渲染，防止缩放时模糊 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 操作按钮区域 */
.action-buttons {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  min-height: 24px;
}

/* 操作按钮基础样式 */
.action-btn {
  background: rgba(128, 128, 128, 0.1);
  color: rgba(128, 128, 128, 0.7);
  border: 1px solid rgba(128, 128, 128, 0.2);
  font-size: 12px;
  cursor: pointer;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-button);
  transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    box-shadow 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    background-color 0.3s ease, color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 24px;
  font-weight: 500;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  /* 简化按钮内部光泽效果，减少性能开销 */
  background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.03) 100%);
  /* 简化内阴影效果 */
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  /* 使用will-change优化动画性能，但只针对会变化的属性 */
  will-change: transform, box-shadow;
  /* 添加硬件加速 */
  backface-visibility: hidden;
  transform: translateZ(0);
  /* 优化文字渲染，防止缩放时模糊 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 添加磁吸效果 - 扩大实际交互区域 */
.action-btn::before {
  content: '';
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  z-index: -1;
}

/* 简化按钮液体波纹效果 */
.action-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%);
  transform: translate(-50%, -50%);
  transition: width 0.5s ease, height 0.5s ease;
  z-index: 1;
  /* 优化性能 */
  will-change: width, height;
}

.action-btn:active::after {
  width: 100px;
  height: 100px;
}

/* 简化按钮光泽层效果 */
.action-btn .shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0) 100%);
  transition: left 0.4s ease;
  z-index: 2;
  pointer-events: none;
  /* 优化性能 */
  will-change: left;
}



/* 操作按钮悬浮状态 - 简化版本 */
.action-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  /* 简化光泽变化 */
  background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.03) 100%);
  /* 优化缩放后的文字渲染 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 悬浮时触发光泽扫过效果 - 简化版本 */
.action-btn:hover .shine {
  left: 100%;
}

/* 卡片悬浮时按钮显示颜色 - 简化版本 */
.archive-card:hover .action-btn.edit {
  background: linear-gradient(135deg, rgba(52, 199, 89, 0.12) 0%, rgba(52, 199, 89, 0.2) 100%);
  color: #34c759;
  border-color: rgba(52, 199, 89, 0.3);
  box-shadow: 0 2px 6px rgba(52, 199, 89, 0.2), inset 0 1px 0 rgba(52, 199, 89, 0.15);
}

.archive-card:hover .action-btn.copy {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.12) 0%, rgba(0, 122, 255, 0.2) 100%);
  color: #007aff;
  border-color: rgba(0, 122, 255, 0.3);
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.2), inset 0 1px 0 rgba(0, 122, 255, 0.15);
}

.archive-card:hover .action-btn.delete {
  background: linear-gradient(135deg, rgba(255, 59, 48, 0.12) 0%, rgba(255, 59, 48, 0.2) 100%);
  color: #ff3b30;
  border-color: rgba(255, 59, 48, 0.3);
  box-shadow: 0 2px 6px rgba(255, 59, 48, 0.2), inset 0 1px 0 rgba(255, 59, 48, 0.15);
}

/* Vue过渡动画 - 图标切换 */
.icon-switch-enter-active,
.icon-switch-leave-active {
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.icon-switch-enter-from {
  opacity: 0;
  transform: scale(0.5) rotate(-180deg);
}

.icon-switch-leave-to {
  opacity: 0;
  transform: scale(0.5) rotate(180deg);
}

.visibility-icon {
  display: inline-block;
}

/* 隐藏状态的存档样式 */
.archive-hidden {
  opacity: 0.6;
  filter: grayscale(0.8);
  transition: all 0.5s ease;
}

.archive-hidden .archive-name {
  color: rgba(255, 255, 255, 0.6);
}

.archive-hidden .background-image {
  filter: grayscale(1) brightness(0.7);
}

.archive-hidden .visibility-icon {
  color: #ff3b30 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .archive-card {
    width: 280px;
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

  .game-mode-info {
    font-size: 11px;
  }

  .current-level {
    font-size: 13px;
  }

  /* 移动端优化按钮尺寸和间距 */
  .action-btn {
    min-width: 36px;
    height: 28px;
    padding: var(--space-2);
  }

  /* 移动端优化触摸区域 */
  .action-buttons {
    gap: var(--space-3);
  }

  /* 移动端优化标签尺寸 */
  .difficulty-tag {
    height: 18px;
    font-size: 10px;
    min-width: 28px;
  }

  /* 移动端减少动画效果 */
  .archive-card:hover {
    transform: translateY(-2px);
  }

  .action-btn:hover {
    transform: translateY(-1px);
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .archive-card {
    width: 100%;
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

  /* 超小屏幕进一步优化按钮 */
  .action-btn {
    min-width: 32px;
    height: 26px;
    padding: var(--space-1) var(--space-2);
  }

  /* 超小屏幕优化标签 */
  .difficulty-tag {
    height: 16px;
    font-size: 9px;
    min-width: 26px;
    padding: 0 12px;
  }

  .archive-info {
    left: var(--space-2);
    right: var(--space-2);
    bottom: var(--space-1);
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {

  /* 增大触摸区域 */
  .action-btn {
    min-width: 40px;
    height: 32px;
  }

  /* 移除悬浮效果，使用点击效果 */
  .archive-card:hover {
    transform: none;
  }

  .action-btn:hover {
    transform: none;
  }

  .action-btn:active {
    transform: scale(0.95);
  }

  /* 触摸设备上标签始终展开 */
  .difficulty-tag {
    inline-size: var(--w-full, var(--w-short, auto));
    padding: 6px 16px;
  }

  .tag-short {
    opacity: 0;
  }

  .tag-full {
    opacity: 1;
  }
}

/* 高分辨率屏幕优化 */
@media (-webkit-min-device-pixel-ratio: 2),
(min-resolution: 192dpi) {

  .archive-name,
  .current-level {
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
</style>