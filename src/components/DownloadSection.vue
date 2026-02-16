<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { REPO_URL, SMART_DOWNLOAD_URL } from '@/constants/links'

const { t, tm } = useI18n()
const hotPoints = computed(() => tm('download.hot.points') as string[])
</script>

<template>
  <section id="download" class="section">
    <div class="container">
      <div class="hot-banner glass-card">
        <div class="hot-content">
          <span class="hot-badge">{{ t('download.hot.badge') }}</span>
          <h3>{{ t('download.hot.title') }}</h3>
          <p>{{ t('download.hot.subtitle') }}</p>
          <div class="hot-points">
            <span v-for="point in hotPoints" :key="point" class="hot-point">{{ point }}</span>
          </div>
        </div>
        <a
          :href="SMART_DOWNLOAD_URL"
          target="_blank"
          class="btn btn-primary hot-btn"
        >
          <font-awesome-icon :icon="['fas', 'download']" />
          <span>{{ t('download.hot.cta') }}</span>
        </a>
      </div>

      <div class="section-header">
        <div class="section-badge">
          <font-awesome-icon :icon="['fas', 'download']" />
          <span>{{ t('download.badge') }}</span>
        </div>
        <h2 class="section-title">{{ t('download.title') }}</h2>
        <p class="section-subtitle">{{ t('download.subtitle') }}</p>
      </div>

      <div class="download-grid">
        <!-- Main Download Card -->
        <div class="download-card glass-card">
          <div class="download-header">
            <div class="platform-badge">
              <font-awesome-icon :icon="['fab', 'windows']" />
              <span>Windows</span>
            </div>
            <div class="version-info">
              <span class="version-tag">{{ t('download.version') }}</span>
              <span class="version-number">v3.0.1</span>
            </div>
          </div>

          <div class="download-body">
            <a 
              :href="SMART_DOWNLOAD_URL"
              target="_blank"
              class="btn btn-primary btn-download"
            >
              <font-awesome-icon :icon="['fas', 'download']" />
              <span>{{ t('download.downloadBtn') }}</span>
            </a>

            <div class="download-formats">
              <span class="format-tag">.msi</span>
              <span class="format-tag">.exe</span>
            </div>
          </div>

          <div class="download-footer">
            <div class="requirements">
              <h4>{{ t('download.requirements.title') }}</h4>
              <ul>
                <li>
                  <font-awesome-icon :icon="['fas', 'check']" class="req-icon" />
                  <span>{{ t('download.requirements.item1') }}</span>
                </li>
                <li>
                  <font-awesome-icon :icon="['fas', 'check']" class="req-icon" />
                  <span>{{ t('download.requirements.item2') }}</span>
                </li>
                <li>
                  <font-awesome-icon :icon="['fas', 'check']" class="req-icon" />
                  <span>{{ t('download.requirements.item3') }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Build from Source Card -->
        <div class="source-card glass-card">
          <div class="source-header">
            <font-awesome-icon :icon="['fas', 'code']" class="source-icon" />
            <h3>{{ t('download.source.title') }}</h3>
          </div>

          <div class="code-block">
            <pre><code><span class="code-comment"># Clone</span>
git clone https://github.com/Eververdants/ETBSaveManager.git
cd ETBSaveManager

<span class="code-comment"># Install</span>
pnpm install

<span class="code-comment"># Build</span>
pnpm tauri build</code></pre>
          </div>

          <a 
            :href="REPO_URL"
            target="_blank"
            class="btn btn-secondary btn-source"
          >
            <font-awesome-icon :icon="['fab', 'github']" />
            <span>{{ t('download.source.viewRepo') }}</span>
          </a>
        </div>
      </div>

      <!-- Release Info -->
      <div class="release-banner glass-card">
        <div class="release-icon">
          <font-awesome-icon :icon="['fas', 'rocket']" />
        </div>
        <div class="release-info">
          <span class="release-label">{{ t('download.release.label') }}</span>
          <span class="release-date">{{ t('download.release.date') }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hot-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 30px;
  margin-bottom: 28px;
  background: linear-gradient(130deg, rgba(124, 58, 237, 0.24) 0%, rgba(244, 63, 94, 0.16) 55%, rgba(6, 182, 212, 0.12) 100%);
  border-color: rgba(167, 139, 250, 0.4);
}

.hot-content h3 {
  font-size: 1.35rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.hot-content p {
  color: var(--text-muted);
  font-size: 0.9375rem;
  margin-bottom: 12px;
}

.hot-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.75rem;
  margin-bottom: 10px;
}

.hot-points {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-point {
  padding: 5px 10px;
  border-radius: 100px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.15);
  font-size: 0.75rem;
  color: rgba(241, 245, 249, 0.9);
}

.hot-btn {
  min-width: 220px;
  padding: 16px 24px;
  position: relative;
  overflow: hidden;
}

.hot-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 0%, rgba(255, 255, 255, 0.2), transparent 45%);
  pointer-events: none;
}

.download-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.download-card {
  padding: 32px;
}

.download-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.platform-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
}

.platform-badge svg {
  font-size: 1.5rem;
  color: var(--primary);
}

.version-info {
  text-align: right;
}

.version-tag {
  display: block;
  font-size: 0.75rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.version-number {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  color: var(--primary-light);
}

.download-body {
  margin-bottom: 32px;
}

.btn-download {
  width: 100%;
  padding: 18px;
  font-size: 1.0625rem;
  margin-bottom: 16px;
}

.download-formats {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.format-tag {
  padding: 6px 14px;
  background: var(--bg-darker);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-family: 'Space Grotesk', sans-serif;
}

.requirements h4 {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.requirements ul {
  list-style: none;
}

.requirements li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  color: var(--text-muted);
  font-size: 0.9375rem;
}

.req-icon {
  color: #22C55E;
  font-size: 0.875rem;
}

.source-card {
  padding: 32px;
  display: flex;
  flex-direction: column;
}

.source-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.source-icon {
  font-size: 1.25rem;
  color: var(--primary);
}

.source-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
}

.code-block {
  flex: 1;
  background: var(--bg-darker);
  border-radius: var(--radius-md);
  padding: 20px;
  margin-bottom: 24px;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
}

.code-block code {
  font-family: 'Fira Code', 'SF Mono', monospace;
  font-size: 0.8125rem;
  line-height: 1.8;
  color: var(--text-muted);
}

.code-comment {
  color: var(--text-dim);
}

.btn-source {
  width: 100%;
}

.release-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 32px;
  background: linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%);
}

.release-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  font-size: 1.25rem;
  color: var(--accent);
}

.release-label {
  display: block;
  font-size: 0.8125rem;
  color: var(--text-dim);
  margin-bottom: 4px;
}

.release-date {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  color: var(--text);
}

@media (max-width: 900px) {
  .hot-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .hot-btn {
    width: 100%;
    min-width: 0;
  }

  .download-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .download-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .version-info {
    text-align: left;
  }

  .release-banner {
    flex-direction: column;
    text-align: center;
  }
}
</style>
