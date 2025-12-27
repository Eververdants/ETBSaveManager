import { gsap } from 'gsap'
import { getAnimationParams, detectDevicePerformance } from '../utils/performance.js'

/**
 * 动画 composable
 */
export function useAnimations(performanceMode, animationQuality) {
  /**
   * 卡片进入前
   */
  const beforeCardEnter = (el) => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(10px)'
  }

  /**
   * 卡片进入动画
   */
  const cardEnter = (el, done, cardCount) => {
    if (cardCount > 30 || performanceMode.value === 'low') {
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
      done()
      return
    }

    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.15,
      ease: "power2.out",
      force3D: true,
      onComplete: done
    })
  }

  /**
   * 卡片离开动画
   */
  const cardLeave = (el, done) => {
    gsap.to(el, {
      opacity: 0,
      scale: 0.95,
      duration: 0.2,
      ease: "power2.in",
      force3D: true,
      onComplete: done
    })
  }

  /**
   * 搜索面板进入前
   */
  const beforeSearchEnter = (el) => {
    const params = getAnimationParams('search', performanceMode.value, animationQuality.value)

    gsap.set(el, {
      opacity: 0,
      y: -15,
      force3D: params.force3D,
      willChange: 'opacity, transform'
    })
  }

  /**
   * 搜索面板进入动画
   */
  const searchEnter = (el, done) => {
    const params = getAnimationParams('search', performanceMode.value, animationQuality.value)

    requestAnimationFrame(() => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: params.duration,
        ease: params.ease,
        force3D: params.force3D,
        onComplete: done
      })
    })
  }

  /**
   * 搜索面板离开动画
   */
  const searchLeave = (el, done) => {
    const params = getAnimationParams('search', performanceMode.value, animationQuality.value)

    gsap.to(el, {
      opacity: 0,
      y: -8,
      duration: params.duration,
      ease: params.ease,
      force3D: params.force3D,
      onComplete: done
    })
  }

  return {
    beforeCardEnter,
    cardEnter,
    cardLeave,
    beforeSearchEnter,
    searchEnter,
    searchLeave
  }
}
