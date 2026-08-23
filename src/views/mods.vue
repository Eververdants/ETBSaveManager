<template>
  <div class="mods-container">
    <main class="mods-content">
      <!-- ─── Game path ─── -->
      <section class="list-section">
        <h3 class="section-title">{{ t("mods.gamePath.title") }}</h3>
        <div class="list-item path-row">
          <span class="path-value" :class="{ unset: !gameRoot || !pathValid }" :title="gameRoot || ''">
            {{ gameRoot || t("mods.gamePath.notSet") }}
          </span>
          <span v-if="pathValid" class="badge on">{{ t("mods.gamePath.validShort") }}</span>
          <span v-else-if="gameRoot" class="badge warn">{{ t("mods.gamePath.invalidShort") }}</span>
        </div>
        <div v-if="gameRoot && pathValid === false" class="list-item single error-text">
          {{ pathErrorText }}
        </div>
        <div class="list-item actions-row">
          <button class="btn primary" :disabled="busy" @click="pickGameFolder">
            {{ t("mods.gamePath.choose") }}
          </button>
          <button v-if="gameRoot && pathValid" class="btn ghost" :disabled="busy" @click="openWin64Folder">
            {{ t("mods.gamePath.openFolder") }}
          </button>
        </div>
      </section>

      <!-- ─── Install progress ─── -->
      <section v-if="progress.visible" class="list-section progress-section">
        <div class="list-item progress-head">
          <span>{{ progressLabel }}</span>
          <span class="progress-percent">{{ smoothPercent }}%</span>
        </div>
        <div class="progress-track-wrap">
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: smoothPercent + '%' }"></div>
          </div>
        </div>
      </section>

      <!-- ─── UE4SS ─── -->
      <section class="list-section">
        <h3 class="section-title mod-section-title">
          <span>UE4SS</span>
          <a
            class="mod-link"
            href="https://github.com/EscapeTheBackroomsCommunity/UE4SS/releases"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </h3>
        <div class="list-item single mod-desc">{{ t("mods.ue4ss.desc") }}</div>
        <div class="list-item">
          <span>{{ t("mods.status.label") }}</span>
          <span class="status-side">
            <span v-if="status?.ue4ss_installed && status.win64_dir" class="win64-path" :title="status.win64_dir">
              {{ status.win64_dir }}
            </span>
            <span class="badge" :class="ue4ssBadgeClass">{{ ue4ssStatusText }}</span>
          </span>
        </div>
        <div class="list-item actions-row">
          <template v-if="!status?.ue4ss_installed">
            <button class="btn primary" :disabled="!canInstall || busy" @click="installUe4ss('recommended')">
              {{ t("mods.ue4ss.installRecommended") }}
            </button>
            <button class="btn secondary" :disabled="!canInstall || busy" @click="installUe4ss('latest')">
              {{ t("mods.ue4ss.installLatest") }}
            </button>
          </template>
          <button v-else class="btn danger" :disabled="busy" @click="confirmUe4ssUninstall">
            {{ t("mods.common.uninstall") }}
          </button>
        </div>
      </section>

      <!-- ─── Nightmare Save Unlocker ─── -->
      <section class="list-section">
        <h3 class="section-title mod-section-title">
          <span>{{ t("mods.nsu.name") }}</span>
          <a
            class="mod-link"
            href="https://github.com/Eververdants/NightmareSaveUnlocker/releases"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </h3>
        <div class="list-item single mod-desc">{{ t("mods.nsu.desc") }}</div>
        <div class="list-item">
          <span>{{ t("mods.status.label") }}</span>
          <span class="badge" :class="nsuBadgeClass">{{ nsuStatusText }}</span>
        </div>
        <div v-if="status?.nsu_installed" class="list-item">
          <span class="toggle-label" :title="t('mods.nsu.enableDesc')">{{ t("mods.nsu.enabled") }}</span>
          <button
            class="switch"
            :class="{ on: nsuToggleValue }"
            role="switch"
            :aria-checked="nsuToggleValue"
            :disabled="busy"
            @click="toggleNsu"
          >
            <span class="knob"></span>
          </button>
        </div>
        <div class="list-item actions-row">
          <button
            v-if="!status?.nsu_installed"
            class="btn primary"
            :disabled="!canInstallNsu || busy"
            @click="installNsuMod"
          >
            {{ t("mods.nsu.install") }}
          </button>
          <button v-else class="btn danger" :disabled="busy" @click="confirmNsuUninstall">
            {{ t("mods.common.uninstall") }}
          </button>
          <span v-if="!status?.ue4ss_installed" class="requires-hint">
            {{ t("mods.nsu.requiresUe4ss") }}
          </span>
        </div>
      </section>
    </main>

    <!-- Uninstall confirmations -->
    <ConfirmModal
      :show="ue4ssConfirmVisible"
      type="danger"
      :title="t('mods.ue4ss.uninstallTitle')"
      :message="t('mods.ue4ss.uninstallMessage')"
      :description="ue4ssUninstallDetail"
      :confirm-text="t('mods.common.uninstall')"
      :cancel-text="t('common.cancel')"
      :loading="busy"
      @update:show="ue4ssConfirmVisible = $event"
      @confirm="doUe4ssUninstall"
    />
    <ConfirmModal
      :show="nsuConfirmVisible"
      type="danger"
      :title="t('mods.nsu.uninstallTitle')"
      :message="t('mods.nsu.uninstallMessage')"
      :confirm-text="t('mods.common.uninstall')"
      :cancel-text="t('common.cancel')"
      :loading="busy"
      @update:show="nsuConfirmVisible = $event"
      @confirm="doNsuUninstall"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import ConfirmModal from "../components/modal/ConfirmModal.vue";
