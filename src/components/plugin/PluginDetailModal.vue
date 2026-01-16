<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click="$emit('close')">
        <div class="modal-container" @click.stop>
          <!-- 关闭按钮 -->
          <button class="modal-close" @click="$emit('close')">
            <font-awesome-icon :icon="['fas', 'times']" />
          </button>

          <!-- 头部区域 -->
          <div class="modal-hero">
            <div class="hero-bg" :class="typeClass"></div>
            <div class="hero-content">
              <div class="icon-wrapper">
                <div class="icon-glow" :class="typeClass"></div>
                <div class="icon-main" :class="typeClass">
                  <font-awesome-icon :icon="['fas', iconName]" />
                </div>
              </div>
              <div class="title-section">
                <h1 class="plugin-title">{{ plugin.name }}</h1>
                <div class="meta-tags">
                  <span class="meta-tag type-tag" :class="typeClass">
                    <font-awesome-icon :icon="['fas', iconName]" />
                    {{ typeLabel }}
                  </span>
                  <span class="meta-tag version-tag">
                    <font-awesome-icon :icon="['fas', 'code-branch']" />
                    v{{ plugin.version }}
                  </span>
                  <span v-if="showStatus" class="meta-tag status-tag" :class="{ active: plugin.status === 'active' }">
                    <font-awesome-icon :icon="['fas', plugin.status === 'active' ? 'check-circle' : 'pause-circle']" />
                    {{ plugin.status === 'active' ? $t('plugin.enabled') : $t('plugin.disabled') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 内容区域 -->
          <div class="modal-body">
            <!-- 描述 -->
            <div class="content-section">
              <div class="section-header">
                <font-awesome-icon :icon="['fas', 'align-left']" class="section-icon" />
                <h3>{{ $t('plugin.description') }}</h3>
              </div>
              <p class="description-text">
                {{ plugin.description || $t('plugin.noDescription') }}
              </p>
            </div>

            <!-- 详细信息 -->
            <div class="content-section">
              <div class="section-header">
                <font-awesome-icon :icon="['fas', 'info-circle']" class="section-icon" />
                <h3>{{ $t('plugin.detailsTitle') }}</h3>
              </div>
              <div class="info-grid">
                <div class="info-card">
                  <div class="info-icon">
                    <font-awesome-icon :icon="['fas', 'user']" />
                  </div>
                  <div class="info-text">
                    <span class="info-label">{{ $t('plugin.author') }}</span>
                    <span class="info-value">{{ plugin.author || 'Unknown' }}</span>
                  </div>
                </div>
                <div v-if="plugin.license" class="info-card">
                  <div class="info-icon">
                    <font-awesome-icon :icon="['fas', 'certificate']" />
                  </div>
                  <div class="info-text">
                    <span class="info-label">{{ $t('plugin.license') }}</span>
                    <span class="info-value">{{ plugin.license }}</span>
                  </div>
                </div>
                <div v-if="plugin.locale" class="info-card">
                  <div class="info-icon">
                    <font-awesome-icon :icon="['fas', 'language']" />
                  </div>
                  <div class="info-text">
                    <span class="info-label">{{ $t('plugin.languageCode') }}</span>
                    <span class="info-value">{{ plugin.locale }}</span>
                  </div>
                </div>
                <div v-if="plugin.localeName" class="info-card">
                  <div class="info-icon">
                    <font-awesome-icon :icon="['fas', 'globe']" />
                  </div>
                  <div class="info-text">
                    <span class="info-label">{{ $t('plugin.languageName') }}</span>
                    <span class="info-value">{{ plugin.localeName }}</span>
                  </div>
                </div>
                <div v-if="plugin.themeId" class="info-card">
                  <div class="info-icon">
                    <font-awesome-icon :icon="['fas', 'palette']" />
                  </div>
                  <div class="info-text">
                    <span class="info-label">{{ $t('plugin.themeId') }}</span>
                    <span class="info-value">{{ plugin.themeId }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div class="modal-footer">
            <template v-if="showStatus">
              <button 
                class="action-btn secondary-btn"
                :class="{ active: plugin.status === 'active' }"
                @click="$emit('toggle', plugin)"
              >
                <font-awesome-icon :icon="['fas', plugin.status === 'active' ? 'pause' : 'play']" />
                <span>{{ plugin.status === 'active' ? $t('plugin.disablePlugin') : $t('plugin.enablePlugin') }}</span>
              </button>
              <button class="action-btn danger-btn" @click="$emit('uninstall', plugin)">
                <font-awesome-icon :icon="['fas', 'trash-alt']" />
                <span>{{ $t('plugin.uninstallPlugin') }}</span>
              </button>
            </template>
            <template v-else>
              <button 
                v-if="plugin.installed"
                class="action-btn success-btn full-width"
                @click="$emit('uninstall', plugin)"
              >
                <font-awesome-icon :icon="['fas', 'check-circle']" />
                <span>{{ $t('plugin.installed') }}</span>
              </button>
              <button 
                v-else
                class="action-btn primary-btn full-width"
                @click="$emit('install', plugin)"
              >
                <font-awesome-icon :icon="['fas', 'download']" />
                <span>{{ $t('plugin.install') }}</span>
              </button>
            </template>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  plugin: {
    type: Object,
    default: () => ({})
  },
  showStatus: {
    type: Boolean,
    default: false
  }
});

defineEmits(['close', 'toggle', 'install', 'uninstall']);

const typeClass = computed(() => `type-${props.plugin?.type || 'feature'}`);

const iconName = computed(() => {
  const icons = {
    language: 'globe',
    theme: 'palette',
    feature: 'puzzle-piece'
  };
  return icons[props.plugin?.type] || 'puzzle-piece';
});

const typeLabel = computed(() => {
  const key = `plugin.type.${props.plugin?.type}`;
  const translated = t(key);
  return translated !== key ? translated : t('plugin.type.plugin');
});

// 控制 body 滚动
watch(() => props.show, (val) => {
  document.body.style.overflow = val ? 'hidden' : '';
});
</script>

<style scoped>
/* 过渡动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}

/* 遮罩层 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

/* 模态框容器 */
.modal-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  background: var(--bg-secondary);
  border-radius: var(--radius-modal);
  overflow: hidden;
  box-shadow: var(--shadow-2xl);
  display: flex;
  flex-direction: column;
}

