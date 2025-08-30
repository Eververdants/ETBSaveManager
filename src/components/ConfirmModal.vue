<template>
  <transition name="modal">
    <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
          <button class="modal-close" @click="handleCancel" aria-label="关闭">
            <font-awesome-icon icon="fa-solid fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <div class="modal-icon" :class="type">
            <font-awesome-icon :icon="icon" />
          </div>
          <p class="modal-message">{{ message }}</p>
          <p v-if="description" class="modal-description">{{ description }}</p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="handleCancel" :disabled="loading">
            {{ cancelText }}
          </button>
          <button class="btn" :class="`btn-${type}`" @click="handleConfirm" :disabled="loading">
            <span v-if="loading" class="loading-spinner"></span>
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '确认操作'
  },
  message: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'danger',
    validator: (value) => ['info', 'warning', 'danger'].includes(value)
  },
  confirmText: {
    type: String,
    default: '确认'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  loading: {
    type: Boolean,
    default: false
  },
  closeOnOverlay: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['confirm', 'cancel', 'update:show'])

const icon = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'fa-solid fa-exclamation-triangle'
    case 'warning':
      return 'fa-solid fa-exclamation-circle'
    case 'info':
      return 'fa-solid fa-info-circle'
    default:
      return 'fa-solid fa-question-circle'
  }
})

const handleConfirm = () => {
  emit('confirm')
  emit('update:show', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:show', false)
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    handleCancel()
  }
}

// 按ESC键关闭
const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    handleCancel()
  }
}

// 监听键盘事件
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  padding-top: 60px;
  justify-content: center;
  z-index: 1099;
  padding: 20px;
}

.modal-container {
  background: var(--bg-primary);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 100%;
  border: 1px solid var(--divider-color);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--divider-color);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.modal-body {
  padding: 24px;
  text-align: center;
}

.modal-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.modal-icon.danger {
  color: #ff3b30;
}

.modal-icon.warning {
  color: #ff9500;
}

.modal-icon.info {
  color: #007aff;
}

.modal-message {
  font-size: 16px;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.modal-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px 24px;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--divider-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.btn-danger {
  background: #ff3b30;
  color: white;
  border: 1px solid #ff3b30;
}

.btn-danger:hover:not(:disabled) {
  background: #ff2d20;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
}

.btn-warning {
  background: #ff9500;
  color: white;
  border: 1px solid #ff9500;
}

.btn-warning:hover:not(:disabled) {
  background: #e68600;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3);
}

.btn-info {
  background: #007aff;
  color: white;
  border: 1px solid #007aff;
}

.btn-info:hover:not(:disabled) {
  background: #0066e6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-right: 6px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .modal-overlay {
    padding: 16px;
  }

  .modal-container {
    margin: 0;
  }

  .modal-header {
    padding: 16px 20px 12px;
  }

  .modal-body {
    padding: 20px;
  }

  .modal-footer {
    padding: 12px 20px 20px;
    flex-direction: column-reverse;
    gap: 8px;
  }

  .btn {
    width: 100%;
  }
}

/* 模态框动画 */
.modal-enter-active {
  transition: opacity 0.3s ease-out;
}

.modal-leave-active {
  transition: opacity 0.25s ease-in;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container {
  transition: all 0.3s ease-out;
  transition-delay: 0.1s;
}

.modal-leave-active .modal-container {
  transition: all 0.25s ease-in;
}

.modal-enter-from .modal-container {
  transform: scale(0.9) translateY(-20px);
  opacity: 0;
}

.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

.modal-overlay.modal-leave-active {
  transition: opacity 0.25s ease-in;
}

.modal-overlay.modal-leave-to {
  opacity: 0;
}
</style>