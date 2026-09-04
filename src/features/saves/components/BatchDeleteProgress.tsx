/**
 * 批量删除进度浮层
 */
import { AnimatePresence, motion } from "motion/react";

import { ProgressBar } from "../../../components/ui";

export interface BatchDeleteProgressProps {
  open: boolean;
  current: number;
  total: number;
  name: string;
}

export default function BatchDeleteProgress({ open, current, total, name }: BatchDeleteProgressProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="pointer-events-none fixed inset-x-0 bottom-10 z-[120] flex justify-center"
        >
          <div className="pointer-events-auto w-[320px] rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-elevated)] p-4 shadow-[0_12px_32px_var(--color-shadow-lg)]">
            <p className="mb-2 truncate text-xs text-[var(--color-text-secondary)]">
              {name} · {current}/{total}
            </p>
            <ProgressBar value={total ? (current / total) * 100 : 0} tone="danger" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
