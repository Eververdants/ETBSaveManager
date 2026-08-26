<template>
  <div class="step-content" data-step="1">
    <!-- Ending selector -->
    <div class="ending-selector">
      <div ref="endingGroupRef" class="ending-group">
        <!-- Sliding highlight indicator -->
        <div
          class="ending-slider"
          :style="{
            width: `${sliderState.width}px`,
            transform: `translateX(${sliderState.left}px)`,
            opacity: sliderState.active ? 1 : 0,
          }"
        />
        <div
          v-for="(tab, index) in groupTabs"
          :key="index"
          class="ending-tab"
          :class="{ active: isTabActive(index) }"
          @click="handleEndingClick(index)"
        >
          <span class="ending-label">{{ tab.label }}</span>
        </div>
      </div>
    </div>

    <!-- Level search — outside section-card so it doesn't scroll -->
    <div class="level-search">
      <font-awesome-icon :icon="['fas', 'search']" class="level-search-icon" />
      <input
        v-model="searchQuery"
        type="text"
        class="level-search-input"
        :placeholder="$t('createArchive.levelSearch.placeholder')"
      />
      <button v-if="searchActive" class="level-search-clear" @click="searchQuery = ''">
        <font-awesome-icon :icon="['fas', 'times']" />
      </button>
    </div>

    <!-- Level selection cards -->
    <div class="section-card">
      <Transition name="level-grid-fade" mode="out-in">
        <div
          v-if="displayList.length > 0"
          :key="transitionKey"
          class="level-grid"
        >
          <div
            v-for="card in displayList"
            :key="`${card.routeIndex}-${card.levelKey}`"
            class="level-card"
            :class="{ selected: isSelected(card) }"
            @click="handleSelectLevel(card, $event)"
          >
            <div class="level-img-wrap">
              <LazyImage :src="card.image" :alt="card.name" image-class="level-img" />
              <!-- Distinguishing tag only while searching — keeps browsing clean -->
              <span v-if="searchActive && card.sharedMain" class="tag-on-image">{{
                $t("editArchive.unlockMainBadge")
              }}</span>
              <div v-if="isSelected(card)" class="level-check">
                <font-awesome-icon :icon="['fas', 'check-circle']" />
              </div>
            </div>
            <span class="level-name">
              <span v-if="searchActive && card.routeLabel" class="origin-label">{{ card.routeLabel }}</span>
              {{ card.name }}
            </span>
          </div>
        </div>
        <div v-else key="empty" class="level-empty">
          {{ $t("createArchive.levelSearch.noResults") }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, reactive, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { gsap } from "gsap";
import LazyImage from "@/components/ui/LazyImage.vue";
import { ENDINGS_CONFIG, ENDING_LEVELS } from "@/data/endingsData";

const props = defineProps({
  selectedLevel: { type: Number, default: -1 },
  selectedEnding: { type: Number, default: 0 },
  availableLevels: { type: Array, default: () => [] },
  endings: { type: Array, default: () => [] },
});

const emit = defineEmits(["select-level", "select-ending"]);

// --- Level search across ALL endings (mirrors the editor's picker) ---
const { t, te } = useI18n({ useScope: "global" });
const lvlName = (k) => {
  const i18nKey = `LevelName_Display.${k}`;
  return te(i18nKey) ? t(i18nKey) : k;
};
const mainRoute = new Set(ENDING_LEVELS[0] || []);

// Tab model: the four routes plus a trailing "special" bucket (LevelCheat)
const specialActive = ref(false);
const localPickedKey = ref(null);
const groupTabs = computed(() => [
  ...props.endings.map((e) => ({ label: e.label, special: false })),
  { label: t("editArchive.levelGroup.special"), special: true },
]);
const cheatCard = {
  name: lvlName("LevelCheat"),
  image: "/images/ETB/LevelCheat.webp",
  levelKey: "LevelCheat",
  routeIndex: -1,
  routeLabel: "",
  sharedMain: false,
};

const isTabActive = (index) => {
  const tab = groupTabs.value[index];
  if (!tab) return false;
  return tab.special ? specialActive.value : !specialActive.value && props.selectedEnding === index;
};

const searchQuery = ref("");
const searchActive = computed(() => searchQuery.value.trim() !== "");

// Every route's levels, decorated so search can cross ending boundaries
const allRouteCards = computed(() => {
  const out = [];
  ENDINGS_CONFIG.forEach((cfg, ci) => {
    (ENDING_LEVELS[cfg.id] || []).forEach((k) => {
      out.push({
        name: lvlName(k),
        image: `/images/ETB/${k}.webp`,
        levelKey: k,
        routeIndex: ci,
        routeLabel: props.endings[ci]?.label || "",
        sharedMain: ci !== 0 && mainRoute.has(k),
      });
    });
  });
  return out;
});

const displayList = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q && specialActive.value) return [cheatCard];
  if (!q) return props.availableLevels.map((l) => ({ ...l }));
  return allRouteCards.value.filter((c) => c.name.toLowerCase().includes(q));
});

