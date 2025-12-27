<template>
  <div class="select-mode-container">
    <!-- 页面内容 -->
    <div class="mode-page-content">
      <!-- 标题 -->
      <div class="mode-header">
        <h1 class="mode-title">{{ $t('createMode.title') }}</h1>
        <p class="mode-subtitle">{{ $t('createMode.subtitle') }}</p>
      </div>

      <!-- 模式分类 -->
      <div class="mode-categories">
        <!-- 单存档创建 -->
        <div class="mode-category">
          <h3 class="category-title">{{ $t('createMode.singleArchive') }}</h3>
          <div class="mode-cards single">
            <!-- 经典模式 -->
            <div class="mode-card" :class="{ selected: selectedMode === 'classic' }" @click="goToMode('classic')">
              <div class="mode-card-image">
                <LazyImage :src="classicModeImage" alt="Classic Mode" :image-class="'mode-card-img'" />
                <div class="mode-card-overlay">
                  <font-awesome-icon v-if="selectedMode === 'classic'" :icon="['fas', 'check-circle']"
                    class="check-icon" />
                </div>
              </div>
              <div class="mode-card-info">
                <h4 class="mode-card-title">{{ $t('createMode.classic.title') }}</h4>
                <p class="mode-card-desc">{{ $t('createMode.classic.desc') }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 多存档创建 -->
        <div class="mode-category">
          <h3 class="category-title">{{ $t('createMode.multiArchive') }}</h3>
          <div class="mode-cards multi">
            <!-- 快速模式 -->
            <div class="mode-card" :class="{ selected: selectedMode === 'quick' }" @click="goToMode('quick')">
              <div class="mode-card-image">
                <LazyImage :src="quickModeImage" alt="Quick Mode" :image-class="'mode-card-img'" />
                <div class="mode-card-overlay">
                  <font-awesome-icon v-if="selectedMode === 'quick'" :icon="['fas', 'check-circle']"
                    class="check-icon" />
                </div>
              </div>
              <div class="mode-card-info">
                <h4 class="mode-card-title">{{ $t('createMode.quick.title') }}</h4>
                <p class="mode-card-desc">{{ $t('createMode.quick.desc') }}</p>
              </div>
            </div>

            <!-- 蓝图模式 -->
            <div class="mode-card" :class="{ selected: selectedMode === 'blueprint' }" @click="goToMode('blueprint')">
              <div class="mode-card-image">
                <LazyImage :src="quickModeImage" alt="Blueprint Mode" :image-class="'mode-card-img'" />
                <div class="mode-card-overlay">
                  <font-awesome-icon v-if="selectedMode === 'blueprint'" :icon="['fas', 'check-circle']"
                    class="check-icon" />
                </div>
              </div>
              <div class="mode-card-info">
                <h4 class="mode-card-title">{{ $t('createMode.blueprint.title') }}</h4>
                <p class="mode-card-desc">{{ $t('createMode.blueprint.desc') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部返回按钮 -->
      <button class="bottom-back-button" @click="goBack" @mousedown="handleMouseDown" @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp" :class="{ 'is-pressing': isPressing }">
        <div class="button-content">
          <span class="close-icon">✕</span>
          <span class="button-text">{{ $t('common.back') }}</span>
        </div>
        <div class="button-ripple"></div>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LazyImage from '@/components/LazyImage.vue'

export default {
  name: 'SelectCreateMode',
  components: {
    LazyImage
  },
  setup() {
    const router = useRouter()
    const { t } = useI18n({ useScope: 'global' })
    const selectedMode = ref(null)
    const isPressing = ref(false)
    const currentTheme = ref('dark')

    // 获取当前主题
    const updateTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme') || 'dark'
      currentTheme.value = theme
    }

    // 根据主题计算图片路径
    const classicModeImage = computed(() => {
      return currentTheme.value === 'light' 
        ? '/images/CAL_JD.jpg' 
        : '/images/CAD_JD.jpg'
    })

    const quickModeImage = computed(() => {
      return currentTheme.value === 'light' 
        ? '/images/CAL_KS.jpg' 
        : '/images/CAD_KS.jpg'
    })

    // 监听主题变化
    let themeObserver = null

    onMounted(() => {
      updateTheme()
      themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-theme') {
            updateTheme()
          }
        })
      })
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      })
    })

    onUnmounted(() => {
      if (themeObserver) {
        themeObserver.disconnect()
      }
    })

    const goBack = () => {
      router.back()
    }

    const handleMouseDown = () => {
      isPressing.value = true
    }

    const handleMouseUp = () => {
      isPressing.value = false
    }

    const goToMode = (mode) => {
      selectedMode.value = mode

      const modeRoutes = {
        classic: '/create-archive',
        quick: '/quick-create-archive',
        blueprint: '/blueprint-create-archive'
      }

      router.push(modeRoutes[mode])
    }

    return {
      selectedMode,
      isPressing,
      currentTheme,
      classicModeImage,
      quickModeImage,
      goBack,
      goToMode,
      handleMouseDown,
      handleMouseUp
    }
  }
}
</script>