import storageService from "../services/storageService";
import notify from "../services/notificationService";
import { invoke } from "@tauri-apps/api/core";
import modService, {
  GAME_ROOT_KEY,
  type ModsStatus,
  type ModInstallProgress,
  type Ue4ssChannel,
} from "../services/modService";

const { t, te } = useI18n();

const gameRoot = ref<string>(storageService.getItem<string>(GAME_ROOT_KEY) || "");
const pathValid = ref<boolean | null>(null);
const pathReason = ref("");
const status = ref<ModsStatus | null>(null);
const busy = ref(false);

const ue4ssConfirmVisible = ref(false);
const nsuConfirmVisible = ref(false);

const nsuToggleValue = computed(() => !!status.value?.nsu_enabled);
const canInstall = computed(() => !!gameRoot.value && pathValid.value === true);
const canInstallNsu = computed(() => canInstall.value && !!status.value?.ue4ss_installed);

// ─── Progress ──────────────────────────────────────────────────────────────

const progress = reactive({
  visible: false,
  percent: 0,
  phase: "",
  modName: "",
});

// Monotonic display percent: phases are mapped into non-overlapping ranges so
// the bar never jumps back to 0 when the backend switches download → extract.
const smoothPercent = ref(0);

watch(
  () => [progress.phase, progress.percent] as const,
  ([phase, raw]) => {
    const p = Number(raw);
    const mapped =
      phase === "resolve"
        ? 4
        : phase === "download"
          ? Math.min(90, 6 + Math.round(p * 0.82))
          : phase === "extract"
            ? Math.min(98, 92 + Math.round(p * 0.06))
            : 100;
    smoothPercent.value = Math.max(smoothPercent.value, mapped);
  },
);

const progressLabel = computed(() => {
  const phaseKey = `mods.progress.${progress.phase || "download"}`;
  const phaseText = te(phaseKey) ? t(phaseKey) : "";
  const modText = progress.modName === "ue4ss" ? "UE4SS" : t("mods.nsu.name");
  return `${t("mods.progress.installing")} ${modText}${phaseText ? " · " + phaseText : ""}`;
});

let unlistenProgress: UnlistenFn | null = null;
let listenPromise: Promise<unknown> | null = null;

// ─── Derived labels ────────────────────────────────────────────────────────

const pathErrorText = computed(() => {
  if (pathReason.value === "path-not-found") return t("mods.gamePath.invalidPathNotFound");
  return t("mods.gamePath.invalidNotGameRoot");
});

const ue4ssBadgeClass = computed(() => {
  if (!status.value?.ue4ss_installed) return "off";
  return status.value.ue4ss_managed ? "on" : "warn";
});

