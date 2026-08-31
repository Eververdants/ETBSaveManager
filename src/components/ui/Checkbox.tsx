/**
 * 复选框
 */
import { Check } from "lucide-react";

import { cn } from "../../utils";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function Checkbox({ checked, onChange, label, disabled, className }: CheckboxProps) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer select-none items-center gap-2",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded border transition-all duration-150",
          checked
            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
            : "border-[var(--color-border-strong)] bg-[var(--color-bg-secondary)]",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-ring)]"
        )}
      >
        {checked && <Check size={11} strokeWidth={3} />}
      </span>
      {label && <span className="text-[13px] text-[var(--color-text-primary)]">{label}</span>}
    </label>
  );
}
