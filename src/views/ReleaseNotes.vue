<template>
  <div class="release-notes-page">
    <header class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="goBack">
          <font-awesome-icon :icon="['fas', 'arrow-left']" />
          {{ $t("back") }}
        </button>
        <h1 class="page-title">{{ $t("releaseNotes") }}</h1>
        <div class="version-count">{{ totalCount }} {{ $t("versions") }}</div>
      </div>
    </header>

    <main class="page-content">
      <div class="release-notes-list">
        <div
          v-for="note in releaseNotes"
          :key="note.version"
          class="release-note-item"
          :class="note.type"
        >
          <div class="version-header">
            <span class="version-tag" :class="note.type">{{
              note.version
            }}</span>
            <span class="version-date">{{ formatDate(note.date) }}</span>
            <span v-if="note.isHighlight" class="featured-badge">{{
              $t("featured")
            }}</span>
          </div>

          <h3 class="version-title">{{ note.title }}</h3>

          <div
            v-if="note.categories.newFeatures?.length"
            class="category-section"
          >
            <h4 class="category-title">{{ $t("categories.newFeatures") }}</h4>
            <ul class="category-list">
              <li
                v-for="(item, idx) in note.categories.newFeatures"
                :key="idx"
                class="category-item"
              >
                {{ item }}
              </li>
            </ul>
          </div>

          <div
            v-if="note.categories.improvements?.length"
            class="category-section"
          >
            <h4 class="category-title">{{ $t("categories.improvements") }}</h4>
            <ul class="category-list">
              <li
                v-for="(item, idx) in note.categories.improvements"
                :key="idx"
                class="category-item"
              >
                {{ item }}
              </li>
            </ul>
          </div>

          <div v-if="note.categories.bugFixes?.length" class="category-section">
            <h4 class="category-title">{{ $t("categories.bugFixes") }}</h4>
            <ul class="category-list">
              <li
                v-for="(item, idx) in note.categories.bugFixes"
                :key="idx"
                class="category-item"
              >
                {{ item }}
              </li>
            </ul>
          </div>

          <div
            v-if="note.categories.performance?.length"
            class="category-section"
          >
            <h4 class="category-title">{{ $t("categories.performance") }}</h4>
            <ul class="category-list">
              <li
                v-for="(item, idx) in note.categories.performance"
                :key="idx"
                class="category-item"
              >
                {{ item }}
              </li>
            </ul>
          </div>
        </div>

        <div v-if="totalCount === 0" class="no-notes">
          <font-awesome-icon :icon="['fas', 'info-circle']" size="3x" />
          <p>{{ $t("noReleaseNotes") }}</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useReleaseNotes } from "@/composables";

const router = useRouter();
const { t } = useI18n();

// 使用公告数据 composable
const { releaseNotes, totalCount, formatDate } = useReleaseNotes();

const $t = (key) => t(key);

const goBack = () => {
  router.go(-1);
};
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
  background: linear-gradient(
    135deg,
    var(--bg-secondary) 0%,
    var(--bg-tertiary, #2a2a3a) 100%
  );
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.release-note-item:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  z-index: 1;
}

.release-note-item:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.release-note-item.major {
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

.release-note-item.minor {
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

.release-note-item.patch {
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
  content: "";
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
  content: "•";
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
