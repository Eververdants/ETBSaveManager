<template>
  <div class="lazy-image-container" :class="{ loaded: imageLoaded, error: imageError }">
    <!-- 首次加载占位符：只在组件首次渲染且图片未加载时显示 -->
    <div v-if="!imageLoaded && !imageError" class="image-placeholder">
      <div class="placeholder-spinner"></div>
    </div>

    <!-- 加载失败占位 -->
    <div v-if="imageError" class="image-error-fallback">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>

    <!-- 实际图片：用 displayedSrc 而非 props.src，确保只显示已加载完成的图片 -->
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

/** 全局缓存：已成功加载的图片 URL，避免重复预加载 */
const loadedImages = new Set();

// 当前实际显示的 src（只有已加载完成的图片才会被赋给这个 ref）
const displayedSrc = ref(props.src);
const imageLoaded = ref(false);
const imageError = ref(false);

/** 预加载一张图片，返回加载成功与否 */
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

/** 切换到新图片：预加载 → 加载成功后更新 displayedSrc */
const swapToSrc = async (newSrc) => {
  if (!newSrc || newSrc === displayedSrc.value) return;

  const ok = await preloadImage(newSrc);
  // 预加载完成后，一次性切换 src（浏览器从缓存读取，无闪白）
  displayedSrc.value = newSrc;
  imageError.value = !ok;
  // imageLoaded 保持 true 不断，容器不显示 spinner
  imageLoaded.value = true;
};

// 首次挂载时预加载初始 src
onMounted(async () => {
  if (props.src) {
    const ok = await preloadImage(props.src);
    // 如果初始图加载失败，进 error 状态
    imageError.value = !ok;
    imageLoaded.value = true;
    displayedSrc.value = props.src;
  }
});

// props.src 变化时：预加载新图 → 静默切换，不重置 imageLoaded
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
  // 只有 displayedSrc 加载失败才算真正的错误
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
  /* 确保容器在过渡期间保持稳定 */
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
  /* 确保图片在过渡期间保持稳定 */
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform: translateZ(0);
  /* 防止图片在过渡期间放大 */
  box-sizing: border-box;
  /* 确保图片在过渡期间不会超出容器 */
  overflow: hidden;
}

/* 如果图片类包含item-image，则使用contain而不是cover */
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

/* 如果图片类包含level-image，确保在过渡期间尺寸稳定 */
.lazy-image-container img.level-image {
  position: absolute;
  top: 0;
  left: 0;
  object-fit: cover;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  /* 确保图片在过渡期间保持稳定 */
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform: translateZ(0);
  /* 防止图片在过渡期间放大 */
  box-sizing: border-box;
  /* 确保图片在过渡期间不会超出容器 */
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

/* 图片加载失败时显示兜底图标 */
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

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .image-placeholder {
    background-color: var(--bg-secondary, rgba(255, 255, 255, 0.05));
  }
}
</style>
