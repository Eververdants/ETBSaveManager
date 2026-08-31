/**
 * Toaster — 渲染 toastStore 队列（对应 master NotificationPopup）
 * 位置固定右上；支持操作按钮；hover 暂停自动关闭。
 */
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { CircleCheck, CircleX, Info, TriangleAlert, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useToastStore, type ToastItem, type ToastType } from "../../stores";
import { cn } from "../../utils";

const ICONS: Record<ToastType, typeof Info> = {
  success: CircleCheck,
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
};

const ICON_COLORS: Record<ToastType, string> = {
  success: "text-[var(--color-success)]",
  error: "text-[var(--color-danger)]",
  warning: "text-[var(--color-danger)]",
  info: "text-[var(--color-primary)]",
};

function ToastCard({ toast }: { toast: ToastItem }) {
  const { t } = useTranslation();
  const dismiss = useToastStore((s) => s.dismiss);
  const Icon = ICONS[toast.type];
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const remainingRef = useRef(toast.duration);
  const startRef = useRef(Date.now());

  const startTimer = (delay: number) => {
    timerRef.current = setTimeout(() => dismiss(toast.id), delay);
  };

  useEffect(() => {
    startRef.current = Date.now();
    startTimer(remainingRef.current);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id]);

  const pause = () => {
    clearTimeout(timerRef.current);
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startRef.current));
  };

  const resume = () => {
    startRef.current = Date.now();
    startTimer(remainingRef.current);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      onMouseEnter={pause}
      onMouseLeave={resume}
      className={cn(
        "pointer-events-auto flex w-[320px] items-start gap-2.5 rounded-xl border p-3",
        "border-[var(--color-border-light)] bg-[var(--color-bg-elevated)]",
        "shadow-[0_8px_24px_var(--color-shadow-lg)]"
      )}
      role="status"
    >
      <Icon size={17} className={cn("mt-0.5 shrink-0", ICON_COLORS[toast.type])} />
      <div className="min-w-0 flex-1">
        <p className="break-words text-[13px] leading-snug text-[var(--color-text-primary)]">
          {toast.message}
        </p>
        {toast.actions && toast.actions.length > 0 && (
          <div className="mt-2 flex gap-2">
            {toast.actions.map((action) => (
              <button
                key={action.text}
                type="button"
                onClick={() => {
                  action.onClick(toast.id);
                  dismiss(toast.id);
                }}
                className="rounded-md bg-[var(--color-primary-subtle)] px-2 py-1 text-xs font-medium text-[var(--color-primary)] transition-colors hover:brightness-95"
              >
                {action.text}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label={t("common.close")}
        onClick={() => dismiss(toast.id)}
        className="rounded p-0.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return createPortal(
    <div className="pointer-events-none fixed right-4 top-12 z-[200] flex flex-col items-end gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => (
          <ToastCard key={item.id} toast={item} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
