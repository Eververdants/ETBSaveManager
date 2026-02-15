<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RELEASES_URL } from '@/constants/links'

const VERSION = '3.0.0'
const BASE_DOWNLOAD_URL = `${RELEASES_URL}/download/v${VERSION}`
const HOME_URL = import.meta.env.BASE_URL
const ARCH_OPTIONS = ['arm64', 'x64', 'x86'] as const

type Arch = (typeof ARCH_OPTIONS)[number]

const { t, locale } = useI18n()
const isWindows = ref(false)
const arch = ref<Arch>('x64')
const disableAuto = ref(false)
const countdown = ref(2)
let timer: number | undefined

const detectArch = (ua: string): Arch => {
  const value = ua.toLowerCase()
  if (value.includes('arm64') || value.includes('aarch64')) return 'arm64'
  if (
    value.includes('wow64') ||
    value.includes('win64') ||
    value.includes('x64') ||
    value.includes('amd64') ||
    value.includes('x86_64')
  ) {
    return 'x64'
  }
  return 'x86'
}

const setupFileName = computed(() => `ETB.Save.Manager_${VERSION}_${arch.value}-setup.exe`)
const recommendedUrl = computed(() => (isWindows.value ? `${BASE_DOWNLOAD_URL}/${setupFileName.value}` : RELEASES_URL))
const platformText = computed(() =>
  isWindows.value ? t('downloadPage.meta.platformWindows') : t('downloadPage.meta.platformOther')
)
const targetFileText = computed(() => (isWindows.value ? setupFileName.value : t('downloadPage.meta.releasesPage')))

const statusText = computed(() => {
  if (!isWindows.value) return t('downloadPage.status.nonWindows')
  if (disableAuto.value) return t('downloadPage.status.autoDisabled')
  return t('downloadPage.status.autoCountdown', { seconds: countdown.value, arch: arch.value })
})

const manualLinks = computed(() => [
  {
    arch: 'arm64',
    label: 'ARM64',
    note: t('downloadPage.manual.arm64Note'),
    url: `${BASE_DOWNLOAD_URL}/ETB.Save.Manager_${VERSION}_arm64-setup.exe`
  },
  {
    arch: 'x64',
    label: 'x64',
    note: t('downloadPage.manual.x64Note'),
    url: `${BASE_DOWNLOAD_URL}/ETB.Save.Manager_${VERSION}_x64-setup.exe`
  },
  {
    arch: 'x86',
    label: 'x86',
    note: t('downloadPage.manual.x86Note'),
    url: `${BASE_DOWNLOAD_URL}/ETB.Save.Manager_${VERSION}_x86-setup.exe`
  }
])

const toggleLocale = () => {
  const newLocale = locale.value === 'zh-CN' ? 'en' : 'zh-CN'
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
}

watch(
  () => locale.value,
  () => {
    document.title = t('downloadPage.meta.pageTitle')
  },
  { immediate: true }
)

