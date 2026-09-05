/**
 * 存档文件夹派生逻辑 — 目录视图、文件夹计数、祖先链、整理计划
 *
 * 文件夹可嵌套（parentId 指向父级，根目录为 null）；归属关系以存档
 * 文件路径（小写）查询，孤儿归属（存档或文件夹已删除）在派生时被
 * 自然忽略，不需要显式清理。
 *
 * 搜索 / 筛选生效时视图与文件夹无关（跨全部文件夹搜索，网盘行为）。
 */
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { toast, useArchiveFolderStore, useArchiveStore } from "../../../stores";
import type { OrganizeGroup, OrganizeRule } from "../../../stores";
import type { ArchiveData, ArchiveFolder } from "../../../types";
import { getLevelImage } from "../../../utils/levelUtils";

/** 存档难度 key → i18n key（TitleSearchCenter 共用） */
export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "archiveCard.easy",
  normal: "archiveCard.normal",
  hard: "archiveCard.hard",
  nightmare: "archiveCard.nightmare",
};

export interface ArchiveFolderWithCount extends ArchiveFolder {
  count: number;
  parentId: string | null;
  /** 封面图（1 张 = 手动或唯一存档；最多 4 张 = 自动合成；空 = 无存档占位） */
  coverImages: string[];
  /** 是否手动指定了封面（「恢复自动封面」的可用性） */
  hasManualCover: boolean;
}

/** 移动子菜单用的扁平选项（label 为含路径全名，如 "难度 / 噩梦"） */
export interface FolderOption {
  id: string;
  label: string;
}

