<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { REPO_URL, SMART_DOWNLOAD_URL } from '@/constants/links'

const { t, locale } = useI18n()

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
    isMobileMenuOpen.value = false
  }
}

const toggleLocale = () => {
  const newLocale = locale.value === 'zh-CN' ? 'en' : 'zh-CN'
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <nav class="navbar" :class="{ scrolled: isScrolled }">
    <div class="container navbar-content">
      <a href="#" class="logo" @click.prevent>
        <img src="/icon.ico" alt="ETB Save Manager" class="logo-icon" />
        <span class="logo-text">ETB Save Manager</span>
      </a>

      <div class="nav-links" :class="{ open: isMobileMenuOpen }">
        <a @click="scrollTo('overview')" class="nav-link">
          <span>{{ t('nav.overview') }}</span>
        </a>
        <a @click="scrollTo('features')" class="nav-link">
          <span>{{ t('nav.features') }}</span>
        </a>
        <a @click="scrollTo('screenshots')" class="nav-link">
          <span>{{ t('nav.preview') }}</span>
        </a>
        <a @click="scrollTo('tech')" class="nav-link">
          <span>{{ t('nav.tech') }}</span>
        </a>
        <a :href="REPO_URL" target="_blank" class="nav-link nav-link-icon">
          <font-awesome-icon :icon="['fab', 'github']" />
        </a>
        <button class="nav-link lang-toggle" @click="toggleLocale">
          <font-awesome-icon :icon="['fas', 'globe']" />
          <span>{{ locale === 'zh-CN' ? 'EN' : '中文' }}</span>
        </button>
        <a :href="SMART_DOWNLOAD_URL" target="_blank" class="btn btn-primary nav-cta">
          <font-awesome-icon :icon="['fas', 'download']" />
          <span>{{ t('nav.download') }}</span>
        </a>
      </div>

      <button class="mobile-toggle" @click="isMobileMenuOpen = !isMobileMenuOpen" aria-label="Toggle menu">
        <font-awesome-icon :icon="isMobileMenuOpen ? ['fas', 'times'] : ['fas', 'bars']" />
      </button>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 50;
  padding: 12px 24px;
  border-radius: var(--radius-xl);
  background: rgba(15, 15, 35, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.navbar.scrolled {
  background: rgba(15, 15, 35, 0.9);
  box-shadow: var(--shadow-lg);
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 100%;
  padding: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.25rem;
}

.logo-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
}

.logo-accent {
  color: var(--primary-light);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  padding: 10px 16px;
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.9375rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-link:hover {
  color: var(--text);
  background: var(--bg-card);
}

.nav-link-icon {
  padding: 10px 12px;
  font-size: 1.125rem;
}

.lang-toggle {
  border: 1px solid var(--border);
  background: transparent;
  font-family: inherit;
}

.lang-toggle:hover {
  border-color: var(--border-hover);
}

.nav-cta {
  padding: 10px 20px;
  margin-left: 8px;
}

.mobile-toggle {
  display: none;
  padding: 10px;
  font-size: 1.25rem;
  color: var(--text);
  border-radius: var(--radius-md);
  transition: background 0.2s ease;
}

.mobile-toggle:hover {
  background: var(--bg-card);
}

@media (max-width: 900px) {
  .navbar {
    top: 12px;
    left: 12px;
    right: 12px;
  }

  .mobile-toggle {
    display: block;
  }

  .nav-links {
    position: fixed;
    top: 80px;
    left: 12px;
    right: 12px;
    flex-direction: column;
    padding: 20px;
    background: rgba(15, 15, 35, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    transform: translateY(-20px);
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .nav-links.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .nav-link {
    width: 100%;
    justify-content: center;
    padding: 14px;
  }

  .nav-cta {
    width: 100%;
    margin-left: 0;
    margin-top: 8px;
  }
}
</style>
