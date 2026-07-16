import { reactive, computed } from "vue";
import type { ComputedRef } from "vue";
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

  // Generated archive names (just level key, no difficulty suffix)
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
    archiveName: string,
    levelKey: string,
    basicArchive: Record<string, unknown>,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");

      const isSideStoryline = !MAIN_STORYLINE_LEVELS.includes(levelKey);
      const isMEGUnlocked = !MEG_LOCKED_LEVELS.includes(levelKey);
      const difficultyLabel = formatDifficulty(state.difficulty);

      const saveData: Record<string, unknown> = {
        archive_name: archiveName,
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

  /**
   * Resolve an archive name that doesn't conflict with existing/taken names.
   * Appends a numeric suffix like "_2", "_3" as needed.
   */
  function resolveName(baseName: string, takenNames: Set<string>): string {
    if (!takenNames.has(baseName)) {
      takenNames.add(baseName);
      return baseName;
    }
    let counter = 2;
    while (takenNames.has(`${baseName}_${counter}`)) {
      counter++;
    }
    const resolved = `${baseName}_${counter}`;
    takenNames.add(resolved);
    return resolved;
  }

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

    // ── Load existing archive names for duplicate protection ──
    let existingNames = new Set<string>();
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const existingSaves = await invoke<Array<{ name: string }>>("load_all_saves");
      for (const save of existingSaves) {
        if (save.name) existingNames.add(save.name);
      }
    } catch (error) {
      console.warn("Failed to load existing saves for dedup check, proceeding without:", error);
    }

    state.isCreating = true;
    state.creationProgress = 0;

    const results: { success: number; failed: number; errors: Array<{ name: string; error: string }> } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Build a flat list of all archives to create, resolving duplicate names
    const allEntries: Array<{ levelKey: string; archiveName: string }> = [];
    const takenNames = new Set(existingNames); // track all names used (existing + batch)
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

    // Process sequentially to avoid MAINSAVE.sav concurrent write conflicts
    for (let i = 0; i < allEntries.length; i++) {
      const { levelKey, archiveName } = allEntries[i];

      const result = await createSingleArchive(archiveName, levelKey, basicArchive);
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push({ name: archiveName, error: result.error || "Unknown error" });
      }

      // Update progress
      state.creationProgress = Math.round(((i + 1) / allEntries.length) * 100);
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
