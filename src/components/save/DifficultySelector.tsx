/**
 * 难度选择器 — 存档难度（+ 可选的实际难度）
 * FEATURES.MERGE_DIFFICULTY 启用时隐藏实际难度并显示 NSU 提示。
 */
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Info, Smile, Meh, Frown, Skull, Gauge } from "lucide-react";

import { Card } from "../ui";
import { FEATURES, DIFFICULTY_LEVELS } from "../../constants";
import { useNsuStatus } from "../../hooks/useNsuStatus";
import SectionTitle from "./SectionTitle";
import { cn } from "../../utils";

const DIFFICULTY_ICONS = {
  easy: Smile,
  normal: Meh,
  hard: Frown,
  nightmare: Skull,
} as const;

export interface DifficultySelectorProps {
  title?: string;
  /** 宿主页面 i18n 前缀："editArchive" | "createArchive" | "quickCreate" */
  i18nPrefix: string;
  archiveDifficulty: string;
  actualDifficulty?: string;
  onArchiveDifficultyChange: (value: string) => void;
  onActualDifficultyChange?: (value: string) => void;
}

function DifficultyGrid({
  i18nPrefix,
  value,
  onChange,
  ariaLabel,
}: {
  i18nPrefix: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-4 gap-2.5" role="radiogroup" aria-label={ariaLabel}>
      {DIFFICULTY_LEVELS.map((level) => {
        const Icon = DIFFICULTY_ICONS[level as keyof typeof DIFFICULTY_ICONS];
        const selected = value === level;
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(level)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border px-2 py-4 transition-all duration-150 ease-out",
              "active:scale-[0.97]",
              selected
                ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] shadow-sm"
                : "border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-tertiary)]"
            )}
          >
            <Icon
              size={22}
              strokeWidth={1.8}
              className={cn(
                "transition-colors",
                selected ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
              )}
            />
            <span
              className={cn(
                "text-xs font-semibold",
                selected ? "text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]"
              )}
            >
              {t(`${i18nPrefix}.difficultyLevels.${level}`, level)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function DifficultySelector({
  title,
  i18nPrefix,
  archiveDifficulty,
  actualDifficulty,
  onArchiveDifficultyChange,
  onActualDifficultyChange,
}: DifficultySelectorProps) {
  const { t } = useTranslation();
  const { nsuActive, nsuProbed, refreshNsuStatus } = useNsuStatus();

  useEffect(() => {
    void refreshNsuStatus();
  }, [refreshNsuStatus]);

  return (
    <div className="flex flex-col gap-3.5">
      {title && <SectionTitle icon={<Gauge size={15} />}>{title}</SectionTitle>}
      <Card className="max-w-[500px] p-5">
        <label className="mb-3.5 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
          {t(`${i18nPrefix}.difficulty`)}
        </label>
        <DifficultyGrid
          i18nPrefix={i18nPrefix}
          value={archiveDifficulty}
          onChange={onArchiveDifficultyChange}
          ariaLabel={t(`${i18nPrefix}.difficulty`)}
        />
      </Card>

      {!FEATURES.MERGE_DIFFICULTY && onActualDifficultyChange && (
        <Card className="max-w-[500px] p-5">
          <label className="mb-3.5 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
            {t(`${i18nPrefix}.actualDifficulty`)}
          </label>
          <DifficultyGrid
            i18nPrefix={i18nPrefix}
            value={actualDifficulty ?? "normal"}
            onChange={onActualDifficultyChange}
            ariaLabel={t(`${i18nPrefix}.actualDifficulty`)}
          />
        </Card>
      )}

      {FEATURES.MERGE_DIFFICULTY && nsuProbed && !nsuActive && (
        <div className="flex max-w-[500px] items-center gap-2 rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          <Info size={14} className="shrink-0 text-[var(--color-danger)]" />
          {t(`${i18nPrefix}.difficultyMergeHint`)}
        </div>
      )}
    </div>
  );
}