const ue4ssStatusText = computed(() => {
  const s = status.value;
  if (!s?.ue4ss_installed) return t("mods.status.notInstalled");
  if (s.ue4ss_managed && s.ue4ss_version) {
    const channelKey = s.ue4ss_channel === "latest" ? "mods.ue4ss.channelLatest" : "mods.ue4ss.channelRecommended";
    return `v${s.ue4ss_version} · ${t(channelKey)}`;
  }
  return t("mods.status.detectedUnmanaged");
});

const nsuBadgeClass = computed(() => {
  if (!status.value?.nsu_installed) return "off";
  return status.value.nsu_enabled ? "on" : "warn";
});

const nsuStatusText = computed(() => {
  const s = status.value;
  if (!s?.nsu_installed) return t("mods.status.notInstalled");
  const ver = s.nsu_version ? ` v${s.nsu_version}` : "";
  return s.nsu_enabled ? `${t("mods.status.installed")}${ver}` : `${t("mods.status.installedDisabled")}${ver}`;
});

const ue4ssUninstallDetail = computed(() => {
  const deps = status.value?.dependent_mods ?? [];
  if (deps.length === 0) return t("mods.ue4ss.uninstallNoDependents");
  return `${t("mods.ue4ss.uninstallDependentsPrefix")} ${deps.join(", ")}`;
});

function showProgressCard(modName: string): void {
  if (progressHideTimer !== null) {
    clearTimeout(progressHideTimer);
    progressHideTimer = null;
  }
  progress.modName = modName;
  progress.phase = "resolve";
  progress.percent = 0;
  smoothPercent.value = 0;
  progress.visible = true;
}

function scheduleProgressHide(): void {
  if (progressHideTimer !== null) clearTimeout(progressHideTimer);
  progressHideTimer = setTimeout(() => {
    progressHideTimer = null;
    progress.visible = false;
  }, 600);
}

let progressHideTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Data loading ──────────────────────────────────────────────────────────

async function refreshStatus(): Promise<void> {
  if (!gameRoot.value || pathValid.value !== true) {
    status.value = null;
    return;
  }
  try {
    status.value = await modService.getModsStatus(gameRoot.value);
  } catch (err) {
    console.error("Failed to load mods status:", err);
    status.value = null;
  }
}

/** Validate the currently saved path (or a newly picked one) and store it. */
async function validateAndAdopt(path: string, announce: boolean): Promise<boolean> {
  try {
    const info = await modService.validateGamePath(path);
    if (info.valid && info.canonical_root) {
      gameRoot.value = info.canonical_root;
      pathValid.value = true;
      pathReason.value = "";
      storageService.setItem(GAME_ROOT_KEY, info.canonical_root);
      await refreshStatus();
      if (announce) notify.success(t("mods.gamePath.saved"));
      return true;
    }
    pathValid.value = false;
    pathReason.value = info.reason;
    return false;
  } catch (err) {
    console.error("Game path validation failed:", err);
    pathValid.value = false;
    pathReason.value = "not-a-game-root";
    return false;
  }
}

async function pickGameFolder(): Promise<void> {
  const selected = await openFileDialog({ directory: true, multiple: false });
  if (!selected) return;
  const ok = await validateAndAdopt(selected as string, true);
  if (!ok) {
    notify.error(pathErrorText.value);
  }
}

// ─── Error mapping ─────────────────────────────────────────────────────────

function errorText(err: unknown): string {
  const raw =
    typeof err === "object" && err !== null && "message" in err
      ? String((err as { message: unknown }).message)
      : String(err);

  const codeKeys: Record<string, string> = {
    "ue4ss-not-installed": "mods.errors.ue4ssNotInstalled",
    "nsu-not-installed": "mods.errors.nsuNotInstalled",
    "invalid-game-root": "mods.errors.invalidGameRoot",
    "permission-denied": "mods.errors.permissionDenied",
  };
  for (const [needle, key] of Object.entries(codeKeys)) {
    if (raw.includes(needle) && te(key)) return t(key);
  }
  if (/network|connection|timed?\s?out|download|github/i.test(raw)) {
    return te("mods.errors.network") ? t("mods.errors.network", { error: raw }) : raw;
  }
  return raw;
}

// ─── Actions ───────────────────────────────────────────────────────────────

