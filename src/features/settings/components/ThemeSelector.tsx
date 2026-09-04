/**
 * 主题切换器（亮 / 暗 / 跟随系统）
 */
import { useTranslation } from "react-i18next";

import { cn } from "../../../utils";

export default function ThemeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  const options = [
    { value: "light", label: t("common.light") },
    { value: "dark", label: t("common.dark") },
    { value: "system", label: t("common.system") },
  ];

  return (
    <div className="flex gap-1 rounded-lg bg-[var(--color-bg-muted)] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-all",
            value === option.value
              ? "bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
