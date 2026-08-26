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
          v-for="(ending, index) in endings"
          :key="index"
          class="ending-tab"
          :class="{ active: selectedEnding === index }"
          @click="handleEndingClick(index)"
        >
          <span class="ending-label">{{ ending.label }}</span>
        </div>
      </div>
    </div>

    <!-- Level search -->
    <div class="level-search">
      <font-awesome-icon :icon="['fas', 'magnifying-glass']" class="search-icon" />
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        :placeholder="$t('createArchive.levelSearch.placeholder')"
      />
    </div>

    <!-- Level selection cards -->
    <div class="section-card">
      <Transition name="level-grid-fade" mode="out-in">
        <div
          v-if="filteredLevels.length > 0"
          :key="selectedEnding"
          class="level-grid"
        >
          <div
            v-for="level in filteredLevels"
            :key="level.levelKey"
            class="level-card"
            :class="{ selected: selectedLevel === availableLevels.indexOf(level) }"
            @click="handleSelectLevel(availableLevels.indexOf(level), $event)"
          >
            <div class="level-image-container">
              <LazyImage :src="level.image" :alt="level.name" image-class="level-image" />
              <div class="level-overlay">
                <font-awesome-icon
                  v-if="selectedLevel === availableLevels.indexOf(level)"
                  :icon="['fas', 'check']"
                  class="check-icon"
                />
              </div>
            </div>
            <div class="level-info">
              <h3 class="level-name">{{ level.name }}</h3>
            </div>
          </div>
        </div>
        <div v-else :key="`empty-${selectedEnding}`" class="level-empty">
          {{ $t("createArchive.levelSearch.noResults") }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, reactive, onMounted, onUnmounted } from "vue";
import { gsap } from "gsap";
import LazyImage from "@/components/ui/LazyImage.vue";

const props = defineProps({
  selectedLevel: { type: Number, default: -1 },
  selectedEnding: { type: Number, default: 0 },
  availableLevels: { type: Array, default: () => [] },
  endings: { type: Array, default: () => [] },
});

const emit = defineEmits(["select-level", "select-ending"]);

// --- Level search (filters the current ending's cards by display name) ---
const searchQuery = ref("");
const filteredLevels = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return props.availableLevels;
  return props.availableLevels.filter((l) => l.name.toLowerCase().includes(q));
});

// Switching endings resets the query so each tab starts unfiltered
watch(
  () => props.selectedEnding,
  () => {
    searchQuery.value = "";
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
  if (props.selectedEnding === index) return;
  emit("select-ending", index);
};

// --- Level card click animation ---
const handleSelectLevel = (index, event) => {
  const card = event.currentTarget;
  gsap.killTweensOf(card);
  gsap
    .timeline()
    .to(card, {
      scale: 0.97,
      duration: 0.08,
      ease: "power2.out",
      overwrite: true,
    })
    .to(card, {
      scale: 1,
      duration: 0.18,
      ease: "power2.out",
      onComplete: () => gsap.set(card, { clearProps: "transform" }),
    });
  emit("select-level", index);
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

/* Level search bar */
.level-search {
  position: relative;
  margin-bottom: 16px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 14px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 14px 0 40px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.search-input:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.15);
}

.level-empty {
  padding: 48px 0;
  text-align: center;
  color: var(--text-secondary);
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
  height: calc(100vh - 280px);
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

/* Hover motion gated to precise pointers — touch gets :active feedback
   instead, no sticky hover. will-change only while hovered. */
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

.level-image-container {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.level-image-container :deep(.level-image) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (hover: hover) and (pointer: fine) {
  .level-card:hover .level-image-container :deep(.level-image) {
    transform: scale(1.1);
  }
}

.level-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.35s ease;
}

@media (hover: hover) and (pointer: fine) {
  .level-card:hover .level-overlay {
    opacity: 0.6;
    background: rgba(var(--accent-color-rgb), 0.15);
  }
}

.level-card.selected .level-overlay {
  opacity: 1;
  background: rgba(var(--accent-color-rgb), 0.4);
}

.level-card.selected .level-overlay .check-icon {
  transform: scale(1);
}

.check-icon {
  color: white;
  font-size: 32px;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
}

.level-info {
  padding: 14px 12px;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.02) 100%);
}

.level-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  text-align: center;
  line-height: 1.4;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s ease;
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
