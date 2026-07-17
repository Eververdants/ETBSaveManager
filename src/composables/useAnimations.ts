import { gsap } from "gsap";
import { getAnimationParams } from "../utils/performance";
import scheduler from "@/services/resourceScheduler";
import type { Ref } from "vue";

interface AnimationHandlers {
  beforeSearchEnter: (el: HTMLElement) => void;
  searchEnter: (el: HTMLElement, done: () => void) => void;
  searchLeave: (el: HTMLElement, done: () => void) => void;
}

/**
 * Resolve the effective animation quality by combining the user's
 * explicit setting with the scheduler's dynamic context.
 */
function resolveAnimationQuality(userQuality: string): "high" | "medium" | "low" | "disabled" {
  // If user explicitly disabled animations, respect that
  if (userQuality === "disabled") return "disabled";
  // If user explicitly set high, prefer it (but scheduler can override if overloaded)
  if (userQuality === "high" && !scheduler.isOverloaded) return "high";

  // In auto/low mode, let the scheduler decide based on current operation
  const schedulerQuality = scheduler.getAnimationQuality();

  // Pick the more conservative option
  const levels = ["high", "medium", "low", "disabled"];
  const userIdx = levels.indexOf(userQuality);
  const schedIdx = levels.indexOf(schedulerQuality);
  return levels[Math.max(userIdx < 0 ? 1 : userIdx, schedIdx)] as "high" | "medium" | "low" | "disabled";
}

/**
 * Animation composable — dynamically adjusts animation params
 * based on both user preference and the resource scheduler's
 * current operation context.
 */
export function useAnimations(performanceMode: Ref<string>, animationQuality: Ref<string>): AnimationHandlers {
  /**
   * Before search panel enters
   */
  const beforeSearchEnter = (el: HTMLElement): void => {
    const effectiveQuality = resolveAnimationQuality(animationQuality.value);
    const params = getAnimationParams("search", performanceMode.value, effectiveQuality);

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
    const effectiveQuality = resolveAnimationQuality(animationQuality.value);
    const params = getAnimationParams("search", performanceMode.value, effectiveQuality);

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
    const effectiveQuality = resolveAnimationQuality(animationQuality.value);
    const params = getAnimationParams("search", performanceMode.value, effectiveQuality);

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
