/**
 * 安全区 SVG 覆盖层
 *
 * 折叠态下鼠标从一级项移向浮出面板时会掠过两者之间的空隙，
 * 这里用一个透明多边形补上这段区域，避免面板提前收起。
 */
import { useEffect, useState } from "react";

export interface SafeAreaOverlayProps {
  sidebarEl: HTMLElement | null;
  triggerEl: HTMLElement | null;
  panelEl: HTMLElement | null;
  onEnter: () => void;
  onLeave: () => void;
}

export default function SafeAreaOverlay({
  sidebarEl,
  triggerEl,
  panelEl,
  onEnter,
  onLeave,
}: SafeAreaOverlayProps) {
  const [points, setPoints] = useState("");

  useEffect(() => {
    if (!sidebarEl || !triggerEl || !panelEl) {
      setPoints("");
      return;
    }

    let rafId: number | null = null;
    const calc = () => {
      if (rafId !== null) return; // 节流：同一帧内只执行一次
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const sb = sidebarEl.getBoundingClientRect();
        const t = triggerEl.getBoundingClientRect();
        const p = panelEl.getBoundingClientRect();
        const pts = [
          [t.right - sb.left - 6, t.top - sb.top],
          [t.right - sb.left - 12, t.bottom - sb.top],
          [p.left - sb.left, p.bottom - sb.top],
          [p.left - sb.left, p.top - sb.top],
        ];
        setPoints(pts.map(([x, y]) => `${x},${y}`).join(" "));
      });
    };

    calc();
    window.addEventListener("resize", calc);
    return () => {
      window.removeEventListener("resize", calc);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [sidebarEl, triggerEl, panelEl]);

  if (!points) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[60]"
      style={{ width: "100%", height: "100%" }}
      aria-hidden="true"
    >
      <polygon
        points={points}
        style={{ fill: "transparent" }}
        className="pointer-events-auto"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      />
    </svg>
  );
}
