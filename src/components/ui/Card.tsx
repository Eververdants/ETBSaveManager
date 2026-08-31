/**
 * 卡片 — 内容容器
 */
import type { HTMLAttributes } from "react";

import { cn } from "../../utils";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-elevated)]",
        "shadow-[0_1px_2px_var(--color-shadow)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** 卡片内小节标题 */
export function CardTitle({ className, children }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-sm font-semibold text-[var(--color-text-primary)]", className)}>
      {children}
    </h3>
  );
}

/** 卡片说明文字 */
export function CardDescription({ className, children }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-[var(--color-text-muted)]", className)}>{children}</p>
  );
}
