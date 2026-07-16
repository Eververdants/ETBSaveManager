<template>
  <div ref="containerRef" class="lazy-image-container" :class="{ loaded: imageLoaded, error: imageError }">
    <!-- Initial loading placeholder: static gradient, no animation -->
    <div v-if="!imageLoaded && !imageError" class="image-placeholder"></div>

    <!-- Load failure placeholder -->
    <div v-if="imageError" class="image-error-fallback">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>

    <!-- Actual image: uses displayedSrc instead of props.src to ensure only loaded images are displayed.
         src starts empty — no browser request until preloaded through the queue.
         Once loaded, the img reads from cache (instant, no white flash). -->
    <img
      :src="displayedSrc"
      :alt="alt"
      :class="imageClass"
      :style="imageStyle"
      decoding="async"
      @load="handleImageLoad"
      @error="onImageError"
    />
  </div>
</template>

<script setup>
import { isImagePreloaded, preloadImage } from "@/utils/imagePreloader";
import { ref, onMounted, onUnmounted, watch } from "vue";

/**
 * Global image preload queue with concurrency limit.
 * Prevents disk I/O contention when many cards mount simultaneously.
 * Reduced to 2 concurrent loads — disk I/O is slower than network,
 * and fewer concurrent reads = less contention on the storage device.
 */
const PRELOAD_QUEUE_MAX = 2;
const PRELOAD_ROOT_MARGIN = "200px";
const preloadQueue = [];
let preloadActive = 0;
const loadedImages = new Set();

/**
 * Stagger: ensure image load starts are spread ~50ms apart.
 * Prevents N simultaneous WebP decodes from blocking the main thread on initial render.
 * During scroll, natural user pacing means this usually resolves immediately.
 */
let _lastLoadStartMs = 0;
const MIN_LOAD_GAP_MS = 50;

const staggerGap = () => {
  const now = performance.now();
  const elapsed = now - _lastLoadStartMs;
  if (elapsed < MIN_LOAD_GAP_MS) {
    const wait = MIN_LOAD_GAP_MS - elapsed;
    return new Promise((resolve) =>
      setTimeout(() => {
        _lastLoadStartMs = performance.now();
        resolve();
      }, wait),
    );
  }
  _lastLoadStartMs = now;
  return Promise.resolve();
};

const processQueue = () => {
  while (preloadActive < PRELOAD_QUEUE_MAX && preloadQueue.length > 0) {
    const { url, resolve } = preloadQueue.shift();
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
};

const enqueuePreload = (url) => {
  return new Promise((resolve) => {
    if (loadedImages.has(url)) {
      resolve(true);
      return;
    }
    // Shared preloader (imagePreloader.ts) already started loading this
    // URL (e.g. via Phase 2's batch preload).  Resolve immediately and
    // track in our local set so subsequent checks skip the global one.
    if (isImagePreloaded(url)) {
      loadedImages.add(url);
      resolve(true);
      return;
    }
    preloadQueue.push({ url, resolve });
    processQueue();
  });
};

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: "",
  },
  imageClass: {
    type: String,
    default: "",
  },
  imageStyle: {
    type: [String, Object],
    default: "",
  },
  placeholder: {
    type: String,
    default: "default",
  },
  preload: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["load", "error"]);

const containerRef = ref(null);

// Whether this element is near the viewport — starts false, becomes true
// when IntersectionObserver fires (or immediately if IO not supported).
const isNearViewport = ref(false);

// displayedSrc starts empty — no `<img src>` means no browser request.
// Only set after the JS preload queue has finished loading the image.
const displayedSrc = ref("");
const imageLoaded = ref(false);
const imageError = ref(false);

// Monotonic load ID: if startLoad() is called twice (e.g. props.src changes
// while a preload is in-flight), only the latest call's result is applied.
let currentLoadId = 0;
let observer = null;

/**
 * Load an image URL through the concurrency-limited queue.
 * Only applies the result if `url` is still the current props.src
 * and no newer load has been started.
 */
