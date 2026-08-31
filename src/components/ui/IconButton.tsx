/**
 * 图标按钮 — 方形交互按钮（工具栏 / 卡片操作）
 */
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "../../utils";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 无障碍标签（必填，纯图标按钮） */
  label: string;
  size?: "sm" | "md";
  active?: boolean;
}

const SIZES = {
  sm: "h-6.5 w-6.5 p-1 [&_svg]:size-3.5",
  md: "h-8 w-8 p-1.5 [&_svg]:size-4",
} as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", active, className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md",
        "text-[var(--color-text-secondary)] transition-all duration-150 ease-out",
        "hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)] active:scale-90",
        "disabled:pointer-events-none disabled:opacity-40",
        active &&
          "bg-[var(--color-primary-subtle)] text-[var(--color-primary)] hover:text-[var(--color-primary)]",
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
