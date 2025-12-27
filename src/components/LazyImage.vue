<template>
  <div class="lazy-image-container" :class="{ 'loaded': imageLoaded }">
    <!-- 加载占位符 -->
    <div v-if="!imageLoaded" class="image-placeholder">
      <div class="placeholder-spinner"></div>
    </div>

    <!-- 实际图片 -->
    <img :src="src" :alt="alt" :class="imageClass" :style="imageStyle" @load="handleImageLoad"
      @error="handleImageError" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  imageClass: {
    type: String,
    default: ''
  },
  imageStyle: {
    type: [String, Object],
    default: ''
  },
  placeholder: {
    type: String,
    default: 'default' // 'default', 'skeleton', 'blur'
  },
  preload: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['load', 'error'])

const imageLoaded = ref(false)

// 全局图片缓存（已加载的图片URL）
const loadedImages = new Set()

// 检查图片是否已缓存
const isImageCached = (url) => {
  if (loadedImages.has(url)) return true
  // 检查浏览器缓存
  const img = new Image()
  img.src = url
  return img.complete && img.naturalWidth > 0
}

// 处理图片加载完成
const handleImageLoad = () => {
  loadedImages.add(props.src)
  imageLoaded.value = true
  emit('load')
}

// 处理图片加载错误
const handleImageError = (event) => {
  // 即使加载失败也显示图片，避免布局问题
  imageLoaded.value = true
  emit('error', event)
}

// 组件挂载时检查缓存
onMounted(() => {
  // 如果图片已缓存，直接显示
  if (isImageCached(props.src)) {
    imageLoaded.value = true
  }
})

// 监听src变化，检查新图片是否已缓存
watch(() => props.src, (newSrc) => {
  if (isImageCached(newSrc)) {
    imageLoaded.value = true
  } else {
    imageLoaded.value = false
  }
})
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

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .image-placeholder {
    background-color: var(--bg-secondary, rgba(255, 255, 255, 0.05));
  }
}
</style>