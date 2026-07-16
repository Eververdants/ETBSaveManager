import { useEffect, useState } from "react";

export interface MousePosition {
  /** 归一化到 [-1, 1]，视口宽度方向 */
  x: number;
  /** 归一化到 [-1, 1]，视口高度方向 */
  y: number;
}

/**
 * 跟踪鼠标位置，返回归一化坐标，用于视差效果。
 * 通过 requestAnimationFrame 节流保证性能。
 */
export function useMousePosition(): MousePosition {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    let rafId: number;
    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      lastX = (e.clientX / window.innerWidth - 0.5) * 2;
      lastY = (e.clientY / window.innerHeight - 0.5) * 2;

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          setPosition({ x: lastX, y: lastY });
          rafId = 0;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return position;
}
