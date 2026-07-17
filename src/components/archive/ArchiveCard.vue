<template>
  <div
v-squircle="36" class="archive-card" :class="{
    'archive-hidden': !localVisible,
    'visibility-transitioning': isAnimating,
    'multi-select-mode': isMultiSelectMode,
    'is-selected': isSelected,
  }" @click="handleCardClick">
    <!-- Multi-select mode checkbox -->
    <div
v-if="isMultiSelectMode" class="multi-select-checkbox" :class="{ 'is-checked': isSelected }"
      @click.stop="toggleSelection">
      <font-awesome-icon :icon="isSelected ? 'fa-solid fa-check' : 'fa-regular fa-circle'" class="check-icon" />
    </div>

    <!-- Upper background area -->
    <div class="card-background">
      <LazyImage
:src="cardData?.backgroundImage ?? ''" :alt="cardData?.currentLevelName ?? ''"
        image-class="background-image" />
      <div class="background-overlay"></div>

      <!-- Hidden status badge -->
      <Transition name="badge">
        <div v-if="!localVisible" class="hidden-badge">
          <font-awesome-icon icon="fa-solid fa-eye-slash" />
          <span>{{ t("archiveCard.hidden") }}</span>
        </div>
      </Transition>

      <!-- Archive info -->
      <div class="archive-info">
        <h3 class="archive-name" v-html="sanitize(highlightedName)"></h3>
        <div class="game-mode-info">
          <span
class="difficulty-tag" :class="cardData?.archiveDifficultyClass ?? ''"
            :style="archiveDifficultyTagStyle">
            <span class="tag-short">{{ cardData?.archiveDifficultyText ?? "" }}</span>
            <span class="tag-full">{{ t("archiveCard.archiveDifficulty") }}：{{ cardData?.archiveDifficultyText ?? ""
            }}</span>
          </span>
          <span
v-if="!FEATURES.MERGE_DIFFICULTY" class="difficulty-tag" :class="cardData?.actualDifficultyClass ?? ''"
            :style="actualDifficultyTagStyle">
            <span class="tag-short">{{ cardData?.actualDifficultyText ?? "" }}</span>
            <span class="tag-full">{{ t("archiveCard.actualDifficulty") }}：{{ cardData?.actualDifficultyText ?? ""
            }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Lower info area -->
    <div class="card-info">
      <span class="current-level" v-html="sanitize(highlightedLevel)"></span>
      <div class="action-buttons">
        <button
class="action-btn edit" type="button" :aria-label="$t('archiveCard.editLabel')"
          @click.stop="editArchive">
          <font-awesome-icon icon="fa-solid fa-edit" aria-hidden="true" />
        </button>
        <button
class="action-btn copy" type="button"
          :aria-label="cardData?.isVisible ? $t('archiveCard.hideLabel') : $t('archiveCard.showLabel')"
          @click.stop="toggleVisibility">
          <font-awesome-icon
:icon="cardData?.isVisible ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"
            aria-hidden="true" />
        </button>
        <button
class="action-btn delete" type="button" :aria-label="$t('archiveCard.deleteLabel')"
          @click.stop="deleteArchive">
          <font-awesome-icon icon="fa-solid fa-trash" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, toRef } from "vue";
import { useI18n } from "vue-i18n";
import LazyImage from "../ui/LazyImage.vue";
import { useArchiveCard } from "@/composables/useArchiveCard";
import { highlightMatch } from "@/composables/useArchiveSearchFilter";
import { FEATURES } from "@/config/features";

const props = defineProps({
  archive: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    default: 0,
  },
  isMultiSelectMode: {
    type: Boolean,
    default: false,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
  searchQuery: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["toggle-visibility", "edit", "delete", "select", "toggle-select"]);

const sanitize = (html) => {
  // Fast return if no mark tags present (most common case)
  if (!html || !html.includes("<mark")) return html;
  // Strip dangerous attributes from <mark> tags, keep only safe class attribute
  html = html.replace(/<(\/?)mark\b([^>]*)>/gi, (match, isClosing, attrs) => {
    if (isClosing) return "</mark>";
    const cls = attrs.match(/class\s*=\s*"(?:[^"\\]|\\.)*"/i);
    return cls ? `<mark ${cls[0]}>` : "<mark>";
  });
  // Remove all other HTML tags
  return html.replace(/<(?!\/?mark\b)[^>]*>/gi, "");
};

