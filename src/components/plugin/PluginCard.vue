<template>
  <div 
    class="plugin-card" 
    :class="{ 'is-installed': isInstalled }"
    @click="$emit('click', plugin)"
  >
    <!-- 顶部装饰条 -->
    <div class="card-accent" :class="typeClass"></div>
    
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="plugin-icon" :class="typeClass">
        <font-awesome-icon :icon="['fas', iconName]" />
      </div>
      <div class="plugin-info">
        <h3 class="plugin-name">{{ plugin.name }}</h3>
        <div class="plugin-meta">
          <span class="type-badge" :class="typeClass">
            {{ typeLabel }}
          </span>
          <span class="version-badge">v{{ plugin.version }}</span>
          <span v-if="plugin.locale" class="locale-badge">
            {{ plugin.locale }}
          </span>
        </div>
      </div>
    </div>

    <!-- 卡片内容 -->
    <div class="card-body">
      <p class="plugin-desc">
        {{ plugin.description || plugin.localeName || $t('plugin.noDescription') }}
      </p>
    </div>

    <!-- 卡片底部 -->
    <div class="card-footer">
      <div class="footer-left">
        <span v-if="plugin.author" class="author-info">
          <font-awesome-icon :icon="['fas', 'user']" />
          {{ plugin.author }}
        </span>
        <template v-if="showStatus">
          <span class="status-badge" :class="{ active: plugin.status === 'active' }">
            <font-awesome-icon :icon="['fas', statusIcon]" />
            {{ statusText }}
          </span>
        </template>
      </div>
      
      <div class="card-actions" @click.stop>
        <template v-if="showStatus">
          <button 
            class="action-btn toggle-btn"
            :class="{ enabled: plugin.status === 'active' }"
            @click="$emit('toggle', plugin)"
            :title="plugin.status === 'active' ? $t('plugin.disablePlugin') : $t('plugin.enablePlugin')"
          >
            <font-awesome-icon :icon="['fas', plugin.status === 'active' ? 'toggle-on' : 'toggle-off']" />
          </button>
          <button 
            class="action-btn uninstall-btn"
            @click="$emit('uninstall', plugin)"
            :title="$t('plugin.uninstallPlugin')"
          >
            <font-awesome-icon :icon="['fas', 'trash']" />
          </button>
        </template>
        <template v-else>
          <button 
            v-if="isInstalled"
            class="action-btn uninstall-btn"
            @click="$emit('uninstall', plugin)"
            :title="$t('plugin.uninstallPlugin')"
          >
            <font-awesome-icon :icon="['fas', 'trash']" />
          </button>
          <button 
            v-else
            class="action-btn install-btn"
            @click="$emit('install', plugin)"
            :title="$t('plugin.installPlugin')"
          >
            <font-awesome-icon :icon="['fas', 'download']" />
            {{ $t('plugin.install') }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  plugin: {
    type: Object,
    required: true
  },
  showStatus: {
    type: Boolean,
    default: false
  }
});

defineEmits(['click', 'toggle', 'install', 'uninstall']);

const typeClass = computed(() => `type-${props.plugin.type || 'feature'}`);

const iconName = computed(() => {
  const icons = {
    language: 'globe',
    theme: 'palette',
    feature: 'puzzle-piece'
  };
  return icons[props.plugin.type] || 'puzzle-piece';
});

const typeLabel = computed(() => {
  const key = `plugin.type.${props.plugin.type}`;
  const translated = t(key);
  return translated !== key ? translated : t('plugin.type.plugin');
});

// 已安装插件有 status 字段，商店插件有 installed 字段
const isInstalled = computed(() => props.plugin.installed || props.plugin.status !== undefined);

const statusIcon = computed(() => 
  props.plugin.status === 'active' ? 'check-circle' : 'pause-circle'
);

const statusText = computed(() => 
  props.plugin.status === 'active' ? t('plugin.enabled') : t('plugin.disabled')
);
</script>

<style scoped>
.plugin-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  position: relative;
  height: 220px;
}

.plugin-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent-color);
}

/* 顶部装饰条 */
.card-accent {
  height: 4px;
  background: var(--accent-color);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.plugin-card:hover .card-accent {
  opacity: 1;
}

.card-accent.type-language {
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.card-accent.type-theme {
  background: linear-gradient(90deg, #f093fb, #f5576c);
}

.card-accent.type-feature {
  background: linear-gradient(90deg, #4facfe, #00f2fe);
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 20px 0;
}

.plugin-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
  box-shadow: var(--shadow-md);
  transition: transform 0.3s ease;
}

.plugin-card:hover .plugin-icon {
  transform: scale(1.05) rotate(3deg);
}

.plugin-icon.type-language {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.plugin-icon.type-theme {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.plugin-icon.type-feature {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.plugin-info {
  flex: 1;
  min-width: 0;
}

.plugin-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plugin-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.type-badge,
.version-badge,
.locale-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
}

.type-badge {
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.type-badge.type-language {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.type-badge.type-theme {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.type-badge.type-feature {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.version-badge {
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
}

.locale-badge {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.2);
}

/* 卡片内容 */
.card-body {
  padding: 16px 20px;
  flex: 1;
  overflow: hidden;
}

.plugin-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.author-info {
  font-size: 12px;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.author-info svg {
  font-size: 11px;
  color: var(--accent-color);
  flex-shrink: 0;
}

.status-badge {
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.status-badge.active {
  color: #34c759;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn {
  width: 36px;
  height: 36px;
  font-size: 18px;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.toggle-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

.toggle-btn.enabled {
  color: #34c759;
  background: rgba(52, 199, 89, 0.1);
  border-color: rgba(52, 199, 89, 0.3);
}

.toggle-btn.enabled:hover {
  color: #ff9500;
  background: rgba(255, 149, 0, 0.1);
  border-color: rgba(255, 149, 0, 0.3);
}

.uninstall-btn {
  width: 36px;
  height: 36px;
  font-size: 15px;
  color: #ff3b30;
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.2);
}

.uninstall-btn:hover {
  background: rgba(255, 59, 48, 0.2);
  border-color: rgba(255, 59, 48, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2);
}

.install-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #34c759, #30d158);
  box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
}

.install-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(52, 199, 89, 0.4);
}
</style>
