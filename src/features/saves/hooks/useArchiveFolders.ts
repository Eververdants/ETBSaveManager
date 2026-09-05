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

import { toast, useArchiveFolderStore } from "../../../stores";
import type { OrganizeGroup, OrganizeRule } from "../../../stores";
import type { ArchiveData, ArchiveFolder } from "../../../types";

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
  const moveFolder = useArchiveFolderStore((s) => s.moveFolder);
  const deleteFolder = useArchiveFolderStore((s) => s.deleteFolder);
  const moveArchives = useArchiveFolderStore((s) => s.moveArchives);
  const applyOrganizePlan = useArchiveFolderStore((s) => s.applyOrganizePlan);
  const clearAssignments = useArchiveFolderStore((s) => s.clearAssignments);

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

  const foldersWithCounts = useMemo<ArchiveFolderWithCount[]>(
    () =>
      folders.map((folder) => ({
        ...folder,
        parentId: folder.parentId ?? null,
        count: archives.reduce((n, a) => (folderIdOf(a) === folder.id ? n + 1 : n), 0),
      })),
    [folders, archives, folderIdOf]
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

  /** 按规则生成一键整理计划并执行（规则即最终布局，在根目录建立） */
  const executeOrganize = useCallback(
    (rule: OrganizeRule) => {
      if (archives.length === 0) return;

      const groups = new Map<string, string[]>();
      const push = (name: string, path: string) => {
        const list = groups.get(name);
        if (list) list.push(path);
        else groups.set(name, [path]);
      };

      for (const archive of archives) {
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
      const result = applyOrganizePlan(plan);
      toast.success(
        t("organizer.organizeDone", { created: result.created, moved: result.moved })
      );
    },
    [archives, applyOrganizePlan, t]
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
    moveFolder,
    deleteFolder,
    moveArchives,
    executeOrganize,
    clearAssignments,
  };
}

export type ArchiveFoldersApi = ReturnType<typeof useArchiveFolders>;
