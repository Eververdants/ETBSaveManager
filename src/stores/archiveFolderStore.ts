/**
 * 存档文件夹 Store — 应用层整理分组（不触碰游戏存档文件）
 *
 * 数据持久化到应用配置目录 archive_folders.json（经 api/save 的
 * loadArchiveFolders / saveArchiveFolders）。assignments 以存档文件
 * 路径的小写形式为键 —— 路径大小写在 Windows 不敏感，且存档 id 是
 * 枚举下标、刷新后漂移，均不可直接作键。
 *
 * 写操作统一走 schedulePersist（250ms 防抖整体覆写），失败时 toast。
 * currentFolderId 是页内导航状态，仅存 sessionStorage（编辑后返回仍
 * 停在原文件夹，新会话从根目录开始）。
 */
import { create } from "zustand";

import i18n from "../locales";
import { saveApi } from "../api";
import { toast } from "./toastStore";
import type { ArchiveFolder } from "../types";

export type OrganizeRule = "archiveDifficulty" | "actualDifficulty" | "visibility";

/** 一键整理计划：每个分组 = 一个文件夹 + 归属其中的存档路径 */
export interface OrganizeGroup {
  folderName: string;
  paths: string[];
}

const CURRENT_FOLDER_KEY = "archive-current-folder";

function normalizePath(path: string): string {
  return path.toLowerCase();
}

function newFolderId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface ArchiveFolderState {
  folders: ArchiveFolder[];
  assignments: Record<string, string>;
  /** 当前浏览的文件夹 id（/saves/all 页内导航） */
  currentFolderId: string | null;
  loaded: boolean;
  load: () => Promise<void>;
  setCurrentFolder: (id: string | null) => void;
  /** 在指定父文件夹下创建文件夹（缺省为根目录），返回新 id */
  createFolder: (name: string, parentId?: string | null) => string;
  renameFolder: (id: string, name: string) => void;
  /** 指定文件夹封面存档；path 为 null 表示恢复自动封面 */
  setFolderCover: (id: string, coverArchivePath: string | null) => void;
  /** 移动文件夹到新的父级（parent 为 null 表示移回根目录）；目标是自身或后代时拒绝并返回 false */
  moveFolder: (id: string, newParentId: string | null) => boolean;
  /** 删除文件夹（连同其子文件夹），其中存档回到未归档；若正在浏览被删范围则返回根目录 */
  deleteFolder: (id: string) => void;
  /** 批量移动存档；folderId 传 null 表示移回未归档 */
  moveArchives: (paths: string[], folderId: string | null) => void;
  /** 应用一键整理计划（在 parentId 下建立/复用同名文件夹），返回新建数与实际移动数 */
  applyOrganizePlan: (
    groups: OrganizeGroup[],
    parentId?: string | null
  ) => { created: number; moved: number };
  /** 全部移出文件夹（保留文件夹本身） */
  clearAssignments: () => void;
}

/** 收集 folderId 的全部后代文件夹 id（不含自身） */
function collectDescendantIds(folders: ArchiveFolder[], folderId: string): string[] {
  const result: string[] = [];
  const stack = [folderId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const folder of folders) {
      if ((folder.parentId ?? null) === current && !result.includes(folder.id)) {
        result.push(folder.id);
        stack.push(folder.id);
      }
    }
  }
  return result;
}

let saveTimer: number | null = null;

function schedulePersist(get: () => ArchiveFolderState) {
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    saveTimer = null;
    const { folders, assignments } = get();
    try {
      await saveApi.saveArchiveFolders({ folders, assignments });
    } catch (error) {
      console.error("Failed to save archive folders:", error);
      toast.error(i18n.t("organizer.saveFailed"));
    }
  }, 250);
}

function readPersistedFolderId(): string | null {
  try {
    return sessionStorage.getItem(CURRENT_FOLDER_KEY);
  } catch {
    return null;
  }
}

