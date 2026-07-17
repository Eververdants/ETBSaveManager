import { reactive, computed } from "vue";
import type { ComputedRef } from "vue";
import { ENDING_LEVELS } from "@/data/endingsData";
import type { DifficultyLevel, QuickCreateBatchResult } from "@/types";
import { invoke } from "@tauri-apps/api/core";
import { formatDifficulty, loadBasicArchive, isSideStoryline, isMEGUnlocked } from "@/utils/archiveCreationUtils";

/** All unique levels across all endings, in order */
const ALL_LEVELS = (() => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const key of [0, 1, 2, 3]) {
    for (const level of ENDING_LEVELS[key] || []) {
      if (!seen.has(level)) {
        seen.add(level);
        result.push(level);
      }
    }
  }
  return result;
})();

interface SimplifiedState {
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
  setDifficulty: (d: DifficultyLevel) => void;
  setCopies: (n: number) => void;
  batchCreate: () => Promise<QuickCreateBatchResult>;
  reset: () => void;
}

function createInitialState(): SimplifiedState {
  return {
    selectedLevelKeys: [],
    difficulty: "normal",
    copies: 1,
    isCreating: false,
    creationProgress: 0,
  };
}

export function useQuickCreateSimplified(): SimplifiedReturn {
  const state = reactive<SimplifiedState>(createInitialState());
  const currentLevels = computed(() => ALL_LEVELS);
  /**
   * Preview archive names based on current selection and copies.
   * NOTE: Final created names may differ from these preview names
   * because batchCreate() resolves duplicates via resolveName()
   * which appends "-2", "-3", etc. suffixes to avoid conflicts
   * with existing saves on disk.
   */
  const archiveNames = computed(() => {
    const names: string[] = [];
    for (const levelKey of state.selectedLevelKeys) {
      if (state.copies <= 1) {
        names.push(levelKey);
      } else {
        for (let i = 1; i <= state.copies; i++) {
          names.push(`${levelKey}(${i})`);
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

  const createSingleArchive = async (
    archiveName: string,
    levelKey: string,
    basicArchive: Record<string, unknown>,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const difficultyLabel = formatDifficulty(state.difficulty);
      const saveData: Record<string, unknown> = {
        archive_name: archiveName,
        level: levelKey,
        game_mode: "multiplayer",
        difficulty: difficultyLabel,
        actual_difficulty: difficultyLabel,
        players: [],
        basic_archive: basicArchive,
        main_ending: isSideStoryline(levelKey),
        meg_unlocked: isMEGUnlocked(levelKey),
      };
      await invoke("handle_new_save", { saveData });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message || String(error) };
    }
  };

  function resolveName(baseName: string, takenNames: Set<string>): string {
    if (!takenNames.has(baseName)) {
      takenNames.add(baseName);
      return baseName;
    }
    let counter = 2;
    while (takenNames.has(`${baseName}-${counter}`)) {
      counter++;
    }
    const resolved = `${baseName}-${counter}`;
    takenNames.add(resolved);
    return resolved;
  }

  const batchCreate = async (): Promise<QuickCreateBatchResult> => {
    const levelsToCreate = [...state.selectedLevelKeys];
    if (levelsToCreate.length === 0) {
      return { success: 0, failed: 0, errors: [] };
    }
    state.isCreating = true;
    state.creationProgress = 0;
    const basicArchive = await loadBasicArchive();
    if (!basicArchive) {
      state.isCreating = false;
      return {
        success: 0,
        failed: levelsToCreate.length,
        errors: [{ name: "all", error: "Failed to load archive template" }],
      };
    }
    const existingNames = new Set<string>();
    try {
      const existingSaves = await invoke<Array<{ name: string }>>("load_all_saves");
      for (const save of existingSaves) {
        if (save.name) existingNames.add(save.name);
      }
    } catch (error) {
      console.warn("Failed to load existing saves for dedup check, proceeding without:", error);
    }
    const results: { success: number; failed: number; errors: Array<{ name: string; error: string }> } = {
      success: 0,
      failed: 0,
      errors: [],
    };
    const allEntries: Array<{ levelKey: string; archiveName: string }> = [];
    const takenNames = new Set(existingNames);
    for (const levelKey of levelsToCreate) {
      if (state.copies <= 1) {
        const resolved = resolveName(levelKey, takenNames);
        allEntries.push({ levelKey, archiveName: resolved });
      } else {
        for (let i = 1; i <= state.copies; i++) {
          const baseName = `${levelKey}(${i})`;
          const resolved = resolveName(baseName, takenNames);
          allEntries.push({ levelKey, archiveName: resolved });
        }
      }
    }
    const BATCH_SIZE = 5;
    for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
      const batch = allEntries.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(({ levelKey, archiveName }) => createSingleArchive(archiveName, levelKey, basicArchive)),
      );
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const { archiveName } = batch[j];
        if (result.status === "fulfilled" && result.value.success) {
          results.success++;
        } else {
          results.failed++;
          const errorMsg =
            result.status === "rejected"
              ? (result.reason as Error)?.message || String(result.reason)
              : result.value?.error || "Unknown error";
          results.errors.push({ name: archiveName, error: errorMsg });
        }
      }
      const completed = Math.min(i + BATCH_SIZE, allEntries.length);
      state.creationProgress = Math.round((completed / allEntries.length) * 100);
    }
    state.creationProgress = 100;
    state.isCreating = false;
    return results;
  };

  const reset = () => {
    Object.assign(state, createInitialState());
    state.selectedLevelKeys = [...ALL_LEVELS];
  };
  state.selectedLevelKeys = [...ALL_LEVELS];
  return {
    state,
    currentLevels,
    archiveNames,
    canCreate,
    setDifficulty,
    setCopies,
    batchCreate,
    reset,
  };
}
