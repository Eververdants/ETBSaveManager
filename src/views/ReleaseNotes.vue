<template>
  <div class="release-notes-page">
    <header class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="goBack">
          <font-awesome-icon :icon="['fas', 'arrow-left']" />
          {{ $t('back') }}
        </button>
        <h1 class="page-title">{{ $t('releaseNotes') }}</h1>
        <div class="version-count">{{ releaseNotes.length }} {{ $t('versions') }}</div>
      </div>
    </header>

    <main class="page-content">
      <div class="release-notes-list">
        <div v-for="note in releaseNotes" :key="note.version" class="release-note-item" :class="note.type">
          <div class="version-header">
            <span class="version-tag" :class="note.type">{{ note.version }}</span>
            <span class="version-date">{{ formatDate(note.date) }}</span>
            <span v-if="note.isHighlight" class="featured-badge">{{ $t('featured') }}</span>
          </div>

          <h3 class="version-title">{{ note.title }}</h3>

          <div v-if="note.categories.newFeatures?.length" class="category-section">
            <h4 class="category-title">{{ $t('categories.newFeatures') }}</h4>
            <ul class="category-list">
              <li v-for="(item, idx) in note.categories.newFeatures" :key="idx" class="category-item">
                {{ item }}
              </li>
            </ul>
          </div>

          <div v-if="note.categories.improvements?.length" class="category-section">
            <h4 class="category-title">{{ $t('categories.improvements') }}</h4>
            <ul class="category-list">
              <li v-for="(item, idx) in note.categories.improvements" :key="idx" class="category-item">
                {{ item }}
              </li>
            </ul>
          </div>

          <div v-if="note.categories.bugFixes?.length" class="category-section">
            <h4 class="category-title">{{ $t('categories.bugFixes') }}</h4>
            <ul class="category-list">
              <li v-for="(item, idx) in note.categories.bugFixes" :key="idx" class="category-item">
                {{ item }}
              </li>
            </ul>
          </div>

          <div v-if="note.categories.performance?.length" class="category-section">
            <h4 class="category-title">{{ $t('categories.performance') }}</h4>
            <ul class="category-list">
              <li v-for="(item, idx) in note.categories.performance" :key="idx" class="category-item">
                {{ item }}
              </li>
            </ul>
          </div>
        </div>

        <div v-if="releaseNotes.length === 0" class="no-notes">
          <font-awesome-icon :icon="['fas', 'info-circle']" size="3x" />
          <p>{{ $t('noReleaseNotes') }}</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { watch } from 'vue';

const router = useRouter();
const { t, locale } = useI18n();

// 翻译文本的computed
const $t = (key) => {
  return t(key);
};

const releaseNotes = ref([]);

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale.value || 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// 监听语言变化，重新加载发布说明
const reloadReleaseNotes = () => {
  loadReleaseNotes();
};

// 使用Vue的watch来监听locale变化
watch(locale, (newLocale, oldLocale) => {
  if (newLocale !== oldLocale) {
    reloadReleaseNotes();
  }
});

const goBack = () => {
  router.go(-1);
};

// 加载更新公告数据
const loadReleaseNotes = async () => {
  try {
    console.log('🔄 [ReleaseNotes.vue] 开始加载更新公告数据...', {
      '当前语言': locale.value,
      '全局常量可用性': typeof __RELEASE_NOTES_ZH_CN__ !== 'undefined'
    })

    // 从全局常量获取数据，而不是导入的JSON文件
    let allReleaseNotes = [];

    if (typeof __RELEASE_NOTES_ZH_CN__ !== 'undefined') {
      // 直接使用全局常量对象，避免JSON.parse错误
      const zhData = Array.isArray(__RELEASE_NOTES_ZH_CN__) ? __RELEASE_NOTES_ZH_CN__ : [];
      const enData = Array.isArray(__RELEASE_NOTES_EN_US__) ? __RELEASE_NOTES_EN_US__ : [];
      const twData = Array.isArray(__RELEASE_NOTES_ZH_TW__) ? __RELEASE_NOTES_ZH_TW__ : [];

      // 根据当前语言选择对应的数据
      switch (locale.value) {
        case 'zh-CN':
          allReleaseNotes = zhData || [];
          break;
        case 'zh-TW':
          allReleaseNotes = twData || [];
          break;
        case 'en-US':
        default:
          allReleaseNotes = enData || [];
          break;
      }
    } else {
      console.warn('[ReleaseNotes.vue] 全局常量未定义，使用备用方案');
      // 备用方案：尝试从静态导入获取数据（如果tree-shaking允许）
      try {
        import('../i18n/locales/release-notes.zh-CN.json').then(module => {
          const fallbackData = locale.value === 'zh-CN' ? module.default : [];
          releaseNotes.value = fallbackData;
          console.log('📋 [ReleaseNotes.vue] 使用备用数据源:', fallbackData.length);
        });
        return;
      } catch (error) {
        console.error('[ReleaseNotes.vue] 备用方案失败:', error);
        allReleaseNotes = [];
      }
    }

    // 设置响应式数据
    releaseNotes.value = allReleaseNotes;

    console.log('📋 [ReleaseNotes.vue] 从全局常量获取的数据:', {
      '长度': allReleaseNotes.length,
      '第一个版本': allReleaseNotes[0]?.version,
      '当前语言': locale.value,
      '数据源': 'Vite全局常量'
    });

    console.log('✅ [ReleaseNotes.vue] 更新公告数据加载成功', {
      '语言': locale.value,
      '数量': releaseNotes.value.length,
      '最新版本': releaseNotes.value[0]?.version,
      '版本列表': releaseNotes.value.slice(0, 3).map(note => note.version),
      '公告类型': [...new Set(releaseNotes.value.map(note => note.type))]
    })
  } catch (error) {
    console.error('❌ [ReleaseNotes.vue] 加载更新公告数据失败:', error)
    console.error('🔍 [ReleaseNotes.vue] 错误详情:', {
      '错误信息': error.message,
      '错误堆栈': error.stack,
      '当前状态': {
        'locale': locale.value
      }
    })
    releaseNotes.value = []
  }
}