const { t, te } = useI18n({ useScope: "global" });

const getLevelName = (levelKey) => {
  const translationKey = `LevelName_Display.${levelKey}`;
  return te(translationKey) ? t(translationKey) : levelKey;
};

const getDifficultyText = (difficultyKey) => {
  const translationKey = `createArchive.difficultyLevels.${difficultyKey}`;
  return te(translationKey) ? t(translationKey) : difficultyKey;
};

const translations = {
  getLevelName,
  getDifficultyText,
};

const archiveRef = toRef(props, "archive");
const indexRef = computed(() => props.index);

const {
  localVisible,
  isAnimating,
  cardData,
  tagStyle,
  toggleVisibility,
  editArchive,
  deleteArchive,
  handleCardClick: baseHandleCardClick,
} = useArchiveCard(archiveRef, indexRef, emit, translations);

// Cache tagStyle results to avoid creating new style objects on every render
const archiveDifficultyTagStyle = computed(() =>
  tagStyle(cardData.value?.archiveDifficultyText ?? "", t("archiveCard.archiveDifficulty")),
);
const actualDifficultyTagStyle = computed(() =>
  tagStyle(cardData.value?.actualDifficultyText ?? "", t("archiveCard.actualDifficulty")),
);

const highlightedName = computed(() => {
  if (!props.searchQuery) return props.archive.name;
  return highlightMatch(props.archive.name, props.searchQuery);
});

const highlightedLevel = computed(() => {
  if (!props.searchQuery) return cardData.value?.currentLevelName ?? "";
  return highlightMatch(cardData.value?.currentLevelName ?? "", props.searchQuery);
});

const handleCardClick = () => {
  if (props.isMultiSelectMode) {
    toggleSelection();
  } else {
    baseHandleCardClick();
  }
};

const toggleSelection = () => {
  emit("toggle-select", props.archive.id);
};

// ─── Entrance animation ──────────────────────────────
// Handled by Home.vue's animateCardsEntrance() via direct DOM
// manipulation (inline styles) — avoids Vue scoped-CSS and
// ref-timing issues with virtual scroll.
</script>

<style scoped>
/* Card container - optimized GPU acceleration.
   contain: layout style paint scopes layout/paint changes to the card
   itself — when .difficulty-tag width changes on hover, the browser
   recalculates layout only inside this card, without cascading to the
   CSS Grid or sibling cards.  Without this, every frame of the width
   transition would re-layout the entire grid row.

   We deliberately avoid will-change: transform here (see note below),
   but contain is safe because hover is user-initiated and synchronous —
   the stale-GPU-texture issue from WebView2 only applies to async
   content landing on compositing layers. */
.archive-card {
  position: relative;
  width: 100%;
  min-width: 320px;
  height: 160px;
  border-radius: var(--radius-card);
  overflow: hidden;
  cursor: default;
  background: var(--card-bg);
  border: var(--card-border);
  box-shadow: var(--card-shadow);
  /* contain: paint — limits paint invalidation to the card's own bounds.
     Without this, a hover-triggered background/color change on this card
     would force the browser to repaint the entire archive-grid parent.
     With contain:paint, only this card's pixels are re-rasterized.

     We deliberately skip will-change:transform here — it would promote
     every card to its own GPU compositing layer, and with 12-16 visible
     cards that's 12-16 GPU textures the compositor has to manage per
     scroll frame.  Hover-only will-change is on :hover below. */
  contain: paint;
  transition: transform 0.25s ease;
}

/* Disable all transform-related animations during deletion to avoid GSAP conflicts */
.archive-card.deleting,
.archive-card.deleting *,
.archive-card.deleting *::before,
.archive-card.deleting *::after {
  transition: opacity 0.2s linear !important;
  animation: none !important;
}

.archive-card.deleting:hover {
  transform: none !important;
}

