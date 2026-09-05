/**
 * 懒加载图片 — IntersectionObserver + 全局共享预加载队列（utils/imagePreloader）
 * 行为与 master LazyImage.vue 对齐：
 * - src 为空时不发请求；进视口 200px 内才开始加载
 * - 加载统一走共享预加载器（按 URL 去重 + 并发上限），本组件不再维护
 *   私有队列；imagePreloader 已预加载（含预加载中）的图片直接命中
 */
import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";

import { preloadImage } from "../../utils/imagePreloader";
import { cn } from "../../utils";

const PRELOAD_ROOT_MARGIN = "200px";

export interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  /** 图片元素附加类（如 item-image / level-image） */
  imageClassName?: string;
}

export function LazyImage({ src, alt = "", className, imageClassName }: LazyImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [displayedSrc, setDisplayedSrc] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const loadIdRef = useRef(0);

  useEffect(() => {
    if (!("IntersectionObserver" in window) || !containerRef.current) {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: PRELOAD_ROOT_MARGIN }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!nearViewport || !src) return;

    let cancelled = false;
    const loadId = ++loadIdRef.current;

    // 预载完成再设置 src：避免 <img> 与预加载器对同一 URL 双下载
    void (async () => {
      const ok = await preloadImage(src);
      if (cancelled || loadId !== loadIdRef.current) return;
      setDisplayedSrc(src);
      setError(!ok);
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [nearViewport, src]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        !loaded && !error && "bg-[var(--color-bg-muted)]",
        className
      )}
    >
      {error && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]">
          <ImageIcon size={28} strokeWidth={1.5} />
        </div>
      )}
      <img
        src={displayedSrc || undefined}
        alt={alt}
        decoding="async"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
          loaded && !error ? "opacity-100" : "opacity-0",
          imageClassName
        )}
      />
    </div>
  );
}
