import { useEffect, useState } from "react";

/**
 * 数字滚动动画：从 0 到 end 以 ease-out cubic 缓动。
 * 当 startOn=false 时保持 0，用于与 IntersectionObserver 联动。
 */
export function useCounter(end: number, duration = 1200, startOn = true): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!startOn) {
      setValue(0);
      return;
    }

    if (end === 0) {
      setValue(0);
      return;
    }

    let startTime: number | null = null;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [end, duration, startOn]);

  return value;
}
