/**
 * 模组管理 — UE4SS / NSU 安装卸载与安装进度
 *
 * 依赖游戏路径的校验结果，由 useMods 组合时注入。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";

import { modsApi } from "../../../api";
import { toast } from "../../../stores";
import type { ModInstallProgress, ModsStatus, Ue4ssChannel } from "../../../types";

export interface ModProgress {
  name: string;
  percent: number;
  phase: string;
}

export interface UseModsInstallParams {
  gameRoot: string;
  pathValid: boolean | null;
  status: ModsStatus | null;
  nsuEnabled: boolean;
  setNsuEnabled: (enabled: boolean) => void;
  refreshStatus: (root: string) => Promise<void>;
}

export function useModsInstall({
  gameRoot,
  pathValid,
  status,
  nsuEnabled,
  setNsuEnabled,
  refreshStatus,
}: UseModsInstallParams) {
  const { t } = useTranslation();

  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<ModProgress | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);

  // ---- 安装进度事件 ----
  useEffect(() => {
    let disposed = false;
    void listen<ModInstallProgress>("mod-install-progress", (event) => {
      const p = event.payload;
      setProgress({ name: p.mod_name, percent: p.percent, phase: p.phase });
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

  const errorToast = useCallback(
    (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("not installed")) toast.error(t("mods.errors.ue4ssNotInstalled"));
      else if (message.includes("Invalid game root") || message.includes("game root"))
        toast.error(t("mods.errors.invalidGameRoot"));
      else if (message.includes("denied") || message.includes("permission"))
        toast.error(t("mods.errors.permissionDenied"));
      else if (message.includes("network") || message.includes("download"))
        toast.error(t("mods.errors.network"));
      else toast.error(message);
    },
    [t]
  );

  /** 统一 busy 守卫 + 错误提示，避免五个操作各自复制一遍 */
  const runBusy = useCallback(
    async (key: string, task: () => Promise<void>) => {
      if (!gameRoot || !pathValid) return;
      setBusy(key);
      try {
        await task();
      } catch (error) {
        errorToast(error);
      } finally {
        setBusy(null);
      }
    },
    [gameRoot, pathValid, errorToast]
  );

  const installUe4ss = useCallback(
    (channel: Ue4ssChannel) =>
      runBusy("ue4ss", async () => {
        await modsApi.installUe4ss(gameRoot, channel);
        toast.success(t("mods.toast.ue4ssInstalled"));
        await refreshStatus(gameRoot);
      }),
    [gameRoot, refreshStatus, runBusy, t]
  );

  const uninstallUe4ss = useCallback(
    () =>
      runBusy("ue4ss-rm", async () => {
        const report = await modsApi.uninstallUe4ss(gameRoot);
        if (report.removed_dependent_mods.length > 0) {
          toast.success(
            t("mods.toast.ue4ssUninstalledWithDeps", { mods: report.removed_dependent_mods.join(", ") })
          );
        } else {
          toast.success(t("mods.toast.ue4ssUninstalled"));
        }
        await refreshStatus(gameRoot);
      }),
    [gameRoot, refreshStatus, runBusy, t]
  );

  const installNsu = useCallback(
    () =>
      runBusy("nsu", async () => {
        await modsApi.installNsu(gameRoot);
        toast.success(t("mods.toast.nsuInstalled"));
        await refreshStatus(gameRoot);
      }),
    [gameRoot, refreshStatus, runBusy, t]
  );

  const uninstallNsu = useCallback(
    () =>
      runBusy("nsu-rm", async () => {
        await modsApi.uninstallNsu(gameRoot);
        toast.success(t("mods.toast.nsuUninstalled"));
        await refreshStatus(gameRoot);
      }),
    [gameRoot, refreshStatus, runBusy, t]
  );

  const toggleNsu = useCallback(
    async (enabled: boolean) => {
      if (!gameRoot || !pathValid || !status?.nsu_installed) return;
      // 乐观切换，失败回滚
      setNsuEnabled(enabled);
      try {
        await modsApi.setNsuEnabled(gameRoot, enabled);
        toast.success(enabled ? t("mods.toast.nsuEnabledOn") : t("mods.toast.nsuEnabledOff"));
      } catch (error) {
        setNsuEnabled(nsuEnabled);
        errorToast(error);
      }
    },
    [gameRoot, nsuEnabled, pathValid, setNsuEnabled, status, errorToast, t]
  );

  return { busy, progress, installUe4ss, uninstallUe4ss, installNsu, uninstallNsu, toggleNsu };
}
