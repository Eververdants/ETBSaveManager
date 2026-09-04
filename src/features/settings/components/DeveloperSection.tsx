/**
 * 开发者选项（仅 developerMode 开启时渲染）+ sav 文件工具
 */
import type { DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { MonitorCog, RefreshCw, UserCog } from "lucide-react";

import { Card, CardTitle, Switch } from "../../../components/ui";
import { useAppStore } from "../../../stores";
import { storage } from "../../../utils/storage";
import { STORAGE_KEYS } from "../../../constants";
import { useSavTools } from "../hooks/useSavTools";
import { cn } from "../../../utils";
import { SectionHeader } from "./SettingsSection";

export default function DeveloperSection() {
  const { t } = useTranslation();
  const developerMode = useAppStore((s) => s.developerMode);
  const setDeveloperMode = useAppStore((s) => s.setDeveloperMode);
  const savTools = useSavTools();

  // 开发者模式关闭时清理子设置
  const handleDevMode = (enabled: boolean) => {
    setDeveloperMode(enabled);
    if (!enabled) {
      storage.removeItem(STORAGE_KEYS.PERFORMANCE_MONITOR);
    }
  };

  if (!developerMode) return null;

  return (
    <section className="space-y-3">
      <SectionHeader icon={<UserCog size={15} />} title={t("settings.developerOptions")} />
      <Card className="p-4">
        <Switch
          checked={developerMode}
          onChange={handleDevMode}
          label={t("settings.developerMode")}
          description={t("settings.developerModeDescription")}
        />
      </Card>
      <SavToolsCard tools={savTools} />
    </section>
  );
}

function SavToolsCard({ tools }: { tools: ReturnType<typeof useSavTools> }) {
  const { t } = useTranslation();
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <MonitorCog size={15} className="text-[var(--color-primary)]" />
        <CardTitle>{t("settings.savFileTools")}</CardTitle>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DropZone
          title={t("settings.parseSavFile")}
          hint={t("settings.dropSavFileHere")}
          active={tools.parseDragOver}
          busy={tools.isParsing}
          onDragOver={(e) => {
            e.preventDefault();
            tools.setParseDragOver(true);
          }}
          onDragLeave={() => tools.setParseDragOver(false)}
          onDrop={tools.handleParseDrop}
          onClick={() => void tools.triggerParse()}
        />
        <DropZone
          title={t("settings.packSavFile")}
          hint={t("settings.dropJsonFileHere")}
          active={tools.packDragOver}
          busy={tools.isPacking}
          onDragOver={(e) => {
            e.preventDefault();
            tools.setPackDragOver(true);
          }}
          onDragLeave={() => tools.setPackDragOver(false)}
          onDrop={tools.handlePackDrop}
          onClick={() => void tools.triggerPack()}
        />
      </div>
    </Card>
  );
}

function DropZone({
  title,
  hint,
  active,
  busy,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
}: {
  title: string;
  hint: string;
  active: boolean;
  busy: boolean;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed p-5 transition-all",
        active
          ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]"
          : "border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]"
      )}
    >
      <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{title}</span>
      <span className="text-[11px] text-[var(--color-text-muted)]">{hint}</span>
      {busy && <RefreshCw size={14} className="animate-spin text-[var(--color-primary)]" />}
    </button>
  );
}
