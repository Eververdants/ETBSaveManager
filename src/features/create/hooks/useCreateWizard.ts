/**
 * 经典创建向导的步骤流转与提交
 * Step1 选关卡（含结局路线）→ Step2 命名与难度 → Step3 玩家与背包 → 创建
 *
 * 玩家相关子状态见 hooks/useWizardPlayers
 */
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { playerApi, saveApi } from "../../../api";
import { ENDING_LEVELS } from "../../../constants/endings";
import { FEATURES } from "../../../constants";
import { toast } from "../../../stores";
import { getItemIdByName } from "../../../utils/itemIdMap";
import {
  formatDifficulty,
  isMEGUnlocked,
  isSideStoryline,
  loadBasicArchive,
} from "../../../utils/archiveCreationUtils";
import { useWizardPlayers } from "./useWizardPlayers";

const ENDING_IDS = [0, 1, 2, 3];

export function useCreateWizard() {
  const { t } = useTranslation();
  const wizardPlayers = useWizardPlayers();
  const { players, resetPlayers } = wizardPlayers;

  const [step, setStep] = useState(1);
  const [stepDirection, setStepDirection] = useState(1);
  const [selectedEnding, setSelectedEnding] = useState(0);
  const [selectedLevelKey, setSelectedLevelKey] = useState<string | null>(null);
  const [archiveName, setArchiveName] = useState("");
  const [difficulty, setDifficulty] = useState("normal");
  const [actualDifficulty, setActualDifficulty] = useState("normal");
  const [isCreating, setIsCreating] = useState(false);
  const [createdName, setCreatedName] = useState<string | null>(null);

  const nameHasError = archiveName.includes("_");
  const canProceed =
    step === 1
      ? selectedLevelKey !== null
      : step === 2
        ? archiveName.trim().length > 0 && !nameHasError
        : true;

  // ---- Step 1：关卡选择 ----
  const handleLevelSelect = useCallback((card: { levelKey: string }) => {
    // 跨路线选择时切换结局分组
    const target = ENDING_IDS.findIndex((id) => (ENDING_LEVELS[id] || []).includes(card.levelKey));
    if (target !== -1) setSelectedEnding(target);
    setSelectedLevelKey(card.levelKey);
  }, []);

  // ---- 提交 ----
  const createArchive = useCallback(async () => {
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

      await saveApi.createArchive({
        archive_name: savedName,
        level: selectedLevelKey,
        game_mode: "multiplayer",
        difficulty: formatDifficulty(difficulty),
        actual_difficulty: formatDifficulty(
          FEATURES.MERGE_DIFFICULTY ? difficulty : actualDifficulty
        ),
        players: players.map((p) => ({
          steam_id: uniqueIdMap[p.steamId] || p.steamId || "",
          inventory: (p.inventory || [])
            .filter((item) => item !== null && item !== undefined)
            .map((item) => getItemIdByName(item)),
          sanity: typeof p.sanity === "number" ? p.sanity : 100,
        })),
        basic_archive: (await loadBasicArchive()) || {},
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
  }, [actualDifficulty, archiveName, difficulty, isCreating, players, selectedLevelKey, t]);

  const resetForm = useCallback(() => {
    setStep(1);
    setStepDirection(1);
    setSelectedEnding(0);
    setSelectedLevelKey(null);
    setArchiveName("");
    setDifficulty("normal");
    setActualDifficulty("normal");
    setCreatedName(null);
    resetPlayers();
  }, [resetPlayers]);

  const goNext = useCallback(() => {
    if (step < 3 && canProceed) {
      setStepDirection(1);
      setStep(step + 1);
    } else if (step === 3) {
      void createArchive();
    }
  }, [canProceed, createArchive, step]);

  const goPrev = useCallback(() => {
    if (step > 1) {
      setStepDirection(-1);
      setStep(step - 1);
    }
  }, [step]);

  return {
    ...wizardPlayers,
    step,
    stepDirection,
    canProceed,
    selectedEnding,
    setSelectedEnding,
    selectedLevelKey,
    handleLevelSelect,
    archiveName,
    setArchiveName,
    nameHasError,
    difficulty,
    setDifficulty,
    actualDifficulty,
    setActualDifficulty,
    isCreating,
    createdName,
    setCreatedName,
    createArchive,
    resetForm,
    goNext,
    goPrev,
  };
}
