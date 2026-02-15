<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { RELEASES_URL, REPO_URL, SMART_DOWNLOAD_URL } from '@/constants/links'

const { t } = useI18n()
const currentYear = new Date().getFullYear()

const links = computed(() => ({
  product: [
    { name: t('footer.links.download'), href: SMART_DOWNLOAD_URL, icon: 'download' },
    { name: t('footer.links.changelog'), href: RELEASES_URL, icon: 'rocket' },
    { name: t('footer.links.feedback'), href: 'https://github.com/Eververdants/ETBSaveManager/issues', icon: 'comment' }
  ],
  resources: [
    { name: 'GitHub', href: REPO_URL, icon: 'github', brand: true },
    { name: 'Bilibili', href: 'https://www.bilibili.com/video/BV1L3yeYzEfi', icon: 'film' }
  ]
}))
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-main">
        <!-- Brand -->
        <div class="footer-brand">
          <a href="#" class="footer-logo" @click.prevent>
            <img src="/icon.ico" alt="ETB Save Manager" class="logo-icon" />
            <span>ETB Save Manager</span>
          </a>
          <p class="footer-desc">
            {{ t('footer.desc') }}
          </p>
          <a href="mailto:llzgd@outlook.com" class="footer-email">
            <font-awesome-icon :icon="['fas', 'envelope']" />
            <span>llzgd@outlook.com</span>
          </a>
        </div>

        <!-- Links -->
        <div class="footer-links">
          <div class="footer-section">
            <h4>{{ t('footer.product') }}</h4>
            <ul>
              <li v-for="link in links.product" :key="link.name">
                <a :href="link.href" target="_blank">
                  <font-awesome-icon :icon="['fas', link.icon]" />
                  <span>{{ link.name }}</span>
                </a>
              </li>
            </ul>
          </div>

          <div class="footer-section">
            <h4>{{ t('footer.resources') }}</h4>
            <ul>
              <li v-for="link in links.resources" :key="link.name">
                <a :href="link.href" target="_blank">
                  <font-awesome-icon :icon="link.brand ? ['fab', link.icon] : ['fas', link.icon]" />
                  <span>{{ link.name }}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Bottom -->
      <div class="footer-bottom">
        <p class="copyright">
          © {{ currentYear }} Eververdants. MIT License
        </p>
        <p class="disclaimer">
          {{ t('footer.disclaimer') }}
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--border);
  padding: 64px 0 32px;
  margin-top: 40px;
}

.footer-main {
  display: flex;
  justify-content: space-between;
  gap: 64px;
  margin-bottom: 48px;
}

.footer-brand {
  max-width: 320px;
}

.footer-logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.125rem;
  margin-bottom: 16px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
}

.footer-desc {
  font-size: 0.9375rem;
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 20px;
}

.footer-email {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9375rem;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.footer-email:hover {
  color: var(--primary);
}

.footer-email svg {
  font-size: 0.875rem;
}

.footer-links {
  display: flex;
  gap: 64px;
}

.footer-section h4 {
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-dim);
  margin-bottom: 20px;
}

.footer-section ul {
  list-style: none;
}

.footer-section li {
  margin-bottom: 12px;
}

.footer-section a {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9375rem;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.footer-section a:hover {
  color: var(--text);
}

.footer-section a svg {
  font-size: 0.875rem;
  color: var(--primary);
  width: 16px;
}

.footer-bottom {
  padding-top: 32px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.copyright {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.disclaimer {
  font-size: 0.75rem;
  color: var(--text-dim);
}

@media (max-width: 768px) {
  .footer-main {
    flex-direction: column;
    gap: 40px;
  }

  .footer-links {
    gap: 40px;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}
</style>
