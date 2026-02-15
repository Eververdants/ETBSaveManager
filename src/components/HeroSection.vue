<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { REPO_URL, SMART_DOWNLOAD_URL } from '@/constants/links'

const { t, tm } = useI18n()
const heroRef = ref<HTMLElement | null>(null)
const scrollY = ref(0)
const reduceMotion = ref(false)
let rafId = 0

const heroProofs = computed(() => tm('hero.proofs') as string[])

const parallaxStyles = computed(() => {
  if (reduceMotion.value) {
    return {
      glow1: { transform: 'translate3d(-50%, 0, 0)' },
      glow2: { transform: 'translate3d(0, 0, 0)' },
      grid: { transform: 'translate3d(0, 0, 0)' },
      content: { transform: 'translate3d(0, 0, 0)' }
    }
  }

  const y = Math.max(0, Math.min(scrollY.value, 1000))

  return {
    glow1: { transform: `translate3d(-50%, ${y * -0.18}px, 0)` },
    glow2: { transform: `translate3d(${y * 0.1}px, ${y * -0.12}px, 0)` },
    grid: { transform: `translate3d(0, ${y * -0.08}px, 0)` },
    content: { transform: `translate3d(0, ${y * -0.14}px, 0)` }
  }
})

const updateParallax = () => {
  if (rafId) return
  rafId = window.requestAnimationFrame(() => {
    scrollY.value = window.scrollY
    rafId = 0
  })
}

onMounted(() => {
  reduceMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.addEventListener('scroll', updateParallax, { passive: true })
  updateParallax()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateParallax)
  if (rafId) window.cancelAnimationFrame(rafId)
})
</script>

<template>
  <section ref="heroRef" class="hero">
    <!-- Background Effects -->
    <div class="hero-bg">
      <div class="hero-glow hero-glow-1" :style="parallaxStyles.glow1"></div>
      <div class="hero-glow hero-glow-2" :style="parallaxStyles.glow2"></div>
      <div class="hero-grid" :style="parallaxStyles.grid"></div>
    </div>
    
    <div class="container hero-content" :style="parallaxStyles.content">
      <!-- Badge -->
      <a 
        :href="SMART_DOWNLOAD_URL"
        target="_blank"
        class="hero-badge"
      >
        <span class="badge-dot"></span>
        <span>{{ t('hero.badge') }}</span>
        <font-awesome-icon :icon="['fas', 'arrow-right']" class="badge-arrow" />
      </a>

      <!-- Title -->
      <h1 class="hero-title">
        <span class="title-line">{{ t('hero.title1') }}</span>
        <span class="title-line title-gradient">{{ t('hero.title2') }}</span>
      </h1>

      <!-- Subtitle -->
      <p class="hero-subtitle">
        {{ t('hero.subtitle') }}<br class="hide-mobile">
        {{ t('hero.subtitleDesc') }}
      </p>

      <!-- CTA Buttons -->
      <div class="hero-actions">
        <a 
          :href="SMART_DOWNLOAD_URL"
          target="_blank"
          class="btn btn-primary btn-lg btn-download-hero"
        >
          <font-awesome-icon :icon="['fas', 'download']" />
          <span>{{ t('hero.downloadBtn') }}</span>
        </a>
        <a 
          :href="REPO_URL"
          target="_blank"
          class="btn btn-secondary btn-lg"
        >
          <font-awesome-icon :icon="['fab', 'github']" />
          <span>{{ t('hero.sourceBtn') }}</span>
        </a>
      </div>

      <p class="hero-download-note">{{ t('hero.downloadNote') }}</p>

      <div class="hero-proofs">
        <span v-for="proof in heroProofs" :key="proof" class="hero-proof-chip">
          {{ proof }}
        </span>
      </div>

      <!-- Stats -->
      <div class="hero-stats">
        <div class="stat-item">
          <font-awesome-icon :icon="['fab', 'windows']" class="stat-icon" />
          <div class="stat-content">
            <span class="stat-value">Windows</span>
            <span class="stat-label">{{ t('hero.stats.platform') }}</span>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <font-awesome-icon :icon="['fas', 'bolt']" class="stat-icon" />
          <div class="stat-content">
            <span class="stat-value">Tauri 2.0</span>
            <span class="stat-label">{{ t('hero.stats.framework') }}</span>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <font-awesome-icon :icon="['fas', 'globe']" class="stat-icon" />
          <div class="stat-content">
            <span class="stat-value">{{ t('hero.stats.languagesValue') }}</span>
            <span class="stat-label">{{ t('hero.stats.languages') }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding: calc(var(--nav-height) + 60px) 0 80px;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.4;
  will-change: transform;
}

