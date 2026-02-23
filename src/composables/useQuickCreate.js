import { ref, reactive, computed, nextTick } from "vue";
import {
  createDefaultUniformConfig,
  createDefaultSmartRules,
  resolve,
  hasIndividualSettings,
} from "./useConfigResolver";
import { validate } from "./useValidator";
import { parseName } from "./useNameParser";
import storage from "../services/storageService";

/**
 * 批量创建配置
 */
const BATCH_SIZE = 5; // 每批创建5个存档
const BATCH_DELAY = 100; // 每批之间的延迟（毫秒）

/**
 * 主线剧情层级列表（前17个层级）
 * 用于判断快速模式下是否为主线剧情
 * 如果选择的层级不在此列表中，则视为支线剧情，需要生成全部层级数据
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
 * 大量数据阈值配置
 * Requirements: 16.5, 17.1
 */
const LARGE_ARCHIVE_THRESHOLD = 100; // 超过此数量显示建议
const VERY_LARGE_NAME_THRESHOLD = 1000; // 超过此数量建议分批

/**
 * 防抖延迟配置
 * Requirements: 16.2 - 统一配置变更时 300ms 防抖
 */
const DEBOUNCE_DELAY = 300; // 防抖延迟（毫秒）

/**
 * 草稿自动保存配置
 * Requirements: 16.3, 16.4 - 每 30 秒保存到 localStorage，页面加载时检测并提示恢复
 */
const DRAFT_KEY = "quick_create_draft";
const DRAFT_SAVE_INTERVAL = 30000; // 30秒

/**
 * 创建防抖函数
 * @param {Function} fn - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
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

  // 添加取消方法
  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  // 添加立即执行方法
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
 * 草稿存储管理
 * Requirements: 16.3, 16.4
 */
