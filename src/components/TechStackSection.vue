<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const frontendStack = [
  'Vue 3',
  'Vite',
  'vue-i18n',
  'Tailwind CSS + CSS Variables'
]

const backendStack = [
  'Tauri 2.0',
  'uesave',
  'tokio',
  'rusqlite (SQLite)'
]
</script>

<template>
  <section id="tech" class="section tech-section">
    <div class="container">
      <div class="section-header">
        <div class="section-badge">
          <font-awesome-icon :icon="['fas', 'code']" />
          <span>{{ t('tech.badge') }}</span>
        </div>
        <h2 class="section-title">{{ t('tech.title') }}</h2>
        <p class="section-subtitle">{{ t('tech.subtitle') }}</p>
      </div>

      <div class="stack-grid">
        <article class="stack-card glass-card">
          <div class="stack-header">
            <div class="stack-icon">
              <font-awesome-icon :icon="['fab', 'vuejs']" />
            </div>
            <h3>{{ t('tech.frontendTitle') }}</h3>
          </div>
          <div class="stack-tags">
            <span v-for="item in frontendStack" :key="item" class="stack-tag">
              {{ item }}
            </span>
          </div>
        </article>

        <article class="stack-card glass-card">
          <div class="stack-header">
            <div class="stack-icon">
              <font-awesome-icon :icon="['fab', 'rust']" />
            </div>
            <h3>{{ t('tech.backendTitle') }}</h3>
          </div>
          <div class="stack-tags">
            <span v-for="item in backendStack" :key="item" class="stack-tag">
              {{ item }}
            </span>
          </div>
        </article>
      </div>

      <!-- Open Source Banner -->
      <div class="opensource-banner glass-card">
        <div class="banner-content">
          <div class="banner-icon">
            <font-awesome-icon :icon="['fab', 'github']" />
          </div>
          <div class="banner-text">
            <h3>{{ t('tech.opensource.title') }}</h3>
            <p>{{ t('tech.opensource.desc') }}</p>
          </div>
        </div>
        <a 
          href="https://github.com/Eververdants/ETBSaveManager" 
          target="_blank"
          class="btn btn-secondary"
        >
          <font-awesome-icon :icon="['fas', 'star']" />
          <span>{{ t('tech.opensource.btn') }}</span>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tech-section {
  background: linear-gradient(180deg, transparent 0%, rgba(124, 58, 237, 0.03) 50%, transparent 100%);
}

.stack-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 48px;
}

.stack-card {
  padding: 24px;
}

.stack-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.stack-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  color: var(--primary-light);
  font-size: 1.5rem;
}

.stack-header h3 {
  font-size: 1.0625rem;
  font-weight: 600;
}

.stack-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.stack-tag {
  padding: 6px 12px;
  border-radius: 100px;
  font-size: 0.8125rem;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
}

.opensource-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 40px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.banner-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  font-size: 1.5rem;
  color: var(--text);
}

.banner-text h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.banner-text p {
  font-size: 0.9375rem;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .stack-grid {
    grid-template-columns: 1fr;
  }

  .opensource-banner {
    flex-direction: column;
    gap: 24px;
    text-align: center;
    padding: 32px;
  }

  .banner-content {
    flex-direction: column;
  }
}
</style>
