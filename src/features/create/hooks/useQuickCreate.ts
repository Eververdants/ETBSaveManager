/**
 * 快速批量创建 Hook（对应 master useQuickCreate 的简化批量路径 + snake_case wire 修复）
 *
 * 修复说明：master 的 camelCase CreateArchiveOptions 与 Rust SaveData（无别名、
 * snake_case）不匹配，批量创建会反序列化失败；此处按 Rust 真实字段名构造。
 */
import { useCallback, useState } from "react";

import { saveApi } from "../../../api";
import {
  createDefaultSmartRules,
  createDefaultUniformConfig,
  hasIndividualSettings,
  resolve,
} from "../../../utils/configResolver";
import { validate } from "../../../utils/validator";
import { parseName } from "../../../utils/nameParser";
import {
  formatDifficulty,
  isMEGUnlocked,
  isSideStoryline,
  loadBasicArchive,
} from "../../../utils/archiveCreationUtils";
import { FEATURES } from "../../../constants";
import type {
  ArchiveConfig,
  DifficultyLevel,
  ParsedNameInfo,
  QuickCreateBatchResult,
  UniformConfig,
} from "../../../types";

const BATCH_SIZE = 5;
const BATCH_DELAY = 100;

function generateId(): string {
  return `archive_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function createArchiveConfig(name: string): ArchiveConfig {
  const parsedInfo: ParsedNameInfo = parseName(name);
  return {
    id: generateId(),
    name,
    parsedInfo,
    level: null,
    difficulty: null,
    actualDifficulty: null,
    inventoryTemplate: null,
    finalLevel: null,
    finalDifficulty: null,
    finalActualDifficulty: null,
    finalInventory: [],
    hasIndividualSettings: false,
    validationErrors: [],
  };
}

function recalculate(
  list: ArchiveConfig[],
  uniform: UniformConfig
): ArchiveConfig[] {
  const smartRules = createDefaultSmartRules();
  const validationResult = validate(list);
  return list.map((archive) => {
    const resolved = resolve(archive, uniform, smartRules);
    return {
      ...archive,
      finalLevel: resolved.level,
      finalDifficulty: resolved.difficulty,
      finalActualDifficulty: FEATURES.MERGE_DIFFICULTY ? resolved.difficulty : resolved.actualDifficulty,
      finalInventory: [],
      hasIndividualSettings: hasIndividualSettings(archive),
      validationErrors: validationResult.errors
        .filter((e) => e.archiveId === archive.id)
        .map((e) => e.message),
    };
  });
}

export function useQuickCreate() {
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);

  /**
   * 从名称列表 + 统一难度批量创建。
   * 名称含下划线会被拒绝；重名自动加 -1/-2 后缀（用 - 避免文件名格式冲突）。
   * 中断时不回滚已创建的存档（与 master 行为一致）。
   */
  const createBatch = useCallback(
    async (names: string[], difficulty: DifficultyLevel): Promise<QuickCreateBatchResult> => {
      const validNames = names.filter((name) => name && name.trim() && !name.includes("_"));
      if (validNames.length === 0) {
        return { success: 0, failed: 0, errors: [] };
      }

      // 重名自动后缀
      const usedNames = new Set<string>();
      const configs = validNames.map((raw) => {
        const baseName = raw.trim();
        let finalName = baseName;
        let suffix = 1;
        while (usedNames.has(finalName)) {
          finalName = `${baseName}-${suffix}`;
          suffix++;
        }
        usedNames.add(finalName);
        return createArchiveConfig(finalName);
      });

      const uniform: UniformConfig = {
        ...createDefaultUniformConfig(),
        difficulty: { enabled: true, value: difficulty },
      };
      const targets = recalculate(configs, uniform);

      const basicArchive = await loadBasicArchive();
      if (!basicArchive) {
        return {
          success: 0,
          failed: targets.length,
          errors: [{ name: "all", error: "Failed to load archive template" }],
        };
      }

      setIsCreating(true);
      setCreationProgress(0);

      const results: QuickCreateBatchResult = {
        success: 0,
        failed: 0,
        errors: [],
        lastCreatedName: null,
      };

      const createSingle = async (archive: ArchiveConfig): Promise<void> => {
        const level = archive.finalLevel || "Level0";
        await saveApi.createArchive({
          archive_name: archive.name,
          level,
          game_mode: "multiplayer",
          difficulty: formatDifficulty(archive.finalDifficulty),
          actual_difficulty: formatDifficulty(archive.finalActualDifficulty),
          players: [],
          basic_archive: basicArchive,
          main_ending: isSideStoryline(level),
          meg_unlocked: isMEGUnlocked(level),
        });
      };

      for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        const batch = targets.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(batch.map(createSingle));

        batchResults.forEach((result, j) => {
          const archive = batch[j];
          if (result.status === "fulfilled") {
            results.success++;
            results.lastCreatedName = archive.name;
          } else {
            results.failed++;
            const errorMsg =
              (result.reason as Error)?.message || String(result.reason) || "Unknown error";
            results.errors.push({ name: archive.name, error: errorMsg });
          }
        });

        const completed = Math.min(i + BATCH_SIZE, targets.length);
        setCreationProgress((completed / targets.length) * 100);

        if (i + BATCH_SIZE < targets.length) {
          await new Promise((r) => setTimeout(r, BATCH_DELAY));
        }
      }

      setCreationProgress(100);
      setIsCreating(false);
      return results;
    },
    []
  );

  const resetState = useCallback(() => {
    setIsCreating(false);
    setCreationProgress(0);
  }, []);

  return { isCreating, creationProgress, createBatch, resetState };
}
