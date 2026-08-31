/**
 * 编辑存档 — 基础信息 Tab：名称 / 难度 / Hub 门解锁
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DoorOpen, Gauge, Info } from "lucide-react";

import { Button, Card, CardDescription } from "../../../components/ui";
import { ArchiveNameCard, DifficultySelector } from "../../../components/save";
import { toast } from "../../../stores";

export interface BasicTabProps {
  name: string;
  onNameChange: (value: string) => void;
  archiveDifficulty: string;
  actualDifficulty: string;
  onArchiveDifficultyChange: (value: string) => void;
  onActualDifficultyChange: (value: string) => void;
  /** 解锁 Hub 门（异步）；原始存档路径由父级持有 */
  onUnlockHubDoors: () => Promise<string>;
}

export default function BasicTab({
  name,
  onNameChange,
  archiveDifficulty,
  actualDifficulty,
  onArchiveDifficultyChange,
  onActualDifficultyChange,
  onUnlockHubDoors,
}: BasicTabProps) {
  const { t } = useTranslation();
  const [unlocking, setUnlocking] = useState(false);

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      const message = await onUnlockHubDoors();
      toast.success(message || t("editArchive.hubDoorsUnlocked"));
    } catch (error) {
      console.error("Unlock hub doors failed:", error);
      toast.error(error instanceof Error && error.message ? error.message : t("editArchive.unlockAllHubDoors"));
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ArchiveNameCard
        title={t("editArchive.tabs.basic")}
        label={t("createArchive.archiveName")}
        placeholder={t("createArchive.archiveNamePlaceholder")}
        errorText={t("createArchive.archiveNameError")}
        value={name}
        onChange={onNameChange}
      />

      <DifficultySelector
        title={t("createArchive.difficulty")}
        i18nPrefix="editArchive"
        archiveDifficulty={archiveDifficulty}
        actualDifficulty={actualDifficulty}
        onArchiveDifficultyChange={onArchiveDifficultyChange}
        onActualDifficultyChange={onActualDifficultyChange}
      />

      {/* 快捷操作：解锁全部 Hub 门 */}
      <Card className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[var(--color-primary-subtle)] p-2 text-[var(--color-primary)]">
            <DoorOpen size={18} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
              {t("editArchive.unlockAllHubDoors")}
            </p>
            <CardDescription>{t("editArchive.hubDoors")}</CardDescription>
          </div>
        </div>
        <Button
          variant="secondary"
          loading={unlocking}
          onClick={() => void handleUnlock()}
          icon={<Gauge size={14} />}
        >
          {t("editArchive.unlockAllHubDoors")}
        </Button>
      </Card>

      <div className="flex items-center gap-2 rounded-lg bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--color-text-muted)]">
        <Info size={13} className="shrink-0 text-[var(--color-primary)]" />
        {t("editArchive.steamIdInfo")}
      </div>
    </div>
  );
}