<style scoped>
.select-mode-container {
  height: calc(100vh - 38px);
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.mode-page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  overflow: hidden;
  position: relative;
}

.mode-header {
  text-align: center;
  margin-bottom: var(--space-6);
  flex-shrink: 0;
}

.mode-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--space-2);
}

.mode-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0;
}

.mode-categories {
  display: flex;
  gap: var(--space-8);
  width: 100%;
  max-width: 1000px;
  flex-shrink: 0;
}

.mode-category {
  flex: 1;
}

.category-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--divider-light);
}

.mode-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.mode-cards.single {
  max-width: 100%;
}

.mode-cards.multi {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.mode-card {
  background: var(--bg-secondary);
  border: 2px solid var(--divider-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: row;
  height: 120px;
}

.mode-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent-color);
}

.mode-card.selected {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.2);
}

.mode-card-image {
  position: relative;
  width: 180px;
  height: 100%;
  flex-shrink: 0;
  overflow: hidden;
}

.mode-card-image .lazy-image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.mode-card:hover .mode-card-image .lazy-image-container img {
  transform: scale(1.05);
}

.mode-card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to right, transparent 30%, rgba(0, 0, 0, 0.3));
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.mode-card.selected .mode-card-overlay {
  opacity: 1;
  background: rgba(var(--accent-color-rgb), 0.3);
}

.mode-card-overlay .check-icon {
  font-size: 2rem;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.mode-card-info {
  flex: 1;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.mode-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-1);
}

.mode-card-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 900px) {
  .mode-categories {
    flex-direction: column;
    gap: var(--space-6);
  }

  .mode-card {
    height: 100px;
  }

  .mode-card-image {
    width: 150px;
  }
}

@media (max-width: 768px) {
  .mode-page-content {
    padding: var(--space-8) var(--space-4) var(--space-4);
  }

  .mode-header {
    margin-bottom: var(--space-4);
  }

  .mode-title {
    font-size: 1.5rem;
  }

  .mode-card {
    height: 90px;
  }

  .mode-card-image {
    width: 120px;
  }

  .mode-card-title {
    font-size: 0.9rem;
  }

  .mode-card-desc {
    font-size: 0.75rem;
  }
}

/* 底部返回按钮 - 磨砂玻璃设计 */
.bottom-back-button {
  position: relative;
  margin-top: var(--space-8);
  align-self: center;
  width: 140px;
  height: 56px;
  background: rgba(239, 68, 68, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 28px;
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  overflow: hidden;
  box-shadow:
    0 8px 32px rgba(239, 68, 68, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.bottom-back-button:hover {
  background: rgba(220, 38, 38, 0.95);
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 12px 40px rgba(239, 68, 68, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
}

.bottom-back-button:active {
  transform: translateY(0px) scale(0.98);
  transition: all 0.1s ease;
}

.bottom-back-button.is-pressing {
  transform: translateY(1px) scale(0.96);
}

.button-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 100%;
  padding: 0 var(--space-4);
}

.close-icon {
  font-size: 18px;
  font-weight: 600;
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.button-text {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 微交互效果 */
.bottom-back-button:hover .close-icon {
  transform: rotate(90deg) scale(1.1);
}

.bottom-back-button:active .close-icon {
  transform: rotate(90deg) scale(0.9);
}

/* 波纹效果 */
.button-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.6s ease;
  z-index: 1;
}

.bottom-back-button:active .button-ripple {
  width: 300px;
  height: 300px;
}

/* 脉冲动画 */
@keyframes pulse {
  0% {
    box-shadow:
      0 8px 32px rgba(239, 68, 68, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  50% {
    box-shadow:
      0 8px 32px rgba(239, 68, 68, 0.5),
      0 0 0 0 rgba(239, 68, 68, 0.7),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  100% {
    box-shadow:
      0 8px 32px rgba(239, 68, 68, 0.3),
      0 0 0 20px rgba(239, 68, 68, 0),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
}

.bottom-back-button:focus {
  animation: pulse 2s infinite;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .bottom-back-button {
    bottom: var(--space-4);
    width: 120px;
    height: 48px;
  }

  .button-content {
    padding: 0 var(--space-3);
  }

  .close-icon {
    font-size: 16px;
  }

  .button-text {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .bottom-back-button {
    bottom: var(--space-3);
    width: 100px;
    height: 44px;
  }

  .button-content {
    gap: var(--space-1);
    padding: 0 var(--space-2);
  }

  .close-icon {
    font-size: 14px;
  }

  .button-text {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .mode-card {
    height: 80px;
  }

  .mode-card-image {
    width: 100px;
  }
}
</style>
