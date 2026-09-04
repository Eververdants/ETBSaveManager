/**
 * 模组管理 — 游戏路径校验与状态刷新
 *
 * 职责：读写已保存的游戏根目录、缺省时探测 Steam 库、校验路径并拉取模组状态。
 */
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/plugin-dialog";

import { GAME_ROOT_KEY, modsApi } from "../../../api";
import { toast } from "../../../stores";
import { storage } from "../../../utils/storage";
import type { ModsStatus } from "../../../types";

export function useModsGamePath() {
  const { t } = useTranslation();

  const [gameRoot, setGameRoot] = useState("");
  const [pathValid, setPathValid] = useState<boolean | null>(null);
  const [pathReason, setPathReason] = useState("");
  const [win64Dir, setWin64Dir] = useState("");
  const [status, setStatus] = useState<ModsStatus | null>(null);
  const [nsuEnabled, setNsuEnabled] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chooseFolder = useCallback(async () => {
    const selected = await open({ directory: true });
    if (typeof selected !== "string" || !selected) return;
    setGameRoot(selected);
    await refreshStatus(selected);
  }, [refreshStatus]);

  const reasonText = useCallback(
    (reason: string): string => {
      const map: Record<string, string> = {
        path_not_found: t("mods.gamePath.invalidPathNotFound"),
        not_game_root: t("mods.gamePath.invalidNotGameRoot"),
      };
      return map[reason] || reason;
    },
    [t]
  );

  return {
    gameRoot,
    pathValid,
    pathReason,
    win64Dir,
    status,
    nsuEnabled,
    setNsuEnabled,
    refreshStatus,
    chooseFolder,
    reasonText,
  };
}
