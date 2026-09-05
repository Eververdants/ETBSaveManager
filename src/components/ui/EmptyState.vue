<template>
  <div class="empty-card" :class="{ 'empty-card--welcome': variant === 'welcome' }">
    <div class="empty-card__bg" aria-hidden="true"></div>
    <div class="empty-card__deco" aria-hidden="true">
      <div class="empty-card__deco-ring"></div>
      <div v-if="variant === 'welcome'" class="empty-card__deco-ring empty-card__deco-ring--outer"></div>
      <div class="empty-card__deco-dot empty-card__deco-dot--1"></div>
      <div class="empty-card__deco-dot empty-card__deco-dot--2"></div>
      <div v-if="variant === 'welcome'" class="empty-card__deco-dot empty-card__deco-dot--3"></div>
    </div>
    <div class="empty-card__icon-wrap">
      <div class="empty-card__icon-bg"></div>
      <font-awesome-icon :icon="icon" class="empty-card__icon" />
    </div>
    <h3 class="empty-card__title">{{ title }}</h3>
    <p v-if="description" class="empty-card__desc">{{ description }}</p>
    <p v-if="hint" class="empty-card__hint">{{ hint }}</p>
    <button v-if="actionText" class="empty-card__action" @click="$emit('action')">
      <font-awesome-icon v-if="actionIcon" :icon="actionIcon" class="empty-card__action-icon" />
      <span>{{ actionText }}</span>
    </button>
    <slot name="action" />
  </div>
</template>

<script setup>
defineProps({
  icon: { type: Array, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  hint: { type: String, default: "" },
  // "welcome" adds the extra orbit ring / dot for the first-run empty state
  variant: { type: String, default: "default" },
  actionIcon: { type: Array, default: null },
  actionText: { type: String, default: "" },
});

defineEmits(["action"]);
</script>

<style scoped>
.empty-card {
  position: relative;
  text-align: center;
  max-width: 420px;
  width: 100%;
  padding: 56px 48px 48px;
  background: var(--card-bg);
  border-radius: var(--radius-xl);
  overflow: hidden;
  isolation: isolate;
  transition:
    transform 0.35s var(--ease-spring, cubic-bezier(0.25, 0.46, 0.45, 0.94)),
    box-shadow 0.35s var(--ease-default, ease);
}

.empty-card:hover {
  transform: translateY(-4px);
}

/* Background sheen layer */
.empty-card__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 80% 50% at 50% -10%,
    color-mix(in srgb, var(--primary) 10%, transparent) 0%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
}

/* Decorative orbiting dots */
.empty-card__deco {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.empty-card__deco-ring {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 120px;
  border-radius: var(--radius-circle);
  border: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
  animation: empty-ring-float 4s ease-in-out infinite;
}

.empty-card--welcome .empty-card__deco-ring--outer {
  width: 170px;
  height: 170px;
  top: -9px;
  border-color: color-mix(in srgb, var(--primary) 8%, transparent);
  animation-delay: -1s;
  animation-duration: 5s;
}

.empty-card__deco-dot {
  position: absolute;
  border-radius: var(--radius-circle);
  background: color-mix(in srgb, var(--primary) 25%, transparent);
  animation: empty-dot-drift 6s ease-in-out infinite;
}

.empty-card__deco-dot--1 {
  width: 6px;
  height: 6px;
  top: 48px;
  left: calc(50% + 68px);
}

.empty-card__deco-dot--2 {
  width: 4px;
  height: 4px;
  top: 84px;
  left: calc(50% - 80px);
  animation-delay: -2s;
}

.empty-card--welcome .empty-card__deco-dot--3 {
  width: 5px;
  height: 5px;
  top: 128px;
  left: calc(50% + 52px);
  animation-delay: -3.5s;
}

/* Icon area */
.empty-card__icon-wrap {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin-bottom: 28px;
}

.empty-card__icon-bg {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-circle);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--primary) 18%, transparent) 0%,
    color-mix(in srgb, var(--primary) 6%, transparent) 100%
  );
  border: 1px solid color-mix(in srgb, var(--primary) 12%, transparent);
  transition:
    transform 0.35s var(--ease-spring, ease),
    box-shadow 0.35s ease;
}

.empty-card:hover .empty-card__icon-bg {
  transform: scale(1.08);
  box-shadow: 0 0 40px color-mix(in srgb, var(--primary) 15%, transparent);
}

.empty-card__icon {
  position: relative;
  z-index: 1;
  font-size: 1.75rem;
  color: var(--primary);
  transition: transform 0.35s var(--ease-spring, ease);
}

.empty-card:hover .empty-card__icon {
  transform: scale(1.1) rotate(-4deg);
}

/* Typography */
.empty-card__title {
  position: relative;
  z-index: 1;
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 10px;
  letter-spacing: -0.01em;
}

.empty-card__desc {
  position: relative;
  z-index: 1;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 0 6px;
}

.empty-card__hint {
  position: relative;
  z-index: 1;
  font-size: 0.85rem;
  color: var(--text-tertiary);
  margin: 0 0 28px;
}

/* Action button */
.empty-card__action {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, #000 30%) 100%);
  color: var(--text-inverse, #fff);
  border: none;
  padding: 13px 32px;
  border-radius: var(--radius-button);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.25s var(--ease-spring, ease),
    box-shadow 0.25s ease;
  box-shadow:
    0 4px 14px color-mix(in srgb, var(--primary) 25%, transparent),
    0 1px 3px color-mix(in srgb, var(--primary) 15%, transparent);
}

.empty-card__action:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 8px 24px color-mix(in srgb, var(--primary) 30%, transparent),
    0 2px 6px color-mix(in srgb, var(--primary) 20%, transparent);
}

.empty-card__action:active {
  transform: scale(0.97);
}

.empty-card__action-icon {
  font-size: 0.8rem;
  opacity: 0.9;
}

@keyframes empty-ring-float {
  0%,
  100% {
    transform: translateX(-50%) scale(1);
    opacity: 1;
  }

  50% {
    transform: translateX(-50%) scale(1.06);
    opacity: 0.6;
  }
}

@keyframes empty-dot-drift {
  0%,
  100% {
    transform: translate(0, 0);
    opacity: 0.6;
  }

  25% {
    transform: translate(4px, -6px);
    opacity: 1;
  }

  50% {
    transform: translate(-2px, 4px);
    opacity: 0.5;
  }

  75% {
    transform: translate(6px, 2px);
    opacity: 0.8;
  }
}

/* Kill perpetual decorative motion for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  .empty-card__deco-ring,
  .empty-card__deco-dot {
    animation: none;
  }
}
</style>
