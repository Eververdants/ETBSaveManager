import { useEffect, useState } from "react";

/**
 * 监听多个 section id，返回当前在视口中居中的那个 id。
 * 用于导航面包屑的活跃高亮。
 */
export function useActiveSection(ids: string[]): string {
  const [activeId, setActiveId] = useState(ids[0] ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      // 视口中间 15% 区域触发
      { rootMargin: "-40% 0px -55% 0px" },
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}
