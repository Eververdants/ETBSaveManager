/**
 * 开关 — Fluent 切换
 */
import { cn } from "../../utils";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export default function Switch({ checked, onChange, disabled, label, description }: SwitchProps) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-10 shrink-0 items-center rounded-full border transition-all duration-150",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
          : "border-[var(--color-border-strong)] bg-[var(--color-bg-tertiary)]"
      )}
    >
      <span
        className={cn(
          "inline-block h-3 w-3 transform rounded-full transition-transform duration-150",
          checked
            ? "ml-[22px] bg-[var(--color-primary-fg)]"
            : "ml-[3px] bg-[var(--color-text-muted)]"
        )}
      />
    </button>
  );

  if (!label && !description) return control;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        {label && (
          <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{label}</p>
        )}
        {description && (
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{description}</p>
        )}
      </div>
      {control}
    </div>
  );
}
