<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click="$emit('close')">
        <div class="modal-container" @click.stop>
          <!-- 关闭按钮 -->
          <button class="modal-close" @click="$emit('close')">
            <font-awesome-icon :icon="['fas', 'times']" />
          </button>

          <!-- 上传区域 -->
          <div 
            class="upload-zone"
            :class="{ dragging: isDragging, loading: loading }"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
          >
            <!-- 加载状态 -->
            <div v-if="loading" class="state-container">
              <div class="spinner"></div>
              <p class="state-text">{{ $t('plugin.installing') }}</p>
            </div>

            <!-- 成功状态 -->
            <div v-else-if="successMessage" class="state-container success">
              <div class="state-icon success">
                <font-awesome-icon :icon="['fas', 'check-circle']" />
              </div>
              <p class="state-text">{{ successMessage }}</p>
              <button class="state-btn" @click="resetState">
                <font-awesome-icon :icon="['fas', 'plus']" />
                {{ $t('plugin.continueInstall') }}
              </button>
            </div>

            <!-- 错误状态 -->
            <div v-else-if="errorMessage" class="state-container error">
              <div class="state-icon error">
                <font-awesome-icon :icon="['fas', 'exclamation-circle']" />
              </div>
              <p class="state-text">{{ errorMessage }}</p>
              <button class="state-btn" @click="resetState">
                <font-awesome-icon :icon="['fas', 'redo']" />
                {{ $t('plugin.retry') }}
              </button>
            </div>

            <!-- 默认上传状态 -->
            <template v-else>
              <div class="upload-icon-wrapper">
                <div class="upload-icon-glow"></div>
                <div class="upload-icon">
                  <font-awesome-icon :icon="['fas', 'folder-open']" />
                </div>
              </div>
              <h3 class="upload-title">{{ $t('plugin.selectPluginFolder') }}</h3>
              <p class="upload-desc">{{ $t('plugin.selectFolderWithPluginJson') }}</p>
              <button class="upload-btn primary" @click="selectFolder">
                <font-awesome-icon :icon="['fas', 'folder-open']" />
                <span>{{ $t('plugin.browseFolder') }}</span>
              </button>
              <div class="upload-hint">
                <font-awesome-icon :icon="['fas', 'info-circle']" />
                <span>{{ $t('plugin.pluginFolderMustContainJson') }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  successMessage: {
    type: String,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['close', 'select-folder', 'reset']);

const isDragging = ref(false);

const handleDragOver = (e) => {
  e.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = (e) => {
  e.preventDefault();
  isDragging.value = false;
};

const handleDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  // 拖拽暂不支持，提示用户使用按钮
  emit('reset');
};

const selectFolder = () => {
  emit('select-folder');
};

const resetState = () => {
  emit('reset');
};

// 控制 body 滚动
watch(() => props.show, (val) => {
  document.body.style.overflow = val ? 'hidden' : '';
});
</script>

<style scoped>
/* 过渡动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}

/* 遮罩层 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

/* 模态框容器 */
.modal-container {
  position: relative;
  width: 100%;
  max-width: 520px;
  background: var(--bg-secondary);
  border-radius: var(--radius-modal);
  overflow: hidden;
  box-shadow: var(--shadow-2xl);
}

/* 关闭按钮 */
.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.modal-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  transform: rotate(90deg) scale(1.1);
}

/* 上传区域 */
.upload-zone {
  padding: 48px 32px;
  text-align: center;
  transition: all 0.3s ease;
}

.upload-zone.dragging {
  background: rgba(0, 122, 255, 0.05);
}

.upload-zone.loading {
  pointer-events: none;
  opacity: 0.8;
}

/* 上传图标 */
.upload-icon-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.upload-icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--accent-color);
  filter: blur(24px);
  opacity: 0.3;
}

.upload-icon {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  box-shadow: var(--shadow-lg);
}

.upload-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.upload-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 24px;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-button);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-btn.primary {
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  color: white;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 122, 255, 0.4);
}

.upload-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  font-size: 13px;
  color: var(--text-tertiary);
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.upload-hint svg {
  color: var(--accent-color);
}

/* 状态容器 */
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.state-icon.success {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
}

.state-icon.error {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
}

.state-text {
  font-size: 15px;
  color: var(--text-primary);
  margin: 0;
}

.state-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-button);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.state-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

/* 响应式 */
@media (max-width: 640px) {
  .modal-container {
    border-radius: var(--radius-lg);
  }

  .upload-zone {
    padding: 40px 24px;
  }
}
</style>
