<template>
  <Transition appear @enter="enterCardAnimation" :css="false">
    <div
      ref="cardElement"
      class="living-glass-card"
      :class="{ 'no-hover': isAnimating.value }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="card-header">
        <div class="archive-name">{{ archive.name }}</div>
      </div>

      <div class="card-content">
        <div class="info-item">
          <span class="info-label">存档难度</span>
          <span class="info-value">{{ archive.difficulty }}</span>
        </div>

        <div class="info-item">
          <span class="info-label">实际难度</span>
          <span class="info-value">{{ archive.actualDifficulty }}</span>
        </div>

        <div class="info-item">
          <span class="info-label">游戏模式</span>
          <span class="info-value">{{ archive.mode }}</span>
        </div>

        <div class="info-item">
          <span class="info-label">状态</span>
          <span class="info-value">{{
            archive.hidden ? "已隐藏" : "可见"
          }}</span>
        </div>

        <div class="info-item">
          <span class="info-label">当前层级</span>
          <span class="info-value">{{ archive.currentLevel }}</span>
        </div>
      </div>

      <div class="card-footer">
        <div class="date">最后游玩时间: {{ archive.date }}</div>
        <div class="actions-container">
          <button
            class="action-btn delete-btn"
            @click.stop="$emit('delete', archive.id)"
          >
            <i class="fa-solid fa-trash"></i>
          </button>
          <button
            class="action-btn edit-btn"
            @click.stop="$emit('edit', archive)"
          >
            <i class="fa-solid fa-edit"></i>
          </button>
          <button
            class="action-btn toggle-btn"
            @click.stop="handleToggle"
            type="button"
          >
            <FontAwesomeIcon :icon="isVisible ? ['fas', 'eye'] : ['fas', 'eye-slash']" ref="toggleIcon" />
          </button>
        </div>
      </div>

      <div class="card-highlight"></div>
      <div class="active-indicator" :class="{ active: isCardActive }"></div>
      <div v-if="isAnimating.value" class="card-mask"></div>
    </div>
  </Transition>
</template>