.archive-card.deleting .card-background :deep(.lazy-image-container),
.archive-card.deleting .archive-info,
.archive-card.deleting .action-btn {
  transform: none !important;
  transition: none !important;
}

.archive-card:hover {
  /* Promote to own compositing layer — critical for parallel hovers.
     Without this, ALL hovered cards' paint work (box-shadow, background-color,
     border-color changes) targets the same parent layer's backing store,
     forcing sequential re-rasterization on the main thread.  With will-change,
     each card gets its own GPU backing store that the compositor's worker
     threads can rasterize in parallel.

     Safe during hover because user interaction guarantees every frame is
     committed — the stale-texture issue from the earlier comment only applies
     to async content arriving on a dormant compositing layer. */
  will-change: transform;
  transform: translateY(-4px);
  box-shadow: var(--card-shadow-hover);
  z-index: 2;
}

/* Background area */
.card-background {
  position: relative;
  width: 100%;
  height: 100px;
  overflow: hidden;
}

.card-background :deep(.lazy-image-container) {
  width: 100%;
  height: 100%;
  transform: scale(1.005);
  /* filter: blur() removed entirely — it requires a separate GPU
     render surface per card (8-12 simultaneous surfaces for visible
     cards).  Images are already optimized WebP at quality 15, the
     1px blur was perceptibly redundant and constantly consumed GPU
     blending bandwidth even when no hover is active. */
  transition: transform 0.3s ease;
}

.archive-card:hover .card-background :deep(.lazy-image-container) {
  transform: scale(1.02);
}

/* Background gradient overlay */
.background-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg,
      transparent 0%,
      rgba(0, 0, 0, 0.1) 30%,
      rgba(0, 0, 0, 0.4) 60%,
      rgba(0, 0, 0, 0.7) 100%);
  transition: opacity 0.25s ease;
}

.archive-card:hover .background-overlay {
  opacity: 0.85;
}

/* Archive info */
.archive-info {
  position: absolute;
  bottom: var(--space-2);
  left: var(--space-3);
  right: var(--space-3);
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  transition: transform 0.25s ease;
}

.archive-card:hover .archive-info {
  transform: translateY(-2px);
}

.archive-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 var(--space-1) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Game mode info */
.game-mode-info {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
}

/* Difficulty tag */
.difficulty-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  min-width: 30px;
  padding: 0 8px;
  border-radius: var(--radius-tag);
  font-size: 11px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(0, 0, 0, 0.35);
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  position: relative;
  width: var(--w-short, auto);
  /* Only transition width — background/color/border-color are per-frame
     paint operations that, when combined across multiple simultaneous
     hovers, overload the paint thread.  These snap instantly. */
  transition: width 0.1s ease;
}

.tag-short,
.tag-full {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  /* Opacity transition stays — it's compositor-only, no paint cost */
  transition: opacity 0.1s ease;
  white-space: nowrap;
}

.tag-short {
  opacity: 1;
}

.tag-full {
  opacity: 0;
}

.archive-card:hover .difficulty-tag {
  width: var(--w-full, var(--w-short, auto));
  padding: 0 12px;
}

.archive-card:hover .tag-short {
  opacity: 0;
}

.archive-card:hover .tag-full {
  opacity: 1;
}

/* Difficulty colors on hover */
.archive-card:hover .difficulty-easy {
  background: rgba(52, 199, 89, 0.25);
  color: #34c759;
  border-color: rgba(52, 199, 89, 0.5);
}

.archive-card:hover .difficulty-normal {
  background: rgba(255, 149, 0, 0.25);
  color: #ff9500;
  border-color: rgba(255, 149, 0, 0.5);
}

.archive-card:hover .difficulty-hard {
  background: rgba(255, 59, 48, 0.25);
  color: #ff3b30;
  border-color: rgba(255, 59, 48, 0.5);
}

.archive-card:hover .difficulty-nightmare {
  background: rgba(175, 82, 222, 0.25);
  color: #af52de;
  border-color: rgba(175, 82, 222, 0.5);
}

