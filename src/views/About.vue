<template>
  <div class="about-container">
    <main class="about-content">
      <!-- 毛玻璃卡片 -->
      <section class="glass-card app-info">
        <img
          class="app-icon"
          :class="{ loaded: iconLoaded }"
          src="/app-icon.png"
          alt="App Icon"
          @load="handleImageLoad"
          @error="handleImageLoad"
          @click="handleAppIconClick"
        />
        <div>
          <h2 class="app-title">{{ $t("app.name") }}</h2>
          <p class="app-version">{{ $t("about.version") }} {{ version }}</p>
          <p class="app-desc">{{ $t("about.tagline") }}</p>
        </div>
        <div v-if="showEasterEgg" class="easter-egg">
          <img
            src="/Written_by_Máo.png"
            alt="Easter Egg"
            class="easter-egg-image"
            :class="{ loaded: easterEggImageLoaded }"
            @load="easterEggImageLoaded = true"
            @error="easterEggImageLoaded = true"
          />
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
          <div class="latest-version-header">
            <span class="version-badge" :class="latestRelease.type">{{
              latestRelease.version
            }}</span>
            <span class="version-date">{{
              formatDate(latestRelease.date)
            }}</span>
            <span v-if="latestRelease.isHighlight" class="featured-badge">{{
              $t("featured")
            }}</span>
          </div>
          <h4 class="latest-version-title">{{ latestRelease.title }}</h4>
          <div
            class="latest-feature"
            v-if="latestRelease.categories.newFeatures?.[0]"
          >
            <span class="feature-icon">✨</span>
            <span>{{ latestRelease.categories.newFeatures[0] }}</span>
          </div>
          <button class="view-all-btn" @click="goToReleaseNotes">
            {{ $t("viewAllVersions", { count: totalCount }) }}
          </button>
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
          <a href="mailto:llzgd@outlook.com" target="_blank">
            <font-awesome-icon :icon="['fas', 'envelope']" />
          </a>
          <a href="https://github.com/Eververdants" target="_blank">
            <font-awesome-icon :icon="['fab', 'github']" />
          </a>
          <a
            v-if="showChineseSocial"
            href="https://space.bilibili.com/2019959464"
            target="_blank"
          >
            <font-awesome-icon :icon="['fab', 'bilibili']" />
          </a>
          <a
            v-if="showChineseSocial"
            href="https://www.douyin.com/user/MS4wLjABAAAA8MEFE6VVh4_nWkTLPbueZYywgSyN19xhUFkmDF-nkhlnWytZWiBZ9YWM5s3RsprJ"
            target="_blank"
          >
            <font-awesome-icon :icon="['fab', 'tiktok']" />
          </a>
        </div>
      </section>

      <!-- 底部版权 -->
      <footer class="about-footer">
        <p>© 2025 {{ $t("app.name") }}</p>
        <small
          >{{ $t("about.licenseName") }} | {{ $t("archive.disclaimer") }}</small
        >
      </footer>
    </main>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useReleaseNotes } from "@/composables";
import storage from "@/services/storageService";

const { t, locale } = useI18n({ useScope: "global" });
const router = useRouter();
const version = "3.0.0-Alpha-7.3"; // TODO: 从 package.json 动态获取

// 使用公告数据 composable
const { releaseNotes, latestRelease, totalCount, formatShortDate } =
  useReleaseNotes();

const showChineseSocial = computed(() =>
  ["zh-CN", "zh-TW"].includes(locale.value)
);
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

const goToReleaseNotes = () => {
  router.push({ name: "ReleaseNotes" });
};

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

