<template>
  <div class="bp-node" :class="[`bp-node--${variant}`, { selected }]">
    <div class="bp-node-header">
      <div class="bp-node-title">{{ title }}</div>
      <div v-if="subtitle" class="bp-node-subtitle">{{ subtitle }}</div>
    </div>
    <div class="bp-node-body">
      <slot />
    </div>
    <slot name="handles" />
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
  subtitle: {
    type: String,
    default: "",
  },
  variant: {
    type: String,
    default: "neutral",
  },
  selected: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.bp-node {
  --node-accent: var(--accent-color);
  position: relative;
  min-width: 180px;
  max-width: 260px;
  border-radius: 14px;
  padding: 12px;
  background: var(--bp-node-bg, #131a28);
  border: 1px solid var(--bp-node-border, rgba(120, 160, 255, 0.25));
  border-left: 4px solid var(--node-accent);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.35);
  color: var(--text-primary);
}

.bp-node.selected {
  border-color: color-mix(in srgb, var(--node-accent) 70%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--node-accent) 35%, transparent),
    0 12px 24px rgba(0, 0, 0, 0.18);
}

.bp-node--source {
  --node-accent: var(--accent-color);
}

.bp-node--transform {
  --node-accent: var(--warning-color);
}

.bp-node--logic {
  --node-accent: color-mix(in srgb, var(--accent-color) 55%, var(--success-color) 45%);
}

.bp-node--output {
  --node-accent: var(--success-color);
}

.bp-node-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: -6px -6px 10px;
  padding: 6px 8px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--node-accent) 40%, transparent);
  background: linear-gradient(90deg,
      color-mix(in srgb, var(--node-accent) 25%, transparent),
      rgba(0, 0, 0, 0));
}

.bp-node-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.bp-node-subtitle {
  font-size: 11px;
  color: var(--text-secondary);
}

.bp-node-body {
  font-size: 12px;
  color: var(--text-secondary);
}

:deep(.bp-handle) {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--bp-canvas, #0b0f15);
  background: var(--node-accent);
}

:deep(.bp-handle.vue-flow__handle-connecting) {
  transform: scale(1.15);
}

:deep(.bp-handle.vue-flow__handle-valid) {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--node-accent) 40%, transparent);
}
</style>
