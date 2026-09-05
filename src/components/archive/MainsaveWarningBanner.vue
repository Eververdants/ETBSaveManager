<template>
  <div v-if="!dismissed" class="mainsave-warning" role="alert">
    <font-awesome-icon icon="fa-solid fa-triangle-exclamation" class="warning-icon" />
    <div class="warning-content">
      <div class="warning-title">{{ $t("archive.mainsaveWarning.title") }}</div>
      <div class="warning-description">{{ $t("archive.mainsaveWarning.description") }}</div>
      <div v-if="error" class="warning-error">
        <span class="error-label">{{ $t("archive.mainsaveWarning.errorLabel") }}</span>
        <code class="error-text">{{ error }}</code>
      </div>
    </div>
    <button class="dismiss-btn" :title="$t('archive.mainsaveWarning.dismiss')" @click="dismissed = true">
      <font-awesome-icon icon="fa-solid fa-xmark" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  /** Backend parse/read failure detail; empty when unknown. */
  error: string | null;
}>();

const dismissed = ref(false);

// A changed error means the state moved (e.g. the game rewrote MAINSAVE
// mid-session) — the user should see the new detail even after dismissing.
watch(
  () => props.error,
  () => {
    dismissed.value = false;
  },
);
</script>

<style scoped>
.mainsave-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 0 0 14px;
  padding: 12px 16px;
  border: 1px solid color-mix(in srgb, var(--warning-color) 45%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--warning-color) 12%, transparent);
}

.warning-icon {
  margin-top: 3px;
  font-size: 16px;
  color: var(--warning-color);
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
  min-width: 0;
}

.warning-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.warning-description {
  margin-top: 4px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.warning-error {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
}

.error-label {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.error-text {
  font-family: var(--font-mono, monospace);
  font-size: 11.5px;
  word-break: break-all;
  color: var(--text-primary);
  opacity: 0.85;
  user-select: text;
}

.dismiss-btn {
  flex-shrink: 0;
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.dismiss-btn:hover {
  background: color-mix(in srgb, var(--warning-color) 18%, transparent);
  color: var(--text-primary);
}
</style>