/* 更新公告摘要样式 */
.release-summary {
  position: relative;
  padding: 1.5rem;
  background: linear-gradient(
    135deg,
    var(--bg-secondary) 0%,
    var(--bg-tertiary, #2a2a3a) 100%
  );
  border: 1px solid var(--border-light);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.release-summary:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  z-index: 1;
}

.release-summary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.release-summary.major {
  border-left: 3px solid #ff6b6b;
  background: linear-gradient(
    135deg,
    var(--bg-secondary) 0%,
    rgba(255, 107, 107, 0.03) 50%,
    var(--bg-tertiary, #2a2a3a) 100%
  );
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.release-summary.minor {
  border-left: 3px solid #4ecdc4;
  background: linear-gradient(
    135deg,
    var(--bg-secondary) 0%,
    rgba(78, 205, 196, 0.03) 50%,
    var(--bg-tertiary, #2a2a3a) 100%
  );
  box-shadow: 0 4px 16px rgba(78, 205, 196, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.release-summary.patch {
  border-left: 3px solid #45b7d1;
  background: linear-gradient(
    135deg,
    var(--bg-secondary) 0%,
    rgba(69, 183, 209, 0.03) 50%,
    var(--bg-tertiary, #2a2a3a) 100%
  );
  box-shadow: 0 4px 16px rgba(69, 183, 209, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.latest-version-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  position: relative;
  z-index: 2;
}

.version-badge {
  position: relative;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.version-badge.major {
  background: linear-gradient(135deg, #ff6b6b, #ff5252);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

.version-badge.minor {
  background: linear-gradient(135deg, #4ecdc4, #26a69a);
  box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3);
}

.version-badge.patch {
  background: linear-gradient(135deg, #45b7d1, #1976d2);
  box-shadow: 0 2px 8px rgba(69, 183, 209, 0.3);
}

.version-badge.feature {
  background: linear-gradient(135deg, #9c88ff, #7c4dff);
  box-shadow: 0 2px 8px rgba(156, 136, 255, 0.3);
}

.version-badge.enhancement {
  background: linear-gradient(135deg, #ff8a65, #ff5722);
  box-shadow: 0 2px 8px rgba(255, 138, 101, 0.3);
}

.version-badge.improvement {
  background: linear-gradient(135deg, #81c784, #4caf50);
  box-shadow: 0 2px 8px rgba(129, 199, 132, 0.3);
}

.version-badge.stability {
  background: linear-gradient(135deg, #ffd54f, #ffb300);
  box-shadow: 0 2px 8px rgba(255, 213, 79, 0.3);
}

.version-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.version-date {
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.featured-badge {
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  color: #8b5cf6;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
  animation: shimmer 2s ease-in-out infinite alternate;
}

@keyframes shimmer {
  0% {
    filter: brightness(1);
  }

  100% {
    filter: brightness(1.1);
  }
}

.latest-version-title {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.4;
  position: relative;
  z-index: 2;
}

.latest-version-title:after {
  content: "";
  position: absolute;
  bottom: -0.25rem;
  left: 0;
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, var(--accent-color), transparent);
  border-radius: 1px;
}

.latest-feature {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding: 0.75rem;
  background: linear-gradient(
    135deg,
    rgba(var(--accent-color-rgb), 0.08) 0%,
    rgba(var(--accent-color-rgb), 0.03) 100%
  );
  border: 1px solid rgba(var(--accent-color-rgb), 0.2);
  border-radius: 10px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.latest-feature:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--accent-color-rgb), 0.3),
    transparent
  );
}

.latest-feature:hover {
  background: linear-gradient(
    135deg,
    rgba(var(--accent-color-rgb), 0.12) 0%,
    rgba(var(--accent-color-rgb), 0.05) 100%
  );
  transform: translateX(4px);
}

.feature-icon {
  font-size: 1.1rem;
  margin-top: 0.1rem;
  color: var(--accent-color);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.view-all-btn {
  position: relative;
  width: 100%;
  padding: 1rem 1.25rem;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.02) 100%
  );
  color: var(--text-primary);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  overflow: hidden;
  z-index: 2;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.view-all-btn:before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--accent-color-rgb), 0.3),
    transparent
  );
  transition: left 0.6s ease;
  z-index: -1;
}

.view-all-btn:hover:before {
  left: 100%;
}

.view-all-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(var(--accent-color-rgb), 0.2) 0%,
    rgba(var(--accent-color-rgb), 0.1) 50%,
    rgba(var(--accent-color-rgb), 0.05) 100%
  );
  border-color: rgba(var(--accent-color-rgb), 0.4);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 40px rgba(var(--accent-color-rgb), 0.3),
    0 6px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  color: var(--accent-color);
}

.view-all-btn:active {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 6px 20px rgba(var(--accent-color-rgb), 0.2),
    0 3px 10px rgba(0, 0, 0, 0.1);
}

.no-release-notes {
  padding: 1.5rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  position: relative;
}

.no-release-notes:before {
  content: "📋";
  font-size: 1.5rem;
  display: block;
  margin-bottom: 0.5rem;
  opacity: 0.6;
}

/* 深色模式适配 */
[data-theme="dark"] .about-container {
  background: linear-gradient(
    to bottom,
    var(--about-bg-gradient-start),
    var(--about-bg-gradient-end)
  );
}
</style>
