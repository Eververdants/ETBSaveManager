<!-- 有Bug -->
<template>
  <div
    :id="'notification-' + notification.id"
    :class="[
      'glass-notification',
      notification.theme,
      notification.darkMode ? 'dark' : 'light',
    ]"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
  >
    <div class="notification-icon">
      <i v-if="notification.theme === 'info'" class="fas fa-info-circle"></i>
      <i
        v-else-if="notification.theme === 'success'"
        class="fas fa-check-circle"
      ></i>
      <i
        v-else-if="notification.theme === 'warning'"
        class="fas fa-exclamation-triangle"
      ></i>
      <i
        v-else-if="notification.theme === 'error'"
        class="fas fa-times-circle"
      ></i>
    </div>
    <div class="notification-content">
      <div class="notification-title">{{ notification.title }}</div>
      <div class="notification-message">{{ notification.message }}</div>
    </div>
    <button class="notification-close" @click="closeNotification">
      <i class="fas fa-times"></i>
    </button>
    <div class="progress-bar">
      <div class="progress" :style="{ width: progress + '%' }"></div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { gsap } from "gsap";

export default {
  props: ["notification", "position", "index", "stack-size"],
  setup(props, { emit }) {
    const progress = ref(100);
    let progressInterval;
    let timeoutId;

    // 开始计时
    const startTimer = () => {
      if (props.notification.duration === 0) return;

      const step = 100;
      const interval = props.notification.duration / step;

      clearInterval(progressInterval);
      clearTimeout(timeoutId);

      progressInterval = setInterval(() => {
        progress.value -= 1;
        if (progress.value <= 0) {
          clearInterval(progressInterval);
        }
      }, interval);

      timeoutId = setTimeout(() => {
        closeNotification();
      }, props.notification.duration);
    };

    // 暂停计时
    const pauseTimer = () => {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
    };

    // 恢复计时
    const resumeTimer = () => {
      const remaining = (progress.value / 100) * props.notification.duration;
      startTimer(remaining);
    };

    const closeNotification = () => {
      // 根据位置确定动画方向
      let animationVars = {
        opacity: 0,
        x: props.position.includes("left") ? -200 : 200,
        y: props.position.includes("top") ? -100 : 100,
        scale: 0.9,
        duration: 0.6,
        ease: "power3.inOut",
        onComplete: () => {
          emit("close");
        },
      };

      gsap.to(`#notification-${props.notification.id}`, animationVars);
    };

    onMounted(() => {
      // 一致的缩放比例
      gsap.fromTo(
        `#notification-${props.notification.id}`,
        {
          opacity: 0,
          y: props.position.includes("top") ? -60 : 60,
          scale: 0.9,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: "elastic.out(1, 0.7)",
          delay: props.index * 0.08,
        }
      );

      startTimer();
    });

    return {
      progress,
      pauseTimer,
      resumeTimer,
      closeNotification,
    };
  },
};
</script>

<style scoped>
.glass-notification {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 18px 20px;
  border-radius: 16px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  min-width: 300px;
  max-width: 350px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  pointer-events: auto;
  overflow: hidden;
  transform-origin: center;
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

/* 浅色主题 */
.light {
  background: rgba(255, 255, 255, 0.82);
  color: #333;
}

/* 深色主题 */
.dark {
  background: rgba(25, 25, 35, 0.82);
  color: #f0f0f0;
}

/* 主题类型 */
.info {
  border-left: 5px solid #007aff;
}

.success {
  border-left: 5px solid #34c759;
}

.warning {
  border-left: 5px solid #ff9500;
}

.error {
  border-left: 5px solid #ff3b30;
}

.notification-icon {
  margin-right: 15px;
  font-size: 22px;
  margin-top: 2px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.info .notification-icon {
  background: rgba(0, 122, 255, 0.15);
  color: #007aff;
}

.success .notification-icon {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
}

.warning .notification-icon {
  background: rgba(255, 149, 0, 0.15);
  color: #ff9500;
}

.error .notification-icon {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
}

.notification-content {
  flex: 1;
  padding-right: 10px;
}

.notification-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 6px;
  letter-spacing: -0.2px;
}

.notification-message {
  font-size: 14px;
  line-height: 1.5;
  opacity: 0.9;
}

.notification-close {
  background: none;
  border: none;
  color: inherit;
  opacity: 0.5;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  margin-left: 5px;
  transition: opacity 0.2s;
  align-self: flex-start;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.notification-close:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

.dark .notification-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  width: 100%;
}

.progress {
  height: 100%;
  transition: width 0.1s linear;
  border-radius: 0 2px 2px 0;
}

.info .progress {
  background: linear-gradient(90deg, #007aff, #5dacff);
}

.success .progress {
  background: linear-gradient(90deg, #34c759, #5dd976);
}

.warning .progress {
  background: linear-gradient(90deg, #ff9500, #ffb44d);
}

.error .progress {
  background: linear-gradient(90deg, #ff3b30, #ff6e66);
}
</style>
