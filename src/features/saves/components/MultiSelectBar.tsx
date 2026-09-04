/**
 * 多选工具条 — 全选 / 反选 / 计数 / 批量删除
 */
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { Trash2, X } from "lucide-react";

import { Button } from "../../../components/ui";

export interface MultiSelectBarProps {
  visible: boolean;
  selectedCount: number;
  totalCount: number;
  onExit: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBatchDelete: () => void;
}

export default function MultiSelectBar({
  visible,
  selectedCount,
  totalCount,
  onExit,
  onSelectAll,
  onDeselectAll,
  onBatchDelete,
}: MultiSelectBarProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="shrink-0 overflow-hidden border-b border-[var(--color-border-light)] bg-[var(--color-primary-subtle)]"
        >
          <div className="flex items-center gap-2 px-5 py-2">
            <Button size="sm" variant="ghost" icon={<X size={13} />} onClick={onExit}>
              {t("archiveSearch.multiSelect.exit")}
            </Button>
            <Button size="sm" variant="ghost" onClick={onSelectAll}>
              {t("archiveSearch.multiSelect.selectAll")}
            </Button>
            <Button size="sm" variant="ghost" onClick={onDeselectAll}>
              {t("archiveSearch.multiSelect.deselectAll")}
            </Button>
            <span className="ml-2 text-xs tabular-nums text-[var(--color-text-secondary)]">
              {t("archiveSearch.multiSelect.selected", { count: selectedCount, total: totalCount })}
            </span>
            <Button
              size="sm"
              variant="danger"
              className="ml-auto"
              icon={<Trash2 size={13} />}
              disabled={selectedCount === 0}
              onClick={onBatchDelete}
            >
              {t("archiveSearch.multiSelect.batchDelete")}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
