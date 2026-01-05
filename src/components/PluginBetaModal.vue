<template>
  <div v-if="show" class="plugin-beta-modal-overlay" @click="handleClose">
    <div class="plugin-beta-modal" @click.stop>
      <div class="modal-icon">
        <font-awesome-icon icon="puzzle-piece" />
      </div>
      <h2 class="modal-title">{{ $t('pluginBeta.title') }}</h2>
      <p class="modal-message">{{ $t('pluginBeta.message') }}</p>
      <div class="modal-features">
        <div class="feature-item">
          <font-awesome-icon icon="language" class="feature-icon" />
          <span>{{ $t('pluginBeta.feature1') }}</span>
        </div>
        <div class="feature-item">
          <font-awesome-icon icon="palette" class="feature-icon" />
          <span>{{ $t('pluginBeta.feature2') }}</span>
        </div>
        <div class="feature-item">
          <font-awesome-icon icon="rocket" class="feature-icon" />
          <span>{{ $t('pluginBeta.feature3') }}</span>
        </div>
      </div>
      <button class="modal-button" @click="handleClose">
        {{ $t('pluginBeta.confirm') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const handleClose = () => {
  emit('close');
};

// 防止背景滚动
onMounted(() => {
  if (props.show) {
    document.body.style.overflow = 'hidden';
  }
});
</script>

<style scoped>
.plugin-beta-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
}

.plugin-beta-modal {
  background: var(--bg-primary, #ffffff);
  border-radius: 16px;
  padding: 32px;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.modal-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: white;
}

.modal-title {
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 16px;
  color: var(--text-primary, #333);
}

.modal-message {
  font-size: 16px;
  text-align: center;
  color: var(--text-secondary, #666);
  line-height: 1.6;
  margin-bottom: 24px;
}

.modal-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  padding: 20px;
  background: var(--bg-secondary, #f5f5f5);
  border-radius: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--text-primary, #333);
}

.feature-icon {
  width: 20px;
  color: #667eea;
}

.modal-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.modal-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.modal-button:active {
  transform: translateY(0);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