/* Lower info area */
.card-info {
  height: 60px;
  padding: var(--space-3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
}

.current-level {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Action buttons */
.action-buttons {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 26px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-button);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: rgba(128, 128, 128, 0.1);
  color: rgba(128, 128, 128, 0.7);
  border: 1px solid rgba(128, 128, 128, 0.2);
  /* Only transition compositor-friendly properties; background/color/
     border-color are paint-triggers that snap instantly. */
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease;
  position: relative;
  overflow: hidden;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Button hover colors - only change when button itself is hovered */
.action-btn.edit:hover {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
  border-color: rgba(52, 199, 89, 0.3);
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
}

.action-btn.copy:hover {
  background: rgba(0, 122, 255, 0.15);
  color: #007aff;
  border-color: rgba(0, 122, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.action-btn.delete:hover {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
  border-color: rgba(255, 59, 48, 0.3);
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
}

/* Button active/pressed styles */
.action-btn.edit:active {
  background: rgba(52, 199, 89, 0.25);
  transform: scale(0.95);
}

.action-btn.copy:active {
  background: rgba(0, 122, 255, 0.25);
  transform: scale(0.95);
}

.action-btn.delete:active {
  background: rgba(255, 59, 48, 0.25);
  transform: scale(0.95);
}

/* ========== Hidden mode: status badge ========== */
.hidden-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 15;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 200, 50, 0.25);
  border-radius: var(--radius-md);
  color: rgba(255, 200, 50, 0.8);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.3px;
  pointer-events: none;
  user-select: none;
}

/* Badge Vue Transition — enter with slight delay, leave quickly */
.badge-enter-active {
  transition:
    opacity 0.35s ease 0.05s,
    transform 0.35s ease 0.05s;
}

.badge-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.badge-enter-from,
.badge-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.archive-hidden:hover .hidden-badge {
  color: rgba(255, 200, 50, 0.95);
  border-color: rgba(255, 200, 50, 0.4);
  background: rgba(0, 0, 0, 0.7);
}

/* ========== Hidden mode styles ========== */
/* Core principle: preserve content readability, use additional visual indicators for hidden state */

/* Gold left marker bar - always present, hidden by default, animated on hidden state */
.archive-card::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 100%;
  background: rgba(255, 200, 50, 0.5);
  pointer-events: none;
  z-index: 12;
  opacity: 0;
  transition:
    width 0.35s ease,
    opacity 0.35s ease,
    background 0.35s ease;
}

.archive-card.archive-hidden::after {
  width: 4px;
  opacity: 1;
}

.archive-card.archive-hidden:hover::after {
  background: rgba(255, 200, 50, 0.75);
  width: 5px;
}

/* Hidden state: border with gold accent */
.archive-hidden {
  border-color: rgba(255, 200, 50, 0.15);
  transition:
    border-color 0.35s ease,
    opacity 0.35s ease;
}

.archive-hidden:hover {
  border-color: rgba(255, 200, 50, 0.25);
  transform: translateY(-3px);
  box-shadow: var(--card-shadow-hover);
}

/* Hidden state: background image slightly desaturated, preserving clarity */
.archive-hidden .card-background :deep(.lazy-image-container) {
  filter: grayscale(0.35) brightness(0.9);
  transition:
    filter 0.4s ease-in-out,
    transform 0.4s ease-in-out;
}

.archive-hidden:hover .card-background :deep(.lazy-image-container) {
  filter: grayscale(0.15) brightness(0.95);
  transform: scale(1.02);
}

/* Hidden state: background overlay unchanged, keeping image content visible */
.archive-hidden .background-overlay {
  background: linear-gradient(180deg,
      transparent 0%,
      rgba(0, 0, 0, 0.1) 30%,
      rgba(0, 0, 0, 0.4) 60%,
      rgba(0, 0, 0, 0.7) 100%);
}

/* Hidden state: archive name slightly softened */
.archive-hidden .archive-name {
  color: rgba(255, 255, 255, 0.75);
}

.archive-hidden:hover .archive-name {
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}

/* Hidden state: difficulty tags display normally */
.archive-hidden .difficulty-tag {
  opacity: 0.85;
}

.archive-hidden:hover .difficulty-tag {
  opacity: 1;
}

/* Hidden state: bottom info remains fully readable */
.archive-hidden .card-info {
  opacity: 0.85;
  transition: opacity 0.35s ease;
}

.archive-hidden:hover .card-info {
  opacity: 1;
}

.archive-hidden .current-level {
  color: var(--text-secondary);
}

.archive-hidden:hover .current-level {
  color: var(--text-primary);
}

/* Hidden state: action buttons remain usable */
.archive-hidden .action-btn {
  opacity: 0.6;
}

.archive-hidden:hover .action-btn {
  opacity: 0.9;
}

.archive-hidden .action-btn:hover {
  opacity: 1;
}

/* Hidden state: eye icon subtle hint */
.archive-hidden .copy .fa-eye-slash {
  color: rgba(255, 200, 50, 0.5);
}

.archive-hidden:hover .copy .fa-eye-slash {
  color: rgba(255, 200, 50, 0.85);
}

/* Visibility toggle transition — override all property durations during animation window */
.visibility-transitioning,
.visibility-transitioning * {
  transition-duration: 0.25s !important;
  transition-timing-function: ease !important;
}

/* Responsive */
@media (max-width: 768px) {
  .archive-card {
    min-width: 280px;
    height: 140px;
  }

  .card-background {
    height: 90px;
  }

  .card-info {
    height: 50px;
    padding: var(--space-2) var(--space-3);
  }

  .archive-name {
    font-size: 14px;
  }

  .current-level {
    font-size: 13px;
  }

  .difficulty-tag {
    height: 18px;
    font-size: 10px;
  }

  .archive-card:hover {
    transform: translateY(-2px);
  }
}

@media (max-width: 480px) {
  .archive-card {
    min-width: 100%;
    max-width: 320px;
    height: 130px;
  }

  .card-background {
    height: 80px;
  }

  .card-info {
    height: 50px;
    padding: var(--space-2);
  }

  .archive-name {
    font-size: 13px;
  }

  .current-level {
    font-size: 12px;
  }

  .difficulty-tag {
    height: 16px;
    font-size: 9px;
    min-width: 26px;
  }

  .archive-info {
    left: var(--space-2);
    right: var(--space-2);
    bottom: var(--space-1);
  }
}

/* Touch devices */
@media (hover: none) and (pointer: coarse) {
  .action-btn {
    min-width: 40px;
    height: 32px;
  }

  .archive-card:hover {
    transform: none;
  }

  /* Touch devices: tags always expanded */
  .difficulty-tag {
    width: var(--w-full, var(--w-short, auto));
    padding: 0 12px;
  }

  .tag-short {
    opacity: 0;
  }

  .tag-full {
    opacity: 1;
  }
}

/* Search result highlight marker */
.archive-name :deep(.search-highlight),
.current-level :deep(.search-highlight) {
  background: rgba(var(--accent-color-rgb), 0.3);
  color: var(--accent-color);
  border-radius: var(--radius-xs);
  padding: 0 1px;
}

/* Multi-select mode styles */
.multi-select-checkbox {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 20;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.multi-select-checkbox .check-icon {
  font-size: 14px;
  color: transparent;
  transition: all 0.15s ease;
}

.multi-select-checkbox:hover {
  background: rgba(0, 0, 0, 0.65);
  border-color: rgba(255, 255, 255, 0.5);
}

.multi-select-checkbox.is-checked {
  background: var(--primary);
  border-color: var(--primary);
}

.multi-select-checkbox.is-checked .check-icon {
  color: #fff;
}

.multi-select-checkbox.is-checked:hover {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
}

.archive-card.multi-select-mode {
  cursor: pointer;
}

.archive-card.is-selected {
  box-shadow:
    0 0 0 2px var(--primary),
    var(--card-shadow);
}

.archive-card.is-selected .card-background::after {
  content: "";
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  pointer-events: none;
}
</style>

<!-- High animation quality: re-enable backdrop-filter for capable devices -->
<style scoped>
[data-animation-quality="high"] .difficulty-tag {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
}

[data-animation-quality="high"] .archive-card:hover .difficulty-tag {
  backdrop-filter: blur(8px);
}

[data-animation-quality="high"] .hidden-badge {
  backdrop-filter: blur(4px);
}
</style>
