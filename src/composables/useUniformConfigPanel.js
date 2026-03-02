import { computed } from "vue";

const MAIN_LEVEL_KEYS = [
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
];

const BRANCH1_LEVEL_KEYS = [
  "Branch1Floor1",
  "Branch1Floor2",
  "Branch1Floor3",
  "Branch1Floor4",
  "Branch1Floor5",
  "Branch1Floor6",
  "Branch1Floor7",
  "Cinema",
  "SmallHouse",
];

export function useUniformConfigPanel(props, emit, t, te) {
  const getLevelName = (levelKey) => {
    const translationKey = `LevelName_Display.${levelKey}`;
    return te(translationKey) ? t(translationKey) : levelKey;
  };

  const getDifficultyText = (difficultyKey) => {
    const translationKey = `createArchive.difficultyLevels.${difficultyKey}`;
    return te(translationKey) ? t(translationKey) : difficultyKey;
  };

  const mainLevels = computed(() => {
    return MAIN_LEVEL_KEYS.map((key) => ({
      levelKey: key,
      name: getLevelName(key),
    }));
  });

  const branch1Levels = computed(() => {
    return BRANCH1_LEVEL_KEYS.map((key) => ({
      levelKey: key,
      name: getLevelName(key),
    }));
  });

  const levelOptions = computed(() => {
    const options = [];
    mainLevels.value.forEach((level) => {
      options.push({
        value: level.levelKey,
        label: level.name,
      });
    });
    branch1Levels.value.forEach((level) => {
      options.push({
        value: level.levelKey,
        label: level.name,
      });
    });
    return options;
  });

  const difficultyOptions = computed(() => [
    { value: "easy", label: getDifficultyText("easy") },
    { value: "normal", label: getDifficultyText("normal") },
    { value: "hard", label: getDifficultyText("hard") },
    { value: "nightmare", label: getDifficultyText("nightmare") },
  ]);

  const inventoryTemplateOptions = computed(() => [
    { value: "empty", label: "默认空背包" },
  ]);

  const handleLevelModeChange = (enabled) => {
    emit("update:config", {
      ...props.config,
      level: {
        enabled,
        value: enabled ? props.config.level.value : null,
      },
    });
  };

  const handleLevelValueChange = (value) => {
    emit("update:config", {
      ...props.config,
      level: {
        enabled: true,
        value: value || null,
      },
    });
  };

  const handleDifficultyModeChange = (enabled) => {
    emit("update:config", {
      ...props.config,
      difficulty: {
        enabled,
        value: enabled ? props.config.difficulty.value : null,
      },
    });
  };

  const handleDifficultyValueChange = (value) => {
    emit("update:config", {
      ...props.config,
      difficulty: {
        enabled: true,
        value: value || null,
      },
    });
  };

  const handleActualDifficultyModeChange = (enabled) => {
    emit("update:config", {
      ...props.config,
      actualDifficulty: {
        enabled,
        value: enabled ? props.config.actualDifficulty.value : null,
      },
    });
  };

  const handleActualDifficultyValueChange = (value) => {
    emit("update:config", {
      ...props.config,
      actualDifficulty: {
        enabled: true,
        value: value || null,
      },
    });
  };

  const handleInventoryModeChange = (enabled) => {
    emit("update:config", {
      ...props.config,
      inventory: {
        enabled,
        templateName: enabled ? props.config.inventory.templateName : null,
      },
    });
  };

  const handleInventoryTemplateChange = (templateName) => {
    emit("update:config", {
      ...props.config,
      inventory: {
        enabled: true,
        templateName: templateName || null,
      },
    });
  };

  const handleSmartRuleChange = (rule, checked) => {
    emit("update:smartRules", {
      ...props.smartRules,
      [rule]: checked,
    });
  };

  return {
    mainLevels,
    branch1Levels,
    levelOptions,
    difficultyOptions,
    inventoryTemplateOptions,
    handleLevelModeChange,
    handleLevelValueChange,
    handleDifficultyModeChange,
    handleDifficultyValueChange,
    handleActualDifficultyModeChange,
    handleActualDifficultyValueChange,
    handleInventoryModeChange,
    handleInventoryTemplateChange,
    handleSmartRuleChange,
  };
}
