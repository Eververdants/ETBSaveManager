# 快速创建存档模式简化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将快速创建存档从多栏复杂交互（文本粘贴+批量配置+卡片流）简化为"选结局→勾关卡→设难度→创建"三步流程

**Architecture:** 复用经典创建模式中 Step1SelectLevel 的结局切换器和关卡卡片样式，改单选为多选，去掉文本粘贴和批量配置面板。提取结局数据到共享模块，新建 3 个轻量组件（EndingSelector/LevelCheckGrid/PreviewList）和一个简化版 composable

**Tech Stack:** Vue 3 + Composition API + GSAP + vue-i18n

## Global Constraints

- 所有新组件使用 `<script setup>` 语法（与现有 Step1SelectLevel 一致）
- 结局关卡数据提取到 `src/data/endingsData.ts`，同时被 CreateArchive 和 QuickCreateArchive 引用
- 存档命名格式固定为 `{关卡Key}_{难度}`，多份时加序号 `(2)(3)...`
- 卡片样式直接复用 Step1SelectLevel 的 `.level-card` / `.level-grid` CSS（复制而非 import）
- BATCH_DELAY（100ms）和 DEBOUNCE_DELAY（300ms）不再使用
- 新组件目录：`src/components/quickCreate/`

---
### Task 1: 提取共享结局数据 + 关卡工具函数

**Files:**
- Create: `src/data/endingsData.ts`
- Create: `src/utils/levelUtils.ts`

**Interfaces:**
- Consumes: `src/i18n/locales`（运行时通过 i18n 获取标签）
- Produces: `ENDING_LEVELS: Record<number, string[]>` — 4 个结局的关卡 Key 列表
  `ENDINGS_CONFIG: Array<{id: number, labelKey: string}>` — 结局配置
  `getLevelName(levelKey: string): string` — 根据 LevelName_Display 翻译键获取关卡显示名

- [ ] **Step 1: Create `src/data/endingsData.ts`**

```typescript
/**
 * Game ending route definitions and level data
 * Shared between classic mode (CreateArchive) and quick mode (QuickCreateArchive)
 */

/** Level keys for each ending (0 = main, 1-3 = branches) */
export const ENDING_LEVELS: Record<number, string[]> = {
  0: [
    "Level0", "TopFloor", "MiddleFloor", "GarageLevel2", "BottomFloor",
    "TheHub", "Pipes1", "ElectricalStation", "Office", "Hotel", "Floor3",
    "BoilerRoom", "Pipes2", "LevelFun", "Poolrooms", "LevelRun", "TheEnd",
    "Level94", "AnimatedKingdom", "LightsOut", "OceanMap", "CaveLevel",
    "Level05", "Level9", "AbandonedBase", "Level10", "Level3999", "Level07",
    "Snackrooms", "LevelDash", "Level188_Expanded", "Poolrooms_Expanded",
    "WaterPark_Level01_P", "WaterPark_Level02_P", "WaterPark_Level03_P",
    "LevelFun_Expanded", "Zone1_Modified", "Zone2_Modified", "Zone3_Baked",
    "Zone4", "Level52", "TunnelLevel",
  ],
  1: ["Bunker", "GraffitiLevel", "Grassrooms_Expanded"],
  2: ["Bunker", "TheHub", "BottomFloor", "Level922"],
  3: ["Bunker", "TheHub", "OceanMap", "LightsOut", "Level974"],
};

/** Ending configuration — `labelKey` maps to `createArchive.endings.*` in i18n */
export const ENDINGS_CONFIG = [
  { id: 0, labelKey: "main" },
  { id: 1, labelKey: "branch1" },
  { id: 2, labelKey: "branch2" },
  { id: 3, labelKey: "branch3" },
];
```

- [ ] **Step 2: Create `src/utils/levelUtils.ts`**