const transitionKey = computed(() =>
  searchActive.value ? "search" : `ending-${props.selectedEnding}`,
);

const isSelected = (card) =>
  card.levelKey === localPickedKey.value ||
  props.availableLevels[props.selectedLevel]?.levelKey === card.levelKey;

// Switching endings resets the query/special state so each tab starts clean
watch(
  () => props.selectedEnding,
  () => {
    searchQuery.value = "";
    specialActive.value = false;
    localPickedKey.value = null;
  },
);

// --- Sliding indicator ---
const endingGroupRef = ref(null);
const sliderState = reactive({
  width: 0,
  left: 0,
  active: false,
});

const updateSlider = () => {
  if (!endingGroupRef.value) return;
  const container = endingGroupRef.value;
  const activeTab = container.querySelector(".ending-tab.active");
  if (!activeTab) return;

  const containerRect = container.getBoundingClientRect();
  const tabRect = activeTab.getBoundingClientRect();

  sliderState.width = tabRect.width;
  sliderState.left = tabRect.left - containerRect.left;
  sliderState.active = true;
};

watch(
  () => props.selectedEnding,
  () => {
    nextTick(() => updateSlider());
  },
);

onMounted(() => {
  // Wait for DOM to be fully painted before measuring
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateSlider();
      });
    });
  });
  window.addEventListener("resize", updateSlider);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateSlider);
});

const handleEndingClick = (index) => {
  const tab = groupTabs.value[index];
  if (tab?.special) {
    if (specialActive.value) return;
    specialActive.value = true;
    searchQuery.value = "";
    localPickedKey.value = cheatCard.levelKey;
    emit("select-level", cheatCard); // parent records the special pick
    nextTick(() => updateSlider());
    return;
  }
  specialActive.value = false;
  if (props.selectedEnding === index) return;
  emit("select-ending", index);
};

// --- Level card click animation ---
const handleSelectLevel = (card, event) => {
  const el = event.currentTarget;
  gsap.killTweensOf(el);
  gsap
    .timeline()
    .to(el, {
      scale: 0.97,
      duration: 0.08,
      ease: "power2.out",
      overwrite: true,
    })
    .to(el, {
      scale: 1,
      duration: 0.18,
      ease: "power2.out",
      onComplete: () => gsap.set(el, { clearProps: "transform" }),
    });
  // Emit the CARD (levelKey-bearing): parent resolves the right route/index,
  // switching endings when a cross-route search result is picked.
  localPickedKey.value = card.levelKey;
  emit("select-level", card);
};
</script>

<style scoped>
/* Ending selector styles */
.ending-selector {
  margin-bottom: 20px;
  overflow: visible;
  display: flex;
  justify-content: center;
}

/* Segmented control group */
.ending-group {
  position: relative;
  display: inline-flex;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 4px;
  gap: 2px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08));
}

/* Sliding highlight pill */
.ending-slider {
  position: absolute;
  top: 4px;
  left: 0;
  height: calc(100% - 8px);
  background: var(--accent-color);
  border-radius: var(--radius-md);
  filter: drop-shadow(0 2px 8px rgba(var(--accent-color-rgb), 0.35))
    drop-shadow(0 1px 3px rgba(var(--accent-color-rgb), 0.2));
  pointer-events: none;
  transition:
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.2s ease;
  z-index: 0;
}

.ending-tab {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: var(--radius-md);
  cursor: pointer;
  background: transparent;
  border: none;
  user-select: none;
  transition: none;
  white-space: nowrap;
}

.ending-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.25s ease;
  white-space: nowrap;
}

.ending-tab.active .ending-label {
  color: #ffffff;
  font-weight: 600;
}

.ending-tab:not(.active):hover .ending-label {
  color: var(--text-primary);
}

.ending-tab:active {
  transform: scale(0.96);
}

/* Level search bar — same look as the editor's picker */
.level-search {
  position: relative;
  margin-bottom: 18px;
}