onMounted(() => {
  loadReleaseNotes();
});
</script>

<style scoped>
.release-notes-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.page-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  padding: 1rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
  border: 1px solid var(--btn-secondary-border);
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: var(--btn-secondary-hover-bg);
  transform: translateX(-2px);
}

.page-title {
  flex: 1;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.version-count {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.page-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.release-notes-list {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0 1rem;
  width: 100%;
}

.release-note-item {
  position: relative;
  background: linear-gradient(135deg,
      var(--bg-secondary) 0%,
      var(--bg-tertiary, #2a2a3a) 100%);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.release-note-item:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  z-index: 1;
}

.release-note-item:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.15),
    0 4px 8px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.release-note-item.major {
  border-left: 3px solid #ff6b6b;
  background: linear-gradient(135deg,
      var(--bg-secondary) 0%,
      rgba(255, 107, 107, 0.03) 50%,
      var(--bg-tertiary, #2a2a3a) 100%);
  box-shadow:
    0 4px 16px rgba(255, 107, 107, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.release-note-item.minor {
  border-left: 3px solid #4ecdc4;
  background: linear-gradient(135deg,
      var(--bg-secondary) 0%,
      rgba(78, 205, 196, 0.03) 50%,
      var(--bg-tertiary, #2a2a3a) 100%);
  box-shadow:
    0 4px 16px rgba(78, 205, 196, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.release-note-item.patch {
  border-left: 3px solid #45b7d1;
  background: linear-gradient(135deg,
      var(--bg-secondary) 0%,
      rgba(69, 183, 209, 0.03) 50%,
      var(--bg-tertiary, #2a2a3a) 100%);
  box-shadow:
    0 4px 16px rgba(69, 183, 209, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.version-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  position: relative;
  z-index: 2;
}

.version-tag {
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

.version-tag.major {
  background: linear-gradient(135deg, #ff6b6b, #ff5252);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

.version-tag.minor {
  background: linear-gradient(135deg, #4ecdc4, #26a69a);
  box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3);
}

.version-tag.patch {
  background: linear-gradient(135deg, #45b7d1, #1976d2);
  box-shadow: 0 2px 8px rgba(69, 183, 209, 0.3);
}

.version-tag.feature {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.version-tag.enhancement {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.version-tag.improvement {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.version-tag.stability {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3);
}

.version-tag:hover {
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

.version-title {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.4;
  position: relative;
  z-index: 2;
}

.version-title:after {
  content: '';
  position: absolute;
  bottom: -0.25rem;
  left: 0;
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, var(--accent-color), transparent);
  border-radius: 1px;
}

.category-section {
  margin-bottom: 1.5rem;
}

.category-section:last-child {
  margin-bottom: 0;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.category-list {
  margin: 0;
  padding-left: 1.5rem;
}

.category-item {
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  line-height: 1.6;
  position: relative;
}

.category-item:before {
  content: '•';
  position: absolute;
  left: -1rem;
  color: var(--accent-color);
  font-weight: bold;
}

.category-item:last-child {
  margin-bottom: 0;
}

.no-notes {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
}

.no-notes p {
  margin-top: 1rem;
  font-size: 1.1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 1rem;
  }

  .header-content {
    gap: 0.75rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .page-content {
    padding: 1rem;
  }

  .release-note-item {
    padding: 1rem;
  }

  .version-header {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}

/* 暗黑主题下的版本标签颜色 */
[data-theme="dark"] .version-tag.major {
  background: linear-gradient(135deg, #ff8585, #ff6b6b);
  box-shadow: 0 2px 8px rgba(255, 133, 133, 0.4);
}

[data-theme="dark"] .version-tag.minor {
  background: linear-gradient(135deg, #6ee7db, #4ecdc4);
  box-shadow: 0 2px 8px rgba(110, 231, 219, 0.4);
}

[data-theme="dark"] .version-tag.patch {
  background: linear-gradient(135deg, #67e8f9, #45b7d1);
  box-shadow: 0 2px 8px rgba(103, 232, 249, 0.4);
}

[data-theme="dark"] .version-tag.feature {
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
  box-shadow: 0 2px 8px rgba(167, 139, 250, 0.4);
}

[data-theme="dark"] .version-tag.enhancement {
  background: linear-gradient(135deg, #34d399, #10b981);
  box-shadow: 0 2px 8px rgba(52, 211, 153, 0.4);
}

[data-theme="dark"] .version-tag.improvement {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
}

[data-theme="dark"] .version-tag.stability {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
  box-shadow: 0 2px 8px rgba(156, 163, 175, 0.4);
}
</style>