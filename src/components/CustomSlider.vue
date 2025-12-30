<template>
  <div
    class="custom-slider"
    ref="sliderRef"
    :class="{ dragging: isDragging }"
    :style="sliderStyle"
  >
    <div class="slider-track" @click="handleTrackClick">
      <div class="slider-fill" :style="{ width: `${percentage}%` }"></div>
      <div
        class="slider-thumb"
        :style="{ left: `calc(${percentage}% - 12px)` }"
        @mousedown="startDrag"
        @touchstart="startDragTouch"
        ref="thumbRef"
      >
        <div class="thumb-indicator">
          <span class="thumb-value">{{ displayValue }}%</span>
        </div>
      </div>
    </div>

    <div class="slider-labels">
      <span class="slider-label min">{{ min }}</span>
      <span class="slider-label max">{{ max }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { gsap } from "gsap";

const props = defineProps({
  modelValue: {
    type: Number,
    default: 50,
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 100,
  },
  step: {
    type: Number,
    default: 1,
  },
});

const emit = defineEmits(["update:modelValue", "change", "input"]);

// 当前值
const currentValue = ref(props.modelValue);
const isDragging = ref(false);
const sliderRef = ref(null);
const thumbRef = ref(null); // 滑块元素引用

// 颜色映射配置
const colorMap = {
  good: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  normal: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  danger: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  critical: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
};

// CSS变量样式
const sliderStyle = computed(() => ({
  "--fill-color": colorMap[sanityLevel.value],
  "--thumb-color": colorMap[sanityLevel.value],
}));

// GSAP 动画函数
function animateGrab() {
  if (!thumbRef.value) return;

  gsap.to(thumbRef.value, {
    scale: 1.35,
    boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
    duration: 0.2,
    ease: "power2.out",
  });
}

function animateRelease() {
  if (!thumbRef.value) return;

  gsap.to(thumbRef.value, {
    scale: 1,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    duration: 0.35,
    ease: "elastic.out(1, 0.45)",
  });
}

// 同步外部值变化
watch(
  () => props.modelValue,
  (newValue) => {
    currentValue.value = newValue;
  }
);

// 计算百分比位置
const percentage = computed(() => {
  return ((currentValue.value - props.min) / (props.max - props.min)) * 100;
});

// 显示值计算（用于滑块上的数值显示）
const displayValue = computed(() => {
  // 确保显示值在有效范围内，并且正确反映当前值
  const value = Math.round(currentValue.value);
  return Math.max(props.min, Math.min(props.max, value));
});

// 计算理智水平分类
const sanityLevel = computed(() => {
  const value = displayValue.value;
  if (value >= 80) return "good";
  if (value >= 50) return "normal";
  if (value >= 20) return "danger";
  return "critical";
});

// 处理轨道点击
function handleTrackClick(event) {
  if (isDragging.value) return;

  const rect = sliderRef.value.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const sliderWidth = rect.width;
  const newPercentage = Math.max(
    0,
    Math.min(100, (clickX / sliderWidth) * 100)
  );
  let newValue = Math.round(
    (newPercentage / 100) * (props.max - props.min) + props.min
  );

  // 确保点击计算的数值也在正确范围内
  newValue = Math.max(props.min, Math.min(props.max, newValue));

  updateValue(newValue);
}

// 开始拖拽
function startDrag(event) {
  event.preventDefault();
  isDragging.value = true;
  animateGrab(); // 添加抓取动画
  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", stopDrag);
}

// 触摸开始拖拽
function startDragTouch(event) {
  event.preventDefault();
  isDragging.value = true;
  animateGrab(); // 添加抓取动画
  document.addEventListener("touchmove", handleDragTouch);
  document.addEventListener("touchend", stopDrag);
}

// 使用requestAnimationFrame优化拖拽性能
let rafId = null;

// 拖动中的实时更新（不依赖外部props）
function updateValueDuringDrag(pixelX) {
  const rect = sliderRef.value.getBoundingClientRect();
  const sliderWidth = rect.width;
  const sliderLeft = rect.left;

  const newPercentage = Math.max(
    0,
    Math.min(100, ((pixelX - sliderLeft) / sliderWidth) * 100)
  );
  let newValue = Math.round(
    (newPercentage / 100) * (props.max - props.min) + props.min
  );

  // 确保拖拽过程中的数值也在正确范围内
  newValue = Math.max(props.min, Math.min(props.max, newValue));

  // 直接更新内部数值，UI立即变化，无延迟
  currentValue.value = newValue;
}

// 鼠标拖动处理
function handleDrag(event) {
  if (!isDragging.value) return;

  if (rafId) cancelAnimationFrame(rafId);

  rafId = requestAnimationFrame(() => {
    updateValueDuringDrag(event.clientX);
  });
}

// 触摸拖动处理
function handleDragTouch(event) {
  if (!isDragging.value) return;

  if (rafId) cancelAnimationFrame(rafId);

  rafId = requestAnimationFrame(() => {
    updateValueDuringDrag(event.touches[0].clientX);
  });
}

// 停止拖拽（松手时才emit）
function stopDrag() {
  if (!isDragging.value) return;
  isDragging.value = false;

  animateRelease(); // 添加松手弹性回弹动画

  const finalValue = currentValue.value;
  emit("update:modelValue", finalValue);
  emit("change", finalValue);

  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);
  document.removeEventListener("touchmove", handleDragTouch);
  document.removeEventListener("touchend", stopDrag);
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

// 更新数值（非拖拽状态）
function updateValue(newValue) {
  // 限制范围并按步长调整
  const boundedValue = Math.max(props.min, Math.min(props.max, newValue));
  const steppedValue = Math.round(boundedValue / props.step) * props.step;

  // 确保数值正确同步，避免出现0变成100的问题
  const finalValue = Math.max(props.min, Math.min(props.max, steppedValue));
  currentValue.value = finalValue;

  // 非拖拽状态时emit事件
  if (!isDragging.value) {
    emit("update:modelValue", finalValue);
    emit("input", finalValue);
    emit("change", finalValue);
  }
}

// 组件挂载时设置初始值
onMounted(() => {
  if (props.modelValue !== currentValue.value) {
    currentValue.value = props.modelValue;
  }
});

// 组件卸载时清理事件监听
onUnmounted(() => {
  stopDrag();
});
</script>

<style scoped>
.custom-slider {
  position: relative;
  width: 100%;
  padding: 20px 0;
  user-select: none;
}

.slider-track {
  position: relative;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
  overflow: visible;
}

.slider-fill {
  height: 100%;
  border-radius: 4px;
  background: var(--fill-color);
  transition: background 0.4s ease;
  position: relative;
}

.slider-thumb {
  position: absolute;
  top: 50%;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--thumb-color);
  cursor: grab;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slider-thumb:hover {
  transform: translateY(-50%) scale(1.05);
}

.custom-slider.dragging .slider-thumb {
  cursor: grabbing;
}

/* 移除GSAP控制的动画，避免冲突 */

/* 滑块阴影效果 */
.slider-thumb {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.slider-thumb:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.custom-slider.dragging .slider-thumb {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

/* 滑块图标显示 */
.slider-thumb::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.thumb-indicator {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  z-index: 3;
}

.thumb-indicator::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.8);
}

.slider-thumb:hover .thumb-indicator,
.custom-slider.dragging .thumb-indicator {
  opacity: 1;
  visibility: visible;
  top: -35px;
}

.thumb-value {
  font-weight: 500;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
}

.slider-label {
  font-weight: 500;
}

/* 提升移动端体验 */
@media (max-width: 768px) {
  .custom-slider {
    padding: 16px 0;
  }

  .slider-track {
    height: 6px;
  }

  .slider-thumb {
    width: 20px;
    height: 20px;
  }

  .thumb-indicator {
    font-size: 11px;
    padding: 3px 6px;
  }
}

/* 禁用文本选择 */
.custom-slider * {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.custom-slider input {
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  user-select: text;
}
</style>
