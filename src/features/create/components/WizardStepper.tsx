/**
 * 创建向导步骤指示器
 * 步骤数量与文案以此组件为权威来源
 */
import { useTranslation } from "react-i18next";

import { cn } from "../../../utils";

const STEP_LABELS = [
  "createArchive.selectLevelTitle",
  "createArchive.archiveName",
  "createArchive.playerManagement",
];

export const WIZARD_TOTAL_STEPS = STEP_LABELS.length;

export default function WizardStepper({ step }: { step: number }) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex items-center gap-1.5">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                active
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                  : done
                    ? "bg-[var(--color-success-subtle)] text-[var(--color-success)]"
                    : "bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]"
              )}
            >
              {n}
            </span>
            <span
              className={cn(
                "text-xs",
                active
                  ? "font-medium text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-muted)]"
              )}
            >
              {t(label)}
            </span>
            {n < WIZARD_TOTAL_STEPS && (
              <span className="mx-1 h-px w-5 bg-[var(--color-border-default)]" />
            )}
          </div>
        );
      })}
    </div>
  );
}
