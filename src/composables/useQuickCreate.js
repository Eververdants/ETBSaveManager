import { ref, reactive, computed, nextTick } from "vue";
import {
  createDefaultUniformConfig,
  createDefaultSmartRules,
  resolve,
  hasIndividualSettings,
} from "./useConfigResolver";
import { validate } from "./useValidator";
import { parseName } from "@/utils/nameParser";
import storage from "../services/storageService";

/**
 * Batch creation configuration
 */
const BATCH_SIZE = 5; // 5 archives per batch
const BATCH_DELAY = 100; // Delay between batches (ms)

/**
 * Main storyline level list (first 17 levels)
 * Used to determine if quick mode is a main storyline
 * If the selected level is not in this list, it is considered a side storyline and needs full level data
 */
const MAIN_STORYLINE_LEVELS = [
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

/**
 * Large data threshold configuration
 * Requirements: 16.5, 17.1
 */
const LARGE_ARCHIVE_THRESHOLD = 100; // Show suggestion when exceeding this count
const VERY_LARGE_NAME_THRESHOLD = 1000; // Suggest batching when exceeding this count

/**
 * Debounce delay configuration
 * Requirements: 16.2 - 300ms debounce when uniform config changes
 */
const DEBOUNCE_DELAY = 300; // Debounce delay (ms)

/**
 * Draft auto-save configuration
 * Requirements: 16.3, 16.4 - Save to localStorage every 30 seconds, detect and prompt restore on page load
 */
const DRAFT_KEY = "quick_create_draft";
const DRAFT_SAVE_INTERVAL = 30000; // 30 seconds

/**
 * Create debounce function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
  let timeoutId = null;

  const debouncedFn = (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };

  // Add cancel method
  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  // Add flush method
  debouncedFn.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      fn();
    }
  };

  return debouncedFn;
}

/**
 * Draft storage management
 * Requirements: 16.3, 16.4
 */
const draftStorage = {
  /**
   * Save draft to localStorage
   * @param {Object} state - State to save
   */
  save(state) {
    try {
      // Only save necessary data, exclude computed properties and temporary state
      const draftData = {
        archives: state.archives.map((archive) => ({
          id: archive.id,
          name: archive.name,
          level: archive.level,
          difficulty: archive.difficulty,
          actualDifficulty: archive.actualDifficulty,
          inventoryTemplate: archive.inventoryTemplate,
        })),
        uniformConfig: JSON.parse(JSON.stringify(state.uniformConfig)), // Deep copy
        smartRules: JSON.parse(JSON.stringify(state.smartRules)), // Deep copy
        selectedArchiveIds: Array.from(state.selectedArchiveIds),
        savedAt: Date.now(),
      };
      console.log("[QuickCreate] 保存草稿:", {
        archiveCount: draftData.archives.length,
        uniformConfig: draftData.uniformConfig,
        smartRules: draftData.smartRules,
        firstArchive: draftData.archives[0],
      });
      storage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      return true;
    } catch (error) {
      console.error("保存草稿失败:", error);
      return false;
    }
  },

  /**
   * Load draft from localStorage
   * @returns {Object|null} Draft data or null
   */
  load() {
    try {
      const draftJson = storage.getItem(DRAFT_KEY);
      if (!draftJson) return null;

      let draftData;
      try {
        draftData = JSON.parse(draftJson);
      } catch (parseError) {
        console.error("[QuickCreate] 草稿JSON解析失败:", parseError);
        this.clear();
        return null;
      }

      // Validate draft data validity
      if (!draftData || typeof draftData !== "object") {
        console.warn("[QuickCreate] 草稿数据格式无效");
        this.clear();
        return null;
      }

      if (!draftData.archives || !Array.isArray(draftData.archives)) {
        console.warn("[QuickCreate] 草稿archives字段无效");
        this.clear();
        return null;
      }

      // Validate save time hasn't expired (7 days)
      const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
      if (draftData.savedAt && Date.now() - draftData.savedAt > MAX_AGE) {
        console.log("[QuickCreate] 草稿已过期，清除");
        this.clear();
        return null;
      }

      return draftData;
    } catch (error) {
      console.error("加载草稿失败:", error);
      return null;
    }
  },

  /**
   * Clear draft
   */
  clear() {
    try {
      storage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.error("清除草稿失败:", error);
    }
  },

  /**
   * Check if there is an unsaved draft
   * @returns {boolean}
   */
  hasUnsavedDraft() {
    try {
      const draftJson = storage.getItem(DRAFT_KEY);
      if (!draftJson) return false;

      const draftData = JSON.parse(draftJson);
      return draftData.archives && draftData.archives.length > 0;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get draft info (for showing restore prompt)
   * @returns {Object|null} Draft info
   */
  getDraftInfo() {
    try {
      const draftJson = storage.getItem(DRAFT_KEY);
      if (!draftJson) return null;

      const draftData = JSON.parse(draftJson);
      if (!draftData.archives || draftData.archives.length === 0) return null;

      return {
        archiveCount: draftData.archives.length,
        savedAt: draftData.savedAt ? new Date(draftData.savedAt) : null,
      };
    } catch (error) {
      return null;
    }
  },
};

/**
 * Quick create archive main state management composable
 *
 * Requirements: 15.1
 */

/**
 * Generate unique ID
 * @returns {string}
 */
function generateId() {
  return `archive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create archive config object
 * @param {string} name - Archive name
 * @returns {Object} Archive config
 */
function createArchiveConfig(name) {
  const parsedInfo = parseName(name);

  return {
    id: generateId(),
    name: name,
    parsedInfo: parsedInfo,

    // Individual config values (null means inherit)
    level: null,
    difficulty: null,
    actualDifficulty: null,
    inventoryTemplate: null,

    // Final resolved values (computed by resolve)
    finalLevel: null,
    finalDifficulty: null,
    finalActualDifficulty: null,
    finalInventory: [],

    // State
    hasIndividualSettings: false,
    validationErrors: [],
  };
}

/**
 * Create initial state
 * @returns {Object}
 */
function createInitialState() {
  return {
    // Archive list
    archives: [],

    // Uniform config
    uniformConfig: createDefaultUniformConfig(),

    // Smart rules
    smartRules: createDefaultSmartRules(),

    // Selection state
    selectedArchiveIds: new Set(),

    // UI state
    isCreating: false,
    creationProgress: 0,
    showTutorial: false,
    showBatchEditModal: false,
    showIndividualEditModal: false,
    editingArchiveId: null,
  };
}

/**
 * Quick create archive state management
 * @returns {Object}
 */
export function useQuickCreate() {
  // Reactive state
  const state = reactive(createInitialState());

  /**
   * Recalculate final configuration for all archives
   */
  const recalculateArchives = () => {
    for (const archive of state.archives) {
      const resolved = resolve(archive, state.uniformConfig, state.smartRules);
      archive.finalLevel = resolved.level;
      archive.finalDifficulty = resolved.difficulty;
      archive.finalActualDifficulty = resolved.actualDifficulty;
      archive.finalInventory = resolved.inventoryTemplate ? [] : []; // Template parsing will be implemented in a follow-up task
      archive.hasIndividualSettings = hasIndividualSettings(archive);
    }

    // Re-validate
    const validationResult = validate(state.archives);
    for (const archive of state.archives) {
      archive.validationErrors = validationResult.errors
        .filter((e) => e.archiveId === archive.id)
        .map((e) => e.message);
    }
  };

  /**
   * Debounced version of the recalculate function
   * Requirements: 16.2 - 300ms debounce when uniform config changes
   */
  const debouncedRecalculateArchives = debounce(recalculateArchives, DEBOUNCE_DELAY);

  /**
   * Add archives
   * @param {string[]} names - Archive name list
   * @returns {Object} Add result including warnings
   */
  const addArchives = (names) => {
    const result = {
      added: 0,
      warnings: [],
      errors: [],
    };

    // Filter out names containing underscores
    const validNames = names.filter((name) => {
      if (!name || !name.trim()) {
        return false;
      }
      if (name.includes("_")) {
        result.errors.push({
          name: name,
          error: "存档名称不能包含下划线",
        });
        return false;
      }
      return true;
    });

    const newArchives = validNames.map((name) => createArchiveConfig(name.trim()));

    // Check if exceeding large data threshold
    // Requirements: 17.1 - Suggest batching when exceeding 1000 names
    if (names.length > VERY_LARGE_NAME_THRESHOLD) {
      result.warnings.push({
        type: "very_large_input",
        count: names.length,
        threshold: VERY_LARGE_NAME_THRESHOLD,
      });
    }

    // Handle duplicate names
    if (state.smartRules.autoRenameDuplicates) {
      handleDuplicateNames(newArchives);
    }

    state.archives.push(...newArchives);
    result.added = newArchives.length;

    // Check if total exceeds recommended threshold
    // Requirements: 16.5 - Show suggestion when exceeding 100 archives
    if (state.archives.length > LARGE_ARCHIVE_THRESHOLD) {
      result.warnings.push({
        type: "large_archive_count",
        count: state.archives.length,
        threshold: LARGE_ARCHIVE_THRESHOLD,
      });
    }

    recalculateArchives();

    return result;
  };

  /**
   * Handle duplicate names by auto-adding suffix
   * Use hyphen(-) instead of underscore(_) to avoid filename format conflicts
   * @param {Object[]} newArchives - New archive list
   */
  const handleDuplicateNames = (newArchives) => {
    // Collect all existing names
    const existingNames = new Set(state.archives.map((a) => a.name));

    // Collect name counts of new archives
    const nameCount = new Map();

    for (const archive of newArchives) {
      const baseName = archive.name;
      let finalName = baseName;
      let suffix = 1;

      // Check for duplicates with existing or already-processed new names
      // Use hyphen(-) instead of underscore(_) to avoid filename format conflicts
      while (existingNames.has(finalName) || nameCount.has(finalName)) {
        finalName = `${baseName}-${suffix}`;
        suffix++;
      }

      if (finalName !== baseName) {
        archive.name = finalName;
        archive.parsedInfo = parseName(finalName);
      }

      nameCount.set(finalName, (nameCount.get(finalName) || 0) + 1);
    }
  };

  /**
   * Add a single archive
   * @param {string} name - Archive name
   * @returns {Object} { success: boolean, error?: string }
   */
  const addArchive = (name) => {
    if (!name || !name.trim()) {
      return { success: false, error: "存档名称不能为空" };
    }

    const trimmedName = name.trim();

    // Check if archive name contains underscore
    if (trimmedName.includes("_")) {
      return { success: false, error: "存档名称不能包含下划线" };
    }

    state.archives.push(createArchiveConfig(trimmedName));
    recalculateArchives();
    return { success: true };
  };

  /**
   * Remove archive
   * @param {string} archiveId - Archive ID
   */
  const removeArchive = (archiveId) => {
    const index = state.archives.findIndex((a) => a.id === archiveId);
    if (index > -1) {
      state.archives.splice(index, 1);
      state.selectedArchiveIds.delete(archiveId);
      recalculateArchives();
    }
  };

  /**
   * Clear all archives
   */
  const clearArchives = () => {
    state.archives = [];
    state.selectedArchiveIds.clear();
  };

  /**
   * Update archive config
   * @param {string} archiveId - Archive ID
   * @param {Object} updates - Update content
   */
  const updateArchive = (archiveId, updates) => {
    const archive = state.archives.find((a) => a.id === archiveId);
    if (archive) {
      Object.assign(archive, updates);
      recalculateArchives();
    }
  };

  /**
   * Update uniform config
   * Requirements: 16.2 - 300ms debounce when uniform config changes
   * @param {string} field - Field name
   * @param {Object} value - New value
   */
  const updateUniformConfig = (field, value) => {
    if (state.uniformConfig[field]) {
      state.uniformConfig[field] = { ...state.uniformConfig[field], ...value };
      // Use debounced version of recalculate
      debouncedRecalculateArchives();
    }
  };

  /**
   * Update smart rules
   * Requirements: 16.2 - 300ms debounce when uniform config changes
   * @param {Object} updates - Update content
   */
  const updateSmartRules = (updates) => {
    Object.assign(state.smartRules, updates);
    // Use debounced version of recalculate
    debouncedRecalculateArchives();
  };

  /**
   * Select all
   */
  const selectAll = () => {
    state.selectedArchiveIds = new Set(state.archives.map((a) => a.id));
  };

  /**
   * Invert selection
   */
  const invertSelection = () => {
    const newSelection = new Set();
    for (const archive of state.archives) {
      if (!state.selectedArchiveIds.has(archive.id)) {
        newSelection.add(archive.id);
      }
    }
    state.selectedArchiveIds = newSelection;
  };

  /**
   * Toggle archive selection state
   * @param {string} archiveId - Archive ID
   */
  const toggleArchiveSelection = (archiveId) => {
    if (state.selectedArchiveIds.has(archiveId)) {
      state.selectedArchiveIds.delete(archiveId);
    } else {
      state.selectedArchiveIds.add(archiveId);
    }
    // Trigger reactive update
    state.selectedArchiveIds = new Set(state.selectedArchiveIds);
  };

  /**
   * Batch update selected archives
   * @param {Object} updates - Update content
   */
  const batchUpdateSelected = (updates) => {
    for (const archiveId of state.selectedArchiveIds) {
      const archive = state.archives.find((a) => a.id === archiveId);
      if (archive) {
        // Only update fields that are not "keep original"
        for (const [key, value] of Object.entries(updates)) {
          if (value !== "__keep_original__") {
            archive[key] = value;
          }
        }
      }
    }
    recalculateArchives();
  };

  /**
   * Copy archive
   * @param {string} archiveId - Archive ID
   */
  const copyArchive = (archiveId) => {
    const archive = state.archives.find((a) => a.id === archiveId);
    if (archive) {
      // Use hyphen(-) instead of underscore(_) to avoid filename format conflicts
      const newArchive = {
        ...archive,
        id: generateId(),
        name: `${archive.name}-copy`,
        parsedInfo: parseName(`${archive.name}-copy`),
      };

      // Find original archive position, insert after it
      const index = state.archives.findIndex((a) => a.id === archiveId);
      state.archives.splice(index + 1, 0, newArchive);
      recalculateArchives();
    }
  };

  /**
   * Reset state
   */
  const resetState = () => {
    Object.assign(state, createInitialState());
  };

  // Computed property: summary statistics
  const summaryStats = computed(() => {
    const total = state.archives.length;
    let uniformCount = 0;
    let individualCount = 0;
    let missingCount = 0;

    for (const archive of state.archives) {
      if (archive.hasIndividualSettings) {
        individualCount++;
      } else {
        uniformCount++;
      }

      if (archive.validationErrors.length > 0) {
        missingCount++;
      }
    }

    return {
      total,
      uniformCount,
      individualCount,
      missingCount,
    };
  });

  // Computed property: whether creation is possible
  const canCreate = computed(() => {
    if (state.archives.length === 0) return false;

    // Check for validation errors
    const hasErrors = state.archives.some((a) => a.validationErrors.length > 0);
    return !hasErrors;
  });

  // Computed property: selected archives
  const selectedArchives = computed(() => {
    return state.archives.filter((a) => state.selectedArchiveIds.has(a.id));
  });

  /**
   * Computed property: large data warnings
   * Requirements: 16.5, 17.1
   */
  const largeDataWarnings = computed(() => {
    const warnings = [];

    // Check if archive count exceeds recommended threshold
    if (state.archives.length > LARGE_ARCHIVE_THRESHOLD) {
      warnings.push({
        type: "large_archive_count",
        count: state.archives.length,
        threshold: LARGE_ARCHIVE_THRESHOLD,
      });
    }

    return warnings;
  });

  /**
   * Computed property: whether there is large data
   * Requirements: 16.5
   */
  const hasLargeData = computed(() => {
    return state.archives.length > LARGE_ARCHIVE_THRESHOLD;
  });

  /**
   * Computed property: whether there is very large data (needs batching)
   * Requirements: 17.1
   */
  const hasVeryLargeData = computed(() => {
    return state.archives.length > VERY_LARGE_NAME_THRESHOLD;
  });

  /**
   * Convert difficulty value to backend expected format
   * @param {string} difficulty - Difficulty value (easy, normal, hard, nightmare)
   * @returns {string} Formatted difficulty value (Easy, Normal, Hard, Nightmare)
   */
  const formatDifficulty = (difficulty) => {
    if (!difficulty) return "Normal";
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
  };

  /**
   * Load BasicArchive.json template
   * @returns {Promise<Object|null>}
   */
  const loadBasicArchive = async () => {
    try {
      const response = await fetch("/BasicArchive.json");
      if (!response.ok) throw new Error(`HTTP错误! 状态: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("读取 BasicArchive.json 失败:", error);
      return null;
    }
  };

  /**
   * Create a single archive
   * @param {Object} archive - Archive config
   * @param {Object} basicArchive - Basic archive template
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const createSingleArchive = async (archive, basicArchive) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");

      const level = archive.finalLevel || "Level0";

      // Determine if it's a side storyline: if level is not in the main 17 levels, it's a side story
      // main_ending: true means side story (non-main ending), needs full level data generation
      // main_ending: false means main story, only generate data up to the current level
      const isSideStoryline = !MAIN_STORYLINE_LEVELS.includes(level);

      // MEG unlock check: first 6 levels (Level0 to TheHub) MEG is locked
      const megLevels = ["Level0", "TopFloor", "MiddleFloor", "GarageLevel2", "BottomFloor", "TheHub"];
      const isMEGUnlocked = !megLevels.includes(level);

      // Build save data
      const saveData = {
        archive_name: archive.name,
        level: level,
        game_mode: "multiplayer", // Always set to multiplayer mode
        difficulty: formatDifficulty(archive.finalDifficulty),
        actual_difficulty: formatDifficulty(archive.finalActualDifficulty),
        players: [], // Empty player list, expandable later
        basic_archive: basicArchive,
        main_ending: isSideStoryline, // Set to true for side storyline
        meg_unlocked: isMEGUnlocked, // Determine MEG unlock status based on level
      };

      await invoke("handle_new_save", { saveData });
      return { success: true };
    } catch (error) {
      console.error(`创建存档 "${archive.name}" 失败:`, error);
      return { success: false, error: error.message || String(error) };
    }
  };

  /**
   * Batch create archives
   * Requirements: 14.1, 14.2, 14.3, 17.3
   *
   * Note: If creation is interrupted (e.g., browser closed), already created archives
   * are NOT rolled back. This is by design per Requirement 17.3.
   *
   * @returns {Promise<{success: number, failed: number, errors: Array<{name: string, error: string}>}>}
   */
  const batchCreateArchives = async () => {
    // Get the list of archives to create (selected or all)
    const archivesToCreate =
      state.selectedArchiveIds.size > 0
        ? state.archives.filter((a) => state.selectedArchiveIds.has(a.id))
        : state.archives;

    if (archivesToCreate.length === 0) {
      return { success: 0, failed: 0, errors: [] };
    }

    // Load basic archive template
    const basicArchive = await loadBasicArchive();
    if (!basicArchive) {
      return {
        success: 0,
        failed: archivesToCreate.length,
        errors: [{ name: "all", error: "无法加载存档模板" }],
      };
    }

    // Set creating state
    state.isCreating = true;
    state.creationProgress = 0;

    const results = {
      success: 0,
      failed: 0,
      errors: [],
      lastCreatedName: null, // Record the name of the last successfully created archive
    };

    // Create in batches
    for (let i = 0; i < archivesToCreate.length; i += BATCH_SIZE) {
      const batch = archivesToCreate.slice(i, i + BATCH_SIZE);

      // Create current batch in parallel
      const batchResults = await Promise.allSettled(batch.map((archive) => createSingleArchive(archive, basicArchive)));

      // Process batch results
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const archive = batch[j];

        if (result.status === "fulfilled" && result.value.success) {
          results.success++;
          results.lastCreatedName = archive.name; // Record the name of the last successfully created archive
        } else {
          results.failed++;
          const errorMsg =
            result.status === "rejected"
              ? result.reason?.message || String(result.reason)
              : result.value?.error || "未知错误";
          results.errors.push({ name: archive.name, error: errorMsg });
        }
      }

      // Update progress
      const completed = Math.min(i + BATCH_SIZE, archivesToCreate.length);
      state.creationProgress = (completed / archivesToCreate.length) * 100;

      // Give UI time to update
      await nextTick();

      // Delay between batches
      if (i + BATCH_SIZE < archivesToCreate.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
      }
    }

    // Finish creation
    state.creationProgress = 100;
    state.isCreating = false;

    return results;
  };

  // ==================== Draft Management ====================

  /**
   * Auto-save timer reference
   */
  let autoSaveIntervalId = null;

  /**
   * Save draft
   * Requirements: 16.3 - Save to localStorage every 30 seconds
   * @returns {boolean} Whether save was successful
   */
  const saveDraft = () => {
    // Only save when there are archives
    if (state.archives.length === 0) {
      return false;
    }
    return draftStorage.save(state);
  };

  /**
   * Load draft
   * Requirements: 16.4 - Detect and prompt restore on page load
   * @returns {boolean} Whether load was successful
   */
  const loadDraft = () => {
    const draftData = draftStorage.load();
    if (!draftData) return false;

    try {
      console.log("[QuickCreate] 开始恢复草稿:", draftData);

      // Restore archive list
      state.archives = draftData.archives.map((archiveData) => {
        const archive = createArchiveConfig(archiveData.name);
        archive.id = archiveData.id;
        archive.level = archiveData.level;
        archive.difficulty = archiveData.difficulty;
        archive.actualDifficulty = archiveData.actualDifficulty;
        archive.inventoryTemplate = archiveData.inventoryTemplate;
        console.log("[QuickCreate] 恢复存档:", archiveData.name, {
          level: archiveData.level,
          difficulty: archiveData.difficulty,
          actualDifficulty: archiveData.actualDifficulty,
        });
        return archive;
      });

      // Restore uniform config - deep merge
      if (draftData.uniformConfig) {
        // Deep merge each config item
        for (const key of Object.keys(draftData.uniformConfig)) {
          if (state.uniformConfig[key] && typeof draftData.uniformConfig[key] === "object") {
            Object.assign(state.uniformConfig[key], draftData.uniformConfig[key]);
          } else {
            state.uniformConfig[key] = draftData.uniformConfig[key];
          }
        }
        console.log("[QuickCreate] 恢复统一配置:", JSON.stringify(state.uniformConfig));
      }

      // Restore smart rules
      if (draftData.smartRules) {
        Object.assign(state.smartRules, draftData.smartRules);
        console.log("[QuickCreate] 恢复智能规则:", state.smartRules);
      }

      // Restore selection state
      if (draftData.selectedArchiveIds) {
        state.selectedArchiveIds = new Set(draftData.selectedArchiveIds);
      }

      // Recalculate all archives
      recalculateArchives();

      console.log("[QuickCreate] 草稿恢复完成，存档数量:", state.archives.length);
      console.log(
        "[QuickCreate] 第一个存档的最终配置:",
        state.archives[0]
          ? {
              finalLevel: state.archives[0].finalLevel,
              finalDifficulty: state.archives[0].finalDifficulty,
              finalActualDifficulty: state.archives[0].finalActualDifficulty,
            }
          : "N/A",
      );

      return true;
    } catch (error) {
      console.error("恢复草稿失败:", error);
      return false;
    }
  };

  /**
   * Clear draft
   */
  const clearDraft = () => {
    draftStorage.clear();
  };

  /**
   * Check if there is an unsaved draft
   * @returns {boolean}
   */
  const hasUnsavedDraft = () => {
    return draftStorage.hasUnsavedDraft();
  };

  /**
   * Get draft info
   * @returns {Object|null} Draft info
   */
  const getDraftInfo = () => {
    return draftStorage.getDraftInfo();
  };

  /**
   * Start auto-save
   * Requirements: 16.3 - Save to localStorage every 30 seconds
   */
  const startAutoSave = () => {
    // Clear existing timer
    if (autoSaveIntervalId) {
      clearInterval(autoSaveIntervalId);
    }

    // Start new timer
    autoSaveIntervalId = setInterval(() => {
      if (state.archives.length > 0 && !state.isCreating) {
        saveDraft();
        console.log("[QuickCreate] 草稿已自动保存");
      }
    }, DRAFT_SAVE_INTERVAL);
  };

  /**
   * Stop auto-save
   */
  const stopAutoSave = () => {
    if (autoSaveIntervalId) {
      clearInterval(autoSaveIntervalId);
      autoSaveIntervalId = null;
    }
  };

  // ==================== Interruption Handling ====================

  /**
   * beforeunload event handler reference
   */
  let beforeUnloadHandler = null;

  /**
   * Register beforeunload warning
   * Requirements: 17.2 - Warn user when browser closes
   */
  const registerBeforeUnloadWarning = () => {
    if (beforeUnloadHandler) return; // Already registered

    beforeUnloadHandler = (event) => {
      // Only warn during creation or when there are unsaved archives
      if (state.isCreating || state.archives.length > 0) {
        event.preventDefault();
        // Modern browsers ignore custom messages, but returnValue still needs to be set
        event.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);
  };

  /**
   * Unregister beforeunload warning
   */
  const unregisterBeforeUnloadWarning = () => {
    if (beforeUnloadHandler) {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      beforeUnloadHandler = null;
    }
  };

  /**
   * Check if creation is in progress
   * @returns {boolean}
   */
  const isCreationInProgress = () => {
    return state.isCreating;
  };

  /**
   * Get creation progress
   * @returns {number} Progress value from 0-100
   */
  const getCreationProgress = () => {
    return state.creationProgress;
  };

  return {
    // State
    state,

    // Computed properties
    summaryStats,
    canCreate,
    selectedArchives,
    largeDataWarnings,
    hasLargeData,
    hasVeryLargeData,

    // Archive operations
    addArchives,
    addArchive,
    removeArchive,
    clearArchives,
    updateArchive,
    copyArchive,

    // Config operations
    updateUniformConfig,
    updateSmartRules,

    // Selection operations
    selectAll,
    invertSelection,
    toggleArchiveSelection,
    batchUpdateSelected,

    // Batch creation
    batchCreateArchives,

    // State management
    resetState,
    recalculateArchives,

    // Draft management
    saveDraft,
    loadDraft,
    clearDraft,
    hasUnsavedDraft,
    getDraftInfo,
    startAutoSave,
    stopAutoSave,

    // Interruption handling
    registerBeforeUnloadWarning,
    unregisterBeforeUnloadWarning,
    isCreationInProgress,
    getCreationProgress,

    // Threshold constants (for external use)
    LARGE_ARCHIVE_THRESHOLD,
    VERY_LARGE_NAME_THRESHOLD,
  };
}
