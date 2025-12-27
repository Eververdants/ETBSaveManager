import { ref, onUnmounted } from 'vue'
import { protectFloatingButtonPosition } from '../utils/floatingButtonProtection.js'

/**
 * 浮动按钮保护 composable
 */
export function useFloatingButton() {
  const fabCurrentIndex = ref(0)
  const fabPositionCheckerRef = ref(null)

  let fabObserver = null

  /**
   * 增强的浮动按钮保护
   */
  const enhancedProtectFloatingButton = () => {
    protectFloatingButtonPosition()

    requestAnimationFrame(() => {
      protectFloatingButtonPosition()

      setTimeout(protectFloatingButtonPosition, 50)
      setTimeout(protectFloatingButtonPosition, 100)
      setTimeout(protectFloatingButtonPosition, 200)
      setTimeout(protectFloatingButtonPosition, 300)
      setTimeout(protectFloatingButtonPosition, 500)
      setTimeout(protectFloatingButtonPosition, 1000)

      setTimeout(() => {
        const container = document.querySelector('.floating-action-container')
        if (container) {
          const rect = container.getBoundingClientRect()
          const expectedBottom = window.innerHeight - rect.bottom
          const expectedRight = window.innerWidth - rect.right

          if (Math.abs(expectedBottom - 30) > 5 || Math.abs(expectedRight - 30) > 5) {
            container.style.setProperty('position', 'fixed', 'important')
            container.style.setProperty('bottom', `${expectedBottom}px`, 'important')
            container.style.setProperty('right', `${expectedRight}px`, 'important')
            container.style.setProperty('transform', 'none', 'important')
            container.style.setProperty('margin', '0', 'important')
            container.style.setProperty('top', 'auto', 'important')
            container.style.setProperty('left', 'auto', 'important')
            container.style.setProperty('z-index', '1000', 'important')
          }
        }
      }, 1000)
    })
  }

  /**
   * 初始化浮动按钮保护
   */
  const initFloatingButtonProtection = () => {
    const fabElement = document.querySelector('.floating-action-container')
    if (fabElement) {
      enhancedProtectFloatingButton()

      fabObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const currentStyles = fabElement.style
            const criticalStyles = ['position', 'bottom', 'right', 'top', 'left']
            let hasCriticalChanges = false

            criticalStyles.forEach(prop => {
              const currentValue = currentStyles.getPropertyValue(prop)
              let expectedValue = ''

              if (prop === 'position') {
                expectedValue = 'fixed'
              } else if (prop === 'bottom' || prop === 'right') {
                if (window.innerWidth <= 480) {
                  expectedValue = prop === 'bottom' ? '15px' : '15px'
                } else if (window.innerWidth <= 768) {
                  expectedValue = prop === 'bottom' ? '20px' : '20px'
                } else {
                  expectedValue = '30px'
                }
              } else if (prop === 'top' || prop === 'left') {
                expectedValue = 'auto'
              }

              if (currentValue && currentValue !== expectedValue) {
                console.warn(`浮动按钮定位样式被意外修改: ${prop}`)
                hasCriticalChanges = true
              }
            })

            if (hasCriticalChanges) {
              console.log('恢复浮动按钮定位样式')
              protectFloatingButtonPosition()
            }
          }
        })
      })

      fabObserver.observe(fabElement, {
        attributes: true,
        attributeFilter: ['style'],
        childList: false,
        subtree: false
      })

      console.log('浮动按钮样式保护已启用')
    }
  }

  /**
   * 启动定期位置检查
   */
  const startPositionChecker = () => {
    fabPositionCheckerRef.value = setInterval(() => {
      protectFloatingButtonPosition()
    }, 5000)
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (fabPositionCheckerRef.value) {
      clearInterval(fabPositionCheckerRef.value)
      fabPositionCheckerRef.value = null
    }

    if (fabObserver) {
      fabObserver.disconnect()
      fabObserver = null
    }
  }

  return {
    fabCurrentIndex,
    enhancedProtectFloatingButton,
    initFloatingButtonProtection,
    startPositionChecker,
    cleanup
  }
}
