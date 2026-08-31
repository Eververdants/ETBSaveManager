/**
 * 快速批量创建页（master QuickCreateArchive → /saves/create/quick）
 * 左：关卡勾选网格；右：难度 + 每关份数 + 预览名称；批量创建（5 个/批）。
 * 存档名使用原始关卡 key（与 master 一致）：多份时 Level0(1)、Level0(2)…
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, SquarePen } from "lucide-react";

import { Button, Card, Checkbox, Dialog, Dropdown, LazyImage, ProgressBar } from "../../components/ui";
import { getLevelImage, useLevelName } from "../../utils/levelUtils";
import { ENDING_LEVELS } from "../../constants/endings";
import { DIFFICULTY_LEVELS } from "../../constants";
import type { DifficultyLevel } from "../../types";
import { useQuickCreate } from "./hooks/useQuickCreate";
import { toast } from "../../stores";

export default function QuickCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getLevelName } = useLevelName();
  const { isCreating, creationProgress, createBatch, resetState } = useQuickCreate();

  // 关卡池：全部路线去重（与 master 一致，不含特殊关）
  const levelPool = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const key of [0, 1, 2, 3] as const) {
      for (const level of ENDING_LEVELS[key] || []) {
        if (!seen.has(level)) {
          seen.add(level);
          result.push(level);
        }
      }
    }
    return result;
  }, []);

  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set());
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("normal");
  const [copies, setCopies] = useState(1);
  const [result, setResult] = useState<{
    open: boolean;
    success: number;
    failed: number;
    errors: Array<{ name: string; error: string }>;
  }>({ open: false, success: 0, failed: 0, errors: [] });

  const toggleLevel = (key: string) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // 预览：levelKey × 份数
  const previewNames = useMemo(() => {
    const names: string[] = [];
    for (const levelKey of selectedLevels) {
      if (copies <= 1) {
        names.push(levelKey);
      } else {
        for (let i = 1; i <= copies; i++) names.push(`${levelKey}(${i})`);
      }
    }
    return names;
  }, [selectedLevels, copies]);

  const handleCreate = async () => {
    if (isCreating || previewNames.length === 0) return;
    const batchResult = await createBatch(previewNames, difficulty);

    if (batchResult.success > 0 && batchResult.failed === 0) {
      toast.success(t("quickCreate.result.successTitle"));
      setTimeout(() => {
        resetState();
        setSelectedLevels(new Set());
        navigate("/saves/all");
      }, 1500);
      return;
    }
    setResult({
      open: true,
      success: batchResult.success,
      failed: batchResult.failed,
      errors: batchResult.errors,
    });
  };

  const canCreate = previewNames.length > 0 && !isCreating;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-5 py-2.5">
        <button
          type="button"
          onClick={() => navigate("/saves/create")}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
        >
          <ChevronLeft size={14} />
          {t("common.back")}
        </button>
        <h1 className="text-sm font-semibold text-[var(--color-text-primary)]">{t("quickCreate.title")}</h1>
        {isCreating && (
          <div className="mx-auto flex w-48 items-center gap-2">
            <ProgressBar value={creationProgress} />
            <span className="text-[11px] tabular-nums text-[var(--color-text-muted)]">
              {Math.round(creationProgress)}%
            </span>
          </div>
        )}
        <Button
          variant="primary"
          size="sm"
          className="ml-auto"
          disabled={!canCreate}
          onClick={() => void handleCreate()}
          icon={isCreating ? <Loader2 size={13} className="animate-spin" /> : <SquarePen size={13} />}
        >
          {isCreating
            ? t("quickCreate.creating")
            : t("quickCreate.create", { count: previewNames.length })}
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[7fr_5fr] gap-4 overflow-hidden p-5">
        {/* 关卡勾选网格 */}
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-4 py-2.5">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
              {t("quickCreate.levelGrid")}
            </span>
            <span className="text-xs tabular-nums text-[var(--color-text-muted)]">{selectedLevels.size}</span>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(150px,1fr))] content-start gap-3 overflow-y-auto p-4">
            {levelPool.map((key) => {
              const checked = selectedLevels.has(key);
              return (
                <label
                  key={key}
                  className="relative cursor-pointer overflow-hidden rounded-lg border transition-all duration-150"
                  style={{
                    borderColor: checked ? "var(--color-primary)" : "var(--color-border-light)",
                    boxShadow: checked ? "0 0 0 2px var(--color-ring)" : undefined,
                  }}
                >
                  <div className="absolute left-1.5 top-1.5 z-10">
                    <Checkbox checked={checked} onChange={() => toggleLevel(key)} />
                  </div>
                  <LazyImage src={getLevelImage(key)} alt={getLevelName(key)} className="aspect-video w-full" />
                  <p className="truncate bg-[var(--color-bg-secondary)] px-2 py-1.5 text-center text-[11px] font-medium text-[var(--color-text-primary)]">
                    {getLevelName(key)}
                  </p>
                </label>
              );
            })}
          </div>
        </Card>

        {/* 选项 + 预览 */}
        <div className="flex min-h-0 flex-col gap-4">
          <Card className="space-y-4 p-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                {t("quickCreate.options.difficulty")}
              </label>
              <Dropdown
                value={difficulty}
                onChange={(v) => setDifficulty(v as DifficultyLevel)}
                options={DIFFICULTY_LEVELS.map((d) => ({ value: d, label: t(`archiveCard.${d}`) }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
                {t("quickCreate.options.copies")}
              </label>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setCopies((c) => Math.max(1, c - 1))}>
                  −
                </Button>
                <span className="w-10 text-center text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
                  {copies}
                </span>
                <Button size="sm" variant="secondary" onClick={() => setCopies((c) => Math.min(99, c + 1))}>
                  +
                </Button>
              </div>
            </div>
          </Card>

          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="border-b border-[var(--color-border-light)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-text-primary)]">
              {t("quickCreate.preview")}
              {previewNames.length > 0 && (
                <span className="ml-1.5 text-xs font-normal text-[var(--color-text-muted)]">
                  {previewNames.length}
                </span>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {previewNames.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {previewNames.map((name) => (
                    <span
                      key={name}
                      className="rounded-full bg-[var(--color-primary-subtle)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-primary)]"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-xs text-[var(--color-text-muted)]">—</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* 结果弹窗 */}
      <Dialog
        open={result.open}
        onClose={() => {
          setResult({ open: false, success: 0, failed: 0, errors: [] });
          resetState();
        }}
        title={result.failed > 0 ? t("quickCreate.result.partialTitle") : t("quickCreate.result.successTitle")}
        maxWidth="420px"
        showClose={false}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setResult({ open: false, success: 0, failed: 0, errors: [] });
                resetState();
              }}
            >
              {t("quickCreate.result.continueEditing")}
            </Button>
            <Button variant="primary" onClick={() => navigate("/saves/all")}>
              {t("quickCreate.result.viewArchives")}
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-[13px]">
          <p className="text-[var(--color-success)]">
            {t("quickCreate.result.successCount")}: {result.success}
          </p>
          {result.failed > 0 && (
            <p className="text-[var(--color-danger)]">
              {t("quickCreate.result.failedCount")}: {result.failed}
            </p>
          )}
          {result.errors.length > 0 && (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg bg-[var(--color-bg-secondary)] p-2.5">
              {result.errors.map((e) => (
                <p key={e.name} className="truncate text-xs text-[var(--color-danger)]">
                  {e.name}: {e.error}
                </p>
              ))}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
