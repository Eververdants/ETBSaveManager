import { gsap } from "gsap";
import { getAnimationParams } from "@/utils/performance";
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
 *
 * `skipRef` — when truthy, the panel appears/disappears instantly.
 * Used for keyboard-initiated opens (Ctrl+F / F3): never animate
 * an action a user triggers hundreds of times a day. The flag is
 * cleared once the enter animation completes so a later mouse-
 * triggered open still animates normally.
 */
export function useAnimations(
  performanceMode: Ref<string>,
  animationQuality: Ref<string>,
  skipRef?: Ref<boolean>,
): AnimationHandlers {
  const shouldSkip = (): boolean => skipRef?.value === true;

  /**
   * Before search panel enters
   */
  const beforeSearchEnter = (el: HTMLElement): void => {
    if (shouldSkip()) return;

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
    if (shouldSkip()) {
      done();
      if (skipRef) skipRef.value = false;
      return;
    }

    const effectiveQuality = resolveAnimationQuality(animationQuality.value);
    const params = getAnimationParams("search", performanceMode.value, effectiveQuality);

    requestAnimationFrame(() => {
      // Element may have been removed (e.g. rapid open/close) — skip to avoid
      // animating a detached DOM node.
      if (!el.isConnected) {
        done();
        if (skipRef) skipRef.value = false;
        return;
      }
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: params.duration,
        ease: params.ease,
        force3D: params.force3D,
        onComplete: () => {
          done();
          if (skipRef) skipRef.value = false;
        },
      });
    });
  };

  /**
   * Search panel leave animation
   */
  const searchLeave = (el: HTMLElement, done: () => void): void => {
    if (shouldSkip()) {
      done();
      return;
    }

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