```typescript
import { useI18ntype } from "vue-i18n";

/**
 * Get display name for a level key from i18n
 * Falls back to the raw key if no translation exists
 */
export function getLevelName(levelKey: string): string {
  // Use a simple lookup pattern — caller provides the te/t functions
  return levelKey;
}

/**
 * Composable version for use in components
 * Usage: const { getLevelName } = useLevelUtils();
 */
export function useLevelUtils() {
  const { t, te } = useI18n({ useScope: "global" });

  const getLevelName = (levelKey: string): string => {
    const translationKey = `LevelName_Display.${levelKey}`;
    return te(translationKey) ? t(translationKey) : levelKey;
  };

  return { getLevelName };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/data/endingsData.ts src/utils/levelUtils.ts
git commit -m "feat: extract shared endings data and level utils"
```

---
### Task 2: 更新 i18n 翻译

**Files:**
- Modify: `src/i18n/locales/zh-CN/quickCreate.json`
- Modify: `src/i18n/locales/en-US/quickCreate.json`
- Modify: `src/i18n/locales/zh-TW/quickCreate.json`

**Interfaces:**
- Consumes: 无
- Produces: 新的翻译键供 QuickCreateArchive 使用

- [ ] **Step 1: Update zh-CN translations**

重写 `src/i18n/locales/zh-CN/quickCreate.json`：

```json
{
  "title": "快速创建存档",
  "endingSelector": {
    "label": "选择结局路线"
  },
  "levelGrid": {
    "selectAll": "全选",
    "clearAll": "清空",
    "selected": "已选 {count}/{total} 关",
    "noSelection": "请至少选择 1 个关卡"
  },
  "options": {
    "difficulty": "难度",
    "copies": "每关创建"
  },
  "preview": {
    "title": "即将创建 {count} 个存档",
    "empty": "请选择关卡"
  },
  "create": "创建 {count} 个存档",
  "creating": "创建中...",
  "result": {
    "success": "成功创建 {count} 个存档",
    "partialSuccess": "成功创建 {success} 个，{failed} 个失败",
    "failed": "创建失败",
    "error": "创建过程中发生错误",
    "successTitle": "创建完成",
    "partialTitle": "部分创建成功",
    "successCount": "成功",
    "failedCount": "失败",
    "errorDetails": "错误详情",
    "continueEditing": "继续编辑",
    "viewArchives": "查看存档"
  }
}
```

- [ ] **Step 2: Update en-US translations**

```json
{
  "title": "Quick Create",
  "endingSelector": {
    "label": "Select Ending Route"
  },
  "levelGrid": {
    "selectAll": "Select All",
    "clearAll": "Clear",
    "selected": "{count}/{total} selected",
    "noSelection": "Select at least 1 level"
  },
  "options": {
    "difficulty": "Difficulty",
    "copies": "Copies per level"
  },
  "preview": {
    "title": "Creating {count} archives",
    "empty": "Select levels to create"
  },
  "create": "Create {count} Archives",
  "creating": "Creating...",
  "result": {
    "success": "Successfully created {count} archives",
    "partialSuccess": "{success} created, {failed} failed",
    "failed": "Creation failed",
    "error": "An error occurred",
    "successTitle": "Complete",
    "partialTitle": "Partially Complete",
    "successCount": "Succeeded",
    "failedCount": "Failed",
    "errorDetails": "Error Details",
    "continueEditing": "Continue Editing",
    "viewArchives": "View Archives"
  }
}
```

- [ ] **Step 3: Update zh-TW translations**

