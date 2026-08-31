/**
 * 文本输入框
 */
import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "../../utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 错误时红框 */
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-lg border bg-[var(--color-bg-secondary)] px-3 text-[13px]",
        "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
        "transition-all duration-150 outline-none",
        invalid
          ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-2 focus:ring-[var(--color-ring)]"
          : "border-[var(--color-border-default)] focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-ring)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
