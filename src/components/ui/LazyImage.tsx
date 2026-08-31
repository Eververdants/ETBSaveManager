/**
 * 懒加载图片 — IntersectionObserver + 全局并发预加载队列
 * 行为与 master LazyImage.vue 对齐：
 * - src 为空时不发请求；进视口 200px 内才排队加载
 * - 并发 1 + ≥20ms 错峰，避免大量 WebP 解码阻塞主线程
 * - imagePreloader 已预加载的图片直接命中
 */
import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";

import { isImagePreloaded, preloadImage } from "../../utils/imagePreloader";
import { cn } from "../../utils";

const PRELOAD_QUEUE_MAX = 1;
const PRELOAD_ROOT_MARGIN = "200px";
const MIN_LOAD_GAP_MS = 20;

const preloadQueue: Array<{ url: string; resolve: (ok: boolean) => void }> = [];
let preloadActive = 0;
const loadedImages = new Set<string>();
let lastLoadStartMs = 0;

function staggerGap(): Promise<void> {
  const now = performance.now();
  const elapsed = now - lastLoadStartMs;
  if (elapsed < MIN_LOAD_GAP_MS) {
    const wait = MIN_LOAD_GAP_MS - elapsed;
    return new Promise((resolve) =>
      setTimeout(() => {
        lastLoadStartMs = performance.now();
        resolve();
      }, wait)
    );
  }
  lastLoadStartMs = now;
  return Promise.resolve();
}

function processQueue() {
  while (preloadActive < PRELOAD_QUEUE_MAX && preloadQueue.length > 0) {
    const { url, resolve } = preloadQueue.shift()!;
    preloadActive++;
    const img = new Image();
    img.onload = () => {
      loadedImages.add(url);
      preloadActive--;
      resolve(true);
      processQueue();
    };
    img.onerror = () => {
      preloadActive--;
      resolve(false);
      processQueue();
    };
    img.src = url;
  }
}

function enqueuePreload(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (loadedImages.has(url)) {
      resolve(true);
      return;
    }
    if (isImagePreloaded(url)) {
      loadedImages.add(url);
      resolve(true);
      return;
    }
    preloadQueue.push({ url, resolve });
    processQueue();
  });
}

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

    const apply = (url: string, ok: boolean) => {
      if (cancelled || loadId !== loadIdRef.current || url !== src) return;
      setDisplayedSrc(url);
      setError(!ok);
      setLoaded(true);
    };

    void (async () => {
      if (isImagePreloaded(src)) {
        await preloadImage(src);
        if (cancelled || loadId !== loadIdRef.current) return;
        apply(src, true);
        return;
      }
      if (loaded && displayedSrc === src) return;
      await staggerGap();
      if (cancelled || loadId !== loadIdRef.current) return;
      const ok = await enqueuePreload(src);
      apply(src, ok);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        src={displayedSrc}
        alt={alt}
        decoding="async"
        draggable={false}
        onLoad={() => {
          loadedImages.add(displayedSrc);
          setLoaded(true);
          setError(false);
        }}
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
