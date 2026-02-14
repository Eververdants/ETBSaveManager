<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type BasicInfoItem = {
  label: string
  value: string
}

const { t, tm } = useI18n()

const basicInfo = computed(() => tm('overview.basic.items') as BasicInfoItem[])
const frontendStack = computed(() => tm('overview.architecture.frontend') as string[])
const backendStack = computed(() => tm('overview.architecture.backend') as string[])
const supportItems = computed(() => tm('overview.support.items') as string[])
const qualityItems = computed(() => tm('overview.quality.items') as string[])
</script>

<template>
  <section id="overview" class="section overview-section">
    <div class="container">
      <div class="section-header">
        <div class="section-badge">
          <font-awesome-icon :icon="['fas', 'desktop']" />
          <span>{{ t('overview.badge') }}</span>
        </div>
        <h2 class="section-title">{{ t('overview.title') }}</h2>
        <p class="section-subtitle">{{ t('overview.subtitle') }}</p>
      </div>

      <div class="overview-grid">
        <article class="overview-card glass-card">
          <div class="card-header">
            <font-awesome-icon :icon="['fas', 'desktop']" class="card-icon" />
            <h3>{{ t('overview.basic.title') }}</h3>
          </div>
          <div class="basic-info-grid">
            <div v-for="item in basicInfo" :key="item.label" class="basic-info-item">
              <span class="info-label">{{ item.label }}</span>
              <span class="info-value">{{ item.value }}</span>
            </div>
          </div>
        </article>

        <article class="overview-card glass-card">
          <div class="card-header">
            <font-awesome-icon :icon="['fas', 'gamepad']" class="card-icon" />
            <h3>{{ t('overview.support.title') }}</h3>
          </div>
          <p class="support-desc">{{ t('overview.support.desc') }}</p>
          <ul class="compact-list">
            <li v-for="item in supportItems" :key="item">
              <font-awesome-icon :icon="['fas', 'check']" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </article>

        <article class="overview-card glass-card">
          <div class="card-header">
            <font-awesome-icon :icon="['fas', 'rocket']" class="card-icon" />
            <h3>{{ t('overview.quality.title') }}</h3>
          </div>
          <ul class="compact-list">
            <li v-for="item in qualityItems" :key="item">
              <font-awesome-icon :icon="['fas', 'check']" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </article>
      </div>

      <details class="advanced-panel glass-card">
        <summary>
          <font-awesome-icon :icon="['fas', 'code']" class="summary-icon" />
          <span>{{ t('overview.architecture.title') }}</span>
        </summary>
        <p class="advanced-tip">{{ t('overview.architecture.tip') }}</p>
        <div class="architecture-columns">
          <div class="architecture-block">
            <h4>{{ t('overview.architecture.frontendTitle') }}</h4>
            <ul class="compact-list">
              <li v-for="item in frontendStack" :key="item">
                <font-awesome-icon :icon="['fas', 'check']" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
          <div class="architecture-block">
            <h4>{{ t('overview.architecture.backendTitle') }}</h4>
            <ul class="compact-list">
              <li v-for="item in backendStack" :key="item">
                <font-awesome-icon :icon="['fas', 'check']" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  </section>
</template>

<style scoped>
.overview-section {
  background: linear-gradient(180deg, transparent 0%, rgba(6, 182, 212, 0.04) 45%, transparent 100%);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.overview-card {
  padding: 28px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.card-icon {
  color: var(--primary-light);
  font-size: 1.125rem;
}

.card-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
}

.basic-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.basic-info-item {
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.02);
}

.info-label {
  display: block;
  font-size: 0.8125rem;
  color: var(--text-dim);
  margin-bottom: 4px;
}

.info-value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9375rem;
  color: var(--text);
}

.architecture-columns {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.architecture-block h4 {
  font-size: 0.9375rem;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.support-desc {
  color: var(--text-muted);
  font-size: 0.9375rem;
  margin-bottom: 14px;
}

.compact-list {
  list-style: none;
}

.compact-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 7px 0;
  color: var(--text-muted);
  font-size: 0.90625rem;
  line-height: 1.55;
}

.compact-list li svg {
  margin-top: 5px;
  font-size: 0.75rem;
  color: #22C55E;
  flex-shrink: 0;
}

.advanced-panel {
  margin-top: 20px;
  padding: 18px 24px;
}

.advanced-panel summary {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9375rem;
  color: var(--text-muted);
}

.advanced-panel summary::-webkit-details-marker {
  display: none;
}

.summary-icon {
  color: var(--primary-light);
}

.advanced-tip {
  margin: 12px 0 16px;
  font-size: 0.875rem;
  color: var(--text-dim);
}

@media (max-width: 900px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }

  .architecture-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .basic-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
