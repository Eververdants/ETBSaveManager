<template>
  <div
    class="living-glass-card"
    :class="{ 'light-mode': lightMode }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="card-header">
      <div class="archive-name">{{ archive.name }}</div>
      <div class="difficulty-tag" :class="archive.difficultyClass">
        {{ archive.difficulty }}
      </div>
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
        <span class="info-value">{{ archive.hidden ? "已隐藏" : "可见" }}</span>
      </div>

      <div class="info-item">
        <span class="info-label">当前层级</span>
        <span class="info-value">{{ archive.currentLevel }}</span>
      </div>
    </div>

    <div class="card-footer">
      <div class="date">修改于: {{ archive.date }}</div>
      <div class="actions-container">
        <button
          class="action-btn delete-btn"
          @click="$emit('delete', archive.id)"
        >
          <img src="/delete_forever.svg" alt="删除" />
        </button>
        <button class="action-btn edit-btn" @click="$emit('edit')">
          <img src="/edit.svg" alt="编辑" />
        </button>
        <button class="action-btn toggle-btn" @click="$emit('toggle')">
          <component :is="archive.hidden ? 'VisibilityOff' : 'VisibilityOn'" />
        </button>
      </div>
    </div>

    <div class="glass-edge"></div>
    <div class="glow-effect"></div>
  </div>
</template>

<script>
import { gsap } from "gsap";
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
    lightMode: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["delete", "edit", "toggle"],
  methods: {
    handleMouseEnter(event) {
      const index = Array.from(event.currentTarget.parentNode.children).indexOf(
        event.currentTarget
      );
      onCardHover(index);
    },
    handleMouseLeave(event) {
      const index = Array.from(event.currentTarget.parentNode.children).indexOf(
        event.currentTarget
      );
      onCardLeave(index);
    },
  },
};

// 提取为可复用的方法
function onCardHover(index) {
  const card = document.querySelectorAll(".living-glass-card")[index];
  if (card) {
    gsap.to(card, {
      y: -8,
      duration: 0.3,
      ease: "power2.out",
      boxShadow:
        "0 12px 32px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
    });
  }
}

function onCardLeave(index) {
  const card = document.querySelectorAll(".living-glass-card")[index];
  if (card) {
    gsap.to(card, {
      y: 0,
      duration: 0.4,
      ease: "elastic.out(1, 0.8)",
      boxShadow:
        "0 8px 24px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.15)",
    });
  }
}
</script>

<style scoped>
.living-glass-card {
  cursor: default;
  position: relative;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 20px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  z-index: 1;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform, box-shadow;
}

.light-mode .living-glass-card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.8),
    inset 0 -1px 1px rgba(0, 0, 0, 0.03);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.light-mode .card-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.archive-name {
  position: relative;
  top: 5px;
  font-size: 1.3rem;
  font-weight: 600;
  color: #ffffff;
  max-width: 70%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.light-mode .archive-name {
  color: #2d3748;
}

.difficulty-tag {
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.Easy {
  background: rgba(70, 200, 120, 0.2);
  color: #46c878;
}

.Normal {
  background: rgba(255, 180, 70, 0.2);
  color: #ffb446;
}

.Hard {
  background: rgba(255, 80, 100, 0.2);
  color: #ff5064;
}

.Nightmare {
  background: rgba(133, 14, 163, 0.2);
  color: #850ea3;
}

.card-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  flex-grow: 1;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.8rem;
  color: #a0aec0;
  margin-bottom: 4px;
}

.light-mode .info-label {
  color: #718096;
}

.info-value {
  font-size: 1rem;
  font-weight: 500;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.light-mode .info-value {
  color: #2d3748;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.light-mode .card-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.date {
  font-size: 0.8rem;
  color: #8a9eff;
  font-weight: 500;
}

.light-mode .date {
  color: #667eea;
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
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.light-mode .action-btn {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.05);
  color: #4a5568;
}

.action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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

.glass-edge {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 20px;
  pointer-events: none;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.3),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
  z-index: -1;
}

.light-mode .glass-edge {
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.8),
    inset 0 -1px 1px rgba(0, 0, 0, 0.03);
}

.glow-effect {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at center,
    rgba(138, 158, 255, 0.3) 0%,
    transparent 60%
  );
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  pointer-events: none;
  z-index: -2;
}

.living-glass-card:hover .glow-effect {
  opacity: 0.15;
}

.light-mode .living-glass-card:hover .glow-effect {
  background: radial-gradient(
    circle at center,
    rgba(102, 126, 234, 0.2) 0%,
    transparent 60%
  );
  opacity: 0.1;
}
</style>
