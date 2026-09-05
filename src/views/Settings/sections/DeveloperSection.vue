<template>
  <!-- Developer options settings group -->
  <div class="setting-group">
    <transition name="text-swift" mode="out-in">
      <div :key="appStore.language" class="section-header">
        {{ t("settings.developerOptions") }}
      </div>
    </transition>

    <!-- Developer mode toggle -->
    <div class="setting-item">
      <div class="setting-icon">
        <font-awesome-icon :icon="['fas', 'code']" />
      </div>
      <div class="setting-details">
        <transition name="text-swift" mode="out-in">
          <div :key="appStore.language" class="setting-title">
            {{ t("settings.developerMode") }}
          </div>
        </transition>
        <transition name="text-swift" mode="out-in">
          <div :key="appStore.language" class="setting-description">
            {{ t("settings.developerModeDescription") }}
          </div>
        </transition>
      </div>
      <div class="setting-action">
        <label class="switch">
          <input v-model="developerModeEnabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Performance monitor toggle -->
    <div v-if="appStore.developerModeEnabled" class="setting-item">
      <div class="setting-icon">
        <font-awesome-icon :icon="['fas', 'tachometer-alt']" />
      </div>
      <div class="setting-details">
        <transition name="text-swift" mode="out-in">
          <div :key="appStore.language" class="setting-title">
            {{ t("settings.performanceMonitor") }}
          </div>
        </transition>
        <transition name="text-swift" mode="out-in">
          <div :key="appStore.language" class="setting-description">
            {{ t("settings.performanceMonitorDescription") }}
          </div>
        </transition>
      </div>
      <div class="setting-action">
        <label class="switch">
          <input v-model="performanceMonitorEnabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Reset tutorial button -->
    <div v-if="appStore.developerModeEnabled" class="setting-item">
      <div class="setting-icon">
        <font-awesome-icon :icon="['fas', 'graduation-cap']" />
      </div>
      <div class="setting-details">
        <transition name="text-swift" mode="out-in">
          <div :key="appStore.language" class="setting-title">
            {{ t("settings.resetTutorial") }}
          </div>
        </transition>
        <transition name="text-swift" mode="out-in">
          <div :key="appStore.language" class="setting-description">
            {{ t("settings.resetTutorialDescription") }}
          </div>
        </transition>
      </div>
      <div class="setting-action">
        <button class="reset-tutorial-btn" @click="handleResetTutorial">
          <font-awesome-icon :icon="['fas', 'redo']" />
          <transition name="text-swift" mode="out-in">
            <span :key="appStore.language">{{ t("settings.resetTutorialButton") }}</span>
          </transition>
        </button>
      </div>
    </div>

    <!-- Save file tools -->
    <div v-if="appStore.developerModeEnabled" class="setting-item sav-tools-section">
      <div class="setting-icon">
        <font-awesome-icon :icon="['fas', 'file-code']" />
      </div>
      <div class="setting-details full-width">
        <transition name="text-swift" mode="out-in">
          <div :key="appStore.language" class="setting-title">
            {{ t("settings.savFileTools") }}
          </div>
        </transition>

        <div class="sav-tools-container">
          <!-- Parse save file -->
          <div
            class="drop-zone"
            :class="{ 'drag-over': parseDragOver, processing: isParsing }"
            @dragover.prevent="parseDragOver = true"
            @dragleave.prevent="parseDragOver = false"
            @drop.prevent="handleParseDrop"
            @click="triggerParseFileInput"
          >
            <div class="drop-zone-content">
              <font-awesome-icon
                :icon="isParsing ? ['fas', 'spinner'] : ['fas', 'file-import']"
                :spin="isParsing"
                class="drop-icon"
              />
              <div class="drop-title">
                {{ isParsing ? t("settings.parsing") : t("settings.parseSavFile") }}
              </div>
            </div>
          </div>

          <!-- Pack save file -->
          <div
            class="drop-zone"
            :class="{ 'drag-over': packDragOver, processing: isPacking }"
            @dragover.prevent="packDragOver = true"
            @dragleave.prevent="packDragOver = false"
            @drop.prevent="handlePackDrop"
            @click="triggerPackFileInput"
          >
            <div class="drop-zone-content">
              <font-awesome-icon
                :icon="isPacking ? ['fas', 'spinner'] : ['fas', 'file-export']"
                :spin="isPacking"
                class="drop-icon"
              />
              <div class="drop-title">
                {{ isPacking ? t("settings.packing") : t("settings.packSavFile") }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import storage from "@/services/storageService";
import { notify } from "@/services/notificationService";
import { useAppStore } from "@/stores/appStore";
import { useSavTools } from "@/composables/useSavTools";

const { t } = useI18n({ useScope: "global" });
const appStore = useAppStore();

// Two-way bindings straight onto the store (persistence handled by the store)
const developerModeEnabled = computed({
  get: () => appStore.developerModeEnabled,
  set: (enabled) => appStore.setDeveloperMode(enabled),
});

const performanceMonitorEnabled = computed({
  get: () => appStore.performanceMonitorEnabled,
  set: (enabled) => appStore.setPerformanceMonitor(enabled),
});

function handleResetTutorial() {
  // Clear quick create tutorial completion flag
  storage.removeItem("quick_create_tutorial_completed");

  // Show success notification
  notify.success(t("settings.tutorialReset"));
}

const {
  parseDragOver,
  packDragOver,
  isParsing,
  isPacking,
  triggerParseFileInput,
  triggerPackFileInput,
  handleParseDrop,
  handlePackDrop,
} = useSavTools();
</script>

<style scoped>
/* Reset tutorial button */
.reset-tutorial-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-warning);
  color: white;
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
  position: relative;
  overflow: hidden;
}

.reset-tutorial-btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.reset-tutorial-btn:hover::before {
  left: 100%;
}

.reset-tutorial-btn:hover {
  background-color: var(--color-warning-hover, #e58600);
  border-color: var(--color-warning-hover, #e58600);
  filter: drop-shadow(0 4px 8px rgba(255, 149, 0, 0.25));
  transform: translateY(-1px);
}

/* Save file tool styles */
.sav-tools-section {
  flex-direction: column;
  align-items: flex-start;
}

.sav-tools-section .setting-details.full-width {
  width: 100%;
  margin-right: 0;
}

.sav-tools-container {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.drop-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-4);
  border: 1.5px dashed var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--bg-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 180px;
}

.drop-zone:hover {
  border-color: var(--accent-color);
  background-color: color-mix(in srgb, var(--accent-color) 5%, transparent);
}

.drop-zone.drag-over {
  border-color: var(--accent-color);
  background-color: color-mix(in srgb, var(--accent-color) 10%, transparent);
  border-style: solid;
}

.drop-zone.processing {
  pointer-events: none;
  opacity: 0.7;
  border-color: var(--accent-color);
}

.drop-zone-content {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.drop-icon {
  font-size: 18px;
  color: var(--accent-color);
}

.drop-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
}

@media (max-width: 480px) {
  .sav-tools-container {
    flex-direction: column;
  }

  .drop-zone {
    min-width: auto;
    width: 100%;
  }
}
</style>
