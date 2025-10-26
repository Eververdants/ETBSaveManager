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

// 预加载图片
const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

// 处理图片加载完成
const handleImageLoad = () => {
  imageLoaded.value = true
  emit('load')
}

// 处理图片加载错误
const handleImageError = (event) => {
  console.warn('Image failed to load:', props.src)
  // 即使加载失败也显示图片，避免布局问题
  imageLoaded.value = true
  emit('error', event)
}

// 组件挂载时预加载图片（如果需要）
onMounted(async () => {
  if (props.preload) {
    try {
      await preloadImage(props.src)
      imageLoaded.value = true
    } catch (error) {
      console.error('Preload failed:', error)
      // 预加载失败时不影响正常显示
    }
  }
})

// 监听src变化，重置加载状态
watch(() => props.src, () => {
  imageLoaded.value = false
})
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 确保容器在过渡期间保持稳定 */
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.lazy-image-container img {
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
  width: 40px;
  height: 40px;
  max-width: 100%;
  max-height: 100%;
  margin: auto;
  display: block;
}

/* 如果图片类包含level-image，确保在过渡期间尺寸稳定 */
.lazy-image-container img.level-image {
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
  /* 确保图片在过渡期间不会变形 */
  min-width: 100%;
  min-height: 100%;
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
  transition: opacity 0.3s ease;
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