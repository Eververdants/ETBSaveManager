/**
 * 模组管理页（master Mods → /mods/installed）
 * 游戏路径选择/校验 + UE4SS / NSU 安装管理 + 安装进度事件
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import {
  CheckCircle2,
  CircleAlert,
  Download,
  ExternalLink,
  FolderOpen,
  FolderSearch,
  Package,
  PackageX,
  XCircle,
} from "lucide-react";

import { Badge, Button, Card, CardTitle, CardDescription, Switch } from "../../components/ui";
import { modsApi } from "../../api";
import { GAME_ROOT_KEY } from "../../api/mods";
import { storage } from "../../utils/storage";
import { toast } from "../../stores";
import type { ModsStatus, ModInstallProgress, Ue4ssChannel } from "../../types";

const UE4SS_GITHUB = "https://github.com/UE4SS-RE/RE-UE4SS";

export default function ModsPage() {
  const { t } = useTranslation();

  const [gameRoot, setGameRoot] = useState<string>("");
  const [pathValid, setPathValid] = useState<boolean | null>(null);
  const [pathReason, setPathReason] = useState<string>("");
  const [win64Dir, setWin64Dir] = useState<string>("");
  const [status, setStatus] = useState<ModsStatus | null>(null);
  const [nsuEnabled, setNsuEnabled] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ name: string; percent: number; phase: string } | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);

  const refreshStatus = useCallback(async (root: string) => {
    if (!root) return;
    try {
      const info = await modsApi.validateGamePath(root);
      setPathValid(info.valid);
      setPathReason(info.reason);
      if (info.valid) {
        const s = await modsApi.getModsStatus(info.canonical_root ?? root);
        setStatus(s);
        setNsuEnabled(s.nsu_enabled);
        setWin64Dir(s.win64_dir);
        storage.setItem(GAME_ROOT_KEY, info.canonical_root ?? root);
      } else {
        setStatus(null);
      }
    } catch (error) {
      console.warn("Failed to validate game path:", error);
      setPathValid(false);
    }
  }, []);

  // ---- 初始化：读路径，缺省时探测 Steam 库 ----
  useEffect(() => {
    void (async () => {
      const saved = storage.getItem<string>(GAME_ROOT_KEY) || "";
      let root = saved;
      if (!root) {
        try {
          root = (await modsApi.detectGamePath()) || "";
          if (root) toast.info(t("mods.gamePath.detected"));
        } catch {
          root = "";
        }
      }
      setGameRoot(root);
      if (root) await refreshStatus(root);
    })();
    return () => {
      unlistenRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- 安装进度事件 ----
  useEffect(() => {
    let disposed = false;
    void listen<ModInstallProgress>("mod-install-progress", (event) => {
      const p = event.payload;
      setProgress({
        name: p.mod_name,
        percent: p.percent,
        phase: p.phase,
      });
      if (p.phase === "done") {
        setTimeout(() => setProgress(null), 1200);
      }
    }).then((fn) => {
      if (disposed) fn();
      else unlistenRef.current = fn;
    });
    return () => {
      disposed = true;
      unlistenRef.current?.();
    };
  }, []);

  const chooseFolder = async () => {
    const selected = await open({ directory: true });
    if (typeof selected !== "string" || !selected) return;
    setGameRoot(selected);
    await refreshStatus(selected);
  };

  const errorToast = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("not installed")) toast.error(t("mods.errors.ue4ssNotInstalled"));
    else if (message.includes("Invalid game root") || message.includes("game root"))
      toast.error(t("mods.errors.invalidGameRoot"));
    else if (message.includes("denied") || message.includes("permission"))
      toast.error(t("mods.errors.permissionDenied"));
    else if (message.includes("network") || message.includes("download"))
      toast.error(t("mods.errors.network"));
    else toast.error(message);
  };

  const installUe4ss = async (channel: Ue4ssChannel) => {
    if (!gameRoot || !pathValid) return;
    setBusy("ue4ss");
    try {
      await modsApi.installUe4ss(gameRoot, channel);
      toast.success(t("mods.toast.ue4ssInstalled"));
      await refreshStatus(gameRoot);
    } catch (error) {
      errorToast(error);
    } finally {
      setBusy(null);
    }
  };

  const uninstallUe4ss = async () => {
    if (!gameRoot || !pathValid) return;
    setBusy("ue4ss-rm");
    try {
      const report = await modsApi.uninstallUe4ss(gameRoot);
      if (report.removed_dependent_mods.length > 0) {
        toast.success(
          t("mods.toast.ue4ssUninstalledWithDeps", { mods: report.removed_dependent_mods.join(", ") })
        );
      } else {
        toast.success(t("mods.toast.ue4ssUninstalled"));
      }
      await refreshStatus(gameRoot);
    } catch (error) {
      errorToast(error);
    } finally {
      setBusy(null);
    }
  };

  const installNsu = async () => {
    if (!gameRoot || !pathValid) return;
    setBusy("nsu");
    try {
      await modsApi.installNsu(gameRoot);
      toast.success(t("mods.toast.nsuInstalled"));
      await refreshStatus(gameRoot);
    } catch (error) {
      errorToast(error);
    } finally {
      setBusy(null);
    }
  };

  const uninstallNsu = async () => {
    if (!gameRoot || !pathValid) return;
    setBusy("nsu-rm");
    try {
      await modsApi.uninstallNsu(gameRoot);
      toast.success(t("mods.toast.nsuUninstalled"));
      await refreshStatus(gameRoot);
    } catch (error) {
      errorToast(error);
    } finally {
      setBusy(null);
    }
  };

  const toggleNsu = async (enabled: boolean) => {
    if (!gameRoot || !pathValid || !status?.nsu_installed) return;
    // 乐观切换，失败回滚
    setNsuEnabled(enabled);
    try {
      await modsApi.setNsuEnabled(gameRoot, enabled);
      toast.success(enabled ? t("mods.toast.nsuEnabledOn") : t("mods.toast.nsuEnabledOff"));
    } catch (error) {
      setNsuEnabled(!enabled);
      errorToast(error);
    }
  };

  const reasonText = (reason: string): string => {
    const map: Record<string, string> = {
      "path_not_found": t("mods.gamePath.invalidPathNotFound"),
      "not_game_root": t("mods.gamePath.invalidNotGameRoot"),
    };
    return map[reason] || reason;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-5">
      {/* 游戏路径 */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{t("mods.gamePath.title")}</CardTitle>
            <CardDescription className="mt-1">
              {gameRoot || t("mods.gamePath.notSet")}
            </CardDescription>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="secondary" icon={<FolderSearch size={13} />} onClick={() => void chooseFolder()}>
              {t("mods.gamePath.choose")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<FolderOpen size={13} />}
              disabled={!win64Dir}
              onClick={() => void modsApi.openModsFolder()}
            >
              {t("mods.gamePath.openFolder")}
            </Button>
          </div>
        </div>
        {pathValid === false && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--color-danger-subtle)] px-3 py-2 text-xs text-[var(--color-danger)]">
            <XCircle size={13} className="shrink-0" />
            {reasonText(pathReason)}
          </div>
        )}
        {pathValid && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-success)]">
            <CheckCircle2 size={13} />
            {t("mods.gamePath.validShort")}
          </div>
        )}
      </Card>

      {/* 安装进度 */}
      {progress && (
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--color-text-primary)]">
              {t("mods.progress.installing")} · {t(`mods.progress.${progress.phase}`)}
            </span>
            <span className="tabular-nums text-[var(--color-text-muted)]">{Math.round(progress.percent)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </Card>
      )}

      {/* UE4SS */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[var(--color-primary-subtle)] p-2 text-[var(--color-primary)]">
              <Package size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>UE4SS</CardTitle>
                <Ue4ssBadge status={status} />
              </div>
              <CardDescription className="mt-1">{t("mods.ue4ss.desc")}</CardDescription>
              <a
                href={UE4SS_GITHUB}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs text-[var(--color-text-link)] hover:underline"
              >
                GitHub <ExternalLink size={11} />
              </a>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {status?.ue4ss_installed ? (
              <Button size="sm" variant="danger" loading={busy === "ue4ss-rm"} icon={<PackageX size={13} />} onClick={() => void uninstallUe4ss()}>
                {t("mods.common.uninstall")}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="primary" loading={busy === "ue4ss"} onClick={() => void installUe4ss("recommended")}>
                  {t("mods.ue4ss.installRecommended")}
                </Button>
                <Button size="sm" variant="secondary" loading={busy === "ue4ss"} onClick={() => void installUe4ss("latest")}>
                  {t("mods.ue4ss.installLatest")}
                </Button>
              </div>
            )}
            {status?.ue4ss_installed && status.ue4ss_version && (
              <span className="text-[11px] text-[var(--color-text-muted)]">v{status.ue4ss_version}</span>
            )}
          </div>
        </div>

        {/* 卸载提示：依赖它的第三方模组会被一并移除 */}
        {status?.ue4ss_installed && status.dependent_mods.length > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
            <CircleAlert size={13} className="mt-0.5 shrink-0 text-[var(--color-danger)]" />
            {t("mods.ue4ss.uninstallDependentsPrefix")} {status.dependent_mods.join(", ")}
          </div>
        )}
      </Card>

      {/* NSU */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[var(--color-primary-subtle)] p-2 text-[var(--color-primary)]">
              <Package size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>{t("mods.nsu.name")}</CardTitle>
                {status?.nsu_installed ? (
                  <Badge tone={nsuEnabled ? "success" : "neutral"}>
                    {nsuEnabled ? t("mods.status.installed") : t("mods.status.installedDisabled")}
                  </Badge>
                ) : (
                  <Badge>{t("mods.status.notInstalled")}</Badge>
                )}
              </div>
              <CardDescription className="mt-1">{t("mods.nsu.desc")}</CardDescription>
              {status?.nsu_installed && !status.ue4ss_installed && (
                <p className="mt-1.5 text-xs text-[var(--color-danger)]">{t("mods.nsu.requiresUe4ss")}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            {status?.nsu_installed ? (
              <Button size="sm" variant="danger" loading={busy === "nsu-rm"} icon={<PackageX size={13} />} onClick={() => void uninstallNsu()}>
                {t("mods.common.uninstall")}
              </Button>
            ) : (
              <Button size="sm" variant="primary" loading={busy === "nsu"} disabled={!!status && !status.ue4ss_installed} icon={<Download size={13} />} onClick={() => void installNsu()}>
                {t("mods.nsu.install")}
              </Button>
            )}
          </div>
        </div>
        {status?.nsu_installed && (
          <div className="mt-3">
            <Switch
              checked={nsuEnabled}
              onChange={(v) => void toggleNsu(v)}
              label={t("mods.nsu.enabled")}
              description={t("mods.nsu.enableDesc")}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

function Ue4ssBadge({ status }: { status: ModsStatus | null }) {
  const { t } = useTranslation();
  if (!status?.ue4ss_installed) return <Badge>{t("mods.status.notInstalled")}</Badge>;
  if (status.ue4ss_managed) {
    return (
      <Badge tone="success">
        {t("mods.status.installed")}
        {status.ue4ss_channel ? ` · ${t(`mods.ue4ss.channel${status.ue4ss_channel === "recommended" ? "Recommended" : "Latest"}`)}` : ""}
      </Badge>
    );
  }
  return <Badge tone="warning">{t("mods.status.detectedUnmanaged")}</Badge>;
}
