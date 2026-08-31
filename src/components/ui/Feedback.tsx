/**
 * 徽章 / 标签 / 骨架 Spinner / 进度条
 */
import { cn } from "../../utils";

// ============================================
// Badge
// ============================================
export interface BadgeProps {
  children: React.ReactNode;
  tone?: "neutral" | "primary" | "success" | "danger" | "warning";
  className?: string;
}

const TONES = {
  neutral: "bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]",
  primary: "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]",
  success: "bg-[var(--color-success-subtle)] text-[var(--color-success)]",
  danger: "bg-[var(--color-danger-subtle)] text-[var(--color-danger)]",
  warning: "bg-[var(--color-danger-subtle)] text-[var(--color-danger)]",
} as const;

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

// ============================================
// Spinner
// ============================================
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-block animate-spin rounded-full", className)}
      style={{
        width: size,
        height: size,
        border: `${Math.max(2, size / 10)}px solid var(--color-border-light)`,
        borderTopColor: "var(--color-primary)",
      }}
      role="status"
      aria-label="loading"
    />
  );
}

// ============================================
// ProgressBar
// ============================================
export function ProgressBar({
  value,
  className,
  tone = "primary",
}: {
  /** 0–100 */
  value: number;
  className?: string;
  tone?: "primary" | "success" | "danger";
}) {
  const color =
    tone === "success"
      ? "var(--color-success)"
      : tone === "danger"
        ? "var(--color-danger)"
        : "var(--color-primary)";
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-muted)]", className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-200 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}
