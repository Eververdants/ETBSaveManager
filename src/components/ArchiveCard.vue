<template>
  <div class="archive-card" :data-archive-id="archive.id" @click="handleCardClick" :class="{ 'archive-hidden': !archive.isVisible }">
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
        </button>
        <button class="action-btn copy" @click="toggleVisibility">
          <transition name="icon-switch" mode="out-in">
            <font-awesome-icon :key="isVisible ? 'eye' : 'eye-slash'"
              :icon="isVisible ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'" class="visibility-icon" />
          </transition>
        </button>
        <button class="action-btn delete" @click="deleteArchive">
          <font-awesome-icon icon="fa-solid fa-trash" />
        </button>
      </div>
    </div>
  </div>
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
  return `/images/${props.archive.currentLevel}.jpg`
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



// 使用ResizeObserver优化标签宽度计算，避免强制重排
let resizeObserver = null

// 缓存管理：存储标签文本到宽度的映射
const tagWidthCache = new Map()

// 可见性检测：使用Intersection Observer
let intersectionObserver = null
const hasRendered = ref(false)

// 生成文本内容的哈希值
const generateTextHash = (text) => {
  if (!text) return ''
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  return hash.toString(36)
}

const updateTagWidths = () => {
  return new Promise((resolve) => {
    const card = document.querySelector(`[data-archive-id="${props.archive.id}"]`)
    if (!card) {
      resolve()
      return
    }

    // 获取当前标签文本内容
    const currentTexts = {
      archiveDifficulty: archiveDifficultyText.value,
      actualDifficulty: actualDifficultyText.value
    }

    // 生成缓存键
    const cacheKey = generateTextHash(JSON.stringify(currentTexts))

    // 检查缓存，如果数据相同则直接复用
    if (tagWidthCache.has(cacheKey)) {
      const cachedWidths = tagWidthCache.get(cacheKey)
      const setCachedWidths = (selector, widthKey) => {
        const el = card.querySelector(selector)
        if (el && cachedWidths[widthKey]) {
          el.style.setProperty('--w-short', cachedWidths[widthKey].short)
          el.style.setProperty('--w-full', cachedWidths[widthKey].full)
        }
      }

      setCachedWidths('.difficulty-tag.archive-difficulty', 'archive')
      setCachedWidths('.difficulty-tag.actual-difficulty', 'actual')
      resolve()
      return
    }

    // 性能优化：批量处理，减少DOM查询
    const newWidths = {}

    const setWidths = (selector, key) => {
      const el = card.querySelector(selector)
      if (!el) return

      const shortEl = el.querySelector('.tag-short')
      const fullEl = el.querySelector('.tag-full')

      if (shortEl && fullEl) {
        // 使用更高效的测量方法
        const range = document.createRange()
        range.selectNodeContents(shortEl)
        const shortRect = range.getBoundingClientRect()
        range.selectNodeContents(fullEl)
        const fullRect = range.getBoundingClientRect()
        range.detach()

        const shortWidth = shortRect.width
        const fullWidth = fullRect.width

        const shortWidthPx = `${Math.ceil(shortWidth) + 8}px`
        const fullWidthPx = `${Math.ceil(fullWidth) + 12}px`

        el.style.setProperty('--w-short', shortWidthPx)
        el.style.setProperty('--w-full', fullWidthPx)

        // 存储到缓存
        newWidths[key] = {
          short: shortWidthPx,
          full: fullWidthPx
        }
      }
    }

    // 延迟执行，避免阻塞渲染
    requestAnimationFrame(() => {
      setWidths('.difficulty-tag.archive-difficulty', 'archive')
      setWidths('.difficulty-tag.actual-difficulty', 'actual')

      // 将新计算的结果存入缓存
      if (Object.keys(newWidths).length > 0) {
        tagWidthCache.set(cacheKey, newWidths)
      }

      // 确保DOM更新完成后resolve
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })
}

onMounted(async () => {
  await nextTick()

  // 获取卡片元素
  const card = document.querySelector(`[data-archive-id="${props.archive.id}"]`)
  if (!card) return

  // 按顺序渲染：计算好标签宽度后再渲染
  const renderCard = async () => {
    try {
      // 先计算标签宽度
      await updateTagWidths()

      // 立即执行动画
      animateCard()

    } catch (error) {
      console.error('标签宽度计算失败:', error)
      // 即使计算失败也执行动画
      animateCard()
    }
  }

  // 可见性检测：只有进入视口才开始计算和渲染
  if ('IntersectionObserver' in window) {
    const container = document.querySelector('.archive-grid') || document.body

    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasRendered.value) {
          // 进入视口后开始计算和渲染
          renderCard()

          // 渲染完成后停止观察
          intersectionObserver.unobserve(card)
        }
      })
    }, {
      root: container,
      rootMargin: '100px', // 减少提前计算的范围以提高性能
      threshold: 0.1 // 提高阈值以减少触发次数
    })

    // 开始观察当前卡片
    intersectionObserver.observe(card)
  } else {
    // 浏览器不支持IntersectionObserver，降级处理
    const checkVisibility = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const cardTop = card.offsetTop

      if (cardTop >= scrollTop && cardTop <= scrollTop + windowHeight + 200) {
        if (!hasRendered.value) {
          renderCard()
        }
        return true
      }
      return false
    }

    // 初始检查
    checkVisibility()

    // 滚动监听 - 使用防抖优化性能
    if (!hasRendered.value) {
      let scrollTimer = null
      const handleScroll = () => {
        // 使用防抖避免频繁检查
        if (scrollTimer) {
          clearTimeout(scrollTimer)
        }
        scrollTimer = setTimeout(() => {
          checkVisibility()
        }, 100)
      }

      window.addEventListener('scroll', handleScroll)

      // 保存清理函数
      window._scrollCleanup = window._scrollCleanup || []
      window._scrollCleanup.push(() => {
        window.removeEventListener('scroll', handleScroll)
        if (scrollTimer) {
          clearTimeout(scrollTimer)
        }
      })
    }
  }

  // 使用ResizeObserver监听标签尺寸变化
  if (card) {
    resizeObserver = new ResizeObserver(() => {
      // 只在可见时才重新计算
      if (hasRendered.value) {
        clearTimeout(card._resizeTimer)
        card._resizeTimer = setTimeout(() => {
          updateTagWidths()
          
          // ResizeObserver触发时强制重绘，防止图层卡住
          if (card && card.parentElement) {
            card.parentElement.style.visibility = 'hidden';
            card.parentElement.offsetHeight; // 触发重排
            card.parentElement.style.visibility = 'visible';
          }
        }, 100)
      }
    })
    resizeObserver.observe(card)
  }

  // 字体加载完成后重新计算（只在可见时）
  document.fonts?.ready?.then(() => {
    if (hasRendered.value) {
      setTimeout(updateTagWidths, 100)
    }
  })

  // 卡片进场动画 - 简化版本，避免与transition-group冲突
  const animateCard = () => {
    // 检查用户是否偏好减少动画
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
    if (!card.value) return
  
    // 设置初始状态 - 优化性能
    gsap.set(card.value, {
      opacity: 0,
      y: 30,
      scale: 0.95,
      /* 优化性能：减少GPU负载 */
      force3D: false,
      /* 使用更高效的渲染路径 */
      immediateRender: false
    })
  
    // 设置will-change以提高动画性能
    card.value.style.willChange = 'transform, opacity'
  
    // 入场动画 - 优化性能
    gsap.to(card.value, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: prefersReducedMotion ? 0 : 0.5,
      ease: "back.out(1.2)",
      /* 优化性能：减少GPU负载 */
      force3D: false,
      /* 使用更高效的渲染路径 */
      immediateRender: false,
      onComplete: () => {
        // 动画完成后清除will-change
        if (card.value) {
          card.value.style.willChange = 'auto'
        }
      }
    })
  }
})

