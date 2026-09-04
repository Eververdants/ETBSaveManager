/**
 * 创建向导的玩家管理子状态
 * Steam ID 校验 / 增删玩家 / 背包槽位编辑
 */
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { playerApi } from "../../../api";

export interface WizardPlayer {
  steamId: string;
  inventory: (string | null)[];
  username: string | null;
  isOfflinePlayer: boolean;
  sanity: number;
}

/** 正在编辑的背包槽位 */
export interface EditingSlot {
  playerIndex: number;
  slotIndex: number;
}

export type PlayerMessage = { text: string; type: "success" | "error" } | null;

const PLAYER_MESSAGE_TIMEOUT = 3000;
const INVENTORY_SLOTS = 12;

export function useWizardPlayers() {
  const { t } = useTranslation();

  const [players, setPlayers] = useState<WizardPlayer[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(-1);
  const [newSteamId, setNewSteamId] = useState("");
  const [playerMessage, setPlayerMessage] = useState<PlayerMessage>(null);
  const [editingSlot, setEditingSlot] = useState<EditingSlot | null>(null);

  const activePlayer = activePlayerIndex >= 0 ? players[activePlayerIndex] : null;

  const showPlayerMessage = useCallback((text: string, type: "success" | "error") => {
    setPlayerMessage({ text, type });
    setTimeout(() => setPlayerMessage(null), PLAYER_MESSAGE_TIMEOUT);
  }, []);

  const validateSteamId = useCallback(
    (steamId: string) => {
      if (!steamId.trim()) {
        return { valid: false as const, message: t("createArchive.steamIdRequired") };
      }
      if (steamId.includes("-")) {
        const parts = steamId.split("-");
        if (parts.length === 2 && parts[0].length === 5 && parts[1].length === 15) {
          return { valid: true as const, isOfflinePlayer: true, processedSteamId: parts[0] };
        }
        return { valid: false as const, message: t("createArchive.steamIdInvalid") };
      }
      if (!/^\d+$/.test(steamId)) {
        return { valid: false as const, message: t("createArchive.steamIdInvalid") };
      }
      if (steamId.length !== 17) {
        return {
          valid: false as const,
          message: t("createArchive.steamIdValidationError", {
            error: t("createArchive.steamIdLengthError"),
          }),
        };
      }
      return { valid: true as const, isOfflinePlayer: false, processedSteamId: steamId };
    },
    [t]
  );

  const addSteamId = useCallback(async () => {
    const steamId = newSteamId.trim();
    if (!steamId) return;

    const validation = validateSteamId(steamId);
    if (!validation.valid) {
      showPlayerMessage(validation.message, "error");
      return;
    }

    const processed = validation.processedSteamId;
    if (players.some((p) => p.steamId === processed)) {
      showPlayerMessage(t("createArchive.steamIdDuplicate", { steamId: processed }), "error");
      return;
    }

    // 在线玩家必须有可复用的 EOS 键（steamId_+_|EOS），否则游戏不识别
    if (!validation.isOfflinePlayer) {
      try {
        const map = await playerApi.getPlayerUniqueIds([processed]);
        const foundKey = map[processed];
        if (!foundKey || !foundKey.includes("_+_|")) {
          showPlayerMessage(t("createArchive.playerMissingEosKey", { steamId: processed }), "error");
          return;
        }
      } catch {
        // 查询失败不阻止，退回原逻辑
      }
    }

    setPlayers((prev) => [
      ...prev,
      {
        steamId: processed,
        inventory: Array(INVENTORY_SLOTS).fill(null),
        username: validation.isOfflinePlayer
          ? `${processed}${t("common.localPlayerSuffix")}`
          : null,
        isOfflinePlayer: validation.isOfflinePlayer,
        sanity: 100,
      },
    ]);
    setNewSteamId("");
    setActivePlayerIndex((idx) => (idx === -1 ? 0 : idx));
    showPlayerMessage(t("createArchive.playerAddedSuccess"), "success");
  }, [newSteamId, players, showPlayerMessage, t, validateSteamId]);

  const removePlayer = useCallback(
    (index: number) => {
      setPlayers((prev) => prev.filter((_, i) => i !== index));
      setActivePlayerIndex((idx) => Math.min(idx, players.length - 2));
    },
    [players.length]
  );

  const handleItemSelect = useCallback(
    (itemId: string | null) => {
      if (editingSlot && editingSlot.playerIndex >= 0) {
        setPlayers((prev) =>
          prev.map((p, i) =>
            i === editingSlot.playerIndex
              ? {
                  ...p,
                  inventory: p.inventory.map((slot, s) =>
                    s === editingSlot.slotIndex ? itemId : slot
                  ),
                }
              : p
          )
        );
      }
      setEditingSlot(null);
    },
    [editingSlot]
  );

  const resetPlayers = useCallback(() => {
    setPlayers([]);
    setActivePlayerIndex(-1);
    setNewSteamId("");
    setEditingSlot(null);
  }, []);

  return {
    players,
    setPlayers,
    activePlayerIndex,
    setActivePlayerIndex,
    activePlayer,
    newSteamId,
    setNewSteamId,
    playerMessage,
    addSteamId,
    removePlayer,
    editingSlot,
    setEditingSlot,
    handleItemSelect,
    resetPlayers,
  };
}
