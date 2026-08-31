/**
 * 下拉选择 — Fluent 风格（对应 master CustomDropdown）
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";

import { useClickOutside } from "../../hooks";
import { cn } from "../../utils";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface DropdownProps {
  value: string | null;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** 菜单最小宽度（默认与触发器同宽） */
  menuMinWidth?: number;
}

export default function Dropdown({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  className,
  menuMinWidth,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useClickOutside<HTMLButtonElement>(() => setOpen(false));
  const [upward, setUpward] = useState(false);
  const selected = options.find((o) => o.value === value) ?? null;
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setUpward(rect.bottom + 8 + Math.min(options.length * 32 + 8, 240) > window.innerHeight);
  }, [open, options.length, triggerRef]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>("[data-selected='true']");
    el?.scrollIntoView({ block: "nearest" });
  }, [open]);

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-lg border px-3 text-[13px]",
          "bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]",
          "transition-all duration-150 outline-none",
          open
            ? "border-[var(--color-border-focus)] ring-2 ring-[var(--color-ring)]"
            : "border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon}
          <span className={cn("truncate", !selected && "text-[var(--color-text-muted)]")}>
            {selected?.label ?? placeholder ?? ""}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "shrink-0 text-[var(--color-text-muted)] transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, y: upward ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: upward ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.2, 0, 0, 1] }}
            className={cn(
              "absolute z-50 max-h-60 overflow-y-auto rounded-lg border p-1",
              "border-[var(--color-border-light)] bg-[var(--color-bg-elevated)]",
              "shadow-[0_8px_24px_var(--color-shadow-lg)]"
            )}
            style={{
              left: 0,
              right: 0,
              minWidth: menuMinWidth,
              ...(upward ? { bottom: "calc(100% + 4px)" } : { top: "calc(100% + 4px)" }),
            }}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px]",
                    "transition-colors duration-100",
                    isSelected
                      ? "bg-[var(--color-primary-subtle)] font-medium text-[var(--color-primary)]"
                      : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]"
                  )}
                >
                  {option.icon}
                  <span className="flex-1 truncate">{option.label}</span>
                  {isSelected && <Check size={13} className="shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
