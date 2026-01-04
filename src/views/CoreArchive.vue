<template>
  <div class="core-archive-container">
    <!-- 主要内容区域 -->
    <div class="content-area">
      <!-- 枢纽解锁设置 -->
      <div class="setting-group">
        <div class="section-header">{{ $t("sidebar.unlockHub") }}</div>

        <div class="setting-item">
          <div class="setting-icon">
            <font-awesome-icon :icon="['fas', 'lock']" />
          </div>
          <div class="setting-details">
            <div class="setting-title">{{ $t("sidebar.unlockHub") }}</div>
            <div class="setting-description">
              {{ $t("sidebar.unlockHubSubtitle") }}
            </div>
          </div>
          <div class="setting-action">
            <label class="switch">
              <input
                type="checkbox"
                v-model="isHubUnlocked"
                @change="handleHubUnlockChange"
              />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- 功能区域（仅在解锁后显示） -->
      <div v-if="isHubUnlocked" class="feature-section">
        <div class="section-header">{{ $t("sidebar.featureOptions") }}</div>
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <font-awesome-icon :icon="['fas', 'database']" />
            </div>
            <div class="feature-content">
              <h3>{{ $t("sidebar.archiveDataEdit") }}</h3>
              <p>{{ $t("sidebar.archiveDataEditDesc") }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import storage from "../services/storageService";

export default {
  name: "CoreArchive",
  data() {
    return {
      isHubUnlocked: false,
    };
  },
  methods: {
    handleHubUnlockChange() {
      // 这里可以添加解锁逻辑，比如保存到本地存储
      if (this.isHubUnlocked) {
        console.log("The Hub 已解锁");
        // 可以在这里添加解锁成功的提示或其他逻辑
      } else {
        console.log("The Hub 已锁定");
        // 可以在这里添加锁定逻辑
      }
    },
  },
  mounted() {
    // 从本地存储恢复解锁状态
    const savedState = storage.getItem("hubUnlocked");
    if (savedState !== null) {
      this.isHubUnlocked = savedState === "true";
    }
  },
  watch: {
    isHubUnlocked(newValue) {
      // 保存解锁状态到本地存储
      storage.setItem("hubUnlocked", newValue);
    },
  },
};
</script>

<style scoped>
.core-archive-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 内容区域 */
.content-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 设置组样式 - 参考Settings.vue */
.setting-group {
  background: var(--card-bg, #ffffff);
  border-radius: var(--radius-md, 12px);
  padding: 16px;
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
}

/* 分区标题 */
.section-header {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1c1c1e);
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--divider-light, rgba(60, 60, 67, 0.05));
}

/* 设置项样式 - 参考Settings.vue */
.setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--divider-light, rgba(60, 60, 67, 0.05));
}

.setting-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary, #f2f2f7);
  border-radius: var(--radius-md, 12px);
  color: var(--accent-color, #007aff);
  font-size: 18px;
}

.setting-details {
  flex: 1;
}

.setting-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary, #1c1c1e);
  margin-bottom: 4px;
}

.setting-description {
  font-size: 14px;
  color: var(--text-secondary, #3a3a3c);
}

.setting-action {
  display: flex;
  align-items: center;
}

/* 开关样式 - 使用项目统一开关 */
.switch {
  position: relative;
  display: inline-block;
  width: 51px;
  height: 31px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: var(--radius-pill, 9999px);
}

.slider:before {
  position: absolute;
  content: "";
  height: 27px;
  width: 27px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background-color: var(--accent-color, #007aff);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* 简化功能区域样式 */
.feature-section {
  background: var(--card-bg, #ffffff);
  border-radius: var(--radius-md, 12px);
  padding: 16px;
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--surface-color, #ffffff);
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  transition: all 0.2s ease;
}

.feature-card:hover {
  background: var(--surface-hover, #f8f9fa);
  border-color: var(--accent-color, #007aff);
}

.feature-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-color, #007aff);
  color: white;
  border-radius: var(--radius-md, 12px);
  font-size: 18px;
}

.feature-content h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #1c1c1e);
  margin: 0 0 2px 0;
}

.feature-content p {
  font-size: 13px;
  color: var(--text-secondary, #3a3a3c);
  margin: 0;
}

/* 暗色主题适配 */
[data-theme="dark"] .setting-group,
[data-theme="dark"] .feature-section {
  background: var(--card-bg, #2c2c2e);
}

[data-theme="dark"] .setting-icon {
  background: var(--bg-tertiary, #3a3a3c);
}

[data-theme="dark"] .feature-card {
  background: var(--surface-color, #2c2c2e);
}

[data-theme="dark"] .feature-card:hover {
  background: var(--surface-hover, #3a3a3c);
}
</style>
