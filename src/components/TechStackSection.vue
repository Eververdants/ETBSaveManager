<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const techStack = [
  { name: 'Vue 3', desc: 'Composition API', icon: 'vuejs', brand: true, color: '#42B883' },
  { name: 'Tauri 2.0', desc: 'Rust Backend', icon: 'rust', brand: true, color: '#DEA584' },
  { name: 'Vite 6', desc: 'Build Tool', icon: 'bolt', brand: false, color: '#646CFF' },
  { name: 'vue-i18n', desc: 'i18n', icon: 'language', brand: false, color: '#42B883' },
  { name: 'GSAP', desc: 'Animation', icon: 'film', brand: false, color: '#88CE02' },
  { name: 'CSS Variables', desc: 'Theming', icon: 'brush', brand: false, color: '#F43F5E' }
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

      <div class="tech-grid">
        <div 
          v-for="tech in techStack" 
          :key="tech.name" 
          class="tech-card glass-card"
        >
          <div class="tech-icon-wrapper" :style="{ '--tech-color': tech.color }">
            <font-awesome-icon 
              :icon="tech.brand ? ['fab', tech.icon] : ['fas', tech.icon]" 
              class="tech-icon" 
            />
          </div>
          <div class="tech-info">
            <h4 class="tech-name">{{ tech.name }}</h4>
            <p class="tech-desc">{{ tech.desc }}</p>
          </div>
        </div>
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

.tech-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 48px;
}

.tech-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  cursor: pointer;
}

.tech-icon-wrapper {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.tech-icon {
  font-size: 1.5rem;
  color: var(--tech-color, var(--primary));
}

.tech-name {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text);
}

.tech-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
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
  .tech-grid {
    grid-template-columns: repeat(2, 1fr);
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

@media (max-width: 640px) {
  .tech-grid {
    grid-template-columns: 1fr;
  }
}
</style>
