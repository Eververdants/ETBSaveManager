<template>
  <transition name="modal">
    <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container consent-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
        </div>

        <div class="modal-body">
          <div class="consent-icon">
            <font-awesome-icon :icon="['fas', 'shield-alt']" />
          </div>
          <p class="consent-message">{{ message }}</p>

          <div class="consent-details">
            <div class="consent-detail-item">
              <font-awesome-icon :icon="['fas', 'bug']" class="detail-icon" />
              <span>{{ t("settings.autoFeedbackConsent.errorDetection") }}</span>
            </div>
            <div class="consent-detail-item">
              <font-awesome-icon :icon="['fas', 'laptop-code']" class="detail-icon" />
              <span>{{ t("settings.autoFeedbackConsent.systemInfo") }}</span>
            </div>
            <div class="consent-detail-item">
              <font-awesome-icon :icon="['fas', 'lock']" class="detail-icon" />
              <span>{{ t("settings.autoFeedbackConsent.privacy") }}</span>
            </div>
          </div>

          <p class="consent-note">
            {{ t("settings.autoFeedbackConsent.note") }}
          </p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="handleDecline">
            {{ t("settings.autoFeedbackConsent.decline") }}
          </button>
          <button class="btn btn-primary" @click="handleAccept">
            {{ t("settings.autoFeedbackConsent.accept") }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["accept", "decline", "update:show"]);

const handleOverlayClick = () => {
  // 阻止点击遮罩关闭，必须选择
};

const handleAccept = () => {
  emit("accept");
  emit("update:show", false);
};

const handleDecline = () => {
  emit("decline");
  emit("update:show", false);
};
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
  justify-content: center;
  z-index: 10001;
  padding: 20px;
}

.modal-container {
  background: var(--bg-primary);
  border-radius: var(--radius-modal);
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

.modal-body {
  padding: 24px;
  text-align: center;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 16px 24px 24px;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: var(--radius-button);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--divider-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.consent-modal {
  max-width: 480px;
}

.consent-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.consent-icon :deep(svg) {
  font-size: 48px;
  color: var(--primary-color, #4a90d9);
}

.consent-message {
  text-align: center;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.consent-details {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--divider-color);
  text-align: left;
}

.consent-detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.consent-detail-item:not(:last-child) {
  border-bottom: 1px solid var(--divider-color);
}

.consent-detail-item:last-child {
  padding-bottom: 0;
}

.detail-icon {
  color: var(--primary-color, #4a90d9);
  width: 18px;
  text-align: center;
}

.consent-note {
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
  margin-top: 12px;
}

.modal-footer .btn {
  flex: 1;
  max-width: 160px;
}

.btn-primary {
  background: var(--primary-color, #4a90d9);
  color: white;
  border: 1px solid var(--primary-color, #4a90d9);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-color-hover, #3a7bc8);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 217, 0.3);
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
</style>
