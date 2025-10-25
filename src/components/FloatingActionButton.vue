<template>
  <teleport to="body">
    <div class="floating-action-container" ref="floatingActionContainer" :class="$attrs.class">
      <div class="action-button" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave" @wheel="handleWheel"
        @click="handleClick" ref="actionButton">
        <!-- 主要图标 -->
        <div class="icon-wrapper main-icon" ref="mainIcon">
          <font-awesome-icon :icon="['fas', getCurrentIcon]" />
        </div>

        <!-- 功能提示 -->
        <div class="function-tooltip" ref="tooltip">
          <span class="tooltip-text">{{ getCurrentTooltip }}</span>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'

// 禁用自动属性继承，因为我们使用teleport
defineOptions({
  inheritAttrs: false
})

const { t } = useI18n({ useScope: 'global' })

const emit = defineEmits(['search-click', 'folder-click', 'refresh-click'])

const actionButton = ref(null)
const mainIcon = ref(null)
const tooltip = ref(null)
const floatingActionContainer = ref(null)

const icons = ['search', 'folder', 'refresh']
const currentIndex = ref(0)
const isHovered = ref(false)

const getCurrentIcon = computed(() => {
  switch (icons[currentIndex.value]) {
    case 'search': return 'magnifying-glass'
    case 'folder': return 'folder'
    case 'refresh': return 'arrow-rotate-right'
    default: return 'magnifying-glass'
  }
})

const getCurrentTooltip = computed(() => {
  switch (icons[currentIndex.value]) {
    case 'search': return t('floatingButton.searchArchive')
    case 'folder': return t('floatingButton.openFolder')
    case 'refresh': return t('floatingButton.refreshList')
    default: return t('floatingButton.searchArchive')
  }
})

let tooltipTimer = null

const handleMouseEnter = () => {
  isHovered.value = true

  // 清除之前的定时器
  if (tooltipTimer) {
    clearTimeout(tooltipTimer)
    tooltipTimer = null
  }

  // 取消可能正在进行的隐藏动画
  gsap.killTweensOf(tooltip.value)

  // 设置延迟显示，避免快速移动时的闪烁
  tooltipTimer = setTimeout(() => {
    // 确保鼠标仍在按钮上且tooltip元素存在
    if (isHovered.value && tooltip.value) {
      // 显示功能提示
      gsap.to(tooltip.value, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out"
      })
    }
  }, 100) // 100ms延迟
}

const handleMouseLeave = () => {
  isHovered.value = false

  // 清除之前的定时器
  if (tooltipTimer) {
    clearTimeout(tooltipTimer)
    tooltipTimer = null
  }

  // 取消可能正在进行的显示动画
  gsap.killTweensOf(tooltip.value)

  // 设置延迟隐藏，避免快速移动时的闪烁
  tooltipTimer = setTimeout(() => {
    // 确保鼠标已离开按钮且tooltip元素存在
    if (!isHovered.value && tooltip.value) {
      // 隐藏功能提示
      gsap.to(tooltip.value, {
        opacity: 0,
        y: 10,
        duration: 0.2,
        ease: "power2.out"
      })
    }
  }, 150) // 150ms延迟
}

const handleWheel = (event) => {
  event.preventDefault()

  // 取消当前可能正在进行的动画
  gsap.killTweensOf(mainIcon.value)

  if (event.deltaY > 0) {
    // 向下滚动
    currentIndex.value = (currentIndex.value + 1) % icons.length
  } else {
    // 向上滚动
    currentIndex.value = (currentIndex.value - 1 + icons.length) % icons.length
  }

  // 苹果时钟滚轮效果
  const direction = event.deltaY > 0 ? 1 : -1
  const velocity = Math.abs(event.deltaY) / 100 // 根据滚动速度调整

  // 显示滚动提示
  gsap.to(tooltip.value, {
    opacity: 1,
    y: 0,
    duration: 0.2,
    ease: "power2.out"
  })

  // 创建滚轮滑动效果，带有惯性
  gsap.to(mainIcon.value, {
    y: -direction * 40 * Math.min(velocity, 2),
    opacity: 0,
    duration: 0.15,
    ease: "power2.out",
    onComplete: () => {
      // 瞬间切换图标位置到底部（不可见）
      gsap.set(mainIcon.value, { y: direction * 40, opacity: 0 })

      // 平滑滑动到新位置，带有弹性
      gsap.to(mainIcon.value, {
        y: 0,
        opacity: 1,
        duration: 0.3,
        ease: "back.out(1.2)"
      })
    }
  })
}

