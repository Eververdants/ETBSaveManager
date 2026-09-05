/**
 * 存档数据 Store — 元数据全量 + 详情按可视区域渐进加载
 *
 * Phase 1（metadata）— 仅文件名 + 文件系统，不解析 .sav，秒开；
 *   文件夹计数与全局搜索依赖全量元数据，保持一次加载。
 * Phase 2（details）  — 解析 .sav 取 currentLevel / actualDifficulty，较重；
 *   由网格可视区域经 ensureArchiveDetails 增量请求（去重 + 批处理），
 *   不再在打开 / 刷新时全量预载。
 *
 * 一致性守卫：
 * - refreshGeneration 单调递增，旧加载完成后不得覆盖新数据
 * - detailsLoaded / detailInFlight 去重，避免可视区域反复触发解析
 * - 刷新时沿用已加载详情（按路径匹配），离屏卡片不丢失关卡信息
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

const DETAILS_BATCH_SIZE = 16;

export interface ArchiveStats {
  total: number;
  visible: number;
  hidden: number;
}

interface ArchiveState {
  archives: ArchiveData[];
  loading: boolean;
  dataLoadComplete: boolean;
  archiveStats: () => ArchiveStats;
  initializeArchives: (silent?: boolean) => Promise<void>;
  refreshArchives: () => Promise<void>;
  refreshArchivesSilent: () => Promise<void>;
  /** 渐进加载指定存档的详情（自动去重、批处理；幂等） */
  ensureArchiveDetails: (paths: string[]) => Promise<void>;
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

/** Phase 1 元数据映射：currentLevel 先用 Level0 占位（图片 URL 合法），详情阶段覆盖 */
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

/** 已完成详情加载的存档路径（小写），用于去重与刷新时沿用 */
const detailsLoaded = new Set<string>();
/** 详情请求在途的存档路径（小写） */
const detailInFlight = new Set<string>();
let refreshGeneration = 0;

/** 把详情结果写入数组：按路径替换，保持对象不可变更新 */
function applyDetails(target: ArchiveData[], details: Awaited<ReturnType<typeof saveApi.loadSaveDetailsBatch>>): ArchiveData[] {
  const byPath = new Map(details.map((d) => [d.path.toLowerCase(), d]));
  let changed = false;
  const next = target.map((a) => {
    const detail = byPath.get(a.path.toLowerCase());
    if (!detail) return a;
    const item: ArchiveData = { ...a };
    if (detail.current_level) item.currentLevel = detail.current_level;
    if (detail.actual_difficulty) {
      item.actualDifficulty =
        difficultyMap[detail.actual_difficulty] ||
        detail.actual_difficulty.toLowerCase() ||
        item.actualDifficulty;
      if (FEATURES.MERGE_DIFFICULTY) item.archiveDifficulty = item.actualDifficulty;
    }
    changed = true;
    return item;
  });
  return changed ? next : target;
}

