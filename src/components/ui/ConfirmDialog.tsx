/**
 * 确认对话框 — info / warning / danger 三态（对应 master ConfirmModal）
 */
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import Dialog from "./Dialog";
import { Button } from "./Button";
import { cn } from "../../utils";

export interface ArchiveDetailRows {
  currentLevel?: string;
  difficulty?: string;
  date?: string;
}

export interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message: string;
  description?: string;
  type?: "info" | "warning" | "danger";
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  archiveDetails?: ArchiveDetailRows | null;
  levelName?: (key: string) => string;
  difficultyName?: (key: string) => string;
}

const TYPE_META = {
  info: { icon: Info, cls: "text-[var(--color-primary)]", bg: "bg-[var(--color-primary-subtle)]" },
  warning: {
    icon: AlertTriangle,
    cls: "text-[var(--color-danger)]",
    bg: "bg-[var(--color-danger-subtle)]",
  },
  danger: {
    icon: OctagonAlert,
    cls: "text-[var(--color-danger)]",
    bg: "bg-[var(--color-danger-subtle)]",
  },
} as const;

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  description,
  type = "info",
  confirmText,
  cancelText,
  loading,
  archiveDetails,
  levelName,
  difficultyName,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const meta = TYPE_META[type];
  const Icon = meta.icon;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="400px"
      dismissable={!loading}
      showClose={false}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelText ?? t("common.cancel")}
          </Button>
          <Button
            variant={type === "info" ? "primary" : "danger"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText ?? t("common.confirm")}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 rounded-lg p-2", meta.bg)}>
          <Icon size={18} className={meta.cls} />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[13px] leading-relaxed text-[var(--color-text-primary)]">{message}</p>
          {description && (
            <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">{description}</p>
          )}
        </div>
      </div>

      {archiveDetails && (
        <div className="mt-3 space-y-1.5 rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2.5 text-xs">
          {archiveDetails.currentLevel && (
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)]">
                {t("archiveCard.currentLevel")}
              </span>
              <span className="font-medium text-[var(--color-text-primary)]">
                {levelName ? levelName(archiveDetails.currentLevel) : archiveDetails.currentLevel}
              </span>
            </div>
          )}
          {archiveDetails.difficulty && (
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)]">
                {t("archiveCard.archiveDifficulty")}
              </span>
              <span className="font-medium text-[var(--color-text-primary)]">
                {difficultyName
                  ? difficultyName(archiveDetails.difficulty)
                  : archiveDetails.difficulty}
              </span>
            </div>
          )}
          {archiveDetails.date && (
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)]">{t("archiveCard.lastModified")}</span>
              <span className="font-medium text-[var(--color-text-primary)]">
                {archiveDetails.date}
              </span>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
