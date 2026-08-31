/**
 * 页签 — 胶囊式带滑动高亮（对应 master 编辑页 Tab 导航 / LevelPicker 分组）
 */
import { useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import { cn } from "../../utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  /** 高亮背景尺寸留白 */
  compact?: boolean;
}

export default function Tabs({ items, active, onChange, className, compact }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (el && listRef.current) {
      const listRect = listRef.current.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      setIndicator({ left: rect.left - listRect.left, width: rect.width });
    }
  }, [active, items]);

  return (
    <div
      ref={listRef}
      className={cn(
        "relative inline-flex items-center gap-0.5 rounded-lg bg-[var(--color-bg-muted)] p-0.5",
        className
      )}
      role="tablist"
    >
      {indicator.width > 0 && (
        <motion.div
          layout
          className="absolute top-0.5 bottom-0.5 rounded-md bg-[var(--color-bg-elevated)] shadow-sm"
          animate={{ left: indicator.left, width: indicator.width }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            data-tab={item.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 font-medium transition-colors duration-150",
              compact ? "py-1 text-xs" : "py-1.5 text-[13px]",
              isActive
                ? "text-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
