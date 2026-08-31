/**
 * 空状态 — 图标 + 标题 + 描述 + 可选动作（对应 master EmptyState）
 */
import type { LucideIcon } from "lucide-react";

import { Button } from "./Button";
import { cn } from "../../utils";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  hint?: string;
  actionIcon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  hint,
  actionIcon: ActionIcon,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className
      )}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "var(--color-bg-muted)" }}
      >
        <Icon size={28} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
        {description && (
          <p className="max-w-xs text-xs leading-relaxed text-[var(--color-text-muted)]">
            {description}
          </p>
        )}
        {hint && <p className="text-[11px] text-[var(--color-text-muted)]">{hint}</p>}
      </div>
      {onAction && actionText && (
        <Button variant="primary" size="md" onClick={onAction} icon={ActionIcon && <ActionIcon size={15} />}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
