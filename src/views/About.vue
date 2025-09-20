<template>
  <div class="about-container">
    <main class="about-content">
      <!-- 毛玻璃卡片 -->
      <section class="glass-card app-info">
        <img class="app-icon" :class="{ 'loaded': iconLoaded }" src="/app-icon.png" alt="App Icon"
          @load="handleImageLoad" @error="handleImageLoad" @click="handleAppIconClick" />
        <div>
          <h2 class="app-title">{{ $t('app.name') }}</h2>
          <p class="app-version">{{ $t('about.version') }} {{ version }}</p>
          <p class="app-desc">{{ $t('about.tagline') }}</p>
        </div>
        <div v-if="showEasterEgg" class="easter-egg">
          <img src="/Written_by_Máo.png" alt="Easter Egg" class="easter-egg-image"
            :class="{ 'loaded': easterEggImageLoaded }" @load="easterEggImageLoaded = true"
            @error="easterEggImageLoaded = true" />
        </div>
      </section>

      <!-- 分组：应用信息 -->
      <section class="list-section">
        <h3 class="section-title">{{ $t('about.appInfo') }}</h3>
        <div class="list-item clickable" @click="handleEasterEgg">
          <span>{{ $t('about.author') }}</span>
          <span class="text-secondary">{{ $t('about.authorName') }}</span>
        </div>
        <div class="list-item">
          <span>{{ $t('about.license') }}</span>
          <span class="text-secondary">{{ $t('about.licenseName') }}</span>
        </div>
      </section>

      <!-- 分组：更新公告 -->
      <section class="list-section">
        <h3 class="section-title">{{ $t('about.releaseNotes') }}</h3>
        <div class="list-item single">
          ✨ {{ $t('archive.updated') }}：{{ $t('archive.updateDetails') }}
        </div>
      </section>

      <!-- 分组：致谢 -->
      <section class="list-section">
        <h3 class="section-title">{{ $t('about.acknowledgements') }}</h3>
        <div class="list-item single">
          {{ $t('archive.thanks') }}
        </div>
      </section>

      <!-- 分组：联系方式（图标点击） -->
      <section class="list-section">
        <h3 class="section-title">{{ $t('about.contact') }}</h3>
        <div class="icon-row">
          <a href="mailto:llzgd@outlook.com" target="_blank">
            <font-awesome-icon :icon="['fas', 'envelope']" />
          </a>
          <a href="https://github.com/Eververdants" target="_blank">
            <font-awesome-icon :icon="['fab', 'github']" />
          </a>
          <a v-if="showChineseSocial" href="https://space.bilibili.com/2019959464" target="_blank">
            <font-awesome-icon :icon="['fab', 'bilibili']" />
          </a>
          <a v-if="showChineseSocial"
            href="https://www.douyin.com/user/MS4wLjABAAAA8MEFE6VVh4_nWkTLPbueZYywgSyN19xhUFkmDF-nkhlnWytZWiBZ9YWM5s3RsprJ"
            target="_blank">
            <font-awesome-icon :icon="['fab', 'tiktok']" />
          </a>
        </div>
      </section>

      <!-- 底部版权 -->
      <footer class="about-footer">
        <p>© 2025 {{ $t('app.name') }}</p>
        <small>{{ $t('about.licenseName') }} | {{ $t('archive.disclaimer') }}</small>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { computed, ref, onMounted, nextTick } from 'vue';


const { t, locale } = useI18n({ useScope: 'global' });
const version = "3.0.0-Alpha-4.2";

const showChineseSocial = computed(() => ['zh-CN', 'zh-TW'].includes(locale.value));
const showEasterEgg = ref(false);
const iconLoaded = ref(false);
const easterEggImageLoaded = ref(false);
let clickCount = 0;
let clickTimer = null;

const handleImageLoad = () => {
  iconLoaded.value = true;
};

onMounted(() => {
  // 确保图片已经缓存，直接触发加载完成状态
  const img = new Image();
  img.onload = handleImageLoad;
  img.onerror = handleImageLoad; // 即使加载失败也显示图标
  img.src = '/app-icon.png';
});

