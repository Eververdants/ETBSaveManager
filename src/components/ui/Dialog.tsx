/**
 * 对话框 — 受控模态（overlay + Esc 关闭 + 焦点陷阱）
 * ConfirmDialog 基于此实现。
 */
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { useClickOutside } from "../../hooks";
import { EASE } from "../../constants";
import { cn } from "../../utils";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  /** Esc / 点击遮罩是否可关闭（默认可） */
  dismissable?: boolean;
  showClose?: boolean;
  contentClassName?: string;
  /** 内容区容器类名。需要内部滚动 / flex 撑满时覆盖默认内边距 */
  bodyClassName?: string;
  /**
   * 自定义 Esc 行为。返回 true 表示已消费该按键，不再触发默认关闭。
   * 例：搜索类弹窗先清空关键词，再按一次才关闭。
   */
  onEscape?: () => boolean;
}

export default function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "440px",
  dismissable = true,
  showClose = true,
  contentClassName,
  bodyClassName,
  onEscape,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const clickOutsideRef = useClickOutside<HTMLDivElement>(() => {
    if (dismissable) onClose();
  });

  // 焦点陷阱 + Esc
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (panel) {
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) focusable[0].focus();
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (onEscape?.()) {
          e.stopPropagation();
          return;
        }
        if (dismissable) {
          e.stopPropagation();
          onClose();
        }
        return;
      }
      if (e.key === "Tab" && panel) {
        const focusable = Array.from(
          panel.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute("disabled"));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey, true);
    return () => document.removeEventListener("keydown", handleKey, true);
  }, [open, dismissable, onClose, onEscape]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: EASE.OUT }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ backgroundColor: "var(--color-bg-overlay)" }}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div ref={clickOutsideRef}>
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18, ease: EASE.OUT }}
              className={cn(
                "w-full overflow-hidden rounded-xl border border-[var(--color-border-light)]",
                "bg-[var(--color-bg-elevated)] shadow-[0_16px_48px_var(--color-shadow-lg)]",
                contentClassName
              )}
              style={{ maxWidth }}
            >
              {(title || showClose) && (
                <div className="flex items-center justify-between px-5 pb-1 pt-4">
                  {typeof title === "string" ? (
                    <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {title}
                    </h2>
                  ) : (
                    title
                  )}
                  {showClose && dismissable && (
                    <button
                      type="button"
                      aria-label="close"
                      onClick={onClose}
                      className="rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              )}
              <div className={cn("px-5 py-3", bodyClassName)}>{children}</div>
              {footer && (
                <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-5 py-3">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
