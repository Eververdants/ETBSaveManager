<template>
  <div class="about-container">
    <main class="about-content">
      <!-- 毛玻璃卡片 -->
      <section class="glass-card app-info">
        <img class="app-icon" :class="{ loaded: iconLoaded }" src="/app-icon.png" alt="App Icon" @load="handleImageLoad"
          @error="handleImageLoad" @click="handleAppIconClick" />
        <div>
          <h2 class="app-title">{{ $t("app.name") }}</h2>
          <p class="app-version">{{ $t("about.version") }} {{ version }}</p>
          <p class="app-desc">{{ $t("about.tagline") }}</p>
        </div>
        <div v-if="showEasterEgg" class="easter-egg">
          <img src="/Written_by_Máo.png" alt="Easter Egg" class="easter-egg-image"
            :class="{ loaded: easterEggImageLoaded }" @load="easterEggImageLoaded = true"
            @error="easterEggImageLoaded = true" />
        </div>
      </section>

      <!-- 分组：应用信息 -->
      <section class="list-section">
        <h3 class="section-title">{{ $t("about.appInfo") }}</h3>
        <div class="list-item clickable" @click="handleEasterEgg">
          <span>{{ $t("about.author") }}</span>
          <span class="text-secondary">{{ $t("about.authorName") }}</span>
        </div>
        <div class="list-item">
          <span>{{ $t("about.license") }}</span>
          <span class="text-secondary">{{ $t("about.licenseName") }}</span>
        </div>
      </section>

      <!-- 分组：更新公告 -->
      <section class="list-section">
        <h3 class="section-title">{{ $t("about.releaseNotes") }}</h3>
        <div class="release-summary" v-if="latestRelease">
          <div class="release-header">
            <span class="version-tag">{{ latestRelease.version }}</span>
            <span class="release-date">{{ formatDate(latestRelease.date) }}</span>
          </div>
          <div class="release-title">{{ latestRelease.title }}</div>

          <!-- 更新内容列表 -->
          <div class="release-content">
            <template v-if="latestRelease.categories.newFeatures?.length">
              <div v-for="(item, idx) in latestRelease.categories.newFeatures" :key="'new-' + idx" class="release-item">
                <span class="item-dot new"></span>
                <span>{{ item }}</span>
              </div>
            </template>
            <template v-if="latestRelease.categories.improvements?.length">
              <div v-for="(item, idx) in latestRelease.categories.improvements" :key="'imp-' + idx"
                class="release-item">
                <span class="item-dot improve"></span>
                <span>{{ item }}</span>
              </div>
            </template>
            <template v-if="latestRelease.categories.bugFixes?.length">
              <div v-for="(item, idx) in latestRelease.categories.bugFixes" :key="'fix-' + idx" class="release-item">
                <span class="item-dot fix"></span>
                <span>{{ item }}</span>
              </div>
            </template>
            <template v-if="latestRelease.categories.performance?.length">
              <div v-for="(item, idx) in latestRelease.categories.performance" :key="'perf-' + idx"
                class="release-item">
                <span class="item-dot perf"></span>
                <span>{{ item }}</span>
              </div>
            </template>
          </div>
        </div>
        <div v-else class="no-release-notes">
          <p>{{ $t("noReleaseNotes") }}</p>
        </div>
      </section>

      <!-- 分组：致谢 -->
      <section class="list-section">
        <h3 class="section-title">{{ $t("about.acknowledgements") }}</h3>
        <div class="list-item single">
          {{ $t("archive.thanks") }}
        </div>
      </section>

      <!-- 分组：联系方式（图标点击） -->
      <section class="list-section">
        <h3 class="section-title">{{ $t("about.contact") }}</h3>
        <div class="icon-row">
          <a class="social-btn email" href="mailto:llzgd@outlook.com" target="_blank">
            <font-awesome-icon :icon="['fas', 'envelope']" />
            <span class="social-label">Email</span>
          </a>
          <a class="social-btn github" href="https://github.com/Eververdants" target="_blank">
            <font-awesome-icon :icon="['fab', 'github']" />
            <span class="social-label">GitHub</span>
          </a>
          <a class="social-btn x-twitter" href="https://x.com/Eververdants" target="_blank">
            <font-awesome-icon :icon="['fab', 'x-twitter']" />
            <span class="social-label">X</span>
          </a>
          <a class="social-btn bilibili" href="https://space.bilibili.com/2019959464" target="_blank">
            <font-awesome-icon :icon="['fab', 'bilibili']" />
            <span class="social-label">Bilibili</span>
          </a>
          <a class="social-btn tiktok"
            href="https://www.douyin.com/user/MS4wLjABAAAA8MEFE6VVh4_nWkTLPbueZYywgSyN19xhUFkmDF-nkhlnWytZWiBZ9YWM5s3RsprJ"
            target="_blank">
            <font-awesome-icon :icon="['fab', 'tiktok']" />
            <span class="social-label">抖音</span>
          </a>
        </div>
      </section>

      <!-- 底部版权 -->
      <footer class="about-footer">
        <p>© 2026 {{ $t("app.name") }}</p>
        <small>{{ $t("about.licenseName") }} | {{ $t("archive.disclaimer") }}</small>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { computed, ref, onMounted } from "vue";
