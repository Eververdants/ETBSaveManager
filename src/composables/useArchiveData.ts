import { ref, computed, type Ref, type ComputedRef } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { useI18n } from "vue-i18n";
import { useToast } from "./useToast";
import type { ArchiveData } from "@/types";
import { preloadImage } from "@/utils/imagePreloader";
import scheduler from "@/services/resourceScheduler";

interface RawSaveItem {
  id?: number;
  name?: string;
  current_level?: string;
  mode?: string;
  difficulty?: string;
  actual_difficulty?: string;
  is_visible?: boolean;
  path?: string;
  date?: string;
}

interface SaveFileMeta {
  id: number;
  name: string;
  difficulty: string;
  mode: string;
  date: string;
  hidden: boolean;
  path: string;
  is_visible: boolean;
  file_size: number;
}

interface SaveFileDetail {
  path: string;
  current_level: string;
  actual_difficulty: string;
}

interface FileHandleResponse {
  success: boolean;
  data?: {
    SingleplayerSaves?: number[];
  };
}

interface ArchiveStats {
  total: number;
  visible: number;
  hidden: number;
}

export interface IncrementalLoadState {
  phase: "idle" | "metadata" | "details" | "complete";
  totalDetails: number;
  loadedDetails: number;
}

const BATCH_SIZE = 50;

/**
 * Archive data management composable
 * Supports two-phase incremental loading for fast initial display:
 *   Phase 1 (metadata) — filename + filesystem only, no .sav parsing
 *   Phase 2 (details)  — batch-parses .sav files to fill currentLevel & actualDifficulty
 *
 * Data loading uses infinite scroll: first PAGE_SIZE items are loaded on init,
 * more items are appended on demand via loadMoreArchives().  Items are always
 * sorted by archive name to ensure consistent ordering across pages.
 */
