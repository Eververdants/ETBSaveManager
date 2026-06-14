<template>
  <div class="lazy-image-container" :class="{ loaded: imageLoaded, error: imageError }">
    <!-- Initial loading placeholder: only shown on first render when image not loaded -->
    <div v-if="!imageLoaded && !imageError" class="image-placeholder">
      <div class="placeholder-spinner"></div>
    </div>

    <!-- Load failure placeholder -->
    <div v-if="imageError" class="image-error-fallback">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>

    <!-- Actual image: uses displayedSrc instead of props.src to ensure only loaded images are displayed -->
    <img
      :src="displayedSrc"
      :alt="alt"
      :class="imageClass"
      :style="imageStyle"
      @load="handleImageLoad"
      @error="onImageError"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";

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

/** Global cache: successfully loaded image URLs to avoid repeated preloading */
const loadedImages = new Set();

// Currently displayed src (only fully loaded images are assigned to this ref)
const displayedSrc = ref(props.src);
const imageLoaded = ref(false);
const imageError = ref(false);

/** Preload an image, returns success or failure */
const preloadImage = (url) => {
  return new Promise((resolve) => {
    if (loadedImages.has(url)) {
      resolve(true);
      return;
    }
    const img = new Image();
    img.onload = () => {
      loadedImages.add(url);
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

/** Switch to new image: preload -> update displayedSrc on success */
const swapToSrc = async (newSrc) => {
  if (!newSrc || newSrc === displayedSrc.value) return;

  const ok = await preloadImage(newSrc);
  // After preloading, switch src in one go (browser reads from cache, no white flash)
  displayedSrc.value = newSrc;
  imageError.value = !ok;
  // imageLoaded stays true, container won't show spinner
  imageLoaded.value = true;
};

// Preload initial src on first mount
onMounted(async () => {
  if (props.src) {
    const ok = await preloadImage(props.src);
    // If initial image fails to load, enter error state
    imageError.value = !ok;
    imageLoaded.value = true;
    displayedSrc.value = props.src;
  }
});

// When props.src changes: preload new image -> silent switch, don't reset imageLoaded
watch(
  () => props.src,
  (newSrc) => {
    if (!newSrc) return;
    swapToSrc(newSrc);
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
  /* Ensure container stays stable during transitions */
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);
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
  /* Ensure image stays stable during transitions */
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform: translateZ(0);
  /* Prevent image from scaling during transitions */
  box-sizing: border-box;
  /* Ensure image doesn't exceed container during transitions */
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
  /* Ensure image stays stable during transitions */
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform: translateZ(0);
  /* Prevent image from scaling during transitions */
  box-sizing: border-box;
  /* Ensure image doesn't exceed container during transitions */
  overflow: hidden;
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-secondary, rgba(0, 0, 0, 0.05));
  z-index: 1;
}

.placeholder-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-color, rgba(0, 0, 0, 0.1));
  border-top: 2px solid var(--accent-color, #007bff);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.lazy-image-container img {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.lazy-image-container.loaded img {
  opacity: 1;
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
