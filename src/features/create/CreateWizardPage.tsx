/**
 * 经典创建向导（master CreateArchive → /saves/create/custom）
 * Step1 选关卡（含结局路线）→ Step2 命名与难度 → Step3 玩家与背包 → 创建
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button, Dialog } from "../../components/ui";
import {
  ArchiveNameCard,
  DifficultySelector,
  InventoryItemSelector,
  LevelPicker,
  PlayerDetailPanel,
  PlayerManager,
} from "../../components/save";
import { ENDING_LEVELS } from "../../constants/endings";
import { FEATURES } from "../../constants";
import { playerApi, saveApi } from "../../api";
import { getItemIdByName } from "../../utils/itemIdMap";
import { isMEGUnlocked, isSideStoryline } from "../../utils/archiveCreationUtils";
import { useLevelGroups } from "../../hooks/useLevelGroups";
import { toast } from "../../stores";
import { cn } from "../../utils";

interface WizardPlayer {
  steamId: string;
  inventory: (string | null)[];
  username: string | null;
  isOfflinePlayer: boolean;
  sanity: number;
}

const STEP_LABELS = ["createArchive.selectLevelTitle", "createArchive.archiveName", "createArchive.playerManagement"];

export default function CreateWizardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { groups } = useLevelGroups();

  const [step, setStep] = useState(1);
  const [stepDirection, setStepDirection] = useState(1);
  const [selectedEnding, setSelectedEnding] = useState(0);
  const [selectedLevelKey, setSelectedLevelKey] = useState<string | null>(null);
  const [archiveName, setArchiveName] = useState("");
  const [difficulty, setDifficulty] = useState("normal");
  const [actualDifficulty, setActualDifficulty] = useState("normal");
  const [players, setPlayers] = useState<WizardPlayer[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(-1);
  const [newSteamId, setNewSteamId] = useState("");
  const [playerMessage, setPlayerMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [editingSlot, setEditingSlot] = useState<{ playerIndex: number; slotIndex: number } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createdName, setCreatedName] = useState<string | null>(null);

  const nameHasError = archiveName.includes("_");
  const canProceed =
    step === 1
      ? selectedLevelKey !== null
      : step === 2
        ? archiveName.trim().length > 0 && !nameHasError
        : true;

  const showPlayerMessage = (text: string, type: "success" | "error") => {
    setPlayerMessage({ text, type });
    setTimeout(() => setPlayerMessage(null), 3000);
  };

  // ---- Step 1：关卡选择 ----
  const handleLevelSelect = (card: { levelKey: string }) => {
    // 跨路线选择时切换结局分组
    const target = [0, 1, 2, 3].findIndex((id) => (ENDING_LEVELS[id] || []).includes(card.levelKey));
    if (target !== -1) setSelectedEnding(target);
    setSelectedLevelKey(card.levelKey);
  };

  // ---- Step 3：玩家管理 ----
  const validateSteamId = (steamId: string) => {
    if (!steamId.trim()) return { valid: false as const, message: t("createArchive.steamIdRequired") };
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
      return { valid: false as const, message: t("createArchive.steamIdValidationError", { error: t("createArchive.steamIdLengthError") }) };
    }
    return { valid: true as const, isOfflinePlayer: false, processedSteamId: steamId };
  };

  const addSteamId = async () => {
    const steamId = newSteamId.trim();
    if (!steamId) return;
    const validation = validateSteamId(steamId);
    if (!validation.valid) {
      showPlayerMessage(validation.message, "error");
      return;
    }
    if (players.some((p) => p.steamId === validation.processedSteamId)) {
      showPlayerMessage(t("createArchive.steamIdDuplicate", { steamId: validation.processedSteamId }), "error");
      return;
    }
    // 在线玩家必须有可复用的 EOS 键（steamId_+_|EOS），否则游戏不识别
    if (!validation.isOfflinePlayer) {
      try {
        const map = await playerApi.getPlayerUniqueIds([validation.processedSteamId]);
        const foundKey = map[validation.processedSteamId];
        if (!foundKey || !foundKey.includes("_+_|")) {
          showPlayerMessage(t("createArchive.playerMissingEosKey", { steamId: validation.processedSteamId }), "error");
          return;
        }
      } catch {
        // 查询失败不阻止，退回原逻辑
      }
    }
    setPlayers((prev) => [
      ...prev,
      {
        steamId: validation.processedSteamId,
        inventory: Array(12).fill(null),
        username: validation.isOfflinePlayer
          ? `${validation.processedSteamId}${t("common.localPlayerSuffix")}`
          : null,
        isOfflinePlayer: validation.isOfflinePlayer,
        sanity: 100,
      },
    ]);
    setNewSteamId("");
    setActivePlayerIndex((idx) => (idx === -1 ? 0 : idx));
    showPlayerMessage(t("createArchive.playerAddedSuccess"), "success");
  };

  const removePlayer = (index: number) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
    setActivePlayerIndex((idx) => Math.min(idx, players.length - 2));
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

  // ---- 创建 ----
  const createArchive = async () => {
    if (isCreating) return;
    if (!selectedLevelKey) {
      toast.error(t("createArchive.selectLevelRequired"));
      return;
    }
    setIsCreating(true);
    try {
      const savedName = archiveName.trim() || "Unnamed Archive";
      // 复用已有存档中的完整 PlayerData 键（EOS 后缀无法推导）
      let uniqueIdMap: Record<string, string> = {};
      const steamIds = players.map((p) => p.steamId).filter(Boolean);
      if (steamIds.length > 0) {
        try {
          uniqueIdMap = await playerApi.getPlayerUniqueIds(steamIds);
        } catch {
          // 查询失败退回纯 steam id
        }
      }

      const cap = (v: string) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : "Normal");

      await saveApi.createArchive({
        archive_name: savedName,
        level: selectedLevelKey || "Level0",
        game_mode: "multiplayer",
        difficulty: cap(difficulty),
        actual_difficulty: cap(FEATURES.MERGE_DIFFICULTY ? difficulty : actualDifficulty),
        players: players.map((p) => ({
          steam_id: uniqueIdMap[p.steamId] || p.steamId || "",
          inventory: (p.inventory || [])
            .filter((item) => item !== null && item !== undefined)
            .map((item) => getItemIdByName(item)),
          sanity: typeof p.sanity === "number" ? p.sanity : 100,
        })),
        basic_archive: (await fetchJson("BasicArchive.json")) || {},
        main_ending: isSideStoryline(selectedLevelKey),
        meg_unlocked: isMEGUnlocked(selectedLevelKey),
      });

      setCreatedName(savedName);
      toast.success(t("createArchive.archiveCreated"));
    } catch (error) {
      console.error("Failed to create archive:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast.error(t("createArchive.createFailed", { error: errorMsg }));
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setStepDirection(1);
    setSelectedEnding(0);
    setSelectedLevelKey(null);
    setArchiveName("");
    setDifficulty("normal");
    setActualDifficulty("normal");
    setPlayers([]);
    setActivePlayerIndex(-1);
    setNewSteamId("");
    setCreatedName(null);
  };

  const goNext = () => {
    if (step < 3 && canProceed) {
      setStepDirection(1);
      setStep(step + 1);
    } else if (step === 3) {
      void createArchive();
    }
  };

  const goPrev = () => {
    if (step > 1) {
      setStepDirection(-1);
      setStep(step - 1);
    }
  };

  const activePlayer = activePlayerIndex >= 0 ? players[activePlayerIndex] : null;

  const stepContent = useMemo(
    () => (
      <>
        {/* Step 1 */}
        <div className={step === 1 ? "block" : "hidden"}>
          <LevelPicker
            groups={groups}
            selectedKey={selectedLevelKey ?? ""}
            activeGroup={selectedEnding}
            onActiveGroupChange={setSelectedEnding}
            onSelect={handleLevelSelect}
            searchPlaceholder={t("createArchive.levelSearchPlaceholder")}
            emptyText={t("createArchive.levelSearchEmpty")}
            badgeText={t("editArchive.unlockMainBadge")}
            clearSearchOnGroupChange
          />
        </div>

        {/* Step 2 */}
        <div className={cn("mx-auto max-w-2xl space-y-6", step === 2 ? "block" : "hidden")}>
          <ArchiveNameCard
            title={t("createArchive.archiveName")}
            label={t("createArchive.archiveName")}
            placeholder={t("createArchive.archiveNamePlaceholder")}
            errorText={t("createArchive.archiveNameError")}
            value={archiveName}
            onChange={setArchiveName}
          />
          <DifficultySelector
            title={t("createArchive.difficulty")}
            i18nPrefix="createArchive"
            archiveDifficulty={difficulty}
            actualDifficulty={actualDifficulty}
            onArchiveDifficultyChange={setDifficulty}
            onActualDifficultyChange={setActualDifficulty}
          />
        </div>

        {/* Step 3 */}
        <div className={cn("grid h-full grid-cols-[minmax(280px,2fr)_3fr] gap-4", step === 3 ? "grid" : "hidden")}>
          <PlayerManager
            players={players}
            activePlayerIndex={activePlayerIndex}
            newSteamId={newSteamId}
            playerInputMessage={playerMessage?.text ?? ""}
            playerInputMessageType={playerMessage?.type ?? ""}
            titleKey="createArchive.playerManagement"
            emptyHintKey="createArchive.noPlayersHint"
            steamIdPlaceholderKey="createArchive.steamIdPlaceholder"
            showSanity
            onNewSteamIdChange={setNewSteamId}
            onAddSteamId={() => void addSteamId()}
            onRemovePlayer={removePlayer}
            onSelectPlayer={setActivePlayerIndex}
          />
          <div className="min-h-0 overflow-y-auto">
            {activePlayer ? (
              <PlayerDetailPanel
                player={activePlayer}
                slotLabelPrefix="createArchive"
                onEditSlot={(slotIndex) => setEditingSlot({ playerIndex: activePlayerIndex, slotIndex })}
                onSanityChange={(sanity) =>
                  setPlayers((prev) =>
                    prev.map((p, i) => (i === activePlayerIndex ? { ...p, sanity } : p))
                  )
                }
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--color-border-default)] text-xs text-[var(--color-text-muted)]">
                {t("createArchive.selectPlayerMessage")}
              </div>
            )}
          </div>
        </div>
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, groups, selectedLevelKey, selectedEnding, archiveName, difficulty, actualDifficulty, players, activePlayerIndex, newSteamId, playerMessage]
  );

  return (
    <div className="flex h-full flex-col">
      {/* 顶栏 */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-5 py-2.5">
        <button
          type="button"
          onClick={() => navigate("/saves/create")}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
        >
          <ChevronLeft size={14} />
          {t("common.back")}
        </button>
        <h1 className="text-sm font-semibold text-[var(--color-text-primary)]">{t("createArchive.title")}</h1>

        {/* 步骤指示 */}
        <div className="mx-auto flex items-center gap-1.5">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <div key={label} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    active
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                      : done
                        ? "bg-[var(--color-success-subtle)] text-[var(--color-success)]"
                        : "bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]"
                  )}
                >
                  {n}
                </span>
                <span
                  className={cn(
                    "text-xs",
                    active ? "font-medium text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"
                  )}
                >
                  {t(label)}
                </span>
                {n < 3 && <span className="mx-1 h-px w-5 bg-[var(--color-border-default)]" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* 内容区 */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: stepDirection * 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: stepDirection * -32 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className={step === 3 ? "h-full" : undefined}
          >
            {stepContent}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 底部操作栏 */}
      <div className="flex shrink-0 items-center justify-between border-t border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-5 py-3">
        <Button variant="secondary" onClick={goPrev} disabled={step === 1} icon={<ChevronLeft size={14} />}>
          {t("createArchive.previous")}
        </Button>
        <span className="text-xs tabular-nums text-[var(--color-text-muted)]">
          {t("createArchive.step", { number: step })}
        </span>
        <Button
          variant="primary"
          onClick={goNext}
          disabled={!canProceed || isCreating}
          icon={isCreating ? <Loader2 size={14} className="animate-spin" /> : undefined}
        >
          {step === 3 ? t("createArchive.createArchive") : t("createArchive.next")}
          {step < 3 && <ChevronRight size={14} />}
        </Button>
      </div>

      {/* 物品选择器 */}
      <InventoryItemSelector
        visible={editingSlot !== null}
        selectedItem={
          editingSlot ? players[editingSlot.playerIndex]?.inventory[editingSlot.slotIndex] ?? null : null
        }
        onClose={() => setEditingSlot(null)}
        onSelect={handleItemSelect}
      />

      {/* 成功弹窗 */}
      <Dialog
        open={createdName !== null}
        onClose={() => {
          setCreatedName(null);
          navigate("/saves/all");
        }}
        maxWidth="380px"
        showClose={false}
        title={t("createArchive.archiveCreated")}
        footer={
          <>
        <Button variant="secondary" onClick={() => navigate("/saves/all")}>
          {t("createArchive.editArchive")}
        </Button>
            <Button variant="secondary" onClick={resetForm}>
              {t("createArchive.createAnother")}
            </Button>
            <Button variant="primary" onClick={() => navigate("/saves/all")}>
              {t("createArchive.goHome")}
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          {t("createArchive.archiveCreatedMessage", { name: createdName ?? "" })}
        </p>
      </Dialog>
    </div>
  );
}

async function fetchJson(filename: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(`/${filename}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to read ${filename}:`, error);
    return null;
  }
}
