/**
 * 编辑存档页（master EditArchive → /games/edit）
 * 数据来源：editArchiveStore 载荷（Home 卡片"编辑"写入）
 * 三个 Tab：基础 / 关卡 / 玩家；保存即写盘（无二次确认）
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Loader2, Save } from "lucide-react";

import { Button } from "../../components/ui";
import { Tabs } from "../../components/ui";
import { InventoryItemSelector } from "../../components/save";
import { systemApi, playerApi } from "../../api";
import { toast } from "../../stores";
import { useEditArchiveStore } from "../../stores";
import { FEATURES } from "../../constants";
import { formatDifficulty } from "../../utils/archiveCreationUtils";
import { stripSteamIdSuffix } from "../../utils/steamIdUtils";
import { getItemIdByName } from "../../utils/itemIdMap";
import type { ArchiveData } from "../../types";
import type { EditPlayer } from "./types";
import BasicTab from "./components/BasicTab";
import LevelTab from "./components/LevelTab";
import PlayerTab from "./components/PlayerTab";

const TAB_ITEMS = [
  { id: "basic", labelKey: "editArchive.tabs.basic" },
  { id: "level", labelKey: "editArchive.tabs.level" },
  { id: "players", labelKey: "editArchive.tabs.players" },
];

export default function EditArchivePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const payload = useEditArchiveStore((s) => s.payload);
  const clearPayload = useEditArchiveStore((s) => s.clearPayload);

  const [originalArchive, setOriginalArchive] = useState<ArchiveData | null>(null);
  const [parseError, setParseError] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [name, setName] = useState("");
  const [currentLevel, setCurrentLevel] = useState("Level0");
  const [archiveDifficulty, setArchiveDifficulty] = useState("normal");
  const [actualDifficulty, setActualDifficulty] = useState("normal");
  const [players, setPlayers] = useState<EditPlayer[]>([]);

  const [activePlayerIndex, setActivePlayerIndex] = useState(-1);
  const [newSteamId, setNewSteamId] = useState("");
  const [playerMessage, setPlayerMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [editingSlot, setEditingSlot] = useState<{ playerIndex: number; slotIndex: number } | null>(null);
  const [editingSteamIdIndex, setEditingSteamIdIndex] = useState<number | null>(null);
  const [editingSteamIdValue, setEditingSteamIdValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ---- 初始化：读取载荷 ----
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
      setActualDifficulty(FEATURES.MERGE_DIFFICULTY ? data.archiveDifficulty || "normal" : data.actualDifficulty || "normal");
      clearPayload();
      void loadPlayerData(data);
    } catch (error) {
      console.error("Archive data parse failed:", error);
      setParseError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPlayerData = async (archive: ArchiveData) => {
    try {
      const playerData = await playerApi.getPlayerData(archive.path);
      if (!playerData?.ids || !playerData?.inventories) return;

      const list: EditPlayer[] = [];
      playerData.ids.forEach((steamId, index) => {
        if (!steamId?.trim()) return;
        const inventory = (playerData.inventories[index] || []).map((item) => item || null);
        while (inventory.length < 12) inventory.push(null);

        let processedId: string;
        let isOffline = false;
        let username: string | null = null;

        if (steamId.includes("-")) {
          processedId = steamId.split("-")[0];
          isOffline = true;
          username = `${processedId}${t("common.localPlayerSuffix")}`;
        } else {
          processedId = stripSteamIdSuffix(steamId);
        }

        list.push({
          steamId: processedId,
          originalSteamId: steamId,
          inventory: inventory.slice(0, 12),
          username,
          isOfflinePlayer: isOffline,
          sanity: playerData.sanities[index] ?? 100,
        });
      });
      setPlayers(list);
      if (list.length > 0) setActivePlayerIndex(0);
    } catch (error) {
      console.error("Load player data failed:", error);
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setPlayerMessage({ text, type });
    setTimeout(() => setPlayerMessage(null), 3000);
  };

  // ---- 玩家操作 ----
  const validateSteamId = (steamId: string) => {
    if (!steamId.trim()) return { valid: false as const, message: t("editArchive.steamIdRequired") };
    if (steamId.includes("-")) {
      const parts = steamId.split("-");
      if (parts.length === 2 && parts[0].length === 5 && parts[1].length === 15) {
        return { valid: true as const, isOfflinePlayer: true, processedSteamId: parts[0] };
      }
      return { valid: false as const, message: t("editArchive.steamIdInvalid") };
    }
    if (!/^\d+$/.test(steamId)) {
      return { valid: false as const, message: t("editArchive.steamIdInvalid") };
    }
    if (steamId.length !== 17) {
      return { valid: false as const, message: t("editArchive.steamIdValidationError", { error: t("editArchive.steamIdLengthError") }) };
    }
    return { valid: true as const, isOfflinePlayer: false, processedSteamId: steamId };
  };

  const addPlayer = () => {
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
      inventory: Array(12).fill(null),
      username: validation.isOfflinePlayer ? `${validation.processedSteamId}${t("common.localPlayerSuffix")}` : null,
      isOfflinePlayer: validation.isOfflinePlayer,
      sanity: 100,
    };
    setPlayers((prev) => [...prev, newPlayer]);
    setActivePlayerIndex(players.length);
    setNewSteamId("");
    showMessage(t("editArchive.playerAddedSuccess"), "success");
  };

  const removePlayer = (index: number) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
    setActivePlayerIndex((idx) => Math.min(idx, players.length - 2));
  };

  const commitSteamId = () => {
    if (editingSteamIdIndex === null) return;
    const value = editingSteamIdValue.trim();
    const validation = validateSteamId(value);
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
  };

  const handleItemSelect = (itemId: string | null) => {
    if (editingSlot && editingSlot.playerIndex >= 0) {
      setPlayers((prev) =>
        prev.map((p, i) =>
          i === editingSlot.playerIndex
            ? { ...p, inventory: p.inventory.map((slot, s) => (s === editingSlot.slotIndex ? itemId : slot)) }
            : p
        )
      );
    }
    setEditingSlot(null);
  };

  // ---- 保存 ----
  const handleSave = async () => {
    if (!originalArchive || isSaving) return;
    setIsSaving(true);
    try {
      const playerInventory: Record<string, Array<{ item: { id: number } }>> = {};
      const playerSanity: Record<string, number> = {};

      players.forEach((player) => {
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
        actualDifficulty: formatDifficulty(FEATURES.MERGE_DIFFICULTY ? archiveDifficulty : actualDifficulty),
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
  };

  const unlockHubDoors = async () => {
    if (!originalArchive) throw new Error("no archive");
    return playerApi.unlockAllHubDoors(originalArchive.path);
  };

  // ---- 错误 / 无载荷状态 ----
  if (parseError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-[var(--color-danger)]">{t("editArchive.parseFailedDataInvalid")}</p>
        <Button variant="secondary" onClick={() => navigate("/saves/all")}>
          {t("common.back")}
        </Button>
      </div>
    );
  }

  if (!originalArchive) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--color-text-muted)]" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 顶栏 */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-5 py-2.5">
        <button
          type="button"
          onClick={() => navigate("/saves/all")}
          className="rounded-md px-2 py-1 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
        >
          {t("common.cancel")}
        </button>
        <h1 className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
          {t("editArchive.title")}: {originalArchive.displayName || originalArchive.name}
        </h1>

        <Tabs
          className="mx-auto"
          items={TAB_ITEMS.map((tab) => ({ id: tab.id, label: t(tab.labelKey) }))}
          active={activeTab}
          onChange={setActiveTab}
        />

        <Button
          variant="primary"
          size="sm"
          className="ml-auto"
          loading={isSaving}
          onClick={() => void handleSave()}
          icon={<Save size={13} />}
        >
          {t("common.save")}
        </Button>
      </div>

      {/* 内容 */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className={activeTab === "basic" ? "block" : "hidden"}>
          <BasicTab
            name={name}
            onNameChange={setName}
            archiveDifficulty={archiveDifficulty}
            actualDifficulty={actualDifficulty}
            onArchiveDifficultyChange={setArchiveDifficulty}
            onActualDifficultyChange={setActualDifficulty}
            onUnlockHubDoors={unlockHubDoors}
          />
        </div>
        <div className={activeTab === "level" ? "block" : "hidden"}>
          <LevelTab currentLevel={currentLevel} onCurrentLevelChange={setCurrentLevel} />
        </div>
        <div className={activeTab === "players" ? "h-full" : "hidden"}>
          <PlayerTab
            players={players}
            activePlayerIndex={activePlayerIndex}
            newSteamId={newSteamId}
            playerInputMessage={playerMessage?.text ?? ""}
            playerInputMessageType={playerMessage?.type ?? ""}
            editingSteamIdIndex={editingSteamIdIndex}
            editingSteamIdValue={editingSteamIdValue}
            onNewSteamIdChange={setNewSteamId}
            onAddSteamId={addPlayer}
            onRemovePlayer={removePlayer}
            onSelectPlayer={setActivePlayerIndex}
            onEditSlot={(slotIndex) => setEditingSlot({ playerIndex: activePlayerIndex, slotIndex })}
            onSanityChange={(sanity) =>
              setPlayers((prev) => prev.map((p, i) => (i === activePlayerIndex ? { ...p, sanity } : p)))
            }
            onStartEditSteamId={(index) => {
              setEditingSteamIdIndex(index);
              setEditingSteamIdValue(players[index].steamId);
            }}
            onEditingSteamIdValueChange={setEditingSteamIdValue}
            onCommitSteamId={commitSteamId}
            onCancelEditSteamId={() => setEditingSteamIdIndex(null)}
          />
        </div>
      </div>

      {/* 物品选择器 */}
      <InventoryItemSelector
        visible={editingSlot !== null}
        selectedItem={
          editingSlot && players[editingSlot.playerIndex]
            ? players[editingSlot.playerIndex].inventory[editingSlot.slotIndex] ?? null
            : null
        }
        onClose={() => setEditingSlot(null)}
        onSelect={handleItemSelect}
      />
    </div>
  );
}
