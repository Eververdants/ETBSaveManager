<template>
  <Teleport to="body">
    <Transition name="base-modal">
      <div v-if="visible" class="base-modal-overlay" :class="overlayClass" @click.self="handleSelfClick">
        <div class="base-modal-card" :class="cardClass" :style="{ maxWidth }">
          <div v-if="title || showClose" class="base-modal-header">
            <h3 class="base-modal-title">
              <slot name="title">{{ title }}</slot>
            </h3>
            <button v-if="showClose" type="button" class="base-modal-close" @click="close">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>
          <div class="base-modal-body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: "" },
  showClose: { type: Boolean, default: false },
  // Whether clicking the backdrop dismisses the modal (progress dialogs: false)
  dismissable: { type: Boolean, default: true },
  maxWidth: { type: String, default: "500px" },
  // Extra classes so host pages can restyle overlay/card via :global() rules
  overlayClass: { type: String, default: "" },
  cardClass: { type: String, default: "" },
});

const emit = defineEmits(["update:visible", "close"]);

const close = () => {
  emit("update:visible", false);
  emit("close");
};

const handleSelfClick = () => {
  if (props.dismissable) close();
};
</script>

<style scoped>
.base-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.base-modal-card {
  background: var(--card-bg);
  border-radius: var(--radius-modal, var(--radius-2xl, 16px));
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.base-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.base-modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.base-modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 6px 8px;
  border-radius: var(--radius-pill, 50%);
  font-size: 14px;
}

.base-modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.base-modal-body {
  min-width: 0;
}

/* Transition */
.base-modal-enter-active,
.base-modal-leave-active {
  transition: opacity 0.25s ease;
}

.base-modal-enter-active .base-modal-card,
.base-modal-leave-active .base-modal-card {
  transition: transform 0.25s ease;
}

.base-modal-enter-from,
.base-modal-leave-to {
  opacity: 0;
}

.base-modal-enter-from .base-modal-card {
  transform: scale(0.96) translateY(-8px);
}

.base-modal-leave-to .base-modal-card {
  transform: scale(0.98);
}
</style>
