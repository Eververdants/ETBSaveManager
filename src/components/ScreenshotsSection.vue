<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const screenshots = computed(() => [
  {
    id: 1,
    titleKey: 'screenshots.items.list.title',
    descKey: 'screenshots.items.list.desc',
    imgZh: '/存档列表-zh.png',
    imgEn: '/存档列表-en.png'
  },
  {
    id: 2,
    titleKey: 'screenshots.items.create.title',
    descKey: 'screenshots.items.create.desc',
    imgZh: '/创建存档页面第一步-zh.png',
    imgEn: '/创建存档页面第一步-en.png'
  },
  {
    id: 3,
    titleKey: 'screenshots.items.quick.title',
    descKey: 'screenshots.items.quick.desc',
    imgZh: '/快速创建存档页面-zh.png',
    imgEn: '/快速创建存档页面-en.png'
  },
  {
    id: 4,
    titleKey: 'screenshots.items.edit.title',
    descKey: 'screenshots.items.edit.desc',
    imgZh: '/编辑页面-zh.png',
    imgEn: '/编辑页面-en.png'
  }
])

const activeIndex = ref(0)

const currentImage = computed(() => {
  const shot = screenshots.value[activeIndex.value]
  if (!shot) return ''
  return locale.value === 'zh-CN' ? shot.imgZh : shot.imgEn
})

const getThumbImage = (shot: { imgZh: string; imgEn: string }) => {
  return locale.value === 'zh-CN' ? shot.imgZh : shot.imgEn
}
</script>

<template>
  <section id="screenshots" class="section">
    <div class="container">
      <div class="section-header">
        <div class="section-badge">
          <font-awesome-icon :icon="['fas', 'image']" />
          <span>{{ t('screenshots.badge') }}</span>
        </div>
        <h2 class="section-title">{{ t('screenshots.title') }}</h2>
        <p class="section-subtitle">{{ t('screenshots.subtitle') }}</p>
      </div>

      <div class="screenshots-wrapper">
        <!-- Main Preview -->
        <div class="screenshot-main glass-card">
          <img :src="currentImage" :alt="screenshots[activeIndex]?.titleKey ? t(screenshots[activeIndex]!.titleKey) : ''" class="screenshot-image" />
          <div class="screenshot-overlay">
            <a href="https://github.com/Eververdants/ETBSaveManager" target="_blank" class="btn btn-secondary">
              <font-awesome-icon :icon="['fas', 'external-link-alt']" />
              <span>{{ t('screenshots.viewMore') }}</span>
            </a>
          </div>
        </div>

        <!-- Thumbnails -->
        <div class="screenshot-thumbs">
          <button v-for="(shot, index) in screenshots" :key="shot.id" class="thumb-item"
            :class="{ active: activeIndex === index }" @click="activeIndex = index">
            <div class="thumb-preview">
              <img :src="getThumbImage(shot)" :alt="t(shot.titleKey)" />
            </div>
            <div class="thumb-info">
              <span class="thumb-title">{{ t(shot.titleKey) }}</span>
              <span class="thumb-desc">{{ t(shot.descKey) }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.screenshots-wrapper {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
  align-items: start;
}

.screenshot-main {
  position: relative;
  aspect-ratio: 16/10;
  overflow: hidden;
  padding: 0;
}

.screenshot-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.screenshot-main:hover .screenshot-image {
  transform: scale(1.02);
}

.screenshot-overlay {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.screenshot-main:hover .screenshot-overlay {
  opacity: 1;
}

.screenshot-thumbs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.thumb-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.thumb-item:hover {
  background: var(--bg-card-hover);
}

.thumb-item.active {
  border-color: var(--primary);
  background: rgba(124, 58, 237, 0.1);
}

.thumb-preview {
  width: 64px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-darker);
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
}

.thumb-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.thumb-title {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--text);
}

.thumb-desc {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .screenshots-wrapper {
    grid-template-columns: 1fr;
  }

  .screenshot-thumbs {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .thumb-item {
    flex-shrink: 0;
    min-width: 200px;
  }
}
</style>