export const useArchiveStore = create<ArchiveState>()((set, get) => ({
  archives: [],
  loading: false,
  dataLoadComplete: false,

  archiveStats: () => {
    const list = get().archives;
    return {
      total: list.length,
      visible: list.filter((a) => a.isVisible).length,
      hidden: list.filter((a) => !a.isVisible).length,
    };
  },

  initializeArchives: async (silent = false) => {
    const loadGeneration = ++refreshGeneration;
    const previousArchives = get().archives;

    if (!silent) {
      set({ loading: true, archives: [], dataLoadComplete: false });
    }

    try {
      // meta.is_visible 已含 MAINSAVE 可见性，无需再读一遍 MAINSAVE.sav
      const metaList = await saveApi.loadSaveMetadata();
      const merged = mergeWithKnownDetails(
        (Array.isArray(metaList) ? metaList : []).map(mapMetaToArchive).sort((a, b) => a.name.localeCompare(b.name)),
        previousArchives
      );

      if (loadGeneration !== refreshGeneration) return; // 已被更新的加载取代

      set({ archives: merged, dataLoadComplete: true });
    } catch (error) {
      console.error("Failed to initialize archives:", error);
      if (!silent) {
        const message = error instanceof Error ? error.message : String(error);
        toast.error(i18n.t("archiveCard.loadFailed") + ": " + message);
      }
      set({ dataLoadComplete: true });
    } finally {
      if (!silent) {
        // 300ms 延迟关闭 spinner，避免闪烁
        setTimeout(() => set({ loading: false }), 300);
      }
    }
  },

  refreshArchives: async () => {
    set({ loading: true });
    const loadGeneration = ++refreshGeneration;
    try {
      const metaList = await saveApi.loadSaveMetadata();
      const merged = mergeWithKnownDetails(
        (Array.isArray(metaList) ? metaList : []).map(mapMetaToArchive).sort((a, b) => a.name.localeCompare(b.name)),
        get().archives
      );

      if (loadGeneration !== refreshGeneration) return;
      set({ archives: merged });
    } catch (error) {
      console.error("Failed to refresh archives:", error);
    } finally {
      setTimeout(() => set({ loading: false }), 300);
    }
  },

  refreshArchivesSilent: async () => {
    const loadGeneration = ++refreshGeneration;
    try {
      const metaList = await saveApi.loadSaveMetadata();
      const merged = mergeWithKnownDetails(
        (Array.isArray(metaList) ? metaList : []).map(mapMetaToArchive).sort((a, b) => a.name.localeCompare(b.name)),
        get().archives
      );

      if (loadGeneration !== refreshGeneration) return;
      set({ archives: merged });
    } catch (error) {
      console.error("Failed to refresh archives silently:", error);
    }
  },

  ensureArchiveDetails: async (paths) => {
    const pending: string[] = [];
    for (const path of paths) {
      if (!path) continue;
      const key = path.toLowerCase();
      if (!detailsLoaded.has(key) && !detailInFlight.has(key)) pending.push(path);
    }
    if (pending.length === 0) return;

    // 小批多次：每批解析完立即回填 store，视口卡片尽早拿到真实关卡图；
    // 循环处理全部 pending（此前超出首批的部分要等下一次可视区变化才补）
    for (let offset = 0; offset < pending.length; offset += DETAILS_BATCH_SIZE) {
      const batch = pending.slice(offset, offset + DETAILS_BATCH_SIZE);
      for (const path of batch) detailInFlight.add(path.toLowerCase());
      try {
        const details = await saveApi.loadSaveDetailsBatch(batch);
        if (details.length > 0) {
          set((state) => ({ archives: applyDetails(state.archives, details) }));
          for (const detail of details) {
            if (detail.current_level) preloadImage(getLevelImage(detail.current_level));
          }
        }
        // 无论是否解析出详情都标记完成，避免不可读存档被反复请求
        for (const path of batch) {
          const key = path.toLowerCase();
          detailInFlight.delete(key);
          detailsLoaded.add(key);
        }
      } catch (error) {
        console.error("Failed to load visible archive details:", error);
        for (const path of batch) detailInFlight.delete(path.toLowerCase());
        return; // 出错即止，避免后续批次连锁失败
      }
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

/** 刷新 / 重建元数据时，沿用已加载过的详情（离屏卡片不丢失关卡信息） */
function mergeWithKnownDetails(merged: ArchiveData[], previous: ArchiveData[]): ArchiveData[] {
  if (previous.length === 0 || detailsLoaded.size === 0) return merged;
  const byPath = new Map(previous.map((a) => [a.path.toLowerCase(), a]));
  for (const archive of merged) {
    const key = archive.path.toLowerCase();
    if (!detailsLoaded.has(key)) continue;
    const old = byPath.get(key);
    if (!old) continue;
    archive.currentLevel = old.currentLevel;
    if (old.actualDifficulty) {
      archive.actualDifficulty = old.actualDifficulty;
      if (FEATURES.MERGE_DIFFICULTY) archive.archiveDifficulty = old.actualDifficulty;
    }
  }
  return merged;
}