const draftStorage = {
  /**
   * 保存草稿到 localStorage
   * @param {Object} state - 要保存的状态
   */
  save(state) {
    try {
      // 只保存必要的数据，排除计算属性和临时状态
      const draftData = {
        archives: state.archives.map((archive) => ({
          id: archive.id,
          name: archive.name,
          level: archive.level,
          difficulty: archive.difficulty,
          actualDifficulty: archive.actualDifficulty,
          inventoryTemplate: archive.inventoryTemplate,
        })),
        uniformConfig: JSON.parse(JSON.stringify(state.uniformConfig)), // 深拷贝
        smartRules: JSON.parse(JSON.stringify(state.smartRules)), // 深拷贝
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
   * 从 localStorage 加载草稿
   * @returns {Object|null} 草稿数据或 null
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

      // 验证草稿数据的有效性
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

      // 验证保存时间是否过期（7天）
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
   * 清除草稿
   */
  clear() {
    try {
      storage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.error("清除草稿失败:", error);
    }
  },

  /**
   * 检查是否有未保存的草稿
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
   * 获取草稿信息（用于显示恢复提示）
   * @returns {Object|null} 草稿信息
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
 * 快速创建存档主状态管理 composable
 *
 * Requirements: 15.1
 */

/**
 * 生成唯一ID
 * @returns {string}
 */
function generateId() {
  return `archive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 创建存档配置对象
 * @param {string} name - 存档名称
 * @returns {Object} 存档配置
 */
function createArchiveConfig(name) {
  const parsedInfo = parseName(name);

  return {
    id: generateId(),
    name: name,
    parsedInfo: parsedInfo,

    // 个别配置值 (null 表示继承)
    level: null,
    difficulty: null,
    actualDifficulty: null,
    inventoryTemplate: null,

    // 最终解析值（由 resolve 计算）
    finalLevel: null,
    finalDifficulty: null,
    finalActualDifficulty: null,
    finalInventory: [],

    // 状态
    hasIndividualSettings: false,
    validationErrors: [],
  };
}

/**
 * 创建初始状态
 * @returns {Object}
 */
function createInitialState() {
  return {
    // 存档列表
    archives: [],

    // 统一配置
    uniformConfig: createDefaultUniformConfig(),

    // 智能规则
    smartRules: createDefaultSmartRules(),

    // 选择状态
    selectedArchiveIds: new Set(),

    // UI 状态
    isCreating: false,
    creationProgress: 0,
    showTutorial: false,
    showBatchEditModal: false,
    showIndividualEditModal: false,
    editingArchiveId: null,
  };
}

/**
 * 快速创建存档状态管理
 * @returns {Object}
 */
export function useQuickCreate() {
  // 响应式状态
  const state = reactive(createInitialState());

  /**
   * 重新计算所有存档的最终配置
   */
  const recalculateArchives = () => {
    for (const archive of state.archives) {
      const resolved = resolve(archive, state.uniformConfig, state.smartRules);
      archive.finalLevel = resolved.level;
      archive.finalDifficulty = resolved.difficulty;
      archive.finalActualDifficulty = resolved.actualDifficulty;
      archive.finalInventory = resolved.inventoryTemplate ? [] : []; // 将在后续任务中实现模板解析
      archive.hasIndividualSettings = hasIndividualSettings(archive);
    }

    // 重新验证
    const validationResult = validate(state.archives);
    for (const archive of state.archives) {
      archive.validationErrors = validationResult.errors
        .filter((e) => e.archiveId === archive.id)
        .map((e) => e.message);
    }
  };

  /**
   * 防抖版本的重新计算函数
   * Requirements: 16.2 - 统一配置变更时 300ms 防抖
   */
  const debouncedRecalculateArchives = debounce(
    recalculateArchives,
    DEBOUNCE_DELAY
  );

  /**
   * 添加存档
   * @param {string[]} names - 存档名称列表
   * @returns {Object} 添加结果，包含警告信息
   */
  const addArchives = (names) => {
    const result = {
      added: 0,
      warnings: [],
    };

    const newArchives = names
      .filter((name) => name && name.trim())
      .map((name) => createArchiveConfig(name.trim()));

    // 检查是否超过大量数据阈值
    // Requirements: 17.1 - 超过 1000 个名称时建议分批
    if (names.length > VERY_LARGE_NAME_THRESHOLD) {
      result.warnings.push({
        type: "very_large_input",
        count: names.length,
        threshold: VERY_LARGE_NAME_THRESHOLD,
      });
    }

    // 处理重复名称
    if (state.smartRules.autoRenameDuplicates) {
      handleDuplicateNames(newArchives);
    }

    state.archives.push(...newArchives);
    result.added = newArchives.length;

    // 检查总数是否超过建议阈值
    // Requirements: 16.5 - 超过 100 个存档时显示建议
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
   * 处理重复名称，自动添加后缀
   * @param {Object[]} newArchives - 新存档列表
   */
  const handleDuplicateNames = (newArchives) => {
    // 收集所有现有名称
    const existingNames = new Set(state.archives.map((a) => a.name));

    // 收集新存档中的名称计数
    const nameCount = new Map();

    for (const archive of newArchives) {
      const baseName = archive.name;
      let finalName = baseName;
      let suffix = 1;

      // 检查是否与现有名称或已处理的新名称重复
      while (existingNames.has(finalName) || nameCount.has(finalName)) {
        finalName = `${baseName}_${suffix}`;
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
   * 添加单个存档
   * @param {string} name - 存档名称
   */
  const addArchive = (name) => {
    if (name && name.trim()) {
      state.archives.push(createArchiveConfig(name.trim()));
      recalculateArchives();
    }
  };

  /**
   * 移除存档
   * @param {string} archiveId - 存档ID
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
   * 清空所有存档
   */
  const clearArchives = () => {
    state.archives = [];
    state.selectedArchiveIds.clear();
  };

  /**
   * 更新存档配置
   * @param {string} archiveId - 存档ID
   * @param {Object} updates - 更新内容
   */
  const updateArchive = (archiveId, updates) => {
    const archive = state.archives.find((a) => a.id === archiveId);
    if (archive) {
      Object.assign(archive, updates);
      recalculateArchives();
    }
  };

  /**
   * 更新统一配置
   * Requirements: 16.2 - 统一配置变更时 300ms 防抖
   * @param {string} field - 字段名
   * @param {Object} value - 新值
   */
  const updateUniformConfig = (field, value) => {
    if (state.uniformConfig[field]) {
      state.uniformConfig[field] = { ...state.uniformConfig[field], ...value };
      // 使用防抖版本的重新计算
      debouncedRecalculateArchives();
    }
  };

  /**
   * 更新智能规则
   * Requirements: 16.2 - 统一配置变更时 300ms 防抖
   * @param {Object} updates - 更新内容
   */
  const updateSmartRules = (updates) => {
    Object.assign(state.smartRules, updates);
    // 使用防抖版本的重新计算
    debouncedRecalculateArchives();
  };

  /**
   * 全选
   */
  const selectAll = () => {
    state.selectedArchiveIds = new Set(state.archives.map((a) => a.id));
  };

  /**
   * 反选
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
   * 切换存档选择状态
   * @param {string} archiveId - 存档ID
   */
  const toggleArchiveSelection = (archiveId) => {
    if (state.selectedArchiveIds.has(archiveId)) {
      state.selectedArchiveIds.delete(archiveId);
    } else {
      state.selectedArchiveIds.add(archiveId);
    }
    // 触发响应式更新
    state.selectedArchiveIds = new Set(state.selectedArchiveIds);
  };

  /**
   * 批量更新选中的存档
   * @param {Object} updates - 更新内容
   */
  const batchUpdateSelected = (updates) => {
    for (const archiveId of state.selectedArchiveIds) {
      const archive = state.archives.find((a) => a.id === archiveId);
      if (archive) {
        // 只更新非 "保持原样" 的字段
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
   * 复制存档
   * @param {string} archiveId - 存档ID
   */
  const copyArchive = (archiveId) => {
    const archive = state.archives.find((a) => a.id === archiveId);
    if (archive) {
      const newArchive = {
        ...archive,
        id: generateId(),
        name: `${archive.name}_copy`,
        parsedInfo: parseName(`${archive.name}_copy`),
      };

      // 找到原存档位置，在其后插入
      const index = state.archives.findIndex((a) => a.id === archiveId);
      state.archives.splice(index + 1, 0, newArchive);
      recalculateArchives();
    }
  };

  /**
   * 重置状态
   */
  const resetState = () => {
    Object.assign(state, createInitialState());
  };

  // 计算属性：摘要统计
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

  // 计算属性：是否可以创建
  const canCreate = computed(() => {
    if (state.archives.length === 0) return false;

    // 检查是否有验证错误
    const hasErrors = state.archives.some((a) => a.validationErrors.length > 0);
    return !hasErrors;
  });

  // 计算属性：选中的存档
  const selectedArchives = computed(() => {
    return state.archives.filter((a) => state.selectedArchiveIds.has(a.id));
  });

  /**
   * 计算属性：大量数据警告
   * Requirements: 16.5, 17.1
   */
  const largeDataWarnings = computed(() => {
    const warnings = [];

    // 检查存档数量是否超过建议阈值
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
   * 计算属性：是否有大量数据
   * Requirements: 16.5
   */
  const hasLargeData = computed(() => {
    return state.archives.length > LARGE_ARCHIVE_THRESHOLD;
  });

  /**
   * 计算属性：是否有非常大量的数据（需要分批处理）
   * Requirements: 17.1
   */
  const hasVeryLargeData = computed(() => {
    return state.archives.length > VERY_LARGE_NAME_THRESHOLD;
  });

  /**
   * 将难度值转换为后端期望的格式
   * @param {string} difficulty - 难度值 (easy, normal, hard, nightmare)
   * @returns {string} 格式化后的难度值 (Easy, Normal, Hard, Nightmare)
   */
  const formatDifficulty = (difficulty) => {
    if (!difficulty) return "Normal";
    return (
      difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase()
    );
  };

  /**
   * 加载 BasicArchive.json 模板
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
   * 创建单个存档
   * @param {Object} archive - 存档配置
   * @param {Object} basicArchive - 基础存档模板
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const createSingleArchive = async (archive, basicArchive) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");

      const level = archive.finalLevel || "Level0";

      // 判断是否为支线剧情：如果层级不在主线17个层级中，则为支线
      // main_ending: true 表示支线（非主线结局），需要生成全部层级数据
      // main_ending: false 表示主线，只生成到当前层级的数据
      const isSideStoryline = !MAIN_STORYLINE_LEVELS.includes(level);

      // MEG 解锁判断：前6个层级（Level0 到 TheHub）MEG 未解锁
      const megLevels = [
        "Level0",
        "TopFloor",
        "MiddleFloor",
        "GarageLevel2",
        "BottomFloor",
        "TheHub",
      ];
      const isMEGUnlocked = !megLevels.includes(level);

      // 构建保存数据
      const saveData = {
        archive_name: archive.name,
        level: level,
        game_mode: "multiplayer", // 始终设置为多人模式
        difficulty: formatDifficulty(archive.finalDifficulty),
        actual_difficulty: formatDifficulty(archive.finalActualDifficulty),
        players: [], // 空玩家列表，后续可扩展
        basic_archive: basicArchive,
        main_ending: isSideStoryline, // 支线剧情时为 true
        meg_unlocked: isMEGUnlocked, // 根据层级判断 MEG 是否解锁
      };

      await invoke("handle_new_save", { saveData });
      return { success: true };
    } catch (error) {
      console.error(`创建存档 "${archive.name}" 失败:`, error);
      return { success: false, error: error.message || String(error) };
    }
  };

  /**
   * 批量创建存档
   * Requirements: 14.1, 14.2, 14.3, 17.3
   *
   * Note: If creation is interrupted (e.g., browser closed), already created archives
   * are NOT rolled back. This is by design per Requirement 17.3.
   *
   * @returns {Promise<{success: number, failed: number, errors: Array<{name: string, error: string}>}>}
   */
  const batchCreateArchives = async () => {
    // 获取要创建的存档列表（选中的或全部）
    const archivesToCreate =
      state.selectedArchiveIds.size > 0
        ? state.archives.filter((a) => state.selectedArchiveIds.has(a.id))
        : state.archives;

    if (archivesToCreate.length === 0) {
      return { success: 0, failed: 0, errors: [] };
    }

    // 加载基础存档模板
    const basicArchive = await loadBasicArchive();
    if (!basicArchive) {
      return {
        success: 0,
        failed: archivesToCreate.length,
        errors: [{ name: "all", error: "无法加载存档模板" }],
      };
    }

    // 设置创建状态
    state.isCreating = true;
    state.creationProgress = 0;

    const results = {
      success: 0,
      failed: 0,
      errors: [],
      lastCreatedName: null, // 记录最后成功创建的存档名称
    };

    // 分批创建
    for (let i = 0; i < archivesToCreate.length; i += BATCH_SIZE) {
      const batch = archivesToCreate.slice(i, i + BATCH_SIZE);

      // 并行创建当前批次
      const batchResults = await Promise.allSettled(
        batch.map((archive) => createSingleArchive(archive, basicArchive))
      );

      // 处理批次结果
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const archive = batch[j];

        if (result.status === "fulfilled" && result.value.success) {
          results.success++;
          results.lastCreatedName = archive.name; // 记录最后成功创建的存档名称
        } else {
          results.failed++;
          const errorMsg =
            result.status === "rejected"
              ? result.reason?.message || String(result.reason)
              : result.value?.error || "未知错误";
          results.errors.push({ name: archive.name, error: errorMsg });
        }
      }

      // 更新进度
      const completed = Math.min(i + BATCH_SIZE, archivesToCreate.length);
      state.creationProgress = (completed / archivesToCreate.length) * 100;

      // 让 UI 有时间刷新
      await nextTick();

      // 批次间延迟
      if (i + BATCH_SIZE < archivesToCreate.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
      }
    }

    // 完成创建
    state.creationProgress = 100;
    state.isCreating = false;

    return results;
  };

  // ==================== 草稿管理 ====================

  /**
   * 自动保存定时器引用
   */
  let autoSaveIntervalId = null;

  /**
   * 保存草稿
   * Requirements: 16.3 - 每 30 秒保存到 localStorage
   * @returns {boolean} 是否保存成功
   */
  const saveDraft = () => {
    // 只有当有存档时才保存
    if (state.archives.length === 0) {
      return false;
    }
    return draftStorage.save(state);
  };

  /**
   * 加载草稿
   * Requirements: 16.4 - 页面加载时检测并提示恢复
   * @returns {boolean} 是否加载成功
   */
  const loadDraft = () => {
    const draftData = draftStorage.load();
    if (!draftData) return false;

    try {
      console.log("[QuickCreate] 开始恢复草稿:", draftData);

      // 恢复存档列表
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

      // 恢复统一配置 - 深度合并
      if (draftData.uniformConfig) {
        // 深度合并每个配置项
        for (const key of Object.keys(draftData.uniformConfig)) {
          if (
            state.uniformConfig[key] &&
            typeof draftData.uniformConfig[key] === "object"
          ) {
            Object.assign(
              state.uniformConfig[key],
              draftData.uniformConfig[key]
            );
          } else {
            state.uniformConfig[key] = draftData.uniformConfig[key];
          }
        }
        console.log(
          "[QuickCreate] 恢复统一配置:",
          JSON.stringify(state.uniformConfig)
        );
      }

      // 恢复智能规则
      if (draftData.smartRules) {
        Object.assign(state.smartRules, draftData.smartRules);
        console.log("[QuickCreate] 恢复智能规则:", state.smartRules);
      }

      // 恢复选择状态
      if (draftData.selectedArchiveIds) {
        state.selectedArchiveIds = new Set(draftData.selectedArchiveIds);
      }

      // 重新计算所有存档
      recalculateArchives();

      console.log(
        "[QuickCreate] 草稿恢复完成，存档数量:",
        state.archives.length
      );
      console.log(
        "[QuickCreate] 第一个存档的最终配置:",
        state.archives[0]
          ? {
              finalLevel: state.archives[0].finalLevel,
              finalDifficulty: state.archives[0].finalDifficulty,
              finalActualDifficulty: state.archives[0].finalActualDifficulty,
            }
          : "N/A"
      );

      return true;
    } catch (error) {
      console.error("恢复草稿失败:", error);
      return false;
    }
  };

  /**
   * 清除草稿
   */
  const clearDraft = () => {
    draftStorage.clear();
  };

  /**
   * 检查是否有未保存的草稿
   * @returns {boolean}
   */
  const hasUnsavedDraft = () => {
    return draftStorage.hasUnsavedDraft();
  };

  /**
   * 获取草稿信息
   * @returns {Object|null} 草稿信息
   */
  const getDraftInfo = () => {
    return draftStorage.getDraftInfo();
  };

  /**
   * 启动自动保存
   * Requirements: 16.3 - 每 30 秒保存到 localStorage
   */
  const startAutoSave = () => {
    // 清除已有的定时器
    if (autoSaveIntervalId) {
      clearInterval(autoSaveIntervalId);
    }

    // 启动新的定时器
    autoSaveIntervalId = setInterval(() => {
      if (state.archives.length > 0 && !state.isCreating) {
        saveDraft();
        console.log("[QuickCreate] 草稿已自动保存");
      }
    }, DRAFT_SAVE_INTERVAL);
  };

  /**
   * 停止自动保存
   */
  const stopAutoSave = () => {
    if (autoSaveIntervalId) {
      clearInterval(autoSaveIntervalId);
      autoSaveIntervalId = null;
    }
  };

  // ==================== 中断处理 ====================

  /**
   * beforeunload 事件处理器引用
   */
  let beforeUnloadHandler = null;

  /**
   * 注册 beforeunload 警告
   * Requirements: 17.2 - 浏览器关闭时警告用户
   */
  const registerBeforeUnloadWarning = () => {
    if (beforeUnloadHandler) return; // 已注册

    beforeUnloadHandler = (event) => {
      // 只有在创建过程中或有未保存的存档时才警告
      if (state.isCreating || state.archives.length > 0) {
        event.preventDefault();
        // 现代浏览器会忽略自定义消息，但仍需设置 returnValue
        event.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);
  };

  /**
   * 取消注册 beforeunload 警告
   */
  const unregisterBeforeUnloadWarning = () => {
    if (beforeUnloadHandler) {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      beforeUnloadHandler = null;
    }
  };

  /**
   * 检查是否正在创建中
   * @returns {boolean}
   */
  const isCreationInProgress = () => {
    return state.isCreating;
  };

  /**
   * 获取创建进度
   * @returns {number} 0-100 的进度值
   */
  const getCreationProgress = () => {
    return state.creationProgress;
  };

  return {
    // 状态
    state,

    // 计算属性
    summaryStats,
    canCreate,
    selectedArchives,
    largeDataWarnings,
    hasLargeData,
    hasVeryLargeData,

    // 存档操作
    addArchives,
    addArchive,
    removeArchive,
    clearArchives,
    updateArchive,
    copyArchive,

    // 配置操作
    updateUniformConfig,
    updateSmartRules,

    // 选择操作
    selectAll,
    invertSelection,
    toggleArchiveSelection,
    batchUpdateSelected,

    // 批量创建
    batchCreateArchives,

    // 状态管理
    resetState,
    recalculateArchives,

    // 草稿管理
    saveDraft,
    loadDraft,
    clearDraft,
    hasUnsavedDraft,
    getDraftInfo,
    startAutoSave,
    stopAutoSave,

    // 中断处理
    registerBeforeUnloadWarning,
    unregisterBeforeUnloadWarning,
    isCreationInProgress,
    getCreationProgress,

    // 阈值常量（供外部使用）
    LARGE_ARCHIVE_THRESHOLD,
    VERY_LARGE_NAME_THRESHOLD,
  };
}
