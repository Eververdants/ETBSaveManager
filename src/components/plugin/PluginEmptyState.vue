<template>
  <div class="empty-state">
    <div class="empty-icon">
      <font-awesome-icon :icon="['fas', icon]" />
    </div>
    <p class="empty-title">{{ title }}</p>
    <p v-if="hint" class="empty-hint">{{ hint }}</p>
    <slot></slot>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: 'puzzle-piece'
  },
  title: {
    type: String,
    required: true
  },
  hint: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 32px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-xl);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-icon svg {
  font-size: 36px;
  color: var(--text-tertiary);
  opacity: 0.6;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.empty-hint {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 8px 0 0;
}
</style>