export function useArchiveData(): {
  archives: Ref<ArchiveData[]>;
  visibleSaves: Ref<Set<number>>;
  loading: Ref<boolean>;
  dataLoadComplete: Ref<boolean>;
  archiveStats: ComputedRef<ArchiveStats>;
  incrementalLoadState: Ref<IncrementalLoadState>;
  loadVisibleSaves: () => Promise<void>;
  loadRealArchives: () => Promise<ArchiveData[]>;
  initializeArchives: (silent?: boolean) => Promise<void>;
  refreshArchives: () => Promise<void>;
  refreshArchivesSilent: () => Promise<void>;
  removeArchive: (archiveId: number) => void;
  updateArchiveVisibility: (archiveId: number, isVisible: boolean) => void;
} {
  const { t } = useI18n({ useScope: "global" });
  const toast = useToast();
  const archives = ref<ArchiveData[]>([]);
  const visibleSaves = ref(new Set<number>());

  const loading = ref(false);
  const dataLoadComplete = ref(false);
  const incrementalLoadState = ref<IncrementalLoadState>({
    phase: "idle",
    totalDetails: 0,
    loadedDetails: 0,
  });

  // Cancellation token for Phase 2 detail loading.
  // Set to true by cancelDetailLoading() — startDetailLoading checks this
  // before each batch and exits early, preventing wasted IPC and stale data
  // writes when refresh/init races with an in-flight detail load.
  let detailLoadCancelled = false;

  // Map Chinese difficulty names from game save files to normalized keys
  const difficultyMap: Record<string, string> = {
    简单难度: "easy",
    普通难度: "normal",
    困难难度: "hard",
    噩梦难度: "nightmare",
  };

  // Map Chinese mode names from game save files to normalized keys
  const modeMap: Record<string, string> = {
    单人模式: "singleplayer",
    多人模式: "multiplayer",
  };

  const mapArchive = (item: RawSaveItem): ArchiveData => {
    const gameMode = modeMap[item.mode!] || item.mode?.toLowerCase() || "singleplayer";

    return {
      id: item.id ?? 0,
      name: item.name ?? t("archiveCard.untitled", "Untitled Archive"),
      currentLevel: item.current_level ?? "Level0",
      gameMode,
      archiveDifficulty: difficultyMap[item.difficulty!] || item.difficulty?.toLowerCase() || "normal",
      actualDifficulty: difficultyMap[item.actual_difficulty!] || item.actual_difficulty?.toLowerCase() || "normal",
      isVisible: item.is_visible === true,
      path: item.path ?? "",
      date: item.date ?? new Date().toISOString(),
    };
  };

  /** Map SaveFileMeta (from Rust, no .sav parsing) to ArchiveData.
   *  Uses "Level0" as safe default for currentLevel so the background
   *  image URL is valid from the start. Phase 2 will overwrite it. */
  const mapMetaToArchive = (meta: SaveFileMeta): ArchiveData => {
    const gameMode = modeMap[meta.mode] || meta.mode?.toLowerCase() || "singleplayer";
    const diff = difficultyMap[meta.difficulty] || meta.difficulty?.toLowerCase() || "normal";
    return {
      id: meta.id,
      name: meta.name,
      currentLevel: "Level0",
      gameMode,
      archiveDifficulty: diff,
      actualDifficulty: diff,
      isVisible: meta.is_visible,
      path: meta.path,
      date: meta.date,
    };
  };

  const loadVisibleSaves = async (): Promise<void> => {
    try {
      const response = await invoke<FileHandleResponse>("handle_file", {
        action: "read",
        filePath: "MAINSAVE.sav",
      });

      if (response && response.success && response.data) {
        const singleplayerSaves = response.data.SingleplayerSaves || [];
        visibleSaves.value = new Set(singleplayerSaves);
      } else {
        visibleSaves.value = new Set();
      }
    } catch (error) {
      console.error("Failed to load visible saves:", error);
      visibleSaves.value = new Set();
    }
  };

  const loadRealArchives = async (): Promise<ArchiveData[]> => {
    try {
      const response = await invoke<RawSaveItem[]>("load_all_saves");

      if (response && Array.isArray(response)) {
        return response.map(mapArchive);
      }
      return [];
    } catch (error) {
      console.error("Failed to load archives:", error);
      const errorMessage =
        (error as { message?: string; msg?: string })?.message ||
        (error as { msg?: string })?.msg ||
        JSON.stringify(error) ||
        t("common.unknown");
      if (errorMessage.includes("Save directory not found")) {
        toast.showError(
          t("archiveCard.saveDirNotFound", "Please open the game first to initialize the save directory"),
        );
      } else {
        toast.showError(t("archiveCard.loadFailed", "Failed to load archives") + ": " + errorMessage);
      }
      return [];
    }
  };

  /** Phase 1: Load ALL metadata from filenames only (no .sav parsing),
   *  then sort by name for consistent ordering.  Fast even for 1000+ files. */
  const loadMetadata = async (): Promise<ArchiveData[]> => {
    try {
      const metaList = await invoke<SaveFileMeta[]>("load_save_metadata");
      if (metaList && Array.isArray(metaList)) {
        return metaList.map(mapMetaToArchive).sort((a, b) => a.name.localeCompare(b.name));
      }
      return [];
    } catch (error) {
      console.error("Failed to load archive metadata:", error);
      return [];
    }
  };

  /**
   * Phase 2: Load detail data (.sav parsing) for archives that only have
   * filename-derived metadata. Loads in batches and mutates individual
   * indices in-place so unchanged cards skip re-render.
   */
  const startDetailLoading = async (): Promise<void> => {
    detailLoadCancelled = false;
    const pendingPaths = archives.value.filter((a) => a.currentLevel === "Level0").map((a) => a.path);

    if (pendingPaths.length === 0) {
      if (detailLoadCancelled) return;
      incrementalLoadState.value = {
        phase: "complete",
        totalDetails: 0,
        loadedDetails: 0,
      };
      scheduler.endOperation("loading-archives");
      return;
    }

    incrementalLoadState.value = {
      phase: "details",
      totalDetails: pendingPaths.length,
      loadedDetails: 0,
    };

    for (let i = 0; i < pendingPaths.length; i += BATCH_SIZE) {
      if (detailLoadCancelled) return;
      const batch = pendingPaths.slice(i, i + BATCH_SIZE);
      try {
        const details = await invoke<SaveFileDetail[]>("load_save_details_batch", { paths: batch });

        // Re-check cancellation after await — another init/refresh may have
        // replaced archives.value while IPC was in flight.
        if (detailLoadCancelled) return;

        for (const detail of details) {
          if (detail.current_level) {
            preloadImage(`/images/ETB/${detail.current_level}.webp`);
          }
        }

        for (const detail of details) {
          const idx = archives.value.findIndex((a) => a.path === detail.path);
          if (idx !== -1) {
            const target = archives.value[idx];
            target.currentLevel = detail.current_level;
            if (detail.actual_difficulty) {
              target.actualDifficulty =
                difficultyMap[detail.actual_difficulty] ||
                detail.actual_difficulty?.toLowerCase() ||
                target.actualDifficulty;
            }
          }
        }

        incrementalLoadState.value.loadedDetails += batch.length;
        scheduler.updateOperation("loading-archives", {
          totalItems: pendingPaths.length,
          completedItems: incrementalLoadState.value.loadedDetails,
        });
      } catch (error) {
        console.error(`Failed to load detail batch (${i}–${i + batch.length}):`, error);
      }
    }

    if (detailLoadCancelled) return;
    incrementalLoadState.value.phase = "complete";
    scheduler.endOperation("loading-archives");
    console.log(
      `Detail loading complete: ${incrementalLoadState.value.loadedDetails}/${incrementalLoadState.value.totalDetails} saves`,
    );
  };

  const cancelDetailLoading = (): void => {
    detailLoadCancelled = true;
    incrementalLoadState.value = {
      phase: "idle",
      totalDetails: 0,
      loadedDetails: 0,
    };
  };

  /** Load ALL metadata (instant, filename-only), load visible saves,
   *  then kick off Phase 2 detail loading in the background. */
  const loadMergedArchives = async (): Promise<ArchiveData[]> => {
    const [, metaArchives] = await Promise.all([loadVisibleSaves(), loadMetadata()]);
    return metaArchives;
  };

  const initializeArchives = async (silent = false): Promise<void> => {
    cancelDetailLoading();

    if (!silent) {
      loading.value = true;
      archives.value = [];
      dataLoadComplete.value = false;
    }

    // Report loading operation to resource scheduler
    scheduler.beginOperation("loading-archives", {
      totalItems: 0,
      completedItems: 0,
    });

    try {
      incrementalLoadState.value = { phase: "metadata", totalDetails: 0, loadedDetails: 0 };

      // Phase 1: ALL metadata (filename-only, instant).  No pagination needed —
      // this is faster than IPC round-trips for individual pages.
      const merged = await loadMergedArchives();
      archives.value = merged;
      dataLoadComplete.value = true;

      if (!silent) loading.value = false;

      // Phase 2: background detail loading — don't await.
      const pendingCount = archives.value.filter((a) => a.currentLevel === "Level0").length;
      if (pendingCount > 0) {
        scheduler.updateOperation("loading-archives", {
          totalItems: pendingCount,
          completedItems: 0,
        });
        startDetailLoading();
      } else {
        incrementalLoadState.value = { phase: "complete", totalDetails: 0, loadedDetails: 0 };
        scheduler.endOperation("loading-archives");
      }
    } catch (error) {
      console.error("Failed to initialize archives:", error);
      if (!silent) {
        archives.value = [];
      }
      dataLoadComplete.value = true;
      incrementalLoadState.value = { phase: "complete", totalDetails: 0, loadedDetails: 0 };
      scheduler.endOperation("loading-archives");
    } finally {
      if (!silent) {
        setTimeout(() => {
          loading.value = false;
        }, 300);
      }
    }
  };

  const refreshArchives = async (): Promise<void> => {
    loading.value = true;
    cancelDetailLoading();
    scheduler.beginOperation("loading-archives", { totalItems: 0, completedItems: 0 });

    try {
      const merged = await loadMergedArchives();
      archives.value = merged;

      const pendingCount = archives.value.filter((a) => a.currentLevel === "Level0").length;
      if (pendingCount > 0) startDetailLoading();
      else scheduler.endOperation("loading-archives");
    } catch (error) {
      console.error("Failed to refresh archives:", error);
      scheduler.endOperation("loading-archives");
    } finally {
      setTimeout(() => {
        loading.value = false;
      }, 300);
    }
  };

  const refreshArchivesSilent = async (): Promise<void> => {
    scheduler.beginOperation("loading-archives", { totalItems: 0, completedItems: 0 });
    try {
      const merged = await loadMergedArchives();
      archives.value = merged;

      const pendingCount = archives.value.filter((a) => a.currentLevel === "Level0").length;
      if (pendingCount > 0) startDetailLoading();
      else scheduler.endOperation("loading-archives");
    } catch (error) {
      console.error("Failed to refresh archives silently:", error);
      scheduler.endOperation("loading-archives");
    }
  };

  const removeArchive = (archiveId: number): void => {
    const index = archives.value.findIndex((a) => a.id === archiveId);
    if (index > -1) {
      archives.value.splice(index, 1);
    }
  };

  const updateArchiveVisibility = (archiveId: number, isVisible: boolean): void => {
    const archiveIndex = archives.value.findIndex((a) => a.id === archiveId);
    if (archiveIndex > -1) {
      archives.value[archiveIndex].isVisible = isVisible;
    }
  };

  const archiveStats = computed(
    (): ArchiveStats => ({
      total: archives.value.length,
      visible: archives.value.filter((a) => a.isVisible).length,
      hidden: archives.value.filter((a) => !a.isVisible).length,
    }),
  );

  return {
    archives,
    visibleSaves,
    loading,
    dataLoadComplete,
    archiveStats,
    incrementalLoadState,
    loadVisibleSaves,
    loadRealArchives,
    initializeArchives,
    refreshArchives,
    refreshArchivesSilent,
    removeArchive,
    updateArchiveVisibility,
  };
}