const handleClick = () => {
  // 点击动画
  gsap.to(actionButton.value, {
    scale: 0.95,
    duration: 0.1,
    ease: "power2.out",
    onComplete: () => {
      gsap.to(actionButton.value, {
        scale: 1,
        duration: 0.1,
        ease: "power2.out"
      })
    }
  })

  // 确保容器位置在点击后保持不变
  const container = floatingActionContainer.value;
  if (container) {
    // 强制重置容器位置，防止任何可能的位移
    container.style.setProperty('position', 'fixed', 'important');
    container.style.setProperty('bottom', '30px', 'important');
    container.style.setProperty('right', '30px', 'important');
    container.style.setProperty('top', 'auto', 'important');
    container.style.setProperty('left', 'auto', 'important');
    container.style.setProperty('transform', 'none', 'important');
    container.style.setProperty('margin', '0', 'important');
    container.style.setProperty('padding', '0', 'important');
    
    // 延迟检查，确保在所有事件处理后位置仍然正确
    setTimeout(() => {
      container.style.setProperty('position', 'fixed', 'important');
      container.style.setProperty('bottom', '30px', 'important');
      container.style.setProperty('right', '30px', 'important');
      container.style.setProperty('top', 'auto', 'important');
      container.style.setProperty('left', 'auto', 'important');
      container.style.setProperty('transform', 'none', 'important');
      container.style.setProperty('margin', '0', 'important');
      container.style.setProperty('padding', '0', 'important');
    }, 100);
    
    // 额外的延迟检查，确保在所有布局变化后位置仍然正确
    setTimeout(() => {
      container.style.setProperty('position', 'fixed', 'important');
      container.style.setProperty('bottom', '30px', 'important');
      container.style.setProperty('right', '30px', 'important');
      container.style.setProperty('top', 'auto', 'important');
      container.style.setProperty('left', 'auto', 'important');
      container.style.setProperty('transform', 'none', 'important');
      container.style.setProperty('margin', '0', 'important');
      container.style.setProperty('padding', '0', 'important');
    }, 500);
  }

  // 触发对应操作
  const currentAction = icons[currentIndex.value]

  switch (currentAction) {
    case 'search':
      emit('search-click')
      break
    case 'folder':
      emit('folder-click')
      break
    case 'refresh':
      emit('refresh-click')
      break
    default:
      console.log(`执行操作: ${currentAction}`)
  }
}

// 显示滚动提示
const showScrollHint = () => {
  // 创建提示元素
  const hint = document.createElement('div')
  hint.className = 'scroll-hint'
  hint.innerHTML = `
    <div class="scroll-hint-content">
      <div class="scroll-hint-icon">🖱️</div>
      <div class="scroll-hint-text">${t('floatingButton.scrollHint')}</div>
    </div>
  `
  document.body.appendChild(hint)

  // 动画显示提示
  gsap.fromTo(hint,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power2.out",
      delay: 0.5,
      onComplete: () => {
        // 3秒后自动隐藏
        gsap.to(hint, {
          opacity: 0,
          y: 20,
          duration: 0.5,
          delay: 3,
          ease: "power2.in",
          onComplete: () => {
            document.body.removeChild(hint)
          }
        })
      }
    }
  )
}

onMounted(() => {
  // 确保浮动按钮容器样式不被外部修改
  const container = floatingActionContainer.value;
  if (container) {
    // 使用内联样式确保最高优先级
    container.style.setProperty('position', 'fixed', 'important');
    container.style.setProperty('bottom', '30px', 'important');
    container.style.setProperty('right', '30px', 'important');
    container.style.setProperty('z-index', '10000', 'important');
    container.style.setProperty('top', 'auto', 'important');
    container.style.setProperty('left', 'auto', 'important');
    container.style.setProperty('transform', 'none', 'important');
    container.style.setProperty('isolation', 'isolate', 'important');
    
    // 添加样式变化监听，但只在检测到关键样式被修改时才恢复
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          // 获取当前样式
          const currentStyles = container.style;
          
          // 只检查关键定位属性
          const criticalStyles = ['position', 'bottom', 'right', 'top', 'left'];
          let hasCriticalChanges = false;
          
          // 检查关键定位样式是否被意外修改
          criticalStyles.forEach(prop => {
            const currentValue = currentStyles.getPropertyValue(prop);
            const expectedValue = prop === 'position' ? 'fixed' : 
                                (prop === 'bottom' || prop === 'right') ? '30px' : 
                                (prop === 'top' || prop === 'left') ? 'auto' : '';
            
            if (currentValue && currentValue !== expectedValue) {
              hasCriticalChanges = true;
            }
          });
          
          // 只有检测到关键定位样式被修改时才恢复
          if (hasCriticalChanges) {
            console.log('检测到浮动按钮定位样式被修改，正在恢复...');
            container.style.setProperty('position', 'fixed', 'important');
            container.style.setProperty('bottom', '30px', 'important');
            container.style.setProperty('right', '30px', 'important');
            container.style.setProperty('top', 'auto', 'important');
            container.style.setProperty('left', 'auto', 'important');
          }
        }
      });
    });
    
    observer.observe(container, {
      attributes: true,
      attributeFilter: ['style']
    });
  }
  
  // 初始化状态 - 确保字体加载完成后再执行动画
  gsap.set(tooltip.value, { opacity: 0, y: 10 })

  // 等待字体图标加载完成，避免布局抖动
  const initializeAnimation = () => {
    gsap.set(actionButton.value, {
      scale: 0,
      opacity: 0,
      x: 0,
      y: 0,
      transformOrigin: "center center"
    })

    // 入场动画 - 使用更稳定的时机
    requestAnimationFrame(() => {
      gsap.to(actionButton.value, {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
      })
    })
  }

  // 确保字体和样式完全加载
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      setTimeout(initializeAnimation, 50) // 额外延迟确保布局稳定
    })
  } else {
    // 降级处理
    setTimeout(initializeAnimation, 100)
  }

  // 显示滚动提示（仅在第一次使用时显示）
  if (!localStorage.getItem('fabScrollHintShown')) {
    setTimeout(() => {
      showScrollHint()
    }, 2000) // 延迟到动画完成后显示
    localStorage.setItem('fabScrollHintShown', 'true')
  }
})