async function installUe4ss(channel: Ue4ssChannel): Promise<void> {
  if (!canInstall.value) return;
  busy.value = true;
  showProgressCard("ue4ss");
  try {
    const result = await modService.installUe4ss(gameRoot.value, channel);
    notify.success(t("mods.toast.ue4ssInstalled", { version: result.version }));
  } catch (err) {
    console.error("UE4SS install failed:", err);
    notify.error(errorText(err));
  } finally {
    busy.value = false;
    scheduleProgressHide();
    await refreshStatus();
  }
}

async function installNsuMod(): Promise<void> {
  if (!canInstallNsu.value) return;
  busy.value = true;
  showProgressCard("nsu");
  try {
    const result = await modService.installNsu(gameRoot.value);
    notify.success(t("mods.toast.nsuInstalled", { version: result.version }));
  } catch (err) {
    console.error("NSU install failed:", err);
    notify.error(errorText(err));
  } finally {
    busy.value = false;
    scheduleProgressHide();
    await refreshStatus();
  }
}

function confirmUe4ssUninstall(): void {
  ue4ssConfirmVisible.value = true;
}

function confirmNsuUninstall(): void {
  nsuConfirmVisible.value = true;
}

async function doUe4ssUninstall(): Promise<void> {
  ue4ssConfirmVisible.value = false;
  busy.value = true;
  try {
    const report = await modService.uninstallUe4ss(gameRoot.value);
    const deps = report.removed_dependent_mods;
    if (deps.length > 0) {
      notify.warning(t("mods.toast.ue4ssUninstalledWithDeps", { mods: deps.join(", ") }));
    } else {
      notify.success(t("mods.toast.ue4ssUninstalled"));
    }
  } catch (err) {
    console.error("UE4SS uninstall failed:", err);
    notify.error(errorText(err));
  } finally {
    busy.value = false;
    await refreshStatus();
  }
}

async function doNsuUninstall(): Promise<void> {
  nsuConfirmVisible.value = false;
  busy.value = true;
  try {
    await modService.uninstallNsu(gameRoot.value);
    notify.success(t("mods.toast.nsuUninstalled"));
  } catch (err) {
    console.error("NSU uninstall failed:", err);
    notify.error(errorText(err));
  } finally {
    busy.value = false;
    await refreshStatus();
  }
}

async function toggleNsu(): Promise<void> {
  if (!status.value?.nsu_installed || busy.value) return;
  busy.value = true;
  const next = !nsuToggleValue.value;
  // Optimistic update, revert on failure
  if (status.value) status.value.nsu_enabled = next;
  try {
    await modService.setNsuEnabled(gameRoot.value, next);
    notify.success(next ? t("mods.toast.nsuEnabledOn") : t("mods.toast.nsuEnabledOff"));
  } catch (err) {
    if (status.value) status.value.nsu_enabled = !next;
    console.error("Failed to toggle NSU:", err);
    notify.error(errorText(err));
  } finally {
    busy.value = false;
    await refreshStatus();
  }
}

/** Open the Win64 mods directory via the backend (explorer spawn — no
 *  opener-plugin ACL involved, so it cannot fail on permissions). */
async function openWin64Folder(): Promise<void> {
  if (!gameRoot.value) return;
  try {
    await invoke("open_mods_folder", { gameRoot: gameRoot.value });
  } catch (err) {
    console.error("Failed to open folder:", err);
    notify.error(errorText(err));
  }
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────

onMounted(async () => {
  // Keep the promise: if the component unmounts before listen() resolves,
  // cleanup must wait for it or the listener leaks.
  listenPromise = listen<ModInstallProgress>("mod-install-progress", (event) => {
    progress.modName = event.payload.mod_name;
    progress.phase = event.payload.phase;
    progress.percent = event.payload.percent;
  }).then((fn) => {
    unlistenProgress = fn;
  });

  // Prefer the saved path; fall back to auto-detection via Steam libraries.
  if (gameRoot.value) {
    await validateAndAdopt(gameRoot.value, false);
  }
  if (!(gameRoot.value && pathValid.value === true)) {
    try {
      const detected = await modService.detectGamePath();
      if (detected) {
        await validateAndAdopt(detected, false);
        notify.info(t("mods.gamePath.detected"));
      }
    } catch (err) {
      console.error("Game path auto-detection failed:", err);
    }
  }
});

onUnmounted(async () => {
  if (progressHideTimer !== null) clearTimeout(progressHideTimer);
  try {
    await listenPromise;
  } catch {
    // listen() itself failed; nothing to unlisten
  }
  unlistenProgress?.();
});
</script>

<style scoped>
.mods-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
}

