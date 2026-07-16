import { ref, reactive, computed } from "vue";
import type { ComputedRef, Ref } from "vue";
import { ENDING_LEVELS } from "@/data/endingsData";
import type { DifficultyLevel, QuickCreateBatchResult } from "@/types";

interface SimplifiedState {
  selectedEnding: number;
  selectedLevelKeys: string[];
  difficulty: DifficultyLevel;
  copies: number;
  isCreating: boolean;
  creationProgress: number;
}

interface SimplifiedReturn {
  state: SimplifiedState;
  currentLevels: ComputedRef<string[]>;
  archiveNames: ComputedRef<string[]>;
  canCreate: ComputedRef<boolean>;
  selectEnding: (index: number) => void;
  setDifficulty: (d: DifficultyLevel) => void;
  setCopies: (n: number) => void;
  batchCreate: () => Promise<QuickCreateBatchResult>;
  reset: () => void;
}

function createInitialState(): SimplifiedState {
  return {
    selectedEnding: 0,
    selectedLevelKeys: [],
    difficulty: "normal",
    copies: 1,
    isCreating: false,
    creationProgress: 0,
  };
}

const MAIN_STORYLINE_LEVELS: string[] = [
  "Level0",
  "TopFloor",
  "MiddleFloor",
  "GarageLevel2",
  "BottomFloor",
  "TheHub",
  "Pipes1",
  "ElectricalStation",
  "Office",
  "Hotel",
  "Floor3",
  "BoilerRoom",
  "Pipes2",
  "LevelFun",
  "Poolrooms",
  "LevelRun",
  "TheEnd",
];

// Default difficulty levels where MEG is locked
const MEG_LOCKED_LEVELS = ["Level0", "TopFloor", "MiddleFloor", "GarageLevel2", "BottomFloor", "TheHub"];

function formatDifficulty(difficulty: string | null | undefined): string {
  if (!difficulty) return "Normal";
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
}

export function useQuickCreateSimplified(): SimplifiedReturn {
  const state = reactive<SimplifiedState>(createInitialState());

  // Levels available in current ending
  const currentLevels = computed(() => ENDING_LEVELS[state.selectedEnding] || []);

  // Select ending and auto-select all its levels
  const selectEnding = (index: number) => {
    state.selectedEnding = index;
    state.selectedLevelKeys = [...(ENDING_LEVELS[index] || [])];
  };

  // Generated archive names
  const archiveNames = computed(() => {
    const names: string[] = [];
    for (const levelKey of state.selectedLevelKeys) {
      const base = `${levelKey}_${formatDifficulty(state.difficulty)}`;
      if (state.copies <= 1) {
        names.push(base);
      } else {
        for (let i = 1; i <= state.copies; i++) {
          names.push(`${base}(${i})`);
        }
      }
    }
    return names;
  });

  const canCreate = computed(() => state.selectedLevelKeys.length > 0 && !state.isCreating);

  const setDifficulty = (d: DifficultyLevel) => {
    state.difficulty = d;
  };
  const setCopies = (n: number) => {
    state.copies = Math.max(1, n);
  };

  const loadBasicArchive = async (): Promise<Record<string, unknown> | null> => {
    try {
      const response = await fetch("/BasicArchive.json");
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to load BasicArchive.json:", error);
      return null;
    }
  };

  const createSingleArchive = async (
    levelKey: string,
    basicArchive: Record<string, unknown>,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");

      const isSideStoryline = !MAIN_STORYLINE_LEVELS.includes(levelKey);
      const isMEGUnlocked = !MEG_LOCKED_LEVELS.includes(levelKey);
      const difficultyLabel = formatDifficulty(state.difficulty);

      const saveData: Record<string, unknown> = {
        archive_name: `${levelKey}_${difficultyLabel}`,
        level: levelKey,
        game_mode: "multiplayer",
        difficulty: difficultyLabel,
        actual_difficulty: difficultyLabel,
        players: [],
        basic_archive: basicArchive,
        main_ending: isSideStoryline,
        meg_unlocked: isMEGUnlocked,
      };

      await invoke("handle_new_save", { saveData });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message || String(error) };
    }
  };

  const batchCreate = async (): Promise<QuickCreateBatchResult> => {
    const levelsToCreate = [...state.selectedLevelKeys];
    if (levelsToCreate.length === 0) {
      return { success: 0, failed: 0, errors: [] };
    }

    const basicArchive = await loadBasicArchive();
    if (!basicArchive) {
      return {
        success: 0,
        failed: levelsToCreate.length,
        errors: [{ name: "all", error: "Failed to load archive template" }],
      };
    }

    state.isCreating = true;
    state.creationProgress = 0;

    const results: { success: number; failed: number; errors: Array<{ name: string; error: string }> } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Process all levels in parallel (no batching delay)
    const batchResults = await Promise.allSettled(
      levelsToCreate.map((levelKey) => createSingleArchive(levelKey, basicArchive)),
    );

    for (let i = 0; i < batchResults.length; i++) {
      const result = batchResults[i];
      const levelKey = levelsToCreate[i];
      if (result.status === "fulfilled" && result.value.success) {
        results.success++;
      } else {
        results.failed++;
        const errorMsg =
          result.status === "rejected"
            ? (result.reason as Error)?.message || String(result.reason)
            : result.value?.error || "Unknown error";
        results.errors.push({ name: levelKey, error: errorMsg });
      }
    }

    state.creationProgress = 100;
    state.isCreating = false;

    return results;
  };

  const reset = () => {
    Object.assign(state, createInitialState());
    state.selectedLevelKeys = [...(ENDING_LEVELS[0] || [])];
  };

  // Initialize with all levels from ending 0 selected
  state.selectedLevelKeys = [...(ENDING_LEVELS[0] || [])];

  return {
    state,
    currentLevels,
    archiveNames,
    canCreate,
    selectEnding,
    setDifficulty,
    setCopies,
    batchCreate,
    reset,
  };
}
