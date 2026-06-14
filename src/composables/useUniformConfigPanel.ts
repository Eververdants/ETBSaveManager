import { computed } from "vue";
import type { ComputedRef } from "vue";
import type { UniformConfig, SmartRules, DifficultyLevel } from "@/types";

interface LevelOption {
  value: string;
  label: string;
}

interface UniformConfigPanelReturn {
  mainLevels: ComputedRef<Array<{ levelKey: string; name: string }>>;
  branch1Levels: ComputedRef<Array<{ levelKey: string; name: string }>>;
  levelOptions: ComputedRef<LevelOption[]>;
  difficultyOptions: ComputedRef<LevelOption[]>;
  inventoryTemplateOptions: ComputedRef<LevelOption[]>;
  handleLevelModeChange: (enabled: boolean) => void;
  handleLevelValueChange: (value: string | null) => void;
  handleDifficultyModeChange: (enabled: boolean) => void;
  handleDifficultyValueChange: (value: DifficultyLevel | null) => void;
  handleActualDifficultyModeChange: (enabled: boolean) => void;
  handleActualDifficultyValueChange: (value: DifficultyLevel | null) => void;
  handleInventoryModeChange: (enabled: boolean) => void;
  handleInventoryTemplateChange: (templateName: string | null) => void;
  handleSmartRuleChange: (rule: keyof SmartRules, checked: boolean) => void;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type EmitFunction = (event: string, value: any) => void;

const MAIN_LEVEL_KEYS: string[] = [
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

const BRANCH1_LEVEL_KEYS: string[] = [
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

export function useUniformConfigPanel(
  props: { config: UniformConfig; smartRules: SmartRules },
  emit: EmitFunction,
  t: (key: string) => string,
  te: (key: string) => boolean,
): UniformConfigPanelReturn {
  const getLevelName = (levelKey: string): string => {
    const translationKey = `LevelName_Display.${levelKey}`;
    return te(translationKey) ? t(translationKey) : levelKey;
  };

  const getDifficultyText = (difficultyKey: string): string => {
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

  const levelOptions = computed((): LevelOption[] => {
    const options: LevelOption[] = [];
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

  const difficultyOptions = computed((): LevelOption[] => [
    { value: "easy", label: getDifficultyText("easy") },
    { value: "normal", label: getDifficultyText("normal") },
    { value: "hard", label: getDifficultyText("hard") },
    { value: "nightmare", label: getDifficultyText("nightmare") },
  ]);

  const inventoryTemplateOptions = computed((): LevelOption[] => [{ value: "empty", label: "默认空背包" }]);

  const handleLevelModeChange = (enabled: boolean): void => {
    emit("update:config", {
      ...props.config,
      level: {
        enabled,
        value: enabled ? props.config.level.value : null,
      },
    });
  };

  const handleLevelValueChange = (value: string | null): void => {
    emit("update:config", {
      ...props.config,
      level: {
        enabled: true,
        value: value || null,
      },
    });
  };

  const handleDifficultyModeChange = (enabled: boolean): void => {
    emit("update:config", {
      ...props.config,
      difficulty: {
        enabled,
        value: enabled ? props.config.difficulty.value : null,
      },
    });
  };

  const handleDifficultyValueChange = (value: DifficultyLevel | null): void => {
    emit("update:config", {
      ...props.config,
      difficulty: {
        enabled: true,
        value: value || null,
      },
    });
  };

  const handleActualDifficultyModeChange = (enabled: boolean): void => {
    emit("update:config", {
      ...props.config,
      actualDifficulty: {
        enabled,
        value: enabled ? props.config.actualDifficulty.value : null,
      },
    });
  };

  const handleActualDifficultyValueChange = (value: DifficultyLevel | null): void => {
    emit("update:config", {
      ...props.config,
      actualDifficulty: {
        enabled: true,
        value: value || null,
      },
    });
  };

  const handleInventoryModeChange = (enabled: boolean): void => {
    emit("update:config", {
      ...props.config,
      inventory: {
        enabled,
        templateName: enabled ? props.config.inventory.templateName : null,
      },
    });
  };

  const handleInventoryTemplateChange = (templateName: string | null): void => {
    emit("update:config", {
      ...props.config,
      inventory: {
        enabled: true,
        templateName: templateName || null,
      },
    });
  };

  const handleSmartRuleChange = (rule: keyof SmartRules, checked: boolean): void => {
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
