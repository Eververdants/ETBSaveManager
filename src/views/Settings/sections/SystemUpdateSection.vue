<template>
  <!-- System and updates settings group -->
  <div class="setting-group">
    <transition name="text-swift" mode="out-in">
      <div :key="appStore.language" class="section-header">
        {{ t("settings.systemAndUpdates") }}
      </div>
    </transition>

    <!-- Check for updates -->
    <div class="setting-item">
      <div class="setting-icon">
        <font-awesome-icon :icon="['fas', 'download']" />
      </div>
      <div class="setting-details">
        <transition name="text-swift" mode="out-in">
          <div :key="appStore.language" class="setting-title">
            {{ t("settings.checkUpdates") }}
          </div>
        </transition>
        <transition name="text-swift" mode="out-in">
          <div :key="appStore.language" class="setting-description">
            {{ t("settings.checkUpdatesDescription") }}
          </div>
        </transition>
      </div>
      <div class="setting-action">
        <button class="check-update-btn" :disabled="checkingUpdate" @click="checkForUpdates(true)">
          <font-awesome-icon v-if="checkingUpdate" :icon="['fas', 'spinner']" spin />
          <transition name="text-swift" mode="out-in">
            <span :key="appStore.language + '-' + checkingUpdate">
              {{ checkingUpdate ? t("settings.checking") : t("settings.check") }}
            </span>
          </transition>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { updateService } from "../../../services/updateService.js";
import { notify } from "../../../services/notificationService";
import { useAppStore } from "../../../stores/appStore";

const { t } = useI18n({ useScope: "global" });
const appStore = useAppStore();

const checkingUpdate = ref(false);
const isProcessing = ref(false);
const updateInfo = ref(null);

async function checkForUpdates(isManual = true) {
  if (isProcessing.value) return;

  isProcessing.value = true;
  checkingUpdate.value = true;

  try {
    const update = await updateService.checkForUpdates();

    if (update.shouldUpdate) {
      updateInfo.value = update;

      // Use new notification system with buttons
      notify.info(t("settings.newVersionAvailable", { version: update.version }), {
        title: t("settings.updateAvailable"),
        icon: ["fas", "download"],
        details: update.body ? { description: update.body.substring(0, 100) + "..." } : null,
        actions: [
          {
            text: t("settings.goToDownload"),
            type: "primary",
            icon: ["fas", "external-link-alt"],
            onClick: () => downloadAndInstall(),
          },
          {
            text: t("common.later"),
            type: "secondary",
          },
        ],
      });
    } else {
      // Only show "already up to date" notification for manual checks
      if (isManual) {
        notify.success(t("settings.latestVersion"));
      }
    }
  } catch (error) {
    // Auto-check on entering settings: silently ignore errors (no popup)
    if (!isManual) return;

    let errorText = t("settings.updateFailed");
    if (error.type === "Rate Limit") {
      errorText = t("settings.rateLimitError");
    } else if (error.type === "Network Connection") {
      errorText = t("settings.networkError");
    } else if (error.type === "Resource Not Found") {
      errorText = t("settings.resourceNotFound");
    } else if (error.type === "Access Restricted") {
      errorText = t("settings.accessDenied");
    }

    notify.error(errorText, { duration: 8000 });
  } finally {
    checkingUpdate.value = false;
    isProcessing.value = false;
  }
}

async function downloadAndInstall() {
  if (!updateInfo.value || isProcessing.value) return;

  isProcessing.value = true;

  try {
    notify.info(t("settings.openingDownloadPage"));

    await updateService.downloadAndInstall();

    // Successfully opened download page
    notify.success(t("settings.downloadPageOpened"));
  } catch (error) {
    console.error(t("settings.openDownloadPageFailed"), error);
    notify.error(t("settings.openDownloadPageFailed"));
  } finally {
    isProcessing.value = false;
  }
}

onMounted(async () => {
  // Auto-check for updates on startup — silent on already up-to-date, once per day
  if (updateService.canCheckUpdate && updateService.canCheckUpdate()) {
    await checkForUpdates(false);
    updateService.recordLastCheck();
  }
});
</script>

<style scoped>
.check-update-btn {
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-4);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition:
    all 0.2s ease,
    background-color 0.25s ease,
    color 0.25s ease,
    transform 0.25s ease;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1-5);
  /* Add subtle shadow */
  filter: drop-shadow(var(--filter-shadow-sm));
}

.check-update-btn:hover:not(:disabled) {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
  /* Enhance hover shadow */
  filter: drop-shadow(var(--filter-shadow-md));
}

.check-update-btn:active:not(:disabled) {
  transform: translateY(0);
  filter: drop-shadow(var(--filter-shadow-sm));
}

.check-update-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transition: opacity 0.25s ease;
}
</style>
