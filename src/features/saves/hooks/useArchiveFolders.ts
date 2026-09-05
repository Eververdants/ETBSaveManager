/**
 * 存档文件夹派生逻辑 — 根目录 / 文件夹视图、文件夹计数、整理计划
 *
 * 归属关系以存档文件路径（小写）查询；孤儿归属（存档已删除）在派生
 * 时被自然忽略，不需要显式清理。
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
}

export function useArchiveFolders(archives: ArchiveData[]) {
  const { t } = useTranslation();

  const folders = useArchiveFolderStore((s) => s.folders);
  const assignments = useArchiveFolderStore((s) => s.assignments);
  const currentFolderId = useArchiveFolderStore((s) => s.currentFolderId);
  const loaded = useArchiveFolderStore((s) => s.loaded);
  const load = useArchiveFolderStore((s) => s.load);
  const setCurrentFolder = useArchiveFolderStore((s) => s.setCurrentFolder);
  const createFolder = useArchiveFolderStore((s) => s.createFolder);
  const renameFolder = useArchiveFolderStore((s) => s.renameFolder);
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

  /** 各文件夹的存档数量（孤儿归属不计入） */
  const foldersWithCounts = useMemo<ArchiveFolderWithCount[]>(
    () =>
      folders.map((folder) => ({
        ...folder,
        count: archives.reduce(
          (n, a) => (folderIdOf(a) === folder.id ? n + 1 : n),
          0
        ),
      })),
    [folders, archives, folderIdOf]
  );

  const currentFolder = useMemo(
    () => folders.find((f) => f.id === currentFolderId) ?? null,
    [folders, currentFolderId]
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

  /** 按规则生成一键整理计划（仅收编未归档时也全量覆盖，规则即最终布局） */
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
          push(archive.isVisible ? t("organizer.groupVisible") : t("organizer.groupHidden"), archive.path);
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
    currentFolder,
    currentFolderId,
    isInFolder: currentFolder !== null,
    scopedArchives,
    hasAssignments,
    loaded,
    setCurrentFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    moveArchives,
    executeOrganize,
    clearAssignments,
  };
}

export type ArchiveFoldersApi = ReturnType<typeof useArchiveFolders>;