.hero-glow-1 {
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 600px;
  background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
}

.hero-glow-2 {
  bottom: -10%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, var(--secondary) 0%, transparent 70%);
  opacity: 0.2;
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  will-change: transform;
}

.hero-content {
  text-align: center;
  position: relative;
  will-change: transform;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: var(--bg-glass);
  border: 1px solid var(--border);
  border-radius: 100px;
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 32px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hero-badge:hover {
  border-color: var(--border-hover);
  color: var(--text);
  background: var(--bg-card-hover);
}

.badge-dot {
  width: 8px;
  height: 8px;
  background: #22C55E;
  border-radius: 50%;
  animation: pulse-glow 2s ease-in-out infinite;
}

.badge-arrow {
  font-size: 0.75rem;
  transition: transform 0.3s ease;
}

.hero-badge:hover .badge-arrow {
  transform: translateX(4px);
}

.hero-title {
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 24px;
}

.title-line {
  display: block;
}

.title-gradient {
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--secondary) 50%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-muted);
  max-width: 560px;
  margin: 0 auto 40px;
  line-height: 1.7;
}

.hide-mobile {
  display: inline;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.btn-lg {
  padding: 16px 32px;
  font-size: 1rem;
}

.btn-download-hero {
  position: relative;
  overflow: hidden;
  animation: cta-pulse 2.4s ease-in-out infinite;
}

.btn-download-hero::before {
  content: '';
  position: absolute;
  top: -120%;
  left: -40%;
  width: 40%;
  height: 300%;
  background: linear-gradient(120deg, transparent 20%, rgba(255, 255, 255, 0.35) 45%, transparent 70%);
  transform: rotate(18deg);
  animation: cta-shine 2.8s linear infinite;
}

.hero-download-note {
  font-size: 0.9375rem;
  color: var(--text-dim);
  margin-bottom: 18px;
}

.hero-proofs {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 52px;
}

.hero-proof-chip {
  padding: 7px 12px;
  border-radius: 100px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.03);
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.hero-stats {
  display: inline-flex;
  align-items: center;
  gap: 32px;
  padding: 24px 40px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(20px);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-icon {
  font-size: 1.5rem;
  color: var(--primary-light);
}

.stat-content {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.stat-value {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  color: var(--text);
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--text-dim);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--border);
}

@media (max-width: 768px) {
  .hero {
    padding: calc(var(--nav-height) + 40px) 0 60px;
  }

  .hero-subtitle {
    font-size: 1.0625rem;
  }

  .hero-download-note {
    font-size: 0.875rem;
  }

  .hide-mobile {
    display: none;
  }

  .hero-stats {
    flex-direction: column;
    gap: 20px;
    padding: 24px 32px;
  }

  .hero-content {
    transform: none !important;
  }

  .stat-divider {
    width: 100%;
    height: 1px;
  }

  .stat-item {
    width: 100%;
    justify-content: center;
  }
}

@keyframes cta-shine {
  0% {
    left: -45%;
  }
  100% {
    left: 140%;
  }
}

@keyframes cta-pulse {
  0%, 100% {
    box-shadow: 0 0 28px rgba(124, 58, 237, 0.35);
  }
  50% {
    box-shadow: 0 0 45px rgba(124, 58, 237, 0.55);
  }
}
</style>
