/**
 * 存档数据 Store — 两阶段加载管线（对应 master 的 useArchiveData）
 *
 * Phase 1（metadata）— 仅文件名 + 文件系统，不解析 .sav，秒开
 * Phase 2（details） — 分批解析 .sav 填充 currentLevel / actualDifficulty
 *
 * 一致性守卫：
 * - refreshGeneration 单调递增，旧加载完成后不得覆盖新数据
 * - detailLoadCancelled 取消在途的批量详情加载
 * - 原子替换（一次性 set），UI 永远看不到占位数据闪现
 */
import { create } from "zustand";

import i18n from "../locales";
import { saveApi } from "../api";
import { toast } from "./toastStore";
import { preloadImage } from "../utils/imagePreloader";
import { getLevelImage } from "../utils/levelUtils";
import { FEATURES } from "../constants";
import type { ArchiveData, SaveFileMeta } from "../types";

const BATCH_SIZE = 50;

export interface IncrementalLoadState {
  phase: "idle" | "metadata" | "details" | "complete";
  totalDetails: number;
  loadedDetails: number;
}

interface ArchiveStats {
  total: number;
  visible: number;
  hidden: number;
}

interface ArchiveState {
  archives: ArchiveData[];
  visibleSaves: Set<string>;
  loading: boolean;
  dataLoadComplete: boolean;
  incrementalLoadState: IncrementalLoadState;
  archiveStats: () => ArchiveStats;
  initializeArchives: (silent?: boolean) => Promise<void>;
  refreshArchives: () => Promise<void>;
  refreshArchivesSilent: () => Promise<void>;
  removeArchiveByPath: (path: string) => void;
  restoreArchive: (archive: ArchiveData) => void;
  updateArchiveVisibility: (archiveId: number, isVisible: boolean, path?: string) => void;
}

// 游戏存档内的中文难度名 → 归一化 key
const difficultyMap: Record<string, string> = {
  简单难度: "easy",
  普通难度: "normal",
  困难难度: "hard",
  噩梦难度: "nightmare",
};

// 单人/多人统一按 multiplayer 处理
const modeMap: Record<string, string> = {
  单人模式: "multiplayer",
  多人模式: "multiplayer",
};

const resolveDifficulty = (raw?: string): string =>
  (raw && difficultyMap[raw]) || raw?.toLowerCase() || "normal";

/** Phase 1 元数据映射：currentLevel 先用 Level0 占位（图片 URL 合法），Phase 2 覆盖 */
function mapMetaToArchive(meta: SaveFileMeta): ArchiveData {
  const diff = resolveDifficulty(meta.difficulty);
  return {
    id: meta.id,
    name: meta.name,
    displayName: meta.display_name ?? null,
    currentLevel: "Level0",
    gameMode: (meta.mode && modeMap[meta.mode]) || "multiplayer",
    archiveDifficulty: diff,
    actualDifficulty: diff,
    isVisible: meta.is_visible,
    path: meta.path,
    date: meta.date,
  };
}

/** 单例守卫状态（数据本体存于 zustand state） */
let visibleSaves = new Set<string>();
let detailLoadCancelled = false;
let refreshGeneration = 0;