onUnmounted(() => {
  // 清理定时器防止内存泄漏
  if (tooltipTimer) {
    clearTimeout(tooltipTimer)
    tooltipTimer = null
  }
})
</script>

<style scoped>
/* 浮动按钮容器 - 终极固定定位解决方案 */
.floating-action-container {
  /* 使用CSS的position: fixed并确保相对于视口定位 */
  position: fixed !important;
  bottom: 30px !important;
  right: 30px !important;
  z-index: 10000 !important;
  
  /* 确保相对于视口定位 */
  top: auto !important;
  left: auto !important;
  
  /* 防止任何变换影响 */
  transform: none !important;
  transform-origin: initial !important;
  
  /* 创建新的堆叠上下文 */
  isolation: isolate;
  
  /* 确保不被裁剪 */
  clip: auto !important;
  clip-path: none !important;
  
  /* 移除所有可能影响定位的属性 */
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  
  /* 禁用所有动画效果 */
  animation: none !important;
  transition: none !important;
  will-change: auto !important;
  backface-visibility: visible !important;
  perspective: none !important;
}

.action-button {
  position: relative;
  width: var(--fab-size, 60px) !important;
  height: var(--fab-size, 60px) !important;
  min-width: var(--fab-size, 60px) !important;
  min-height: var(--fab-size, 60px) !important;
  max-width: var(--fab-size, 60px) !important;
  max-height: var(--fab-size, 60px) !important;
  border-radius: 50%;
  background: var(--glass-bg, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
  color: var(--accent-color, #007aff);
  cursor: pointer;
  transition: var(--card-transition);
  display: flex !important;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  box-sizing: border-box !important;

  /* 防止继承父元素的字体大小 */
  font-size: 0 !important;

  /* 确保初始布局稳定 */
  contain: layout style paint;
  will-change: transform, opacity;
}

.action-button:hover {
  background: var(--sidebar-item-hover-bg, var(--bg-tertiary));
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  transform: var(--card-hover-transform);
}

.icon-wrapper {
  position: absolute;
  color: var(--accent-color, #007aff);
  font-size: 24px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  width: 24px !important;
  height: 24px !important;
  /* 确保图标加载时不会改变尺寸 */
  min-width: 24px !important;
  min-height: 24px !important;
  line-height: 1 !important;
}

.main-icon {
  position: relative;
  color: var(--accent-color, #007aff);
  font-size: 24px !important;
  width: 24px !important;
  height: 24px !important;
}

.function-tooltip {
  position: absolute;
  top: -45px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop-filter);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1001;
  box-shadow: var(--card-shadow);
  border: var(--card-border);
}

.function-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--glass-bg);
}

/* 滚动提示样式 */
.scroll-hint {
  position: fixed;
  bottom: 120px;
  right: 30px;
  z-index: 10000;
  pointer-events: none;
}

.scroll-hint-content {
  display: flex;
  align-items: center;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop-filter);
  color: var(--text-primary);
  padding: 12px 16px;
  border-radius: var(--card-radius);
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--card-shadow);
  border: var(--card-border);
  border-radius: 20px;
}

.scroll-hint-icon {
  margin-right: 8px;
  font-size: 16px;
}

.scroll-hint-text {
  white-space: nowrap;
}

/* 深色模式支持 - 已通过variables.css变量实现，无需重复定义 */

/* 响应式设计 */
@media (max-width: 768px) {
  .floating-action-container {
    bottom: 20px !important;
    right: 20px !important;
    --fab-size: 56px;
  }

  .action-button {
    width: var(--fab-size, 56px) !important;
    height: var(--fab-size, 56px) !important;
    min-width: var(--fab-size, 56px) !important;
    min-height: var(--fab-size, 56px) !important;
    max-width: var(--fab-size, 56px) !important;
    max-height: var(--fab-size, 56px) !important;
  }

  .main-icon {
    font-size: 22px !important;
  }
}

/* 更小屏幕的适配 */
@media (max-width: 480px) {
  .floating-action-container {
    bottom: 15px !important;
    right: 15px !important;
    --fab-size: 50px;
  }

  .action-button {
    width: var(--fab-size, 50px) !important;
    height: var(--fab-size, 50px) !important;
    min-width: var(--fab-size, 50px) !important;
    min-height: var(--fab-size, 50px) !important;
    max-width: var(--fab-size, 50px) !important;
    max-height: var(--fab-size, 50px) !important;
  }

  .main-icon {
    font-size: 20px !important;
  }
}
</style>