.level-search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  font-size: 15px;
  line-height: 1;
  pointer-events: none;
}

.level-search-input {
  width: 100%;
  padding: 12px 42px 12px 44px;
  border: 1px solid var(--border-color);
  background: linear-gradient(145deg, var(--card-bg) 0%, var(--bg-secondary) 100%);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
  border-radius: var(--radius-md);
  outline: none;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.level-search-input::placeholder {
  color: var(--text-tertiary);
}

.level-search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  background: var(--card-bg);
  box-shadow:
    0 0 0 3px rgba(var(--accent-color-rgb), 0.12),
    inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.level-search-clear {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--radius-circle, 50%);
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  font-size: 11px;
  cursor: pointer;
}

.level-search-clear:hover {
  background: var(--accent-color);
  color: #fff;
}

.level-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 56px 16px;
  color: var(--text-tertiary);
  font-size: 14px;
}

/* Card styles - optimized */
.section-card {
  background: linear-gradient(145deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-radius: var(--radius-card);
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.08)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.05));
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  height: calc(100vh - 340px);
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

/* Top highlight effect */
.section-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 20px;
  right: 20px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  pointer-events: none;
}

/* Custom scrollbar */
.section-card::-webkit-scrollbar {
  width: 6px;
}

.section-card::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}

.section-card::-webkit-scrollbar-thumb {
  background: rgba(var(--accent-color-rgb), 0.3);
  border-radius: var(--radius-xs);
  transition: background 0.2s ease;
}

.section-card::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--accent-color-rgb), 0.5);
}

/* Level grid */
.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 18px;
  padding: 4px;
}

.level-grid-fade-enter-active,
.level-grid-fade-leave-active {
  transition: opacity 0.18s ease;
}

.level-grid-fade-enter-from,
.level-grid-fade-leave-to {
  opacity: 0;
}

.level-card {
  background: linear-gradient(160deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    filter 0.35s ease,
    border-color 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.03);
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.06));
}

@media (hover: hover) and (pointer: fine) {
  .level-card:hover {
    will-change: transform;
    transform: translateY(-8px);
    filter: drop-shadow(0 18px 36px rgba(0, 0, 0, 0.14)) drop-shadow(0 6px 14px rgba(0, 0, 0, 0.1));
    border-color: rgba(var(--accent-color-rgb), 0.25);
  }
}

.level-card:active {
  transform: translateY(-3px) scale(0.98);
  transition-duration: 0.1s;
}

.level-card.selected {
  border-color: var(--accent-color);
  border-width: 1.5px;
  box-shadow: inset 0 0 0 3px rgba(var(--accent-color-rgb), 0.2);
  filter: drop-shadow(0 8px 20px rgba(var(--accent-color-rgb), 0.15));
  transform: translateY(-2px);
}

.level-img-wrap {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.level-img-wrap :deep(.level-img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (hover: hover) and (pointer: fine) {
  .level-card:hover .level-img-wrap :deep(.level-img) {
    transform: scale(1.1);
  }
}

/* Selected check — top-right circle, like the editor */
.level-check {
  position: absolute;
  top: 10px;
  right: 10px;
  color: var(--primary, var(--accent-color));
  font-size: 24px;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4));
  z-index: 2;
}

/* Main-ending unlock tag — only while searching; pill badge on image */
.tag-on-image {
  position: absolute;
  bottom: 8px;
  left: 8px;
  z-index: 2;
  padding: 4px 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--accent-color) 0%, color-mix(in srgb, var(--accent-color) 80%, #fff 20%) 100%);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Name strip below the image — same treatment as the editor */
.level-name {
  display: block;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: linear-gradient(to bottom, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-top: 1px solid var(--border-color);
  margin: 0;
}

/* Origin route shown on cross-ending search results */
.origin-label {
  display: block;
  font-size: 10px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-bottom: 2px;
}

@media (hover: hover) and (pointer: fine) {
  .level-card:hover .level-name {
    color: var(--accent-color);
  }
}

.level-card.selected .level-name {
  color: var(--accent-color);
  font-weight: 700;
}

/* Responsive */
@media (max-width: 768px) {
  .ending-group {
    width: 100%;
  }

  .ending-tab {
    flex: 1;
    justify-content: center;
    padding: 8px 12px;
  }

  .ending-label {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .ending-tab {
    padding: 6px 10px;
  }

  .ending-label {
    font-size: 11px;
  }
}
</style>
