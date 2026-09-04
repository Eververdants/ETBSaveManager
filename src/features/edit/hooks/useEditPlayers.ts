/**
 * 编辑存档页 — 玩家管理
 *
 * 职责：玩家列表状态、Steam ID 校验、增删与改名、理智度与背包槽位写入。
 * 从 EditArchivePage 拆出，页面只保留 UI 编排。
 */
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { playerApi } from "../../../api";
import { INVENTORY_SLOTS, mapPlayerData } from "../utils/mapPlayerData";
import type { ArchiveData } from "../../../types";
import type { EditPlayer } from "../types";

export type PlayerMessage = { text: string; type: "success" | "error" };

export type SteamIdValidation =
  | { valid: false; message: string }
  | { valid: true; isOfflinePlayer: boolean; processedSteamId: string };

export function useEditPlayers() {
  const { t } = useTranslation();

  const [players, setPlayers] = useState<EditPlayer[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(-1);
  const [newSteamId, setNewSteamId] = useState("");
  const [playerMessage, setPlayerMessage] = useState<PlayerMessage | null>(null);
  const [editingSteamIdIndex, setEditingSteamIdIndex] = useState<number | null>(null);
  const [editingSteamIdValue, setEditingSteamIdValue] = useState("");

  const showMessage = useCallback((text: string, type: "success" | "error") => {
    setPlayerMessage({ text, type });
    setTimeout(() => setPlayerMessage(null), 3000);
  }, []);

  const validateSteamId = useCallback(
    (steamId: string): SteamIdValidation => {
      if (!steamId.trim()) return { valid: false, message: t("editArchive.steamIdRequired") };

      if (steamId.includes("-")) {
        const parts = steamId.split("-");
        if (parts.length === 2 && parts[0].length === 5 && parts[1].length === 15) {
          return { valid: true, isOfflinePlayer: true, processedSteamId: parts[0] };
        }
        return { valid: false, message: t("editArchive.steamIdInvalid") };
      }

      if (!/^\d+$/.test(steamId)) return { valid: false, message: t("editArchive.steamIdInvalid") };
      if (steamId.length !== 17) {
        return {
          valid: false,
          message: t("editArchive.steamIdValidationError", {
            error: t("editArchive.steamIdLengthError"),
          }),
        };
      }
      return { valid: true, isOfflinePlayer: false, processedSteamId: steamId };
    },
    [t]
  );

  /** 从存档文件读取玩家数据并填充列表 */
  const loadFrom = useCallback(
    async (archive: ArchiveData) => {
      try {
        const playerData = await playerApi.getPlayerData(archive.path);
        const list = mapPlayerData(playerData, t("common.localPlayerSuffix"));
        setPlayers(list);
        if (list.length > 0) setActivePlayerIndex(0);
      } catch (error) {
        console.error("Load player data failed:", error);
      }
    },
    [t]
  );

  const addPlayer = useCallback(() => {
    const steamId = newSteamId.trim();
    if (!steamId) return;

    const validation = validateSteamId(steamId);
    if (!validation.valid) {
      showMessage(validation.message, "error");
      return;
    }
    if (players.some((p) => p.steamId === validation.processedSteamId)) {
      showMessage(t("editArchive.steamIdDuplicate", { steamId: validation.processedSteamId }), "error");
      return;
    }

    const newPlayer: EditPlayer = {
      steamId: validation.processedSteamId,
      originalSteamId: "",
      inventory: Array(INVENTORY_SLOTS).fill(null),
      username: validation.isOfflinePlayer
        ? `${validation.processedSteamId}${t("common.localPlayerSuffix")}`
        : null,
      isOfflinePlayer: validation.isOfflinePlayer,
      sanity: 100,
    };

    setPlayers((prev) => [...prev, newPlayer]);
    setActivePlayerIndex(players.length);
    setNewSteamId("");
    showMessage(t("editArchive.playerAddedSuccess"), "success");
  }, [newSteamId, players, showMessage, t, validateSteamId]);

  const removePlayer = useCallback(
    (index: number) => {
      setPlayers((prev) => prev.filter((_, i) => i !== index));
      setActivePlayerIndex((idx) => Math.min(idx, players.length - 2));
    },
    [players.length]
  );

  const startEditSteamId = useCallback(
    (index: number) => {
      setEditingSteamIdIndex(index);
      setEditingSteamIdValue(players[index].steamId);
    },
    [players]
  );

  const commitSteamId = useCallback(() => {
    if (editingSteamIdIndex === null) return;

    const validation = validateSteamId(editingSteamIdValue.trim());
    if (!validation.valid) {
      showMessage(validation.message, "error");
      return;
    }
    if (players.some((p, i) => i !== editingSteamIdIndex && p.steamId === validation.processedSteamId)) {
      showMessage(t("editArchive.steamIdDuplicate", { steamId: validation.processedSteamId }), "error");
      return;
    }

    setPlayers((prev) =>
      prev.map((p, i) => (i === editingSteamIdIndex ? { ...p, steamId: validation.processedSteamId } : p))
    );
    setEditingSteamIdIndex(null);
  }, [editingSteamIdIndex, editingSteamIdValue, players, showMessage, t, validateSteamId]);

  const cancelEditSteamId = useCallback(() => setEditingSteamIdIndex(null), []);

  const setSanity = useCallback((playerIndex: number, sanity: number) => {
    setPlayers((prev) => prev.map((p, i) => (i === playerIndex ? { ...p, sanity } : p)));
  }, []);

  const setSlotItem = useCallback((playerIndex: number, slotIndex: number, itemId: string | null) => {
    if (playerIndex < 0) return;
    setPlayers((prev) =>
      prev.map((p, i) =>
        i === playerIndex
          ? { ...p, inventory: p.inventory.map((slot, s) => (s === slotIndex ? itemId : slot)) }
          : p
      )
    );
  }, []);

  return {
    players,
    activePlayerIndex,
    setActivePlayerIndex,
    newSteamId,
    setNewSteamId,
    playerMessage,
    editingSteamIdIndex,
    editingSteamIdValue,
    setEditingSteamIdValue,
    loadFrom,
    addPlayer,
    removePlayer,
    startEditSteamId,
    commitSteamId,
    cancelEditSteamId,
    setSanity,
    setSlotItem,
  };
}
