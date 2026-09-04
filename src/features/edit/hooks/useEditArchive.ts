/**
 * 编辑存档页 — 存档载入与写盘
 *
 * 职责：读取 store 载荷、基础字段状态、保存（写盘 + 错误分类）。
 * 玩家相关状态委托给 useEditPlayers。
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { playerApi, systemApi } from "../../../api";
import { toast, useEditArchiveStore } from "../../../stores";
import { FEATURES } from "../../../constants";
import { formatDifficulty } from "../../../utils/archiveCreationUtils";
import { stripSteamIdSuffix } from "../../../utils/steamIdUtils";
import { getItemIdByName } from "../../../utils/itemIdMap";
import type { ArchiveData } from "../../../types";
import { useEditPlayers } from "./useEditPlayers";

export function useEditArchive() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const payload = useEditArchiveStore((s) => s.payload);
  const clearPayload = useEditArchiveStore((s) => s.clearPayload);

  const [originalArchive, setOriginalArchive] = useState<ArchiveData | null>(null);
  const [parseError, setParseError] = useState(false);
  const [name, setName] = useState("");
  const [currentLevel, setCurrentLevel] = useState("Level0");
  const [archiveDifficulty, setArchiveDifficulty] = useState("normal");
  const [actualDifficulty, setActualDifficulty] = useState("normal");
  const [editingSlot, setEditingSlot] = useState<{ playerIndex: number; slotIndex: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const playerEditor = useEditPlayers();
  const { loadFrom, setSlotItem } = playerEditor;

  // ---- 初始化：解析 store 载荷并载入玩家数据 ----
  useEffect(() => {
    if (!payload) {
      setParseError(true);
      return;
    }
    try {
      const data = JSON.parse(payload) as ArchiveData;
      setOriginalArchive(data);
      setName(data.name || "");
      setCurrentLevel(data.currentLevel || "Level0");
      setArchiveDifficulty(data.archiveDifficulty || "normal");
      setActualDifficulty(
        FEATURES.MERGE_DIFFICULTY
          ? data.archiveDifficulty || "normal"
          : data.actualDifficulty || "normal"
      );
      clearPayload();
      void loadFrom(data);
    } catch (error) {
      console.error("Archive data parse failed:", error);
      setParseError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleItemSelect = useCallback(
    (itemId: string | null) => {
      if (editingSlot) setSlotItem(editingSlot.playerIndex, editingSlot.slotIndex, itemId);
      setEditingSlot(null);
    },
    [editingSlot, setSlotItem]
  );

  const unlockHubDoors = useCallback(async () => {
    if (!originalArchive) throw new Error("no archive");
    return playerApi.unlockAllHubDoors(originalArchive.path);
  }, [originalArchive]);

  const handleSave = useCallback(async () => {
    if (!originalArchive || isSaving) return;
    setIsSaving(true);
    try {
      const playerInventory: Record<string, Array<{ item: { id: number } }>> = {};
      const playerSanity: Record<string, number> = {};

      playerEditor.players.forEach((player) => {
        // 未编辑 id 时保留存档原始完整键（UniqueNetId 后缀由游戏写入）
        const originalBase = player.originalSteamId
          ? stripSteamIdSuffix(player.originalSteamId).split("-")[0]
          : "";
        const steamId =
          player.originalSteamId && originalBase === player.steamId.trim()
            ? player.originalSteamId
            : player.steamId.trim();

        playerInventory[steamId] = player.inventory.map((itemId) => ({
          item: { id: getItemIdByName(itemId) },
        }));
        playerSanity[steamId] = player.sanity ?? 100;
      });

      const saveData = {
        path: originalArchive.path,
        name,
        mode: "Multiplayer",
        currentLevel,
        difficulty: formatDifficulty(archiveDifficulty),
        actualDifficulty: formatDifficulty(
          FEATURES.MERGE_DIFFICULTY ? archiveDifficulty : actualDifficulty
        ),
        playerInventory,
        playerSanity,
      };

      const outputDir = (await systemApi.getLocalAppdata()) + "\\EscapeTheBackrooms\\Saved\\SaveGames";
      await playerApi.editSaveFile(saveData as unknown as Record<string, unknown>, outputDir);

      toast.success(t("editArchive.saveSuccess"));
      navigate("/saves/all");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Save failed:", error);
      if (errorMsg.includes("Access is denied") || errorMsg.includes("os error 5")) {
        toast.error(t("editArchive.saveErrorAccessDenied"));
      } else if (errorMsg.includes("being used")) {
        toast.error(t("editArchive.saveErrorFileInUse"));
      } else {
        toast.error(t("editArchive.saveError", { error: errorMsg }));
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    actualDifficulty,
    archiveDifficulty,
    currentLevel,
    isSaving,
    name,
    navigate,
    originalArchive,
    playerEditor.players,
    t,
  ]);

  return {
    originalArchive,
    parseError,
    isSaving,
    name,
    setName,
    currentLevel,
    setCurrentLevel,
    archiveDifficulty,
    setArchiveDifficulty,
    actualDifficulty,
    setActualDifficulty,
    editingSlot,
    setEditingSlot,
    handleItemSelect,
    handleSave,
    unlockHubDoors,
    playerEditor,
  };
}
