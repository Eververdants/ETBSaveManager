import { useEffect, useRef, type RefObject } from "react";

/**
 * 滚动视差：以 rAF 节流，直接写 DOM transform（translate3d），
 * 零 React 重渲染，保证 60fps 顺滑。
 *
 * 行为：
 * - speed > 0：元素随滚动"浮"得更慢（视觉上远离视口移动方向）；
 *   speed < 0：元素移动得更快（靠近前景）。
 * - 元素完全离开视口（含缓冲）时跳过计算，节省开销。
 * - 尊重 prefers-reduced-motion：直接返回不绑定任何监听。
 * - 必须挂载在没有其他 transform 的专用包裹层上（避免覆盖冲突）。
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(speed = 0.1): RefObject<T | null> {
  const ref = useRef<T>(null) as RefObject<T | null>;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;

    const update = (): void => {
      rafId = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 视口外（带 240px 缓冲）直接跳过
      if (rect.bottom < -240 || rect.top > vh + 240) return;
      // 元素中心相对视口中心的偏移，乘以速度得到位移
      const offset = (rect.top + rect.height / 2 - vh / 2) * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };

    const onScroll = (): void => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      el.style.transform = "";
    };
  }, [speed]);

  return ref;
}
