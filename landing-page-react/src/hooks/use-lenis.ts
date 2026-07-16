import { useEffect, useRef } from "react";
import Lenis from "lenis";

/**
 * 丝滑滚动 — 使用 Lenis 对鼠标滚轮和触摸进行插值缓动。
 *
 * - 不影响 IntersectionObserver、scroll 事件等现有机制
 * - 自动响应 prefers-reduced-motion
 * - 返回 lenis 实例引用，可用于外部控制（scrollTo、stop/start）
 */
export function useLenis(): React.RefObject<Lenis | null> {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    // 如果用户偏好减少动效，不初始化
    if (prefersReduced.matches) return;

    const lenis = new Lenis({
      duration: 1.0,
      // ease-out cubic: 开始快、结束慢，感觉自然
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.3,
      orientation: "vertical",
      gestureOrientation: "vertical",
    });

    lenisRef.current = lenis;

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // 监听 prefers-reduced-motion 变化
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        lenis.destroy();
        lenisRef.current = null;
      }
    };
    prefersReduced.addEventListener("change", onChange);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      prefersReduced.removeEventListener("change", onChange);
    };
  }, []);

  return lenisRef;
}
