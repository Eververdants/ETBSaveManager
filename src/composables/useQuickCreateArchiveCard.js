import { computed } from "vue";

export function useQuickCreateArchiveCard(archive, configSource, t, translations) {
  const hasMissingParams = computed(() => {
    return archive.value?.validationErrors && archive.value?.validationErrors.length > 0;
  });

  const borderStatusClass = computed(() => {
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

  const isInherited = (field) => {
    const source = configSource.value;
    return source?.[field] === "uniform" || source?.[field] === "smart";
  };

  const getSourceClass = (field) => {
    return `source-${configSource.value?.[field]}`;
  };

  const difficultyClass = (difficulty) => {
    return `difficulty-${difficulty}`;
  };

  const displayLevel = computed(() => {
    const level = archive.value?.finalLevel;
    if (!level) {
      return t("quickCreate.card.notSet");
    }
    return translations.getLevelName(level);
  });

  const displayDifficulty = computed(() => {
    const difficulty = archive.value?.finalDifficulty;
    if (!difficulty) {
      return t("quickCreate.card.notSet");
    }
    return translations.getDifficultyText(difficulty);
  });

  const displayActualDifficulty = computed(() => {
    const difficulty = archive.value?.finalActualDifficulty;
    if (!difficulty) {
      return t("quickCreate.card.notSet");
    }
    return translations.getDifficultyText(difficulty);
  });

  const displayInventory = computed(() => {
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