export function useArchiveFolders(archives: ArchiveData[]) {
  const { t } = useTranslation();

  const folders = useArchiveFolderStore((s) => s.folders);
  const assignments = useArchiveFolderStore((s) => s.assignments);
  const currentFolderId = useArchiveFolderStore((s) => s.currentFolderId);
  const loaded = useArchiveFolderStore((s) => s.loaded);
  const load = useArchiveFolderStore((s) => s.load);
  const setCurrentFolder = useArchiveFolderStore((s) => s.setCurrentFolder);
  const storeCreateFolder = useArchiveFolderStore((s) => s.createFolder);
  const renameFolder = useArchiveFolderStore((s) => s.renameFolder);
  const setFolderCover = useArchiveFolderStore((s) => s.setFolderCover);
  const moveFolder = useArchiveFolderStore((s) => s.moveFolder);
  const deleteFolder = useArchiveFolderStore((s) => s.deleteFolder);
  const moveArchives = useArchiveFolderStore((s) => s.moveArchives);
  const applyOrganizePlan = useArchiveFolderStore((s) => s.applyOrganizePlan);
  const clearAssignments = useArchiveFolderStore((s) => s.clearAssignments);
  const ensureArchiveDetails = useArchiveStore((s) => s.ensureArchiveDetails);

  useEffect(() => {
    void load();
  }, [load]);

  const folderIdOf = useCallback(
    (archive: ArchiveData): string | null => {
      if (!archive.path) return null;
      return assignments[archive.path.toLowerCase()] ?? null;
    },
    [assignments]
  );

  /** 文件夹内的存档（按列表顺序） */
  const getFolderArchives = useCallback(
    (folderId: string): ArchiveData[] => archives.filter((a) => folderIdOf(a) === folderId),
    [archives, folderIdOf]
  );

  const foldersWithCounts = useMemo<ArchiveFolderWithCount[]>(
    () =>
      folders.map((folder) => {
        // 封面：手动指定优先（存档仍存在时），否则取文件夹内前 4 张自动合成
        let coverImages: string[] = [];
        if (folder.coverArchivePath) {
          const cover = archives.find(
            (a) => a.path.toLowerCase() === folder.coverArchivePath!.toLowerCase()
          );
          if (cover) coverImages = [getLevelImage(cover.currentLevel || "Level0")];
        }
        if (coverImages.length === 0) {
          coverImages = getFolderArchives(folder.id)
            .slice(0, 4)
            .map((a) => getLevelImage(a.currentLevel || "Level0"));
        }
        return {
          ...folder,
          parentId: folder.parentId ?? null,
          count: archives.reduce((n, a) => (folderIdOf(a) === folder.id ? n + 1 : n), 0),
          coverImages,
          hasManualCover: !!folder.coverArchivePath,
        };
      }),
    [folders, archives, folderIdOf, getFolderArchives]
  );

  const currentFolder = useMemo(
    () => foldersWithCounts.find((f) => f.id === currentFolderId) ?? null,
    [foldersWithCounts, currentFolderId]
  );

  /** 当前视图的文件夹卡片：根目录显示根文件夹，文件夹内显示其子文件夹 */
  const viewFolders = useMemo(
    () =>
      foldersWithCounts.filter((f) => (f.parentId ?? null) === (currentFolderId ?? null)),
    [foldersWithCounts, currentFolderId]
  );

  // 封面依赖存档详情（关卡图）。可视文件夹的封面候选存档不在网格可视窗口内，
  // 详情永远不会被渐进加载触发 —— 这里按需补齐，否则封面一直停在 Level0 默认占位图
  useEffect(() => {
    const paths = new Set<string>();
    for (const folder of viewFolders) {
      if (folder.coverArchivePath) {
        paths.add(folder.coverArchivePath);
        continue;
      }
      for (const archive of getFolderArchives(folder.id).slice(0, 4)) {
        if (archive.path) paths.add(archive.path);
      }
    }
    if (paths.size > 0) void ensureArchiveDetails([...paths]);
  }, [viewFolders, getFolderArchives, ensureArchiveDetails]);

  /** 根目录到当前文件夹的链路（面包屑，含当前文件夹） */
  const currentPath = useMemo(() => {
    const chain: ArchiveFolderWithCount[] = [];
    let cursor: ArchiveFolderWithCount | null = currentFolder;
    while (cursor) {
      chain.unshift(cursor);
      const parentId = cursor.parentId;
      cursor = parentId
        ? (foldersWithCounts.find((f) => f.id === parentId) ?? null)
        : null;
    }
    return chain;
  }, [currentFolder, foldersWithCounts]);

  /** 扁平文件夹选项（移动子菜单用） */
  const folderOptions = useMemo<FolderOption[]>(() => {
    const nameOf = new Map(foldersWithCounts.map((f) => [f.id, f.name]));
    const parentOf = new Map(foldersWithCounts.map((f) => [f.id, f.parentId]));
    return foldersWithCounts.map((folder) => {
      const parts = [folder.name];
      let parent = parentOf.get(folder.id) ?? null;
      while (parent) {
        parts.unshift(nameOf.get(parent) ?? "?");
        parent = parentOf.get(parent) ?? null;
      }
      return { id: folder.id, label: parts.join(" / ") };
    });
  }, [foldersWithCounts]);

  /** folderId 的全部后代文件夹 id（不含自身） */
  const getDescendantIds = useCallback(
    (folderId: string): string[] => {
      const result: string[] = [];
      const stack = [folderId];
      while (stack.length > 0) {
        const current = stack.pop()!;
        for (const folder of foldersWithCounts) {
          if (folder.parentId === current && !result.includes(folder.id)) {
            result.push(folder.id);
            stack.push(folder.id);
          }
        }
      }
      return result;
    },
    [foldersWithCounts]
  );

  /** folderId 及其后代文件夹中的存档总数（删除确认文案用） */
  const getSubtreeArchiveCount = useCallback(
    (folderId: string): number => {
      const ids = new Set([folderId, ...getDescendantIds(folderId)]);
      return archives.reduce((n, a) => {
        const fid = folderIdOf(a);
        return fid && ids.has(fid) ? n + 1 : n;
      }, 0);
    },
    [archives, folderIdOf, getDescendantIds]
  );

  /** 当前视图存档：根目录 = 未归档；文件夹内 = 归属于该文件夹 */
  const scopedArchives = useMemo(() => {
    if (!currentFolderId) return archives.filter((a) => !folderIdOf(a));
    return archives.filter((a) => folderIdOf(a) === currentFolderId);
  }, [archives, currentFolderId, folderIdOf]);

  /** 是否存在任何归属关系（「全部移出文件夹」的可用性） */
  const hasAssignments = useMemo(
    () => archives.some((a) => folderIdOf(a) !== null),
    [archives, folderIdOf]
  );

  /** 在当前视图下创建文件夹（根视图 → 根目录；文件夹内 → 该文件夹） */
  const createFolder = useCallback(
    (name: string) => storeCreateFolder(name, currentFolderId),
    [storeCreateFolder, currentFolderId]
  );

  /** 按规则整理「当前目录」：归档当前目录下的存档，规则文件夹建在当前目录 */
  const executeOrganize = useCallback(
    (rule: OrganizeRule) => {
      const scope = scopedArchives;
      if (scope.length === 0) return;

      const groups = new Map<string, string[]>();
      const push = (name: string, path: string) => {
        const list = groups.get(name);
        if (list) list.push(path);
        else groups.set(name, [path]);
      };

      for (const archive of scope) {
        if (!archive.path) continue;
        if (rule === "visibility") {
          push(
            archive.isVisible ? t("organizer.groupVisible") : t("organizer.groupHidden"),
            archive.path
          );
        } else {
          const raw =
            rule === "archiveDifficulty" ? archive.archiveDifficulty : archive.actualDifficulty;
          push(t(DIFFICULTY_LABELS[raw] ?? raw), archive.path);
        }
      }

      const plan: OrganizeGroup[] = [...groups.entries()].map(([folderName, paths]) => ({
        folderName,
        paths,
      }));
      const result = applyOrganizePlan(plan, currentFolderId);
      toast.success(
        t("organizer.organizeDone", { created: result.created, moved: result.moved })
      );
    },
    [scopedArchives, applyOrganizePlan, currentFolderId, t]
  );

  return {
    foldersWithCounts,
    viewFolders,
    currentFolder,
    currentFolderId,
    currentPath,
    folderOptions,
    isInFolder: currentFolder !== null,
    scopedArchives,
    hasAssignments,
    loaded,
    folderIdOf,
    getDescendantIds,
    getSubtreeArchiveCount,
    setCurrentFolder,
    createFolder,
    renameFolder,
    setFolderCover,
    getFolderArchives,
    moveFolder,
    deleteFolder,
    moveArchives,
    executeOrganize,
    clearAssignments,
  };
}

export type ArchiveFoldersApi = ReturnType<typeof useArchiveFolders>;