// 当这些文案变动（含多语言切换）时，重测 - 添加防抖优化
let tagWidthUpdateTimer = null

watch([() => archiveDifficultyText.value, () => actualDifficultyText.value], async () => {
  // 使用防抖优化，避免频繁触发
  clearTimeout(tagWidthUpdateTimer)
  tagWidthUpdateTimer = setTimeout(async () => {
    await nextTick()
    await updateTagWidths()
  }, 100)
})

onBeforeUnmount(() => {
  // 清理ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  // 清理IntersectionObserver
  if (intersectionObserver) {
    const card = document.querySelector(`[data-archive-id="${props.archive.id}"]`)
    if (card) {
      intersectionObserver.unobserve(card)
    }
    intersectionObserver.disconnect()
    intersectionObserver = null
  }

  // 清理防抖定时器
  const card = document.querySelector(`[data-archive-id="${props.archive.id}"]`)
  if (card && card._resizeTimer) {
    clearTimeout(card._resizeTimer)
  }

  // 清理标签宽度更新定时器
  if (tagWidthUpdateTimer) {
    clearTimeout(tagWidthUpdateTimer)
  }

  // 清理全局滚动事件监听器
  if (window._scrollCleanup) {
    window._scrollCleanup.forEach(cleanup => cleanup())
    window._scrollCleanup = []
  }

  // 清理缓存（避免内存泄漏，但保留其他实例可能用到的缓存）
  // 注意：这里不清空全局tagWidthCache，因为其他卡片实例可能还在使用
})
</script>

<style scoped>
.archive-card {
  position: relative;
  width: 320px;
  height: 160px;
  border-radius: var(--card-radius);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform, box-shadow;
  background: var(--card-bg);
  border: var(--card-border);
  box-shadow: var(--card-shadow);
  /* 优化性能：减少GPU负载 */
  transform: translateZ(0);
  backface-visibility: hidden;
  /* 优化性能：减少重绘 */
  contain: layout style paint;
  min-height: 160px;
  z-index: 1;
}