const handleEasterEgg = () => {
  if (clickTimer) {
    clearTimeout(clickTimer);
  }

  clickCount++;

  if (clickCount >= 5) {
    // 直接重置动画状态，无需隐藏再显示
    easterEggImageLoaded.value = false;

    // 强制触发重新加载图片和动画
    setTimeout(() => {
      easterEggImageLoaded.value = true;
    }, 50);

    // 确保彩蛋可见
    if (!showEasterEgg.value) {
      showEasterEgg.value = true;
    }

    clickCount = 0;
    clearTimeout(clickTimer);
  } else {
    clickTimer = setTimeout(() => {
      clickCount = 0;
    }, 2000);
  }
};

// 处理app-icon的5次点击事件
let appIconClickCount = 0;
let appIconClickTimer = null;

const handleAppIconClick = () => {
  if (appIconClickTimer) {
    clearTimeout(appIconClickTimer);
  }

  appIconClickCount++;

  if (appIconClickCount >= 5) {
    // 激活开发者模式
    localStorage.setItem('developerMode', 'true');

    // 触发自定义事件通知其他组件
    window.dispatchEvent(new CustomEvent('developer-mode-changed', {
      detail: { enabled: true }
    }));

    // 显示提示
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 50px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 9999;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: fadeInOut 2s ease-in-out;
    `;
    toast.textContent = '开发者模式已激活！';
    document.body.appendChild(toast);

    setTimeout(() => {
      document.body.removeChild(toast);
    }, 2000);

    appIconClickCount = 0;
    clearTimeout(appIconClickTimer);
  } else {
    appIconClickTimer = setTimeout(() => {
      appIconClickCount = 0;
    }, 1000); // 1秒内点击5次
  }
};

</script>

<style scoped>
.about-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
}

.about-content {
  padding: 1.5rem 1.5rem 3rem;
  overflow-y: auto;
}

/* 毛玻璃卡片 */
.glass-card {
  background: var(--about-glass-bg);
  backdrop-filter: blur(14px);
  border: 1px solid var(--about-glass-border);
  border-radius: 20px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 20px var(--about-glass-shadow);
  position: relative;
}

.easter-egg {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.easter-egg-image {
  max-height: 60px;
  opacity: 0.8;
  border-radius: 8px;
}

.easter-egg-image.loaded {
  animation: fadeIn 0.3s ease-in;
  animation-fill-mode: forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }

  to {
    opacity: 0.8;
    transform: translateX(0);
  }
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }

  20% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  80% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
}

@keyframes iconFadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.app-icon {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: rgba(128, 128, 128, 0.1);
  border: 1px solid rgba(128, 128, 128, 0.2);
  padding: 8px;
  box-sizing: border-box;
  opacity: 0;
  transition: opacity 0.2s ease-in;
}

.app-icon.loaded {
  opacity: 1;
  animation: iconFadeIn 0.2s ease-in forwards;
}

.app-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.app-version {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0.2rem 0;
}

.app-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

/* 分组列表 */
.list-section {
  margin-bottom: 1.2rem;
  background: var(--about-list-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--about-glass-border);
  border-radius: 14px;
  overflow: hidden;
}

.section-title {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--about-border-light);
}

.list-item {
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  color: var(--text-primary);
  transition: background 0.2s ease;
}

.list-item:hover {
  background: var(--about-hover-bg);
}

.list-item.single {
  color: var(--text-secondary);
  justify-content: flex-start;
}

.text-secondary {
  color: var(--text-secondary);
}

/* 联系方式图标 */
.icon-row {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  padding: 0.8rem 0;
}

.icon-row a {
  font-size: 1.4rem;
  color: var(--text-primary);
  transition: transform 0.2s ease, color 0.2s ease;
}

.icon-row a:hover {
  color: var(--accent-color);
  transform: scale(1.15);
}

/* 底部版权 */
.about-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--about-glass-border);
  color: var(--text-secondary);
  position: relative;
}

.about-footer p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.about-footer small {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  opacity: 0.7;
}



.clickable {
  cursor: pointer;
}

/* 深色模式适配 */
[data-theme="dark"] .about-container {
  background: linear-gradient(to bottom, var(--about-bg-gradient-start), var(--about-bg-gradient-end));
}
</style>