复制 zh-CN 内容并转换为繁体中文。

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/*/quickCreate.json
git commit -m "feat(i18n): update quick create translations for simplified UI"
```

---
### Task 3: 创建 EndingSelector 组件

**Files:**
- Create: `src/components/quickCreate/EndingSelector.vue`

**Interfaces:**
- Consumes: `endings: Array<{id: number, label: string}>` (prop), `modelValue: number` (v-model)
- Produces: `update:modelValue` emit on ending change

- [ ] **Step 1: Write `EndingSelector.vue`**

```vue
<template>
  <div class="ending-selector">
    <div class="ending-label">{{ $t("quickCreate.endingSelector.label") }}</div>
    <div class="ending-group" ref="endingGroupRef">
      <div
        class="ending-slider"
        :style="sliderStyle"
      />
      <div
        v-for="ending in endings"
        :key="ending.id"
        class="ending-tab"
        :class="{ active: modelValue === ending.id }"
        @click="handleSelect(ending.id)"
      >
        <span class="ending-label-text">{{ ending.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  endings: { type: Array, required: true },
});

const emit = defineEmits(["update:modelValue"]);

const endingGroupRef = ref(null);
const sliderWidth = ref(0);
const sliderLeft = ref(0);
const sliderActive = ref(false);

const sliderStyle = computed(() => ({
  width: `${sliderWidth.value}px`,
  transform: `translateX(${sliderLeft.value}px)`,
  opacity: sliderActive.value ? 1 : 0,
}));

const updateSlider = () => {
  if (!endingGroupRef.value) return;
  const container = endingGroupRef.value;
  const activeTab = container.querySelector(".ending-tab.active");
  if (!activeTab) return;
  const containerRect = container.getBoundingClientRect();
  const tabRect = activeTab.getBoundingClientRect();
  sliderWidth.value = tabRect.width;
  sliderLeft.value = tabRect.left - containerRect.left;
  sliderActive.value = true;
};

watch(() => props.modelValue, () => nextTick(updateSlider));

onMounted(() => {
  nextTick(() => requestAnimationFrame(() => requestAnimationFrame(updateSlider)));
  window.addEventListener("resize", updateSlider);
});

onUnmounted(() => window.removeEventListener("resize", updateSlider));

const handleSelect = (id) => {
  if (props.modelValue !== id) emit("update:modelValue", id);
};
</script>

<style scoped>
.ending-selector {
  margin-bottom: 16px;
}
.ending-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.ending-group {
  position: relative;
  display: inline-flex;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 4px;
  gap: 2px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.08);
}
.ending-slider {
  position: absolute;
  top: 4px;
  left: 0;
  height: calc(100% - 8px);
  background: var(--accent-color);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px rgba(var(--accent-color-rgb),0.35);
  pointer-events: none;
  transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), width 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease;
  z-index: 0;
}
.ending-tab {
  position: relative;
  z-index: 1;
  padding: 8px 18px;
  border-radius: var(--radius-md);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.ending-label-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.25s ease;
}
.ending-tab.active .ending-label-text { color: #ffffff; font-weight: 600; }
.ending-tab:not(.active):hover .ending-label-text { color: var(--text-primary); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/quickCreate/EndingSelector.vue
git commit -m "feat: add EndingSelector component"
```

---
### Task 4: 创建 LevelCheckGrid 组件

**Files:**
- Create: `src/components/quickCreate/LevelCheckGrid.vue`

**Interfaces:**
- Consumes: `levels: string[]` (关卡 key 列表), `modelValue: string[]` (已选中的 keys, v-model)
- Produces: `update:modelValue` emit on selection change

- [ ] **Step 1: Write `LevelCheckGrid.vue`**

```vue
<template>
  <div class="level-check-grid">
    <div class="grid-header">
      <label class="select-all-checkbox" @click="toggleSelectAll">
        <span class="checkbox-mark" :class="{ checked: isAllSelected }">
          <font-awesome-icon v-if="isAllSelected" :icon="['fas', 'check']" class="check-icon" />
        </span>
        <span>{{ $t("quickCreate.levelGrid.selectAll") }}</span>
      </label>
      <span class="selection-count">
        {{ $t("quickCreate.levelGrid.selected", { count: modelValue.length, total: levels.length }) }}
      </span>
      <button v-if="modelValue.length > 0" class="clear-btn" @click="$emit('update:modelValue', [])">
        {{ $t("quickCreate.levelGrid.clearAll") }}
      </button>
    </div>

    <div class="level-grid">
      <div
        v-for="levelKey in levels"
        :key="levelKey"
        class="level-card"
        :class="{ selected: isSelected(levelKey) }"
        @click="toggleLevel(levelKey)"
      >
        <div class="level-image-container">
          <LazyImage :src="`/images/ETB/${levelKey}.webp`" :alt="getLevelName(levelKey)" image-class="level-image" />
          <div class="level-overlay">
            <div class="check-circle" :class="{ checked: isSelected(levelKey) }">
              <font-awesome-icon v-if="isSelected(levelKey)" :icon="['fas', 'check']" />
            </div>
          </div>
        </div>
        <div class="level-info">
          <h3 class="level-name">{{ getLevelName(levelKey) }}</h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import LazyImage from "@/components/ui/LazyImage.vue";
import { useLevelUtils } from "@/utils/levelUtils";

const props = defineProps({
  levels: { type: Array, required: true },
  modelValue: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue"]);

const { getLevelName } = useLevelUtils();

const isAllSelected = computed(() =>
  props.levels.length > 0 && props.modelValue.length === props.levels.length
);

const isSelected = (levelKey) => props.modelValue.includes(levelKey);

const toggleLevel = (levelKey) => {
  const current = [...props.modelValue];
  const idx = current.indexOf(levelKey);
  if (idx === -1) {
    current.push(levelKey);
  } else {
    current.splice(idx, 1);
  }
  emit("update:modelValue", current);
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    emit("update:modelValue", []);
  } else {
    emit("update:modelValue", [...props.levels]);
  }
};
</script>

<style scoped>
.level-check-grid { display: flex; flex-direction: column; gap: 12px; }
.grid-header {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 12px; background: var(--bg-secondary);
  border-radius: var(--radius-md); border: 1px solid var(--divider-light);
}
.select-all-checkbox {
  display: flex; align-items: center; gap: 6px;
  cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-primary);
  user-select: none;
}
.checkbox-mark {
  width: 18px; height: 18px; border-radius: var(--radius-xs);
  border: 2px solid var(--divider-medium); background: var(--bg-tertiary);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease;
}
.checkbox-mark.checked { background: var(--accent-color); border-color: var(--accent-color); }
.checkbox-mark .check-icon { color: white; font-size: 10px; }
.selection-count { font-size: 12px; color: var(--text-tertiary); margin-left: auto; }
.clear-btn {
  font-size: 12px; color: var(--error-color); background: none; border: none;
  cursor: pointer; padding: 4px 8px; border-radius: var(--radius-xs);
}
.clear-btn:hover { background: rgba(var(--error-color-rgb),0.1); }

.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  max-height: calc(100vh - 320px);
  overflow-y: auto;
  padding: 4px;
}
.level-card {
  background: var(--bg-secondary); border-radius: var(--radius-md);
  overflow: hidden; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.03);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.level-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.12); }
.level-card.selected { border-color: var(--accent-color); box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb),0.2); }
.level-image-container { position: relative; aspect-ratio: 16/9; overflow: hidden; }
.level-image-container :deep(.level-image) { width: 100%; height: 100%; object-fit: cover; }
.level-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;
}
.check-circle {
  width: 28px; height: 28px; border-radius: var(--radius-circle);
  border: 2px solid rgba(255,255,255,0.6); background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease;
}
.check-circle.checked { background: var(--accent-color); border-color: var(--accent-color); }
.check-circle svg { color: white; font-size: 14px; }
.level-info { padding: 10px 12px; }
.level-name { font-size: 12px; font-weight: 600; color: var(--text-primary); margin: 0; text-align: center; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/quickCreate/LevelCheckGrid.vue
git commit -m "feat: add LevelCheckGrid multi-select component"
```

---
### Task 5: 创建 PreviewList 组件

**Files:**
- Create: `src/components/quickCreate/PreviewList.vue`

**Interfaces:**
- Consumes: `archiveNames: string[]` (prop)
- Produces: 无（纯展示）

- [ ] **Step 1: Write `PreviewList.vue`**

```vue
<template>
  <div class="preview-list" v-if="archiveNames.length > 0">
    <div class="preview-header">
      <span>{{ $t("quickCreate.preview.title", { count: archiveNames.length }) }}</span>
    </div>
    <div class="preview-names">
      <span
        v-for="(name, idx) in archiveNames"
        :key="idx"
        class="preview-name"
      >{{ name }}</span>
    </div>
  </div>
  <div v-else class="preview-empty">
    {{ $t("quickCreate.preview.empty") }}
  </div>
</template>

<script setup>
defineProps({
  archiveNames: { type: Array, default: () => [] },
});
</script>

<style scoped>
.preview-header {
  font-size: 12px; font-weight: 500; color: var(--text-secondary);
  margin-bottom: 8px;
}
.preview-names {
  display: flex; flex-wrap: wrap; gap: 6px;
  background: var(--bg-secondary); border-radius: var(--radius-md);
  border: 1px solid var(--divider-light); padding: 10px 12px;
  max-height: 90px; overflow-y: auto;
}
.preview-name {
  font-size: 11px; font-family: monospace;
  background: var(--bg-tertiary); padding: 2px 8px;
  border-radius: var(--radius-xs); color: var(--text-secondary);
  white-space: nowrap;
}
.preview-empty {
  font-size: 12px; color: var(--text-tertiary); text-align: center;
  padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md);
  border: 1px dashed var(--divider-light);
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/quickCreate/PreviewList.vue
git commit -m "feat: add PreviewList component"
```

---
### Task 6: 创建简化版 composable

**Files:**
- Create: `src/composables/useQuickCreateSimplified.ts`

**Interfaces:**
- Consumes: `ENDING_LEVELS` from `src/data/endingsData`
- Produces: 状态和方法供 QuickCreateArchive.vue 使用

- [ ] **Step 1: Write `useQuickCreateSimplified.ts`**

```typescript
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
  "Level0", "TopFloor", "MiddleFloor", "GarageLevel2", "BottomFloor",
  "TheHub", "Pipes1", "ElectricalStation", "Office", "Hotel", "Floor3",
  "BoilerRoom", "Pipes2", "LevelFun", "Poolrooms", "LevelRun", "TheEnd",
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
      const base = `${levelKey}_${state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1)}`;
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

  const canCreate = computed(() =>
    state.selectedLevelKeys.length > 0 && !state.isCreating
  );

  const setDifficulty = (d: DifficultyLevel) => { state.difficulty = d; };
  const setCopies = (n: number) => { state.copies = Math.max(1, n); };

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
      levelsToCreate.map((levelKey) => createSingleArchive(levelKey, basicArchive))
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
```

- [ ] **Step 2: Commit**

```bash
git add src/composables/useQuickCreateSimplified.ts
git commit -m "feat: add simplified quick create composable"
```

---
### Task 7: 重写 QuickCreateArchive.vue

**Files:**
- Modify: `src/views/QuickCreateArchive.vue`

**Interfaces:**
- Consumes: 所有 Task 1-6 中创建的组件和 composable
- Produces: 完整的快速创建页面

- [ ] **Step 1: Rewrite `src/views/QuickCreateArchive.vue`**

```vue
<template>
  <div class="quick-create-container">
    <!-- Header -->
    <header class="quick-create-header">
      <div class="header-left">
        <button class="back-button" @click="goBack">
          <font-awesome-icon :icon="['fas', 'arrow-left']" />
        </button>
        <h1 class="page-title">{{ $t("quickCreate.title") }}</h1>
      </div>
      <div class="header-right">
        <div v-if="state.isCreating" class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${state.creationProgress}%` }" />
          </div>
        </div>
        <button
          class="create-btn"
          :disabled="!canCreate"
          @click="handleCreate"
        >
          <font-awesome-icon
            :icon="state.isCreating ? ['fas', 'spinner'] : ['fas', 'plus']"
            :spin="state.isCreating"
          />
          {{ state.isCreating ? $t("quickCreate.creating") : $t("quickCreate.create", { count: archiveNames.length }) }}
        </button>
      </div>
    </header>

    <!-- Main content -->
    <main class="quick-create-main">
      <!-- Ending selector: use :model-value + @update instead of v-model to avoid
           v-model updating state.selectedEnding before selectEnding() can re-select levels -->
      <EndingSelector
        :model-value="state.selectedEnding"
        :endings="endingLabels"
        @update:model-value="selectEnding"
      />

      <!-- Level grid -->
      <LevelCheckGrid
        v-model="state.selectedLevelKeys"
        :levels="currentLevels"
      />

      <!-- Options row -->
      <div class="options-row">
        <div class="option-group">
          <label class="option-label">{{ $t("quickCreate.options.difficulty") }}</label>
          <select v-model="state.difficulty" class="option-select" @change="setDifficulty(state.difficulty)">
            <option v-for="d in difficultyOptions" :key="d.value" :value="d.value">{{ d.label }}</option>
          </select>
        </div>
        <div class="option-group">
          <label class="option-label">{{ $t("quickCreate.options.copies") }}</label>
          <input
            type="number"
            class="option-input"
            :value="state.copies"
            min="1"
            max="99"
            @input="setCopies(Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>

      <!-- Preview -->
      <PreviewList :archive-names="archiveNames" />
    </main>

    <!-- Result modal -->
    <Teleport to="body">
      <div v-if="showResultModal" class="result-modal-overlay" @click.self="closeResultModal">
        <div class="result-modal">
          <div class="result-modal-header">
            <h3 class="result-modal-title">
              <font-awesome-icon
                :icon="creationResult?.failed > 0 ? ['fas', 'exclamation-triangle'] : ['fas', 'check-circle']"
                :class="creationResult?.failed > 0 ? 'warning-icon' : 'success-icon'"
              />
              {{ creationResult?.failed > 0 ? $t("quickCreate.result.partialTitle") : $t("quickCreate.result.successTitle") }}
            </h3>
            <button class="close-btn" @click="closeResultModal">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>
          <div class="result-modal-body">
            <div class="result-summary">
              <div class="result-stat success">
                <span class="result-value">{{ creationResult?.success || 0 }}</span>
                <span class="result-label">{{ $t("quickCreate.result.successCount") }}</span>
              </div>
              <div v-if="creationResult?.failed > 0" class="result-stat error">
                <span class="result-value">{{ creationResult?.failed || 0 }}</span>
                <span class="result-label">{{ $t("quickCreate.result.failedCount") }}</span>
              </div>
            </div>
            <div v-if="creationResult?.errors?.length > 0" class="error-details">
              <h4 class="error-details-title">{{ $t("quickCreate.result.errorDetails") }}</h4>
              <ul class="error-list">
                <li v-for="(err, idx) in creationResult.errors" :key="idx" class="error-item">
                  <span class="error-name">{{ err.name }}</span>
                  <span class="error-message">{{ err.error }}</span>
                </li>
              </ul>
            </div>
          </div>
          <div class="result-modal-footer">
            <button class="action-btn secondary-btn" @click="closeResultModal">
              {{ $t("quickCreate.result.continueEditing") }}
            </button>
            <button class="action-btn primary-btn" @click="navigateToArchives">
              <font-awesome-icon :icon="['fas', 'list']" />
              {{ $t("quickCreate.result.viewArchives") }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ENDINGS_CONFIG } from "@/data/endingsData";
import { useLevelUtils } from "@/utils/levelUtils";
import { useQuickCreateSimplified } from "@/composables/useQuickCreateSimplified";
import EndingSelector from "@/components/quickCreate/EndingSelector.vue";
import LevelCheckGrid from "@/components/quickCreate/LevelCheckGrid.vue";
import PreviewList from "@/components/quickCreate/PreviewList.vue";

const router = useRouter();
const { t } = useI18n({ useScope: "global" });
const { getLevelName } = useLevelUtils();

const {
  state,
  currentLevels,
  archiveNames,
  canCreate,
  selectEnding,
  setDifficulty,
  setCopies,
  batchCreate,
  reset,
} = useQuickCreateSimplified();

const creationResult = ref(null);
const showResultModal = ref(false);

const endingLabels = computed(() =>
  ENDINGS_CONFIG.map((e) => ({
    id: e.id,
    label: t(`createArchive.endings.${e.labelKey}`),
  }))
);

const difficultyOptions = [
  { value: "easy", label: t("createArchive.difficultyLevels.easy") },
  { value: "normal", label: t("createArchive.difficultyLevels.normal") },
  { value: "hard", label: t("createArchive.difficultyLevels.hard") },
  { value: "nightmare", label: t("createArchive.difficultyLevels.nightmare") },
];

const goBack = () => router.push("/");

const handleCreate = async () => {
  if (!canCreate.value) return;
  creationResult.value = await batchCreate();
  showResultModal.value = true;
};

const closeResultModal = () => {
  showResultModal.value = false;
  creationResult.value = null;
};

const navigateToArchives = () => {
  closeResultModal();
  reset();
  router.push("/");
};
</script>

<style scoped>
.quick-create-container {
  height: calc(100vh - 38px);
  display: flex; flex-direction: column;
  background: var(--bg-primary);
  padding: var(--space-4);
  gap: var(--space-4);
  overflow: hidden;
}
.quick-create-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}
.header-left { display: flex; align-items: center; gap: var(--space-3); }
.back-button {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; padding: 0;
  background: var(--bg-tertiary); border: 1px solid var(--divider-light);
  border-radius: var(--radius-md); color: var(--text-primary);
  cursor: pointer; transition: all 0.2s ease;
}
.back-button:hover { background: var(--bg-hover); border-color: var(--accent-color); color: var(--accent-color); }
.page-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0; }
.header-right { display: flex; align-items: center; gap: var(--space-3); }
.progress-section { display: flex; align-items: center; gap: var(--space-2); }
.progress-bar { width: 80px; height: 6px; background: var(--bg-tertiary); border-radius: var(--radius-xs); overflow: hidden; }
.progress-fill { height: 100%; background: var(--accent-color); border-radius: var(--radius-xs); transition: width 0.3s ease; }
.create-btn {
  display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--accent-color); border: none;
  border-radius: var(--radius-md); color: white;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s ease;
}
.create-btn:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); }
.create-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.quick-create-main {
  flex: 1; display: flex; flex-direction: column;
  gap: var(--space-3); overflow: hidden; min-height: 0;
}

.options-row {
  display: flex; gap: var(--space-4);
  flex-shrink: 0;
}
.option-group {
  display: flex; align-items: center; gap: var(--space-2);
}
.option-label { font-size: 12px; color: var(--text-secondary); white-space: nowrap; }
.option-select, .option-input {
  padding: 6px 10px; border-radius: var(--radius-sm);
  border: 1px solid var(--divider-light); background: var(--bg-secondary);
  color: var(--text-primary); font-size: 13px;
}
.option-input { width: 60px; text-align: center; }

/* Result modal */
.result-modal-overlay { /* same as existing */ position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.result-modal { background: var(--bg-secondary); border: 1px solid var(--divider-light); border-radius: var(--radius-lg); width: 90%; max-width: 480px; box-shadow: var(--shadow-lg); animation: modalSlideIn 0.3s ease-out; }
@keyframes modalSlideIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
.result-modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4); border-bottom: 1px solid var(--divider-light); }
.result-modal-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px; }
.result-modal-title .success-icon { color: var(--success-color); }
.result-modal-title .warning-icon { color: var(--warning-color); }
.close-btn { width: 32px; height: 32px; background: transparent; border: none; color: var(--text-tertiary); cursor: pointer; border-radius: var(--radius-sm); }
.close-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }
.result-modal-body { padding: var(--space-4); }
.result-summary { display: flex; gap: var(--space-4); margin-bottom: var(--space-4); }
.result-stat { flex: 1; display: flex; flex-direction: column; align-items: center; padding: var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-md); }
.result-stat.success .result-value { color: var(--success-color); }
.result-stat.error .result-value { color: var(--error-color); }
.result-value { font-size: 2rem; font-weight: 700; }
.result-label { font-size: 12px; color: var(--text-tertiary); margin-top: var(--space-1); }
.error-details { background: var(--bg-tertiary); border-radius: var(--radius-md); padding: var(--space-3); max-height: 150px; overflow-y: auto; }
.error-details-title { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0 0 var(--space-2); }
.error-list { list-style: none; padding: 0; margin: 0; }
.error-item { padding: var(--space-1) 0; border-bottom: 1px solid var(--divider-light); }
.error-item:last-child { border-bottom: none; }
.error-name { font-size: 12px; font-weight: 500; color: var(--text-primary); }
.error-message { font-size: 11px; color: var(--error-color); }
.result-modal-footer { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-4); border-top: 1px solid var(--divider-light); }
.action-btn { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; transition: all 0.2s ease; }
.secondary-btn { background: var(--bg-tertiary); border-color: var(--divider-light); color: var(--text-secondary); }
.secondary-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.primary-btn { background: var(--accent-color); color: white; }
.primary-btn:hover { background: var(--accent-hover); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/QuickCreateArchive.vue
git commit -m "feat: rewrite QuickCreateArchive with simplified ending+level flow"
```

---
### Task 8: 重构 CreateArchive 使用共享数据

**Files:**
- Modify: `src/views/CreateArchive/index.vue`

**Interfaces:**
- Consumes: `ENDING_LEVELS`, `ENDINGS_CONFIG` from `src/data/endingsData`
- Produces: 保持原有行为不变，使用共享数据源

- [ ] **Step 1: Update `CreateArchive/index.vue` imports**

找到 `src/views/CreateArchive/index.vue` 中的 `loadLevels` 函数（约第304行），将其 `endingLevelsData` 的静态数据替换为从 `endingsData` 导入：

```typescript
import { ENDING_LEVELS, ENDINGS_CONFIG } from "@/data/endingsData";
```

替换 `loadLevels` 方法体：

```typescript
const loadLevels = async () => {
  endingLevelsData[0] = ENDING_LEVELS[0];
  endingLevelsData[1] = ENDING_LEVELS[1];
  endingLevelsData[2] = ENDING_LEVELS[2];
  endingLevelsData[3] = ENDING_LEVELS[3];
  loadLevelsForEnding(0);
};
```

替换 `endings` computed 中硬编码的 labelKey 为从 `ENDINGS_CONFIG` 读取：

```typescript
const endings = computed(() =>
  ENDINGS_CONFIG.map((cfg) => ({
    id: cfg.id,
    label: t(`createArchive.endings.${cfg.labelKey}`),
    levels: endingLevelsData[cfg.id],
  }))
);
```

- [ ] **Step 2: Commit**

```bash
git add src/views/CreateArchive/index.vue
git commit -m "refactor: use shared endingsData in CreateArchive"
```

---
### Task 9: 清理旧组件引用（可选清理）

**Files:**
- Modify: 可能涉及 `src/views/SelectCreateMode.vue` 和其他引用点

**Note:** 快速创建页面不再引用 `SmartInputArea`、`UniformConfigPanel`、`ArchiveCardFlow`。但这些文件本身保留（可能在其他地方被引用或后续清理）。

- [ ] **Step 1: 检查并清理无用引用**

确认以下文件不再被任何代码引用：

```bash
grep -r "SmartInputArea" src/ --include="*.vue" --include="*.ts"
grep -r "UniformConfigPanel" src/ --include="*.vue" --include="*.ts"
grep -r "ArchiveCardFlow" src/ --include="*.vue" --include="*.ts"
grep -r "useQuickCreateArchiveCard" src/ --include="*.vue" --include="*.ts"
```

如果只被 QuickCreateArchive.vue 引用（已被任务7删除），可以安全删除：

```bash
git rm src/components/feature/SmartInputArea.vue
git rm src/components/system/UniformConfigPanel.vue
git rm src/components/archive/ArchiveCardFlow.vue
git rm src/composables/useQuickCreateArchiveCard.ts
```

（可选删除）

- [ ] **Step 2: Commit（如果执行了清理）**

```bash
git commit -m "chore: remove unused components after quick create simplification"
```
