<template>
  <transition name="fade">
    <div v-if="visible" class="dialog-overlay" @click.self="cancel">
      <div class="dialog-container" :class="theme">
        <div class="dialog-header">
          <h3>{{ title }}</h3>
          <button class="close-btn" @click="cancel">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="dialog-body">
          <div class="dialog-icon">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <div class="dialog-content">
            <p>{{ message }}</p>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="cancel-btn" @click="cancel">取消</button>
          <button class="confirm-btn" @click="confirm">确定</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref, computed } from "vue";

export default {
  props: {
    title: {
      type: String,
      default: "确认操作",
    },
    message: {
      type: String,
      default: "您确定要执行此操作吗？",
    },
    visible: {
      type: Boolean,
      required: true,
    },
    theme: {
      type: String,
      default: "dark",
    },
  },
  emits: ["confirm", "cancel"],
  setup(props, { emit }) {
    const confirm = () => {
      emit("confirm");
    };

    const cancel = () => {
      emit("cancel");
    };

    return {
      confirm,
      cancel,
    };
  },
};
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-container {
  background: rgba(30, 30, 46, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  width: 450px;
  max-width: 90%;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.dialog-container.light {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.dialog-header {
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-container.light .dialog-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.dialog-header h3 {
  font-size: 1.4rem;
  font-weight: 600;
  color: #f0f0f0;
}

.dialog-container.light .dialog-header h3 {
  color: #2c3e50;
}

.close-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.2rem;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.dialog-container.light .close-btn {
  color: rgba(0, 0, 0, 0.5);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.dialog-container.light .close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: black;
}

.dialog-body {
  display: flex;
  padding: 2rem;
  gap: 1.5rem;
}

.dialog-icon {
  display: flex;
  align-items: flex-start;
}

.dialog-icon i {
  font-size: 2.5rem;
  color: #ff9800;
}

.dialog-content {
  flex: 1;
}

.dialog-content p {
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
}

.dialog-container.light .dialog-content p {
  color: rgba(0, 0, 0, 0.8);
}

.dialog-footer {
  padding: 1.2rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-container.light .dialog-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.dialog-footer button {
  padding: 0.7rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 90px;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #f0f0f0;
}

.dialog-container.light .cancel-btn {
  background: rgba(0, 0, 0, 0.05);
  color: #2c3e50;
}

.confirm-btn {
  background: #4e89ff;
  color: white;
}

.dialog-container.light .confirm-btn {
  background: #3a6eff;
}

.dialog-footer button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.dialog-container.light .cancel-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.confirm-btn:hover {
  background: #3a6eff;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .dialog-container,
.fade-leave-active .dialog-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.fade-enter-from .dialog-container,
.fade-leave-to .dialog-container {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