.mods-content {
  padding: 1.5rem 1.5rem 3rem;
  overflow-y: auto;
  max-width: 860px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* ─── List sections (mirrors About.vue conventions) ─── */
.list-section {
  margin-bottom: 1.2rem;
  background: var(--about-list-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--about-glass-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.section-title {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--about-border-light);
}

.mod-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mod-section-title span:first-child {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.mod-link {
  font-size: 0.78rem;
  color: var(--text-secondary);
  text-decoration: none;
}

.mod-link:hover {
  color: var(--text-primary);
  text-decoration: underline;
}

.list-item {
  padding: 0.7rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: var(--text-primary);
  transition: background 0.2s ease;
}

.list-item:hover {
  background: var(--about-hover-bg);
}

.list-item.single {
  color: var(--text-secondary);
  justify-content: flex-start;
}

.mod-desc {
  font-size: 0.82rem;
  line-height: 1.55;
}

/* ─── Game path row ─── */
.path-row {
  flex-wrap: wrap;
}

.path-value {
  font-family: monospace;
  font-size: 0.82rem;
  word-break: break-all;
  flex: 1;
  min-width: 200px;
}

.path-value.unset {
  opacity: 0.65;
}

.error-text {
  font-size: 0.8rem;
  color: var(--danger-color, #ed4014);
}

.actions-row {
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* ─── Badges ─── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge.on {
  background: rgba(25, 190, 107, 0.15);
  color: #19be6b;
}

.badge.off {
  background: rgba(128, 128, 128, 0.15);
  color: var(--text-secondary);
}

.badge.warn {
  background: rgba(255, 165, 0, 0.16);
  color: #e6a23c;
}

.status-side {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.win64-path {
  font-size: 0.72rem;
  font-family: monospace;
  color: var(--text-secondary);
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 320px;
}

/* __MODS_VUE_STYLES_B__ */

/* ─── Buttons ─── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.9rem;
  border-radius: var(--radius-sm, 8px);
  border: 1px solid transparent;
  font-size: 0.84rem;
  cursor: pointer;
  transition:
    transform 0.12s ease,
    opacity 0.15s ease,
    background 0.15s ease;
}

.btn:active:not(:disabled) {
  transform: scale(0.97);
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn.primary {
  background: var(--btn-primary-bg, #4f7cff);
  color: #fff;
}

.btn.primary:hover:not(:disabled) {
  filter: brightness(1.08);
}

.btn.secondary {
  background: transparent;
  color: var(--text-primary);
  border-color: var(--border-color, rgba(128, 128, 128, 0.3));
}

.btn.secondary:hover:not(:disabled) {
  background: rgba(128, 128, 128, 0.12);
}

.btn.danger {
  background: transparent;
  color: var(--danger-color, #ed4014);
  border-color: currentColor;
}

.btn.danger:hover:not(:disabled) {
  background: var(--danger-color, #ed4014);
  color: #fff;
}

.btn.ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-color, rgba(128, 128, 128, 0.3));
}

.btn.ghost:hover:not(:disabled) {
  color: var(--text-primary);
}

/* ─── Progress ─── */
.progress-section {
  border-color: var(--about-glass-border);
}

.progress-head {
  font-size: 0.85rem;
}

.progress-percent {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}

.progress-track-wrap {
  padding: 0 1rem 0.85rem;
}

.progress-track {
  height: 6px;
  border-radius: 3px;
  background: rgba(128, 128, 128, 0.18);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--btn-primary-bg, #4f7cff);
  transition: width 0.25s ease;
}

/* ─── NSU toggle switch ─── */
.toggle-label {
  font-size: 0.85rem;
}

.switch {
  width: 42px;
  height: 22px;
  border-radius: 999px;
  border: none;
  background: rgba(128, 128, 128, 0.35);
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
  padding: 0;
  flex-shrink: 0;
}

.switch.on {
  background: var(--success-color, #19be6b);
}

.switch:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch.on .knob {
  left: 23px;
}

.requires-hint {
  font-size: 0.78rem;
  color: var(--text-secondary);
  opacity: 0.8;
}
</style>
