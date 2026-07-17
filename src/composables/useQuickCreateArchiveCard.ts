import { computed } from "vue";
import type { ComputedRef, Ref } from "vue";
import type { ArchiveConfig, DifficultyLevel, ResolvedConfig } from "@/types";

interface QuickCreateTranslations {
  getLevelName: (level: string) => string;
  getDifficultyText: (difficulty: string) => string;
}

interface QuickCreateArchiveCardReturn {
  hasMissingParams: ComputedRef<boolean>;
  borderStatusClass: ComputedRef<string>;
  isInherited: (field: keyof ResolvedConfig["source"]) => boolean;
  getSourceClass: (field: keyof ResolvedConfig["source"]) => string;
  difficultyClass: (difficulty: DifficultyLevel | null) => string;
  displayLevel: ComputedRef<string>;
  displayDifficulty: ComputedRef<string>;
  displayActualDifficulty: ComputedRef<string>;
  displayInventory: ComputedRef<string>;
}

export function useQuickCreateArchiveCard(
  archive: Ref<ArchiveConfig | null>,
  configSource: Ref<ResolvedConfig["source"] | null>,
  t: (key: string) => string,
  translations: QuickCreateTranslations,
): QuickCreateArchiveCardReturn {
  const hasMissingParams = computed((): boolean => {
    return !!archive.value?.validationErrors?.length;
  });

  const borderStatusClass = computed((): string => {
    if (hasMissingParams.value) {
      return "border-error";
    }
    if (archive.value?.hasIndividualSettings) {
      return "border-individual";
    }
    const source = configSource.value;
    const hasUniform =
      source?.level === "uniform" ||
      source?.difficulty === "uniform" ||
      source?.actualDifficulty === "uniform" ||
      source?.inventory === "uniform";
    if (hasUniform) {
      return "border-uniform";
    }
    return "border-default";
  });

  const isInherited = (field: keyof ResolvedConfig["source"]): boolean => {
    const source = configSource.value;
    return source?.[field] === "uniform" || source?.[field] === "smart";
  };

  const getSourceClass = (field: keyof ResolvedConfig["source"]): string => {
    return `source-${configSource.value?.[field]}`;
  };

  const difficultyClass = (difficulty: DifficultyLevel | null): string => {
    return `difficulty-${difficulty}`;
  };

  const displayLevel = computed((): string => {
    const level = archive.value?.finalLevel;
    if (!level) {
      return t("quickCreate.card.notSet");
    }
    return translations.getLevelName(level);
  });

  const displayDifficulty = computed((): string => {
    const difficulty = archive.value?.finalDifficulty;
    if (!difficulty) {
      return t("quickCreate.card.notSet");
    }
    return translations.getDifficultyText(difficulty);
  });

  const displayActualDifficulty = computed((): string => {
    const difficulty = archive.value?.finalActualDifficulty;
    if (!difficulty) {
      return t("quickCreate.card.notSet");
    }
    return translations.getDifficultyText(difficulty);
  });

  const displayInventory = computed((): string => {
    const template = archive.value?.finalInventory;
    if (!template || (Array.isArray(template) && template.length === 0)) {
      return t("quickCreate.card.emptyInventory");
    }
    if (typeof template === "string") {
      return template;
    }
    return t("quickCreate.card.customInventory");
  });

  return {
    hasMissingParams,
    borderStatusClass,
    isInherited,
    getSourceClass,
    difficultyClass,
    displayLevel,
    displayDifficulty,
    displayActualDifficulty,
    displayInventory,
  };
}
