<template>
  <div class="release-notes-container">
    <!-- 简洁版本显示 -->
    <div class="release-notes-compact" v-if="!showDetails">
      <div v-for="(note, index) in releaseNotes.slice(0, 2)" :key="note.version" class="compact-note-item"
        :class="note.type">
        <div class="compact-header">
          <span class="version-tag" :class="note.type">{{ note.version }}</span>
          <span class="compact-date">{{ formatDate(note.date) }}</span>
          <span v-if="note.isHighlight" class="compact-highlight">{{
            $t("featured")
            }}</span>
        </div>
        <div class="compact-title">{{ note.title }}</div>
        <div class="compact-summary" v-if="note.categories.newFeatures?.[0]">
          ✨ {{ note.categories.newFeatures[0] }}
        </div>
      </div>

      <div v-if="releaseNotes.length > 2" class="show-more-btn" @click="showDetails = true">
        {{ $t("viewAllVersions", { count: releaseNotes.length }) }}
      </div>
    </div>

    <!-- 详细版本显示 -->
    <div class="release-notes-detailed" v-else>
      <div class="detailed-header">
        <button class="back-btn" @click="showDetails = false">
          <font-awesome-icon :icon="['fas', 'arrow-left']" />
          {{ $t("back") }}
        </button>
        <h4>
          {{ $t("releaseNotes") }} ({{ releaseNotes.length }}
          {{ $t("versions") }})
        </h4>
      </div>

      <div class="detailed-content">
        <div v-for="note in releaseNotes" :key="note.version" class="detailed-note-item" :class="note.type">
          <div class="detailed-version-header">
            <span class="version-tag" :class="note.type">{{
              note.version
              }}</span>
            <span class="detailed-date">{{ formatDate(note.date) }}</span>
            <span v-if="note.isHighlight" class="detailed-highlight">{{
              $t("featured")
              }}</span>
          </div>
          <div class="detailed-title">{{ note.title }}</div>

          <div v-if="note.categories.newFeatures?.length" class="category-block">
            <div class="category-title">{{ $t("categories.newFeatures") }}</div>
            <div class="category-items">
              <div v-for="(item, idx) in note.categories.newFeatures" :key="idx" class="category-item">
                {{ item }}
              </div>
            </div>
          </div>

          <div v-if="note.categories.improvements?.length" class="category-block">
            <div class="category-title">
              {{ $t("categories.improvements") }}
            </div>
            <div class="category-items">
              <div v-for="(item, idx) in note.categories.improvements" :key="idx" class="category-item">
                {{ item }}
              </div>
            </div>
          </div>

          <div v-if="note.categories.bugFixes?.length" class="category-block">
            <div class="category-title">{{ $t("categories.bugFixes") }}</div>
            <div class="category-items">
              <div v-for="(item, idx) in note.categories.bugFixes" :key="idx" class="category-item">
                {{ item }}
              </div>
            </div>
          </div>

          <div v-if="note.categories.performance?.length" class="category-block">
            <div class="category-title">{{ $t("categories.performance") }}</div>
            <div class="category-items">
              <div v-for="(item, idx) in note.categories.performance" :key="idx" class="category-item">
                {{ item }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// 简洁模式和详细模式切换
const showDetails = ref(false);

// 数据
const releaseNotes = ref([]);

// 翻译文本的computed
const $t = (key, values) => {
  const text = t(key);
  // 简单的模板替换
  if (values && typeof values === "object") {
    return text.replace(/\{(\w+)\}/g, (match, param) => {
      return values[param] || match;
    });
  }
  return text;
};

// 方法
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const loadReleaseNotes = async () => {
  try {
    // 从 public 目录加载数据
    const response = await fetch("/releaseNotes.json");
    if (response.ok) {
      releaseNotes.value = await response.json();
    } else {
      console.warn("无法加载更新公告数据，使用默认数据");
    }
  } catch (error) {
    console.error("加载更新公告失败:", error);
    releaseNotes.value = [];
  }
};

onMounted(() => {
  loadReleaseNotes();
});
</script>

<style scoped>
.release-notes-container {
  width: 100%;
}

/* 简洁模式样式 */
.release-notes-compact {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.compact-note-item {
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 0.75rem;
  background: #fafbfc;
}

.compact-note-item.major {
  border-left: 3px solid #ff6b6b;
}

.compact-note-item.minor {
  border-left: 3px solid #4ecdc4;
}

.compact-note-item.patch {
  border-left: 3px solid #45b7d1;
}

.compact-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.version-tag {
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.version-tag.major {
  background: #ff6b6b;
}

.version-tag.minor {
  background: #4ecdc4;
}

.version-tag.patch {
  background: #45b7d1;
}

.compact-date {
  color: #666;
  font-size: 0.8rem;
}

.compact-highlight {
  background: #ffd43b;
  color: #333;
  padding: 0.2rem 0.4rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

.compact-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.compact-summary {
  font-size: 0.8rem;
  color: #666;
}

.show-more-btn {
  text-align: center;
  padding: 0.5rem;
  background: #f0f2f5;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  color: #666;
  transition: all 0.2s;
}

.show-more-btn:hover {
  background: #e9ecef;
  color: #333;
}

/* 详细模式样式 */
.release-notes-detailed {
  max-height: 400px;
  overflow-y: auto;
}

.detailed-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e1e5e9;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.6rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e9ecef;
}

.detailed-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #333;
}

.detailed-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detailed-note-item {
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 0.75rem;
  background: white;
}

.detailed-note-item.major {
  border-left: 3px solid #ff6b6b;
}

.detailed-note-item.minor {
  border-left: 3px solid #4ecdc4;
}

.detailed-note-item.patch {
  border-left: 3px solid #45b7d1;
}

.detailed-version-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.detailed-date {
  color: #666;
  font-size: 0.8rem;
}

.detailed-highlight {
  background: #ffd43b;
  color: #333;
  padding: 0.2rem 0.4rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

.detailed-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.category-block {
  margin-bottom: 0.5rem;
}

.category-block:last-child {
  margin-bottom: 0;
}

.category-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.25rem;
}

.category-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.category-item {
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-item {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: var(--text-secondary);
  line-height: 1.5;
}

.feature-item::before {
  content: "•";
  position: absolute;
  left: 0;
  color: var(--primary);
  font-weight: bold;
  font-size: 1.2rem;
}

.feature-item:hover {
  color: var(--text-primary);
}

.no-notes {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
}

.no-notes-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.release-notes-footer {
  margin-top: 1rem;
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.last-updated {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* 滚动条样式 */
.release-notes-content::-webkit-scrollbar {
  width: 6px;
}

.release-notes-content::-webkit-scrollbar-track {
  background: var(--surface-secondary);
  border-radius: 3px;
}

.release-notes-content::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.release-notes-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .release-notes-header {
    flex-direction: column;
    align-items: stretch;
  }

  .controls {
    justify-content: center;
  }

  .version-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .version-info {
    justify-content: center;
  }

  .version-details {
    text-align: center;
  }
}
</style>
