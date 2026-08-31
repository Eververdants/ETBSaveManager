/**
 * 按钮 — Fluent 风格
 * variants: primary（强调）/ secondary（默认）/ subtle（低强调）/ danger / ghost（透明）
 */
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "../../utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "subtle" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "text-[var(--color-primary-fg)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] shadow-sm",
  secondary:
    "text-[var(--color-text-primary)] bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-strong)]",
  subtle:
    "text-[var(--color-text-secondary)] bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]",
  danger:
    "text-[var(--color-danger-fg)] bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)] active:bg-[var(--color-danger-active)] shadow-sm",
  ghost:
    "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]",
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
  md: "h-8 px-3.5 text-[13px] gap-1.5 rounded-lg",
  lg: "h-10 px-5 text-sm gap-2 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, icon, className, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-medium",
        "transition-all duration-150 ease-out active:scale-[0.98]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-border-focus)]",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 size={size === "sm" ? 13 : 15} className="animate-spin" /> : icon}
      {children}
    </button>
  );
});
