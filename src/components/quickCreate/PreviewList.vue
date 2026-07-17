<template>
  <div v-if="archiveNames.length > 0" class="preview-list">
    <div class="preview-header">
      <span>{{ $t("quickCreate.preview.title", { count: archiveNames.length }) }}</span>
    </div>
    <div class="preview-names">
      <span v-for="(name, idx) in archiveNames" :key="idx" class="preview-name">{{ name }}</span>
    </div>
  </div>
  <div v-else class="preview-empty">
    {{ $t("quickCreate.preview.empty") }}
  </div>
</template>

<script setup>
defineProps({
  archiveNames: { type: Array, default: () => [] },
});
</script>

<style scoped>
.preview-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.preview-header {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
  flex-shrink: 0;
}

.preview-names {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--divider-light);
  padding: 10px 12px;
  overflow-y: auto;
  align-content: start;
  flex: 1;
}

.preview-name {
  font-size: 11px;
  font-family: monospace;
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  color: var(--text-secondary);
  white-space: nowrap;
}

.preview-empty {
  flex: 1;
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px dashed var(--divider-light);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
