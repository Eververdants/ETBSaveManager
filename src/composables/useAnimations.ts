import { gsap } from "gsap";
import { getAnimationParams, detectDevicePerformance } from "../utils/performance";
import type { Ref } from "vue";

interface AnimationHandlers {
  beforeCardEnter: (el: HTMLElement) => void;
  cardEnter: (el: HTMLElement, done: () => void, cardCount: number) => void;
  cardLeave: (el: HTMLElement, done: () => void) => void;
  beforeSearchEnter: (el: HTMLElement) => void;
  searchEnter: (el: HTMLElement, done: () => void) => void;
  searchLeave: (el: HTMLElement, done: () => void) => void;
}

/**
 * Animation composable
 */
export function useAnimations(performanceMode: Ref<string>, animationQuality: Ref<string>): AnimationHandlers {
  /**
   * Before card enters
   */
  const beforeCardEnter = (el: HTMLElement): void => {
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";
  };

  /**
   * Card enter animation
   */
  const cardEnter = (el: HTMLElement, done: () => void, cardCount: number): void => {
    if (animationQuality.value === "disabled" || cardCount > 30 || performanceMode.value === "low") {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      done();
      return;
    }

    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.15,
      ease: "power2.out",
      force3D: true,
      onComplete: done,
    });
  };

  /**
   * Card leave animation
   */
  const cardLeave = (el: HTMLElement, done: () => void): void => {
    if (animationQuality.value === "disabled") {
      el.style.opacity = "0";
      el.style.transform = "scale(0.95)";
      done();
      return;
    }
    gsap.to(el, {
      opacity: 0,
      scale: 0.95,
      duration: 0.2,
      ease: "power2.in",
      force3D: true,
      onComplete: done,
    });
  };

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
    beforeCardEnter,
    cardEnter,
    cardLeave,
    beforeSearchEnter,
    searchEnter,
    searchLeave,
  };
}