.archive-card:hover {
  transform: translateZ(0) translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* 卡片删除动画期间的尺寸固定 */
.archive-card.v-leave-active {
  position: absolute;
  width: 320px !important;
  height: 160px !important;
  min-width: 320px !important;
  min-height: 160px !important;
  max-width: 320px !important;
  max-height: 160px !important;
  box-sizing: border-box !important;
  /* 优化性能：减少GPU负载 */
  transform: translateZ(0);
  backface-visibility: hidden;
  /* 优化性能：减少重绘 */
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
  /* 添加初始模糊效果 */
  filter: blur(1.5px);
  /* 性能优化：使用更简单的过渡效果 */
  transition: filter 0.2s ease;
  /* 确保容器不会超出边界 */
  box-sizing: border-box;
  /* 确保图片填充整个容器 */
  display: block;
}

/* 悬浮时移除模糊效果 */
.archive-card:hover .lazy-image-container {
  filter: blur(0);
}

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
  /* 移除模糊效果以提高清晰度 */
  /* backdrop-filter: blur(1px); */
}

.archive-info {
  position: absolute;
  bottom: 8px;
  left: 12px;
  right: 12px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.archive-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-mode-info {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.difficulty-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid;
  /* 移除模糊效果以提高性能 */
  /* backdrop-filter: blur(2px); */
  /* 性能优化：简化过渡效果 */
  transition: inline-size 0.2s ease,
    opacity 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  position: relative;
  inline-size: var(--w-short, auto);
  height: 20px;
  line-height: 1;
  /* 调整对齐方式确保垂直居中 */
  vertical-align: top;
  min-width: 30px;
  padding: 0 16px;
}

.tag-short,
.tag-full {
  position: absolute;
  left: 50%;
  top: 50%;
  /* 性能优化：使用更简单的过渡效果 */
  transition: opacity 0.15s ease;
  white-space: nowrap;
  /* 确保文字垂直居中 */
  display: flex;
  align-items: center;
  justify-content: center;
  /* 微调位置使文字更加居中 */
  transform: translate(-50%, -50%) translateY(-1px);
}

.tag-short {
  opacity: 1;
}

.tag-full {
  opacity: 0;
}

/* 悬浮时展开动画 */
.archive-card:hover .difficulty-tag {
  inline-size: var(--w-full, var(--w-short, auto));
  padding: 6px 20px;
}

/* 文字切换动画 */
.archive-card:hover .tag-short {
  opacity: 0;
}

.archive-card:hover .tag-full {
  opacity: 1;
}

.difficulty-tags {
  display: flex;
  gap: 4px;
  align-items: center;
}

.difficulty-easy {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.difficulty-normal {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.difficulty-hard {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.difficulty-nightmare {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 卡片悬浮时显示彩色标签和展开效果 */
.archive-card:hover {
  /* 性能优化：使用更简单的变换以提高性能 */
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.archive-card:hover .difficulty-easy {
  background: rgba(52, 199, 89, 0.2);
  color: #34c759;
  border-color: rgba(52, 199, 89, 0.4);
}

.archive-card:hover .difficulty-normal {
  background: rgba(255, 149, 0, 0.2);
  color: #ff9500;
  border-color: rgba(255, 149, 0, 0.4);
}

.archive-card:hover .difficulty-hard {
  background: rgba(255, 59, 48, 0.2);
  color: #ff3b30;
  border-color: rgba(255, 59, 48, 0.4);
}

.archive-card:hover .difficulty-nightmare {
  background: rgba(175, 82, 222, 0.2);
  color: #af52de;
  border-color: rgba(175, 82, 222, 0.4);
}

/* 下半信息区域 */
.card-info {
  height: 60px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card-bg);
}

.level-info {
  flex: 1;
}

.current-level {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.action-buttons {
  display: flex;
  gap: 6px;
  align-items: center;
  min-height: 24px;
  /* 防止按钮高度变化导致布局抖动 */
}

.action-btn {
  background: rgba(128, 128, 128, 0.1);
  color: rgba(128, 128, 128, 0.7);
  border: 1px solid rgba(128, 128, 128, 0.2);
  font-size: 12px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 16px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 24px;
  font-weight: 500;
  box-sizing: border-box;
  /* 确保边框不增加元素尺寸 */
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Vue过渡动画 - 图标切换 */
.icon-switch-enter-active,
.icon-switch-leave-active {
  transition: all 0.3s ease;
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

/* 卡片悬浮时按钮显示颜色 */
.archive-card:hover .action-btn.edit {
  background: rgba(52, 199, 89, 0.2);
  color: #34c759;
  border: 1px solid rgba(52, 199, 89, 0.3);
}

.archive-card:hover .action-btn.copy {
  background: rgba(0, 122, 255, 0.2);
  color: #007aff;
  border: 1px solid rgba(0, 122, 255, 0.3);
}

.archive-card:hover .action-btn.delete {
  background: rgba(255, 59, 48, 0.2);
  color: #ff3b30;
  border: 1px solid rgba(255, 59, 48, 0.3);
}

/* 按钮自身的悬浮效果 */
.archive-card:hover .action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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
    padding: 8px 10px;
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
}
</style>