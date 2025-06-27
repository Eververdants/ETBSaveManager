<template>
  <div class="delete-confirm-container" :class="{ 'light-mode': lightMode }">
    <div ref="backdropRef" class="confirm-backdrop" @click.self="cancel"></div>
    <div
      ref="dialogRef"
      class="confirm-dialog"
      :class="{ 'light-mode': lightMode }"
    >
      <div class="dialog-header">
        <h2>删除存档确认</h2>
        <div class="danger-icon">
          <svg viewBox="0 0 24 24">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
            />
          </svg>
        </div>
      </div>

      <div class="archive-info">
        <div class="info-item">
          <span class="label">存档名称:</span>
          <span class="value">{{ archive.name }}</span>
        </div>
        <div class="info-item">
          <span class="label">难度:</span>
          <span class="value">{{ archive.difficulty }}</span>
        </div>
        <div class="info-item">
          <span class="label">实际难度:</span>
          <span class="value">{{ archive.actualDifficulty }}</span>
        </div>
        <div class="info-item">
          <span class="label">游戏模式:</span>
          <span class="value">{{ archive.mode }}</span>
        </div>
        <div class="info-item">
          <span class="label">当前层级:</span>
          <span class="value">{{ archive.currentLevel }}</span>
        </div>
        <div class="info-item">
          <span class="label">最后游玩时间:</span>
          <span class="value">{{ formattedDate }}</span>
        </div>
      </div>

      <div class="warning-message">
        <svg viewBox="0 0 24 24">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </svg>
        <p>此操作将永久删除该存档且无法恢复</p>
      </div>

      <div class="dialog-actions">
        <button class="cancel-btn" @click="cancel">取消</button>
        <button class="confirm-btn" @click="confirmDelete">确认删除</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import gsap from "gsap";

export default {
  name: "LG_DeleteConfirm",
  props: {
    archive: {
      type: Object,
      required: true,
      default: () => ({
        id: "",
        name: "未命名存档",
        difficulty: "未知",
        difficultyClass: "未知",
        actualDifficulty: "未知",
        mode: "未知",
        date: new Date(),
        currentLevel: "未知",
        hidden: false,
        path: "",
      }),
    },
    lightMode: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["confirm", "cancel"],
  setup(props, { emit }) {
    const backdropRef = ref(null);
    const dialogRef = ref(null);

    const formattedDate = computed(() => {
      const date = new Date(props.archive.date);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    });

    // 进场动画
    onMounted(() => {
      gsap.set(backdropRef.value, { opacity: 0 });
      gsap.set(dialogRef.value, { y: 50, opacity: 0, scale: 0.9 });

      const timeline = gsap.timeline();

      timeline.to(backdropRef.value, {
        opacity: 1,
        duration: 0.3,
        ease: "sine.out",
      });

      timeline.to(
        dialogRef.value,
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "back.out(1.7)",
        },
        "-=0.2"
      );
    });

    // 执行出场动画
    function animateExit() {
      const timeline = gsap.timeline();

      timeline.to(dialogRef.value, {
        y: 30,
        opacity: 0,
        scale: 0.95,
        duration: 0.4,
        ease: "power2.in",
      });

      timeline.to(
        backdropRef.value,
        {
          opacity: 0,
          duration: 0.3,
          ease: "sine.out",
        },
        "-=0.2"
      );

      return timeline;
    }

    function cancel() {
      animateExit().then(() => {
        emit("cancel");
      });
    }

    function confirmDelete() {
      // 添加确认动画效果
      gsap.to(dialogRef.value, {
        keyframes: [
          { scale: 0.95, duration: 0.1 },
          { scale: 1.05, duration: 0.1 },
          { scale: 1, duration: 0.1 },
        ],
        onComplete: () => {
          // 震动效果
          gsap.to(dialogRef.value, {
            x: 10,
            duration: 0.05,
            repeat: 3,
            yoyo: true,
            ease: "power1.inOut",
            onComplete: () => {
              animateExit().then(() => {
                emit("confirm", props.archive.id);
              });
            },
          });
        },
      });
    }

    return {
      backdropRef,
      dialogRef,
      formattedDate,
      cancel,
      confirmDelete,
    };
  },
};
</script>

<style scoped>
.delete-confirm-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.confirm-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 1;
}

.confirm-dialog {
  position: relative;
  width: 90%;
  max-width: 500px;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  z-index: 2;
  background: rgba(30, 30, 40, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transform-origin: center;
}

.light-mode .confirm-dialog {
  background: rgba(245, 245, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.light-mode .dialog-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: #ff6b6b;
  text-shadow: 0 0 10px rgba(255, 107, 107, 0.3);
}

.light-mode .dialog-header h2 {
  color: #e74c3c;
  text-shadow: 0 0 8px rgba(231, 76, 60, 0.2);
}

.danger-icon svg {
  width: 36px;
  height: 36px;
  fill: #ff6b6b;
}

.light-mode .danger-icon svg {
  fill: #e74c3c;
}

.archive-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 25px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.85rem;
  opacity: 0.7;
  margin-bottom: 3px;
}

.value {
  font-size: 1.05rem;
  font-weight: 500;
  word-break: break-all;
}

.light-mode .label {
  opacity: 0.8;
}

.light-mode .value {
  color: #333;
}

.warning-message {
  display: flex;
  align-items: center;
  background: rgba(255, 107, 107, 0.15);
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 25px;
  border-left: 3px solid #ff6b6b;
}

.light-mode .warning-message {
  background: rgba(231, 76, 60, 0.12);
  border-left: 3px solid #e74c3c;
}

.warning-message svg {
  width: 24px;
  height: 24px;
  fill: #ff6b6b;
  margin-right: 12px;
  flex-shrink: 0;
}

.light-mode .warning-message svg {
  fill: #e74c3c;
}

.warning-message p {
  margin: 0;
  line-height: 1.5;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

button {
  padding: 12px 28px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.light-mode .cancel-btn {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.light-mode .cancel-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.confirm-btn {
  background: linear-gradient(135deg, #ff6b6b, #ff3d3d);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.light-mode .confirm-btn {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.2);
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.light-mode .confirm-btn:hover {
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.3);
}

.confirm-btn:active {
  transform: translateY(0);
}
</style>
