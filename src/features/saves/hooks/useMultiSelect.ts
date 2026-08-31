/**
 * 多选模式 Hook — 批量删除（对应 master useMultiSelect）
 */
import { useCallback, useState } from "react";

import type { ArchiveData } from "../../../types";

export function useMultiSelect(archives: ArchiveData[]) {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggleMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode((v) => {
      if (v) setSelectedIds(new Set());
      return !v;
    });
  }, []);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(archives.map((a) => a.id)));
  }, [archives]);

  const deselectAll = useCallback(() => setSelectedIds(new Set()), []);

  const selectedArchives = archives.filter((a) => selectedIds.has(a.id));

  return {
    isMultiSelectMode,
    selectedIds,
    selectedArchives,
    selectedCount: selectedArchives.length,
    toggleMultiSelectMode,
    toggleSelect,
    selectAll,
    deselectAll,
  };
}