export const useArchiveStore = create<ArchiveState>()((set, get) => ({
  archives: [],
  visibleSaves: new Set<string>(),
  loading: false,
  dataLoadComplete: false,
  incrementalLoadState: { phase: "idle", totalDetails: 0, loadedDetails: 0 },

  archiveStats: () => {
    const list = get().archives;
    return {
      total: list.length,
      visible: list.filter((a) => a.isVisible).length,
      hidden: list.filter((a) => !a.isVisible).length,
    };
  },

  initializeArchives: async (silent = false) => {
    detailLoadCancelled = true;
    const loadGeneration = ++refreshGeneration;

    if (!silent) {
      set({ loading: true, archives: [], dataLoadComplete: false });
    }

    try {
      set({ incrementalLoadState: { phase: "metadata", totalDetails: 0, loadedDetails: 0 } });

      const [saves, metaList] = await Promise.all([saveApi.readVisibleSaves(), saveApi.loadSaveMetadata()]);
      const merged = (Array.isArray(metaList) ? metaList : [])
        .map(mapMetaToArchive)
        .sort((a, b) => a.name.localeCompare(b.name));
      visibleSaves = new Set(saves);

      const pendingCount = merged.filter((a) => a.currentLevel === "Level0").length;
      if (pendingCount > 0) {
        detailLoadCancelled = false;
        set({ incrementalLoadState: { phase: "details", totalDetails: pendingCount, loadedDetails: 0 } });
        await loadDetailsIntoArray(merged, set, get);
      }

      if (detailLoadCancelled || loadGeneration !== refreshGeneration) {
        return; // 已被更新的加载取代
      }

      set({
        archives: merged,
        visibleSaves,
        dataLoadComplete: true,
        incrementalLoadState: { phase: "complete", totalDetails: 0, loadedDetails: 0 },
      });
    } catch (error) {
      console.error("Failed to initialize archives:", error);
      if (!silent) {
        const message = error instanceof Error ? error.message : String(error);
        toast.error(i18n.t("archiveCard.loadFailed") + ": " + message);
      }
      set({
        dataLoadComplete: true,
        incrementalLoadState: { phase: "complete", totalDetails: 0, loadedDetails: 0 },
      });
    } finally {
      if (!silent) {
        // 300ms 延迟关闭 spinner，避免闪烁
        setTimeout(() => set({ loading: false }), 300);
      }
    }
  },

  refreshArchives: async () => {
    set({ loading: true });
    detailLoadCancelled = true;
    const loadGeneration = ++refreshGeneration;
    try {
      const [saves, metaList] = await Promise.all([saveApi.readVisibleSaves(), saveApi.loadSaveMetadata()]);
      const merged = (Array.isArray(metaList) ? metaList : [])
        .map(mapMetaToArchive)
        .sort((a, b) => a.name.localeCompare(b.name));
      visibleSaves = new Set(saves);

      const pendingCount = merged.filter((a) => a.currentLevel === "Level0").length;
      if (pendingCount > 0) {
        detailLoadCancelled = false;
        await loadDetailsIntoArray(merged, set, get);
      }

      if (loadGeneration !== refreshGeneration) return;

      set({ archives: merged, visibleSaves });
    } catch (error) {
      console.error("Failed to refresh archives:", error);
    } finally {
      setTimeout(() => set({ loading: false }), 300);
    }
  },

  refreshArchivesSilent: async () => {
    const loadGeneration = ++refreshGeneration;
    try {
      const [saves, metaList] = await Promise.all([saveApi.readVisibleSaves(), saveApi.loadSaveMetadata()]);
      const merged = (Array.isArray(metaList) ? metaList : [])
        .map(mapMetaToArchive)
        .sort((a, b) => a.name.localeCompare(b.name));
      visibleSaves = new Set(saves);

      const pendingCount = merged.filter((a) => a.currentLevel === "Level0").length;
      if (pendingCount > 0) {
        detailLoadCancelled = false;
        await loadDetailsIntoArray(merged, set, get);
      }

      if (loadGeneration !== refreshGeneration) return;

      set({ archives: merged, visibleSaves });
    } catch (error) {
      console.error("Failed to refresh archives silently:", error);
    }
  },

  removeArchiveByPath: (path) => {
    const normalized = path.toLowerCase();
    set((state) => ({
      archives: state.archives.filter((a) => a.path.toLowerCase() !== normalized),
    }));
  },

  /** 撤销删除：按名称排序插回列表（与加载排序一致） */
  restoreArchive: (archive) => {
    set((state) => {
      const exists = state.archives.some(
        (a) => a.path.toLowerCase() === archive.path.toLowerCase()
      );
      if (exists) return state;
      const insertAt = state.archives.findIndex((a) => a.name.localeCompare(archive.name) > 0);
      const next = [...state.archives];
      if (insertAt === -1) {
        next.push(archive);
      } else {
        next.splice(insertAt, 0, archive);
      }
      return { archives: next };
    });
  },

  updateArchiveVisibility: (archiveId, isVisible, path) => {
    // 稳定的文件路径优先匹配：id 是枚举下标，刷新后会漂移，
    // id 优先可能改错卡片。
    set((state) => {
      let index = -1;
      if (path) {
        const normalized = path.toLowerCase();
        index = state.archives.findIndex((a) => a.path && a.path.toLowerCase() === normalized);
      }
      if (index === -1) {
        index = state.archives.findIndex((a) => a.id === archiveId);
      }
      if (index === -1) return state;
      const next = [...state.archives];
      next[index] = { ...next[index], isVisible };
      return { archives: next };
    });
  },
}));

/** 分批加载 .sav 详情，就地写入 targetArchives（原子替换前使用） */
async function loadDetailsIntoArray(
  targetArchives: ArchiveData[],
  set: (partial: Partial<ArchiveState> | ((s: ArchiveState) => Partial<ArchiveState>)) => void,
  get: () => ArchiveState
): Promise<void> {
  const pendingPaths = targetArchives
    .filter((a) => a.currentLevel === "Level0")
    .map((a) => a.path);
  if (pendingPaths.length === 0) return;

  for (let i = 0; i < pendingPaths.length; i += BATCH_SIZE) {
    if (detailLoadCancelled) return;
    const batch = pendingPaths.slice(i, i + BATCH_SIZE);
    try {
      const details = await saveApi.loadSaveDetailsBatch(batch);
      if (detailLoadCancelled) return;

      for (const detail of details) {
        if (detail.current_level) {
          preloadImage(getLevelImage(detail.current_level));
        }
      }

      for (const detail of details) {
        const idx = targetArchives.findIndex((a) => a.path === detail.path);
        if (idx !== -1) {
          const target = targetArchives[idx];
          target.currentLevel = detail.current_level;
          if (detail.actual_difficulty) {
            target.actualDifficulty =
              (difficultyMap[detail.actual_difficulty] ||
                detail.actual_difficulty.toLowerCase()) || target.actualDifficulty;
            if (FEATURES.MERGE_DIFFICULTY) {
              target.archiveDifficulty = target.actualDifficulty;
            }
          }
        }
      }

      if (targetArchives === get().archives) {
        const inc = get().incrementalLoadState;
        set({
          incrementalLoadState: { ...inc, loadedDetails: inc.loadedDetails + batch.length },
        });
      }
    } catch (error) {
      console.error(`Failed to load detail batch (${i}–${i + batch.length}):`, error);
    }
  }
}
