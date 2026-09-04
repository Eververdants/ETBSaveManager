/**
 * 存档可见性切换 — 单飞守卫 + 乐观更新 + 后端验证回滚
 *
 * 一致性要点（与 master 相同）：
 * - 单飞守卫：同一存档的 toggle 在途时丢弃后续点击
 * - 乐观更新 + 后端验证回滚：UI 永远与 MAINSAVE 实际状态对齐
 * - 撤销/重做使用显式目标状态（不使用相对翻转）
 * - 按稳定文件路径优先匹配（id 是枚举下标，刷新后漂移）
 */
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";

import { saveApi } from "../../../api";
import { toast, useArchiveStore, useHistoryStore } from "../../../stores";
import type { ArchiveData } from "../../../types";
import type { ArchiveActionCallbacks } from "./types";

/** 按稳定路径优先查找存档下标 */
function findArchiveIndex(archives: ArchiveData[], archive: ArchiveData): number {
  if (archive.path) {
    const normalized = archive.path.toLowerCase();
    const byPath = archives.findIndex((a) => a.path && a.path.toLowerCase() === normalized);
    if (byPath !== -1) return byPath;
  }
  return archives.findIndex((a) => a.id === archive.id);
}

/** 在磁盘上应用显式可见性状态，并以后端验证结果对齐 UI */
async function applyVerifiedVisibility(
  archive: ArchiveData,
  target: boolean,
  updateVisibility: (id: number, visible: boolean, path?: string) => void,
  getArchives: () => ArchiveData[]
): Promise<boolean> {
  if (!archive.path) return target;
  const live = getArchives();
  const priorIndex = findArchiveIndex(live, archive);
  const priorState = priorIndex !== -1 ? live[priorIndex].isVisible : undefined;

  const result = await saveApi.toggleVisibility(archive.path, archive.name, target);
  const verified = result.isVisible;
  updateVisibility(archive.id, verified ?? priorState ?? target, archive.path);
  if (verified !== target) {
    throw new Error("Visibility change was not applied");
  }
  return verified;
}

export function useArchiveVisibility() {
  const { t } = useTranslation();
  const getArchives = useCallback(() => useArchiveStore.getState().archives, []);
  const updateVisibility = useArchiveStore((s) => s.updateArchiveVisibility);
  const pushAction = useHistoryStore((s) => s.pushAction);

  const togglingArchives = useRef(new Set<string>());

  const handleToggleVisibility = useCallback(
    async (updatedArchive: ArchiveData, callbacks: ArchiveActionCallbacks = {}) => {
      const { onSuccess, onRefresh } = callbacks;
      const archivePath = updatedArchive.path;

      try {
        if (!archivePath) throw new Error("Archive has no file path");
        if (togglingArchives.current.has(archivePath)) return;
        togglingArchives.current.add(archivePath);

        const desiredVisibility = updatedArchive.isVisible;
        const live = getArchives();
        const liveIndex = findArchiveIndex(live, updatedArchive);
        const originalVisibility = liveIndex !== -1 ? live[liveIndex].isVisible : !desiredVisibility;

        // 乐观更新
        updateVisibility(updatedArchive.id, desiredVisibility, archivePath);

        // 发送显式目标状态；失败重试一次（MAINSAVE 可能被游戏占用）
        let verified: boolean | undefined;
        try {
          const result = await saveApi.toggleVisibility(archivePath, updatedArchive.name, desiredVisibility);
          verified = result.isVisible;
          if (verified !== desiredVisibility) {
            console.warn("[toggle] Verification failed, retrying once");
            const retry = await saveApi.toggleVisibility(archivePath, updatedArchive.name, desiredVisibility);
            verified = retry.isVisible;
          }
        } catch (error) {
          console.warn("[toggle] Attempt failed:", error);
        }

        if (verified !== desiredVisibility) {
          updateVisibility(updatedArchive.id, verified ?? originalVisibility, archivePath);
          throw new Error("Toggle verification failed");
        }

        const archiveSnapshot: ArchiveData = { ...updatedArchive, isVisible: originalVisibility };
        pushAction({
          description: `Toggle visibility of "${updatedArchive.name}"`,
          undo: async () => {
            try {
              await applyVerifiedVisibility(archiveSnapshot, originalVisibility, updateVisibility, getArchives);
            } catch (e) {
              console.warn("[undo] Failed to toggle visibility:", e);
              toast.error(t("archive.actions.toggleVisibilityFailed"));
            }
          },
          redo: async () => {
            try {
              await applyVerifiedVisibility(archiveSnapshot, desiredVisibility, updateVisibility, getArchives);
            } catch (e) {
              console.warn("[redo] Failed to toggle visibility:", e);
              toast.error(t("archive.actions.toggleVisibilityFailed"));
            }
          },
        });

        onSuccess?.();
        await onRefresh?.();
      } catch (error) {
        callbacks.onError?.(error);
        toast.error(t("archive.actions.toggleVisibilityFailed"));
      } finally {
        if (archivePath) togglingArchives.current.delete(archivePath);
      }
    },
    [getArchives, updateVisibility, pushAction, t]
  );

  return { handleToggleVisibility };
}
