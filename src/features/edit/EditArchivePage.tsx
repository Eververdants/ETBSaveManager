/**
 * 编辑存档页（master EditArchive → /games/edit）
 *
 * 数据来源：editArchiveStore 载荷（Home 卡片"编辑"写入）
 * 三个 Tab：基础 / 关卡 / 玩家；保存即写盘（无二次确认）
 *
 * 页面只负责 UI 编排：状态与写盘逻辑在 hooks/useEditArchive，
 * 玩家管理在 hooks/useEditPlayers。
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Loader2, Save } from "lucide-react";

import { Button, Tabs } from "../../components/ui";
import { InventoryItemSelector } from "../../components/save";
import { useEditArchive } from "./hooks/useEditArchive";
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
  const [activeTab, setActiveTab] = useState("basic");

  const {
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
  } = useEditArchive();

  const {
    players,
    activePlayerIndex,
    setActivePlayerIndex,
    newSteamId,
    setNewSteamId,
    playerMessage,
    editingSteamIdIndex,
    editingSteamIdValue,
    setEditingSteamIdValue,
    addPlayer,
    removePlayer,
    startEditSteamId,
    commitSteamId,
    cancelEditSteamId,
    setSanity,
  } = playerEditor;

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
            onSanityChange={(sanity) => setSanity(activePlayerIndex, sanity)}
            onStartEditSteamId={startEditSteamId}
            onEditingSteamIdValueChange={setEditingSteamIdValue}
            onCommitSteamId={commitSteamId}
            onCancelEditSteamId={cancelEditSteamId}
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