onMounted(() => {
  const ua = navigator.userAgent || ''
  isWindows.value = /windows/i.test(ua)

  const params = new URLSearchParams(window.location.search)
  const forcedArch = params.get('arch')
  disableAuto.value = params.get('auto') === '0'
  arch.value = ARCH_OPTIONS.includes(forcedArch as Arch) ? (forcedArch as Arch) : detectArch(ua)

  if (!isWindows.value || disableAuto.value) return

  timer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      if (timer) window.clearInterval(timer)
      window.location.replace(recommendedUrl.value)
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <div class="download-page">
    <div class="bg-layer bg-layer-primary"></div>
    <div class="bg-layer bg-layer-secondary"></div>

    <main class="section">
      <div class="container">
        <div class="top-bar">
          <a :href="HOME_URL" class="back-link">{{ t('downloadPage.backHome') }}</a>
          <button class="lang-toggle" @click="toggleLocale">
            {{ locale === 'zh-CN' ? 'EN' : '中文' }}
          </button>
        </div>

        <div class="download-card glass-card">
          <p class="eyebrow">ETB Save Manager · v{{ VERSION }}</p>
          <h1>{{ t('downloadPage.title') }}</h1>
          <p class="subtitle">{{ t('downloadPage.subtitle') }}</p>

          <div class="meta-list">
            <div class="meta-item">
              <span class="meta-key">{{ t('downloadPage.meta.platform') }}</span>
              <span class="meta-value">{{ platformText }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-key">{{ t('downloadPage.meta.architecture') }}</span>
              <span class="meta-value">{{ arch }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-key">{{ t('downloadPage.meta.targetFile') }}</span>
              <span class="meta-value">{{ targetFileText }}</span>
            </div>
          </div>

          <div class="actions">
            <a :href="recommendedUrl" class="btn btn-primary">{{ t('downloadPage.actions.downloadRecommended') }}</a>
            <a :href="RELEASES_URL" target="_blank" rel="noreferrer" class="btn btn-secondary">{{
              t('downloadPage.actions.allReleases')
            }}</a>
          </div>

          <p class="status">{{ statusText }}</p>

          <div class="manual-panel">
            <p class="manual-title">{{ t('downloadPage.manual.title') }}</p>
            <div class="manual-grid">
              <a
                v-for="item in manualLinks"
                :key="item.arch"
                :href="item.url"
                target="_blank"
                rel="noreferrer"
                class="manual-item"
              >
                <strong>{{ item.label }}</strong>
                <span>{{ item.note }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.download-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.bg-layer {
  position: absolute;
  border-radius: 50%;
  filter: blur(110px);
  pointer-events: none;
}

.bg-layer-primary {
  width: 720px;
  height: 520px;
  top: -140px;
  left: 50%;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(124, 58, 237, 0.28) 0%, transparent 70%);
}

.bg-layer-secondary {
  width: 460px;
  height: 460px;
  right: -140px;
  bottom: -120px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%);
}

.section {
  padding: 90px 0;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  color: var(--text-muted);
  font-size: 0.9375rem;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--text);
}

.lang-toggle {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  color: var(--text-muted);
  font-size: 0.875rem;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.2s ease;
}

.lang-toggle:hover {
  color: var(--text);
  border-color: var(--border-hover);
  background: var(--bg-card);
}

.download-card {
  max-width: 920px;
  margin: 0 auto;
  padding: 36px;
}

.eyebrow {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 100px;
  border: 1px solid var(--border);
  color: var(--primary-light);
  font-size: 0.8125rem;
  margin-bottom: 16px;
}

h1 {
  font-size: clamp(2rem, 6vw, 3.2rem);
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 12px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 1.0625rem;
  margin-bottom: 26px;
}

.meta-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 24px;
}

.meta-item {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: rgba(10, 10, 26, 0.45);
  padding: 12px;
}

.meta-key {
  display: block;
  color: var(--text-dim);
  font-size: 0.75rem;
  margin-bottom: 6px;
}

.meta-value {
  display: block;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.875rem;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.status {
  color: var(--text-muted);
  font-size: 0.9375rem;
  margin-bottom: 20px;
}

.manual-panel {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px;
  background: rgba(10, 10, 26, 0.42);
}

.manual-title {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: 12px;
}

.manual-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.manual-item {
  display: block;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.2s ease;
}

.manual-item:hover {
  border-color: var(--border-hover);
  background: var(--bg-card);
  transform: translateY(-1px);
}

.manual-item strong {
  display: block;
  font-size: 0.9375rem;
  font-family: 'Space Grotesk', sans-serif;
}

.manual-item span {
  display: block;
  color: var(--text-dim);
  font-size: 0.8125rem;
  margin-top: 4px;
}

@media (max-width: 860px) {
  .meta-list,
  .manual-grid {
    grid-template-columns: 1fr;
  }

  .download-card {
    padding: 24px;
  }

  .btn {
    width: 100%;
  }
}
</style>
