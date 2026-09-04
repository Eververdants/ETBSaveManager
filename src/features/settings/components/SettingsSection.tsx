/**
 * 设置分区的布局原语 —— 分区标题 + 标签/说明/控件行
 */
import type { ReactNode } from "react";

export function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
      <span className="text-[var(--color-primary)]">{icon}</span>
      {title}
    </h2>
  );
}

export function SettingsRow({
  label,
  description,
  control,
}: {
  label: string;
  description?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{label}</p>
        {description && <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{description}</p>}
      </div>
      {control}
    </div>
  );
}
