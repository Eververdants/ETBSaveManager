/**
 * 设置页（master Settings + About → /settings）
 * 分区：外观（主题/语言）→ 高级（GPU）→ 系统更新 → 开发者（sav 工具）→ 关于
 * 开发者区仅 developerMode 开启时显示（About 区连续点击图标 5 次开启）。
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Download,
  ExternalLink,
  Info,
  MonitorCog,
  Palette,
  RefreshCw,
  SlidersHorizontal,
  UserCog,
} from "lucide-react";

import { Badge, Button, Card, CardTitle, CardDescription, Switch, Dropdown } from "../../components/ui";
import { supportedLanguages } from "../../locales";
import i18n from "../../locales";
import { useAppStore } from "../../stores";
import { toast } from "../../stores";
import { systemApi } from "../../api";
import { updateService } from "../../services/updateService";
import { APP_VERSION } from "../../constants";
import { storage } from "../../utils/storage";
import { useSavTools } from "./hooks/useSavTools";
import { cn } from "../../utils";

const IS_TAURI = "__TAURI_INTERNALS__" in window;

export default function SettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const developerMode = useAppStore((s) => s.developerMode);
  const setDeveloperMode = useAppStore((s) => s.setDeveloperMode);

  const [gpuDisabled, setGpuDisabled] = useState(false);
  const [checking, setChecking] = useState(false);
  const savTools = useSavTools();

  // 同步 GPU 状态
  useEffect(() => {
    if (!IS_TAURI) return;
    void systemApi.getGpuAccelerationStatus().then(setGpuDisabled).catch(() => undefined);
  }, []);

  // 每日静默检查更新
  useEffect(() => {
    if (!updateService.canCheckUpdate()) return;
    void updateService
      .checkForUpdates()
      .then((info) => {
        updateService.recordLastCheck();
        if ("shouldUpdate" in info && info.shouldUpdate) {
          toast.info(t("settings.updateAvailable"), {
            duration: 8000,
            actions: [
              {
                text: t("settings.goToDownload"),
                onClick: () => void updateService.downloadAndInstall(),
              },
            ],
          });
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTheme = (value: string) => {
    const next = value as "light" | "dark" | "system";
    setTheme(next);
    if (IS_TAURI) {
      void systemApi.setWindowTitle(`${t("common.appName")} — ${t(`common.${next}`)}`).catch(() => undefined);
    }
  };

  const handleLanguage = async (value: string) => {
    const prev = i18n.language;
    try {
      await i18n.changeLanguage(value);
      if (IS_TAURI) {
        await systemApi.setWindowTitle(t("common.appName"));
      }
    } catch (error) {
      // 失败回滚
      await i18n.changeLanguage(prev);
      toast.error(t("common.error"));
    }
  };

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      const info = await updateService.checkForUpdates();
      updateService.recordLastCheck();
      if ("shouldUpdate" in info && info.shouldUpdate) {
        toast.info(t("settings.updateAvailable"), {
          actions: [{ text: t("settings.goToDownload"), onClick: () => void updateService.downloadAndInstall() }],
        });
      } else {
        toast.success(t("settings.latestVersion"));
      }
    } catch {
      toast.error(t("settings.checkUpdateError", { error: "" }));
    } finally {
      setChecking(false);
    }
  };

  const handleGpuToggle = async (disabled: boolean) => {
    setGpuDisabled(disabled);
    try {
      await systemApi.setGpuAcceleration(disabled);
      toast.info(t("settings.gpuAccelerationChangedNeedRestart"));
    } catch {
      setGpuDisabled(!disabled);
      toast.error(t("common.error"));
    }
  };

  // 开发者模式关闭时清理子设置
  const handleDevMode = (enabled: boolean) => {
    setDeveloperMode(enabled);
    if (!enabled) {
      storage.removeItem("performanceMonitor");
      void queryClient.invalidateQueries();
    }
  };

  // About 图标连点 5 次开启开发者模式（彩蛋，与 master 一致）
  const [iconClicks, setIconClicks] = useState<number[]>([]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      {/* ── 外观 ── */}
      <section className="space-y-3">
        <SectionHeader icon={<Palette size={15} />} title={t("settings.appearanceAndLanguage")} />
        <Card className="divide-y divide-[var(--color-border-light)]">
          <div className="p-4">
            <SwitchRow
              label={t("settings.theme")}
              description={t("settings.themeDescription")}
              control={
                <ThemeSelector value={theme} onChange={handleTheme} />
              }
            />
          </div>
          <div className="p-4">
            <SwitchRow
              label={t("settings.language")}
              control={
                <Dropdown
                  className="w-44"
                  value={i18n.language}
                  onChange={(v) => void handleLanguage(v)}
                  options={supportedLanguages.map((l) => ({ value: l.code, label: l.nativeName }))}
                />
              }
            />
          </div>
        </Card>
      </section>

      {/* ── 高级 ── */}
      <section className="space-y-3">
        <SectionHeader icon={<SlidersHorizontal size={15} />} title={t("settings.advancedSettings")} />
        <Card className="p-4">
          <Switch
            checked={gpuDisabled}
            onChange={(v) => void handleGpuToggle(v)}
            label={t("settings.disableGpuAcceleration")}
            description={t("settings.disableGpuAccelerationDescription")}
          />
        </Card>
      </section>

      {/* ── 系统更新 ── */}
      <section className="space-y-3">
        <SectionHeader icon={<RefreshCw size={15} />} title={t("settings.systemAndUpdates")} />
        <Card className="flex items-center justify-between p-4">
          <div>
            <CardTitle>{t("settings.checkUpdatesDescription")}</CardTitle>
            <CardDescription className="mt-1">
              {t("common.versionLabel")} v{APP_VERSION}
            </CardDescription>
          </div>
          <Button size="sm" variant="secondary" loading={checking} onClick={() => void checkForUpdates()} icon={<Download size={13} />}>
            {t("settings.check")}
          </Button>
        </Card>
      </section>

      {/* ── 开发者 ── */}
      {developerMode && (
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
      )}

      {/* ── 关于 ── */}
      <section className="space-y-3">
        <SectionHeader icon={<Info size={15} />} title={t("about.appInfo")} />
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                const now = Date.now();
                const clicks = [...iconClicks, now].filter((ts) => now - ts < 1000);
                setIconClicks(clicks);
                if (clicks.length >= 5) {
                  setDeveloperMode(true);
                  toast.success(t("about.developerModeActivated"));
                  setIconClicks([]);
                }
              }}
              className="h-14 w-14 overflow-hidden rounded-xl border border-[var(--color-border-light)]"
            >
              <img src="/icon.png" alt="ETBToolkit" className="h-full w-full object-contain" draggable={false} />
            </button>
            <div>
              <p className="flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
                {t("common.appName")}
                <Badge tone="primary">v{APP_VERSION}</Badge>
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{t("about.tagline")}</p>
            </div>
            <a
              href="https://github.com/Eververdants/ETBSaveManager"
              target="_blank"
              rel="noreferrer"
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
              aria-label="GitHub"
            >
              <ExternalLink size={17} />
            </a>
          </div>
        </Card>
      </section>
    </div>
  );
}

// ============================================
// 内部小组件
// ============================================
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
      <span className="text-[var(--color-primary)]">{icon}</span>
      {title}
    </h2>
  );
}

function SwitchRow({
  label,
  description,
  control,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{label}</p>
        {description && <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{description}</p>}
      </div>
      {control}
    </div>
  );
}

function ThemeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

function SavToolsCard({
  tools,
}: {
  tools: ReturnType<typeof useSavTools>;
}) {
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
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
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