function writePersistedFolderId(id: string | null) {
  try {
    if (id) sessionStorage.setItem(CURRENT_FOLDER_KEY, id);
    else sessionStorage.removeItem(CURRENT_FOLDER_KEY);
  } catch {
    /* ignore */
  }
}

export const useArchiveFolderStore = create<ArchiveFolderState>()((set, get) => ({
  folders: [],
  assignments: {},
  currentFolderId: readPersistedFolderId(),
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    try {
      const data = await saveApi.loadArchiveFolders();
      set({
        folders: (Array.isArray(data?.folders) ? data.folders : []).map((f) => ({
          ...f,
          parentId: f.parentId ?? null,
        })),
        assignments: data?.assignments ?? {},
        loaded: true,
      });
    } catch (error) {
      console.error("Failed to load archive folders:", error);
      set({ loaded: true });
      toast.error(i18n.t("organizer.loadFailed"));
    }
  },

  setCurrentFolder: (id) => {
    set({ currentFolderId: id });
    writePersistedFolderId(id);
  },

  createFolder: (name, parentId = null) => {
    const folder: ArchiveFolder = {
      id: newFolderId(),
      name,
      createdAt: Date.now(),
      parentId,
    };
    set((s) => ({ folders: [...s.folders, folder] }));
    schedulePersist(get);
    return folder.id;
  },

  renameFolder: (id, name) => {
    set((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)),
    }));
    schedulePersist(get);
  },

  setFolderCover: (id, coverArchivePath) => {
    set((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, coverArchivePath } : f)),
    }));
    schedulePersist(get);
  },

  moveFolder: (id, newParentId) => {
    if (id === newParentId) return false;
    const descendants = collectDescendantIds(get().folders, id);
    if (newParentId && descendants.includes(newParentId)) return false;

    set((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, parentId: newParentId } : f)),
    }));
    schedulePersist(get);
    return true;
  },

  deleteFolder: (id) => {
    set((s) => {
      const removed = new Set([id, ...collectDescendantIds(s.folders, id)]);
      const assignments = { ...s.assignments };
      for (const key of Object.keys(assignments)) {
        if (assignments[key] && removed.has(assignments[key])) delete assignments[key];
      }
      return {
        folders: s.folders.filter((f) => !removed.has(f.id)),
        assignments,
        currentFolderId:
          s.currentFolderId && removed.has(s.currentFolderId) ? null : s.currentFolderId,
      };
    });
    writePersistedFolderId(get().currentFolderId);
    schedulePersist(get);
  },

  moveArchives: (paths, folderId) => {
    set((s) => {
      const assignments = { ...s.assignments };
      for (const path of paths) {
        const key = normalizePath(path);
        if (!key) continue;
        if (folderId) assignments[key] = folderId;
        else delete assignments[key];
      }
      return { assignments };
    });
    schedulePersist(get);
  },

  applyOrganizePlan: (groups, parentId = null) => {
    const folders = [...get().folders];
    const assignments = { ...get().assignments };
    let created = 0;
    let moved = 0;

    for (const group of groups) {
      if (group.paths.length === 0) continue;
      // 整理始终以「当前目录」为基准：规则文件夹建在 parentId 下，
      // 同层级同名文件夹复用，不会跨层级误合并
      let folder = folders.find(
        (f) => f.name === group.folderName && (f.parentId ?? null) === parentId
      );
      if (!folder) {
        folder = {
          id: newFolderId(),
          name: group.folderName,
          createdAt: Date.now(),
          parentId,
        };
        folders.push(folder);
        created++;
      }
      for (const path of group.paths) {
        const key = normalizePath(path);
        if (!key || assignments[key] === folder.id) continue;
        assignments[key] = folder.id;
        moved++;
      }
    }

    set({ folders, assignments });
    schedulePersist(get);
    return { created, moved };
  },

  clearAssignments: () => {
    set({ assignments: {} });
    schedulePersist(get);
  },
}));
