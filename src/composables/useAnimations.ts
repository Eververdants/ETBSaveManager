import { gsap } from "gsap";
import { getAnimationParams } from "../utils/performance";
import type { Ref } from "vue";

interface AnimationHandlers {
  beforeSearchEnter: (el: HTMLElement) => void;
  searchEnter: (el: HTMLElement, done: () => void) => void;
  searchLeave: (el: HTMLElement, done: () => void) => void;
}

/**
 * Animation composable
 */
export function useAnimations(performanceMode: Ref<string>, animationQuality: Ref<string>): AnimationHandlers {
  /**
   * Before search panel enters
   */
  const beforeSearchEnter = (el: HTMLElement): void => {
    const params = getAnimationParams("search", performanceMode.value, animationQuality.value);

    gsap.set(el, {
      opacity: 0,
      y: -15,
      force3D: params.force3D,
      willChange: "opacity, transform",
    });
  };

  /**
   * Search panel enter animation
   */
  const searchEnter = (el: HTMLElement, done: () => void): void => {
    const params = getAnimationParams("search", performanceMode.value, animationQuality.value);

    requestAnimationFrame(() => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: params.duration,
        ease: params.ease,
        force3D: params.force3D,
        onComplete: done,
      });
    });
  };

  /**
   * Search panel leave animation
   */
  const searchLeave = (el: HTMLElement, done: () => void): void => {
    const params = getAnimationParams("search", performanceMode.value, animationQuality.value);

    gsap.to(el, {
      opacity: 0,
      y: -8,
      duration: params.duration,
      ease: params.ease,
      force3D: params.force3D,
      onComplete: done,
    });
  };

  return {
    beforeSearchEnter,
    searchEnter,
    searchLeave,
  };
}
