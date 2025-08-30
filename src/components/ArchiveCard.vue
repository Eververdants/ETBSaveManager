<template>
  <div class="archive-card" :data-archive-id="archive.id">
    <!-- 上半背景区域 -->
    <div class="card-background">
      <img :src="backgroundImage" :alt="currentLevelName" class="background-image" />
      <div class="background-overlay"></div>

      <!-- 存档信息 -->
      <div class="archive-info">
        <h3 class="archive-name">{{ archive.name }}</h3>
        <div class="game-mode-info">
          <span class="mode-tag" :class="gameModeClass">
            <span class="tag-short">{{ gameModeText }}</span>
            <span class="tag-full">{{ gameModeText }}</span>
          </span>
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
const emit = defineEmits(['toggle-visibility', 'edit', 'delete'])

// Computed
// 使用i18n翻译，避免硬编码
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const isVisible = computed(() => props.archive.isVisible)

const currentLevelName = computed(() => {
  return t(`LevelName_Display.${props.archive.currentLevel}`) || props.archive.currentLevel
})

const backgroundImage = computed(() => {
  // 定义固定的level顺序，与图片索引对应
  const levelOrder = [
    'Level0', 'TopFloor', 'MiddleFloor', 'GarageLevel2', 'BottomFloor', 'TheHub',
    'Pipes1', 'ElectricalStation', 'Office', 'Hotel', 'Floor3', 'BoilerRoom',
    'Pipes2', 'LevelFun', 'Poolrooms', 'LevelRun', 'TheEnd', 'Level922',
    'Level94', 'AnimatedKingdom', 'LightsOut', 'OceanMap', 'CaveLevel',
    'Level05', 'Level9', 'AbandonedBase', 'Level10', 'Level3999', 'Level07',
    'Snackrooms', 'LevelDash', 'Level188_Expanded', 'Poolrooms_Expanded',
    'WaterPark_Level01_P', 'WaterPark_Level02_P', 'WaterPark_Level03_P',
    'LevelFun_Expanded', 'Zone1_Modified', 'Zone2_Modified', 'Zone3_Baked',
    'Zone4', 'Level52', 'TunnelLevel'
  ]
  const index = levelOrder.indexOf(props.archive.currentLevel)
  return index >= 0 ? `/images/${index}.jpg` : '/images/0.jpg'
})

const gameModeText = computed(() => {
  return t(`createArchive.gameModes.${props.archive.gameMode}`) || props.archive.gameMode
})

const archiveDifficultyText = computed(() => {
  return t(`createArchive.difficultyLevels.${props.archive.archiveDifficulty}`) || props.archive.archiveDifficulty
})

const actualDifficultyText = computed(() => {
  return t(`createArchive.difficultyLevels.${props.archive.actualDifficulty}`) || props.archive.actualDifficulty
})

const gameModeClass = computed(() => {
  return props.archive.gameMode === 'multiplayer' ? 'mode-multiplayer' : 'mode-single'
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
      mode: gameModeText.value,
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

      setCachedWidths('.mode-tag', 'mode')
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
        const shortWidth = shortEl.offsetWidth || shortEl.getBoundingClientRect().width
        const fullWidth = fullEl.offsetWidth || fullEl.getBoundingClientRect().width

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
      setWidths('.mode-tag', 'mode')
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
  }
  )
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
      rootMargin: '100px', // 提前一点开始计算
      threshold: 0.01
    })

    // 开始观察当前卡片
    intersectionObserver.observe(card)
  } else {
    // 浏览器不支持IntersectionObserver，降级处理
    const checkVisibility = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const cardTop = card.offsetTop

      if (cardTop >= scrollTop && cardTop <= scrollTop + windowHeight + 100) {
        if (!hasRendered.value) {
          renderCard()
        }
        return true
      }
      return false
    }

    // 初始检查
    checkVisibility()

    // 滚动监听
    if (!hasRendered.value) {
      const handleScroll = () => {
        checkVisibility()
      }

      window.addEventListener('scroll', handleScroll)

      // 保存清理函数
      window._scrollCleanup = window._scrollCleanup || []
      window._scrollCleanup.push(() => {
        window.removeEventListener('scroll', handleScroll)
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
    // 性能开关：检测用户是否偏好减少动画
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      return
    }

    // 简化动画逻辑，让transition-group控制主要动画
    card.style.willChange = 'transform, opacity'
  }
})

// 当这些文案变动（含多语言切换）时，重测 - 添加防抖优化
let tagWidthUpdateTimer = null

watch([() => gameModeText.value, () => archiveDifficultyText.value, () => actualDifficultyText.value], async () => {
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
  width: 320px;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--card-bg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid var(--divider-color);
  cursor: pointer;
  /* 卡片基础样式 - 移除进场动画，让transition-group控制 */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-height: 160px;
}

/* 上半背景区域 */
.card-background {
  position: relative;
  width: 100%;
  height: 100px;
  overflow: hidden;
}

.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 添加初始模糊效果 */
  filter: blur(1.5px);
  transition: filter 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 悬浮时减少模糊效果 */
.archive-card:hover .background-image {
  filter: blur(0.5px);
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

.mode-tag,
.difficulty-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid;
  /* 减少模糊效果以提高清晰度 */
  backdrop-filter: blur(2px);
  transition: inline-size 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s ease,
    background 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  overflow: hidden;
  position: relative;
  inline-size: var(--w-short, auto);
  height: 20px;
  line-height: 16px;
}

.mode-tag {
  min-width: 40px;
  height: 20px;
  line-height: 16px;
  padding: 0 16px;
}

.difficulty-tag {
  min-width: 30px;
  height: 20px;
  line-height: 16px;
  padding: 0 16px;
}

.tag-short,
.tag-full {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.tag-short {
  opacity: 1;
}

.tag-full {
  opacity: 0;
}

/* 悬浮时展开动画 */
.archive-card:hover .mode-tag,
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

.mode-single {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.mode-multiplayer {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
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
  /* 性能优化：使用translate3d启用硬件加速 */
  transform: translate3d(0, -4px, 0) scale3d(1.02, 1.02, 1);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.archive-card:hover .mode-single {
  background: rgba(52, 199, 89, 0.2);
  color: #34c759;
  border-color: rgba(52, 199, 89, 0.4);
}

.archive-card:hover .mode-multiplayer {
  background: rgba(0, 122, 255, 0.2);
  color: #007aff;
  border-color: rgba(0, 122, 255, 0.4);
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
}

.action-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
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
  backdrop-filter: blur(5px);
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 三个胶囊按钮的不同颜色 - 未悬浮时柔和颜色 */
.action-btn.edit {
  background: rgba(128, 128, 128, 0.1);
  color: rgba(128, 128, 128, 0.7);
  border: 1px solid rgba(128, 128, 128, 0.2);
  transition: all 0.3s ease;
}

.action-btn.copy {
  background: rgba(128, 128, 128, 0.1);
  color: rgba(128, 128, 128, 0.7);
  border: 1px solid rgba(128, 128, 128, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.action-btn.delete {
  background: rgba(128, 128, 128, 0.1);
  color: rgba(128, 128, 128, 0.7);
  border: 1px solid rgba(128, 128, 128, 0.2);
  transition: all 0.3s ease;
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