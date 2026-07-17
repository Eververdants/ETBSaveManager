<script setup>
import { ref, onErrorCaptured, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const props = defineProps({
  /** Custom title for the error message */
  title: {
    type: String,
    default: undefined,
  },
  /** Custom description for the error message */
  message: {
    type: String,
    default: undefined,
  },
  /** Whether to show the error detail (stack trace) */
  showDetail: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n({ useScope: "global" });
const router = useRouter();

const hasError = ref(false);
const error = ref(null);
const detailVisible = ref(false);
const isRetrying = ref(false);

const displayTitle = computed(() => props.title || t("errorBoundary.title"));
const displayMessage = computed(() => props.message || t("errorBoundary.message"));

onErrorCaptured((err, instance, info) => {
  hasError.value = true;
  error.value = err instanceof Error ? err : new Error(String(err));
  console.error("[ErrorBoundary] Caught error:", err, info);
  return false; // Prevent error from propagating further
});

const retry = () => {
  isRetrying.value = true;
  hasError.value = false;
  error.value = null;
  detailVisible.value = false;

  // Small delay to allow state to settle before re-render
  requestAnimationFrame(() => {
    isRetrying.value = false;
  });
};

const goHome = () => {
  hasError.value = false;
  error.value = null;
  detailVisible.value = false;
  router.push({ name: "Home" });
};

const toggleDetail = () => {
  detailVisible.value = !detailVisible.value;
};
</script>

<template>
  <div class="error-boundary-root">
    <div v-if="hasError" class="error-boundary" role="alert">
      <div class="error-boundary-inner">
        <div class="error-icon">
          <svg
width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 class="error-title">{{ displayTitle }}</h3>
        <p class="error-message">{{ displayMessage }}</p>
        <div class="error-actions">
          <button class="error-btn error-btn-primary" :disabled="isRetrying" @click="retry">
            <span v-if="isRetrying" class="error-btn-spinner" />
            <template v-else>{{ $t("errorBoundary.retry") }}</template>
          </button>
          <button class="error-btn error-btn-secondary" @click="goHome">{{ $t("errorBoundary.goHome") }}</button>
          <button v-if="props.showDetail && error" class="error-btn error-btn-ghost" @click="toggleDetail">
            {{ detailVisible ? $t("errorBoundary.hideDetail") : $t("errorBoundary.showDetail") }}
          </button>
        </div>
        <pre v-if="detailVisible && error" class="error-stack">{{ error.stack || error.message }}</pre>
      </div>
    </div>
    <slot v-else />
  </div>
</template>

<style scoped>
.error-boundary-root {
  width: 100%;
  min-height: 100%;
}

.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 32px;
}

.error-boundary-inner {
  text-align: center;
  max-width: 480px;
  width: 100%;
}

.error-icon {
  color: var(--danger, #ef4444);
  margin-bottom: 16px;
  opacity: 0.8;
}

.error-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text, #1f2937);
  margin-bottom: 8px;
  line-height: 1.3;
}

.error-message {
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 24px;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.error-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: var(--radius-button, 8px);
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.4;
}

.error-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-btn-primary {
  background: var(--accent, #3b82f6);
  color: #fff;
  border-color: var(--accent, #3b82f6);
}

.error-btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.error-btn-secondary {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text, #1f2937);
  border-color: var(--border, #e5e7eb);
}

.error-btn-secondary:hover:not(:disabled) {
  background: var(--bg-hover, #e5e7eb);
}

.error-btn-ghost {
  background: transparent;
  color: var(--text-secondary, #6b7280);
}

.error-btn-ghost:hover {
  color: var(--text, #1f2937);
  background: var(--bg-secondary, #f3f4f6);
}

.error-btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: var(--radius-circle);
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-stack {
  margin-top: 20px;
  padding: 16px;
  background: var(--bg-secondary, #f3f4f6);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: var(--radius-md, 8px);
  font-size: 12px;
  font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
  color: var(--text-secondary, #6b7280);
  text-align: left;
  max-height: 240px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}
</style>