/* 关闭按钮 */
.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.5);
  transform: rotate(90deg) scale(1.1);
}

/* 头部区域 */
.modal-hero {
  position: relative;
  padding: 40px 24px 24px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  opacity: 0.12;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
}

.hero-bg.type-language {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.hero-bg.type-theme {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.hero-bg.type-feature {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.hero-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 图标 */
.icon-wrapper {
  position: relative;
  flex-shrink: 0;
}

.icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  filter: blur(24px);
  opacity: 0.5;
  background: var(--accent-color);
}

.icon-glow.type-language { background: #667eea; }
.icon-glow.type-theme { background: #f093fb; }
.icon-glow.type-feature { background: #4facfe; }

.icon-main {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  box-shadow: var(--shadow-lg);
}

.icon-main.type-language {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.icon-main.type-theme {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.icon-main.type-feature {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

/* 标题区域 */
.title-section {
  flex: 1;
  min-width: 0;
}

.plugin-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
  line-height: 1.2;
}

.meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.type-tag.type-language {
  background: rgba(102, 126, 234, 0.15);
  color: #667eea;
  border-color: rgba(102, 126, 234, 0.3);
}

.type-tag.type-theme {
  background: rgba(240, 147, 251, 0.15);
  color: #f093fb;
  border-color: rgba(240, 147, 251, 0.3);
}

.type-tag.type-feature {
  background: rgba(79, 172, 254, 0.15);
  color: #4facfe;
  border-color: rgba(79, 172, 254, 0.3);
}

.version-tag {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
  border-color: rgba(52, 199, 89, 0.3);
}

.status-tag {
  background: rgba(255, 159, 10, 0.15);
  color: #ff9f0a;
  border-color: rgba(255, 159, 10, 0.3);
}

.status-tag.active {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
  border-color: rgba(52, 199, 89, 0.3);
}

/* 内容区域 */
.modal-body {
  padding: 0 24px 20px;
  overflow-y: auto;
  flex: 1;
}

.content-section {
  margin-bottom: 24px;
}

.content-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.section-icon {
  font-size: 16px;
  color: var(--accent-color);
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.description-text {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
  margin: 0;
  padding: 14px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--accent-color);
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.info-card:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

.info-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  flex-shrink: 0;
}

.info-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.info-value {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 底部操作栏 */
.modal-footer {
  padding: 16px 24px;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: var(--radius-button);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.full-width {
  flex: 1 1 100%;
}

.primary-btn {
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  color: white;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 122, 255, 0.4);
}

.secondary-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.secondary-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

.secondary-btn.active {
  background: rgba(52, 199, 89, 0.15);
  border-color: #34c759;
  color: #34c759;
}

.success-btn {
  background: linear-gradient(135deg, #34c759, #30d158);
  color: white;
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
}

.success-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 199, 89, 0.4);
}

.danger-btn {
  background: linear-gradient(135deg, #ff3b30, #ff453a);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
}

.danger-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 59, 48, 0.4);
}

/* 响应式 */
@media (max-width: 640px) {
  .modal-container {
    max-height: 100vh;
    border-radius: var(--radius-lg);
  }

  .modal-hero {
    padding: 32px 20px 20px;
  }

  .hero-content {
    flex-direction: column;
    text-align: center;
  }

  .meta-tags {
    justify-content: center;
  }

  .modal-body {
    padding: 0 20px 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    padding: 14px 20px;
    flex-direction: column;
  }
}
</style>
