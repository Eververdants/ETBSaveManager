/**
 * Shared image preloader cache with concurrency limit.
 *
 * Both Phase 2 detail loading (useArchiveData) and LazyImage use this
 * to deduplicate image preloads across the application.  When Phase 2
 * preloads a level background image, LazyImage finds it here and skips
 * its own queue — eliminating the blank frame between the old src and
 * the new one.
 *
 * All preloaded images are small local static assets (~6KB average,
 * 49 images ≈ 300KB total), so the concurrency cap only needs to keep
 * the custom-protocol file reads from stampeding: 8 simultaneous loads
 * saturate the webview pipeline without measurable main-thread cost.
 */

const preloadCache = new Map<string, Promise<boolean>>();
const MAX_CONCURRENT = 8;
let inFlight = 0;
const pending: Array<{ url: string; resolve: (v: boolean) => void }> = [];

function processPending(): void {
  while (inFlight < MAX_CONCURRENT && pending.length > 0) {
    const { url, resolve } = pending.shift()!;
    inFlight++;

    const img = new Image();
    img.onload = () => {
      inFlight--;
      resolve(true);
      processPending();
    };
    img.onerror = () => {
      inFlight--;
      resolve(false);
      processPending();
    };
    img.src = url;
  }
}

/**
 * Start preloading an image URL.  Subsequent calls with the same URL
 * return the same promise — no duplicate network/disk reads.
 */
export function preloadImage(url: string): Promise<boolean> {
  const existing = preloadCache.get(url);
  if (existing) return existing;

  const promise = new Promise<boolean>((resolve) => {
    pending.push({ url, resolve });
  });

  // Ensure the promise doesn't cause unhandled rejection
  promise.catch(() => false);
  preloadCache.set(url, promise);
  processPending();
  return promise;
}

/**
 * Returns true if an image URL has been enqueued for preloading
 * (whether or not the preload has completed yet).
 */
export function isImagePreloaded(url: string): boolean {
  return preloadCache.has(url);
}