import { useReleaseNotes } from "@/composables";
import storage from "@/services/storageService";

const { t, locale } = useI18n({ useScope: "global" });
const version = "3.0.0-Beta-1"; // TODO: 从 package.json 动态获取

// 使用公告数据 composable
const { latestRelease, formatShortDate } =
  useReleaseNotes();

const showEasterEgg = ref(false);
const iconLoaded = ref(false);
const easterEggImageLoaded = ref(false);

// 翻译文本的computed
const $t = (key, values) => {
  const text = t(key);
  if (values && typeof values === "object") {
    return text.replace(/\{(\w+)\}/g, (match, param) => {
      return values[param] || match;
    });
  }
  return text;
};

let clickCount = 0;
let clickTimer = null;

const handleImageLoad = () => {
  iconLoaded.value = true;
};

// 使用 composable 提供的日期格式化
const formatDate = (dateString) => formatShortDate(dateString);

onMounted(() => {
  const img = new Image();
  img.onload = handleImageLoad;
  img.onerror = handleImageLoad;
  img.src = "/app-icon.png";
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
    storage.setItem("developerMode", "true");

    // 触发自定义事件通知其他组件
    window.dispatchEvent(
      new CustomEvent("developer-mode-changed", {
        detail: { enabled: true },
      })
    );

    // 显示提示
    const toast = document.createElement("div");
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
    toast.textContent = t("about.developerModeActivated");
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
  gap: 0.75rem;
  padding: 1rem 0;
  flex-wrap: wrap;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 1.2rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  text-decoration: none;
  transition: all 0.3s ease;
  overflow: hidden;
}

.social-label {
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  font-size: 0.85rem;
  font-weight: 500;
  margin-left: 0;
  opacity: 0;
  transition: all 0.3s ease;
}

.social-btn:hover {
  transform: translateY(-2px);
  color: white;
}

.social-btn:hover .social-label {
  max-width: 80px;
  margin-left: 8px;
  opacity: 1;
}

.social-btn.email:hover {
  background: #667eea;
  border-color: #667eea;
}

.social-btn.github:hover {
  background: #333;
  border-color: #333;
}

.social-btn.x-twitter:hover {
  background: #000;
  border-color: #000;
}

.social-btn.bilibili:hover {
  background: #fb7299;
  border-color: #fb7299;
}

.social-btn.tiktok:hover {
  background: #000;
  border-color: #000;
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

/* 更新公告样式 - 简洁版 */
.release-summary {
  padding: 1rem;
}

.release-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.version-tag {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.08));
}

.release-date {
  color: var(--text-tertiary);
  font-size: 0.8rem;
}

.release-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-light);
}

.release-content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.release-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.item-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-top: 0.45rem;
  flex-shrink: 0;
}

.item-dot.new {
  background: #4ecdc4;
}

.item-dot.improve {
  background: #f59e0b;
}

.item-dot.fix {
  background: #ef4444;
}

.item-dot.perf {
  background: #8b5cf6;
}

.no-release-notes {
  padding: 1rem;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 0.9rem;
}

.no-release-notes p {
  margin: 0;
}

/* 深色模式适配 */
[data-theme="dark"] .about-container {
  background: linear-gradient(to bottom,
      var(--about-bg-gradient-start),
      var(--about-bg-gradient-end));
}
</style>
