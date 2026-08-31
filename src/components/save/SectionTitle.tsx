/**
 * 表单分区标题 — accent 竖条 + 图标 + 标题
 */
import { cn } from "../../utils";

export default function SectionTitle({
  icon,
  children,
  className,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "relative flex items-center gap-2.5 pl-3.5 text-[15px] font-semibold tracking-tight text-[var(--color-text-primary)]",
        className
      )}
    >
      <span className="absolute left-0 top-1/2 h-4.5 w-1 -translate-y-1/2 rounded-full bg-[var(--color-primary)]" />
      {icon && <span className="text-[var(--color-primary)]">{icon}</span>}
      {children}
    </h3>
  );
}
