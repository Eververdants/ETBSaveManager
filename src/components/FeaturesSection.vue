<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const features = computed(() => [
  {
    icon: 'folder-open',
    titleKey: 'features.items.saveManagement.title',
    descKey: 'features.items.saveManagement.desc',
    highlight: true
  },
  {
    icon: 'palette',
    titleKey: 'features.items.theme.title',
    descKey: 'features.items.theme.desc'
  },
  {
    icon: 'globe',
    titleKey: 'features.items.i18n.title',
    descKey: 'features.items.i18n.desc'
  },
  {
    icon: 'bolt',
    titleKey: 'features.items.quickCreate.title',
    descKey: 'features.items.quickCreate.desc'
  },
  {
    icon: 'box',
    titleKey: 'features.items.inventory.title',
    descKey: 'features.items.inventory.desc'
  },
  {
    icon: 'plug',
    titleKey: 'features.items.plugins.title',
    descKey: 'features.items.plugins.desc'
  },
  {
    icon: 'comment',
    titleKey: 'features.items.feedback.title',
    descKey: 'features.items.feedback.desc'
  }
])
</script>

<template>
  <section id="features" class="section">
    <div class="container">
      <div class="section-header">
        <div class="section-badge">
          <font-awesome-icon :icon="['fas', 'star']" />
          <span>{{ t('features.badge') }}</span>
        </div>
        <h2 class="section-title">{{ t('features.title') }}</h2>
        <p class="section-subtitle">{{ t('features.subtitle') }}</p>
      </div>

      <div class="features-grid">
        <div 
          v-for="(feature, index) in features" 
          :key="feature.titleKey" 
          class="feature-card glass-card"
          :class="{ 'feature-highlight': feature.highlight }"
        >
          <div class="feature-icon-wrapper">
            <font-awesome-icon :icon="['fas', feature.icon]" class="feature-icon" />
          </div>
          <h3 class="feature-title">{{ t(feature.titleKey) }}</h3>
          <p class="feature-desc">{{ t(feature.descKey) }}</p>
          <div class="feature-number">{{ String(index + 1).padStart(2, '0') }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.feature-card {
  position: relative;
  padding: 28px;
  cursor: pointer;
  overflow: hidden;
}

.feature-highlight {
  grid-column: span 2;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%);
}

.feature-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.feature-icon {
  font-size: 1.25rem;
  color: white;
}

.feature-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--text);
}

.feature-desc {
  font-size: 0.9375rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.feature-number {
  position: absolute;
  top: 20px;
  right: 20px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-dim);
  opacity: 0.5;
}

@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .feature-highlight {
    grid-column: span 2;
  }
}

@media (max-width: 640px) {
  .features-grid {
    grid-template-columns: 1fr;
  }

  .feature-highlight {
    grid-column: span 1;
  }
}
</style>