const startLoad = async (url) => {
  if (!url) return;
  // Already loaded this exact URL — skip
  if (imageLoaded.value && displayedSrc.value === url) return;

  const loadId = ++currentLoadId;

  // Spread image load starts across frames so WebP decodes don't all
  // hit the main thread in the same frame (causing visible stutter).
  await staggerGap();
  // If a newer load superseded us while we waited, discard
  if (loadId !== currentLoadId) return;

  const ok = await enqueuePreload(url);

  // If a newer load superseded this one, discard stale result
  if (loadId !== currentLoadId) return;
  // If props.src changed to something else while we loaded, discard
  if (url !== props.src) return;

  displayedSrc.value = url;
  imageError.value = !ok;
  imageLoaded.value = true;
};

onMounted(() => {
  if (!props.src) return;

  // Use IntersectionObserver to detect viewport proximity.
  // Only start loading when the element is within PRELOAD_ROOT_MARGIN
  // of the viewport. This prevents off-screen / overscanned cards from
  // triggering disk I/O before the user scrolls near them.
  if ("IntersectionObserver" in window && containerRef.value) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          isNearViewport.value = true;
          observer?.disconnect();
          observer = null;
        }
      },
      { rootMargin: PRELOAD_ROOT_MARGIN },
    );
    observer.observe(containerRef.value);
  } else {
    // Fallback: load immediately
    isNearViewport.value = true;
  }
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});

// When element enters viewport proximity, start loading
watch(isNearViewport, async (near) => {
  if (near && props.src) {
    if (isImagePreloaded(props.src)) {
      await preloadImage(props.src);
      displayedSrc.value = props.src;
      imageLoaded.value = true;
      imageError.value = false;
      return;
    }
    await startLoad(props.src);
  }
});

// When props.src changes: if already near viewport, load immediately.
// If the image was already preloaded (e.g. by Phase 2 detail loading),
// skip the queue and set displayedSrc right away — no blank frame.
// Otherwise the original IntersectionObserver is still watching and
// will trigger startLoad() with the latest src when it fires.
watch(
  () => props.src,
  async (newSrc) => {
    if (!newSrc) return;
    if (isNearViewport.value) {
      if (isImagePreloaded(newSrc)) {
        await preloadImage(newSrc);
        displayedSrc.value = newSrc;
        imageLoaded.value = true;
        imageError.value = false;
        return;
      }
      await startLoad(newSrc);
    }
    // If not yet near viewport, do nothing — the observer will fire
    // with isNearViewport=true and the watch on isNearViewport calls
    // startLoad(props.src) which picks up the latest src.
  },
);

const handleImageLoad = () => {
  loadedImages.add(displayedSrc.value);
  imageLoaded.value = true;
  imageError.value = false;
  emit("load");
};

const onImageError = (event) => {
  // Only a failed displayedSrc load counts as a real error
  imageError.value = true;
  emit("error", event);
};
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

/* Fade-in animation for the image */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.lazy-image-container img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  max-width: 100%;
  max-height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

/* If image class contains item-image, use contain instead of cover */
.lazy-image-container img.item-image {
  object-fit: contain;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  max-width: 100%;
  max-height: 100%;
  display: block;
}

/* If image class contains level-image, ensure stable size during transitions */
.lazy-image-container img.level-image {
  position: absolute;
  top: 0;
  left: 0;
  object-fit: cover;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg-secondary, rgba(0, 0, 0, 0.05));
  z-index: 1;
}

.lazy-image-container img {
  opacity: 0;
  animation: none;
}

.lazy-image-container.loaded img {
  opacity: 1;
  animation: fadeIn 0.25s ease-out both;
}

.lazy-image-container.loaded .image-placeholder {
  display: none;
}

/* Fallback icon shown when image fails to load */
.image-error-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary, rgba(0, 0, 0, 0.05));
  color: var(--text-tertiary, rgba(128, 128, 128, 0.5));
  z-index: 1;
}

.lazy-image-container.error img {
  display: none;
}

/* Dark mode adaptation */
@media (prefers-color-scheme: dark) {
  .image-placeholder {
    background-color: var(--bg-secondary, rgba(255, 255, 255, 0.05));
  }
}
</style>