<script>
import { ref, onMounted, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
import gsap from "gsap";
import VisibilityOn from "./icons/VisibilityOn.vue";
import VisibilityOff from "./icons/VisibilityOff.vue";

export default {
  components: {
    VisibilityOn,
    VisibilityOff,
  },
  props: {
    archive: {
      type: Object,
      required: true,
      default: () => ({
        id: 0,
        name: "",
        difficulty: "",
        difficultyClass: "",
        actualDifficulty: "",
        mode: "",
        date: "",
        currentLevel: "",
        hidden: false,
      }),
    },
    filePath: {
      type: String,
      required: true,
    },
    lightMode: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["delete", "edit", "toggle", "update-archive"],
  setup(props, { emit }) {
    const isVisible = ref(!props.archive.hidden);
    const toggleIcon = ref(null);
    const cardElement = ref(null);
    const isCardActive = ref(false);
    const isAnimating = ref(false);
    let ctx;

    onMounted(() => {
      ctx = gsap.context(() => {
        // 初始化卡片状态
        gsap.set(cardElement.value, {
          y: 0,
          boxShadow: "var(--Card-shadow-normal)",
          opacity: 1,
        });
      }, cardElement.value);
    });

    watch(
      () => props.archive.hidden,
      (newVal) => {
        isVisible.value = !newVal;
      }
    );

    const handleToggle = async () => {
      try {
        const newPath = await invoke("handle_file", {
          filePath: props.filePath,
        });

        // 添加切换动画
        gsap.fromTo(
          toggleIcon.value.$el,
          { scale: 1 },
          {
            scale: 1.4,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
          }
        );

        // 更新状态
        const newHidden = !props.archive.hidden;
        emit("update-archive", {
          ...props.archive,
          hidden: newHidden,
          path: newPath,
        });
      } catch (err) {
        console.error("操作失败:", err);
      }
    };

    const handleMouseEnter = () => {
      isCardActive.value = true;

      // 卡片悬浮动画，确保 scale 归位为 1
      gsap.to(cardElement.value, {
        y: -8,
        scale: 1, // 保证最终尺寸一致
        opacity: 1, // 保证透明度一致
        duration: 0.3,
        ease: "power2.out",
        boxShadow: "var(--Card-shadow-hover)",
        overwrite: true,
      });

      // 显示高光
      gsap.to(".card-highlight", {
        opacity: 0.8,
        duration: 0.4,
        ease: "sine.out",
      });
    };

    // 卡片进入动画
    const enterCardAnimation = (el, done) => {
      isAnimating.value = true;
      gsap.from(el, {
        duration: 0.6,
        y: 40,
        opacity: 0,
        scale: 0.95,
        ease: "back.out(1.7)",
        onComplete: () => {
          isAnimating.value = false;
          // 如果动画结束时鼠标仍停留在卡片上，手动触发悬浮动画，保证视觉一致
          if (cardElement.value && cardElement.value.matches(":hover")) {
            handleMouseEnter();
          }
          done();
        },
      });
    };

    const handleMouseLeave = () => {
      isCardActive.value = false;

      // 卡片恢复动画，确保 scale 恢复为 1
      gsap.to(cardElement.value, {
        y: 0,
        scale: 1, // 保证尺寸恢复
        opacity: 1, // 保证透明度恢复
        duration: 0.4,
        ease: "elastic.out(1, 0.8)",
        boxShadow: "var(--Card-shadow-normal)",
        overwrite: true,
      });

      // 隐藏高光
      gsap.to(".card-highlight", {
        opacity: 0,
        duration: 0.3,
        ease: "sine.in",
      });
    };

    return {
      isVisible,
      toggleIcon,
      cardElement,
      isCardActive,
      handleToggle,
      handleMouseEnter,
      handleMouseLeave,
      enterCardAnimation,
      isAnimating,
    };
  },
};
</script>

<style scoped>
.living-glass-card {
  cursor: default;
  position: relative;
  width: 300px;
  height: auto;
  min-height: 280px;
  background: var(--Card-bg-primary);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 22px;
  box-shadow: var(--Card-shadow-normal);
  border: 1px solid var(--Card-border-color);
  overflow: hidden;
  z-index: 1;
  display: flex;
  flex-direction: column;
  transition: background 0.4s ease, border-color 0.4s ease;
}

.card-highlight {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  z-index: -1;
  pointer-events: none;
  border-radius: 50%;
  transform: rotate(15deg);
}

.active-indicator {
  position: absolute;
  top: 20px;
  left: 0;
  width: 4px;
  height: 24px;
  background: var(--Card-accent-primary);
  border-radius: 0 2px 2px 0;
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.active-indicator.active {
  opacity: 1;
  transform: translateX(0);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--Card-border-color);
  position: relative;
  z-index: 2;
}

.archive-name {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--Card-text-primary);
  max-width: 70%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.living-glass-card:hover .archive-name {
  color: var(--Card-accent-primary);
}

.card-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  flex-grow: 1;
  margin-bottom: 15px;
  position: relative;
  z-index: 2;
}

.info-item {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  border-radius: 8px;
  transition: transform 0.3s ease, background 0.3s ease;
}

.info-item:hover {
  transform: translateY(-2px);
}

.info-label {
  font-size: 0.8rem;
  color: var(--Card-text-secondary);
  margin-bottom: 4px;
  letter-spacing: 0.3px;
}

.info-value {
  font-size: 1rem;
  font-weight: 500;
  color: var(--Card-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--Card-border-color);
  position: relative;
  z-index: 2;
}

.date {
  font-size: 0.8rem;
  color: var(--Card-text-secondary);
  font-weight: 500;
  transition: color 0.3s ease;
}

.living-glass-card:hover .date {
  color: var(--Card-accent-secondary);
}

.actions-container {
  position: relative;
  right: -15px;
  display: flex;
  gap: 10px;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.living-glass-card:hover .actions-container {
  opacity: 1;
  transform: translateY(0);
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--Card-bg-secondary);
  border: 1px solid var(--Card-border-color);
  color: var(--Card-text-secondary);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--Card-surface-overlay);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.action-btn:hover::before {
  opacity: 1;
}

.action-btn img {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.action-btn:hover img {
  transform: scale(1.15);
}

.delete-btn:hover {
  background: rgba(255, 80, 100, 0.25);
  color: #ff5064;
}

.edit-btn:hover {
  background: rgba(70, 130, 255, 0.25);
  color: #4682ff;
}

.toggle-btn:hover {
  background: rgba(70, 200, 120, 0.25);
  color: #46c878;
}

.living-glass-card.no-hover {
  pointer-events: none;
  transition: none !important;
  animation: none !important;
}

.card-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(2px);
  z-index: 10;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
</style>
