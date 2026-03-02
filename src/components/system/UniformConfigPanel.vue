<template>
  <section class="uniform-config-panel">
    <div class="section-header">
      <h2 class="section-title">
        <font-awesome-icon :icon="['fas', 'sliders-h']" />
        {{ $t("quickCreate.configArea.title") }}
      </h2>
    </div>

    <div class="config-content">
      <!-- 层级配置 -->
      <div class="config-group">
        <label class="config-label">{{
          $t("quickCreate.configArea.level")
        }}</label>
        <div class="config-options">
          <label class="custom-radio" @click.prevent="handleLevelModeChange(false)">
            <span class="radio-mark" :class="{ checked: !config.level.enabled }"></span>
            <span class="radio-text">{{
              $t("quickCreate.configArea.noUnify")
            }}</span>
          </label>
          <label class="custom-radio" @click.prevent="handleLevelModeChange(true)">
            <span class="radio-mark" :class="{ checked: config.level.enabled }"></span>
            <span class="radio-text">{{
              $t("quickCreate.configArea.setAllTo")
            }}</span>
          </label>
        </div>
        <CustomDropdown v-if="config.level.enabled" :model-value="config.level.value || ''" :options="levelOptions"
          :placeholder="$t('common.select')" @update:model-value="handleLevelValueChange" />
      </div>

      <!-- 存档难度配置 -->
      <div class="config-group">
        <label class="config-label">{{
          $t("quickCreate.configArea.difficulty")
        }}</label>
        <div class="config-options">
          <label class="custom-radio" @click.prevent="handleDifficultyModeChange(false)">
            <span class="radio-mark" :class="{ checked: !config.difficulty.enabled }"></span>
            <span class="radio-text">{{
              $t("quickCreate.configArea.noUnify")
            }}</span>
          </label>
          <label class="custom-radio" @click.prevent="handleDifficultyModeChange(true)">
            <span class="radio-mark" :class="{ checked: config.difficulty.enabled }"></span>
            <span class="radio-text">{{
              $t("quickCreate.configArea.setAllTo")
            }}</span>
          </label>
        </div>
        <CustomDropdown v-if="config.difficulty.enabled" :model-value="config.difficulty.value || ''"
          :options="difficultyOptions" :placeholder="$t('common.select')"
          @update:model-value="handleDifficultyValueChange" />
      </div>

      <!-- 实际难度配置 -->
      <div class="config-group">
        <label class="config-label">{{
          $t("quickCreate.configArea.actualDifficulty")
        }}</label>
        <div class="config-options">
          <label class="custom-radio" @click.prevent="handleActualDifficultyModeChange(false)">
            <span class="radio-mark" :class="{ checked: !config.actualDifficulty.enabled }"></span>
            <span class="radio-text">{{
              $t("quickCreate.configArea.noUnify")
            }}</span>
          </label>
          <label class="custom-radio" @click.prevent="handleActualDifficultyModeChange(true)">
            <span class="radio-mark" :class="{ checked: config.actualDifficulty.enabled }"></span>
            <span class="radio-text">{{
              $t("quickCreate.configArea.setAllTo")
            }}</span>
          </label>
        </div>
        <CustomDropdown v-if="config.actualDifficulty.enabled" :model-value="config.actualDifficulty.value || ''"
          :options="difficultyOptions" :placeholder="$t('common.select')"
          @update:model-value="handleActualDifficultyValueChange" />
      </div>

      <!-- 背包模板配置 -->
      <div class="config-group">
        <label class="config-label">{{
          $t("quickCreate.configArea.inventory")
        }}</label>
        <div class="config-options">
          <label class="custom-radio" @click.prevent="handleInventoryModeChange(false)">
            <span class="radio-mark" :class="{ checked: !config.inventory.enabled }"></span>
            <span class="radio-text">{{
              $t("quickCreate.configArea.noUnify")
            }}</span>
          </label>
          <label class="custom-radio" @click.prevent="handleInventoryModeChange(true)">
            <span class="radio-mark" :class="{ checked: config.inventory.enabled }"></span>
            <span class="radio-text">{{
              $t("quickCreate.configArea.useTemplate")
            }}</span>
          </label>
        </div>
        <div v-if="config.inventory.enabled" class="inventory-config">
          <CustomDropdown :model-value="config.inventory.templateName || ''" :options="inventoryTemplateOptions"
            :placeholder="$t('common.select')" @update:model-value="handleInventoryTemplateChange" />
        </div>
      </div>

      <!-- 智能规则 -->
      <div class="config-group smart-rules">
        <label class="config-label">{{
          $t("quickCreate.configArea.smartRules")
        }}</label>
        <div class="checkbox-options">
          <label class="custom-checkbox" @click.prevent="
            handleSmartRuleChange(
              'autoAssignLevel',
              !smartRules.autoAssignLevel
            )
            ">
            <span class="checkbox-mark" :class="{ checked: smartRules.autoAssignLevel }">
              <font-awesome-icon :icon="['fas', 'check']" class="check-icon" />
            </span>
            <span class="checkbox-text">{{
              $t("quickCreate.configArea.autoAssignLevel")
            }}</span>
          </label>
          <label class="custom-checkbox" @click.prevent="
            handleSmartRuleChange(
              'autoDetectDifficulty',
              !smartRules.autoDetectDifficulty
            )
            ">
            <span class="checkbox-mark" :class="{ checked: smartRules.autoDetectDifficulty }">
              <font-awesome-icon :icon="['fas', 'check']" class="check-icon" />
            </span>
            <span class="checkbox-text">{{
              $t("quickCreate.configArea.autoDetectDifficulty")
            }}</span>
          </label>
          <label class="custom-checkbox" @click.prevent="
            handleSmartRuleChange(
              'autoRenameDuplicates',
              !smartRules.autoRenameDuplicates
            )
            ">
            <span class="checkbox-mark" :class="{ checked: smartRules.autoRenameDuplicates }">
              <font-awesome-icon :icon="['fas', 'check']" class="check-icon" />
            </span>
            <span class="checkbox-text">{{
              $t("quickCreate.configArea.autoRenameDuplicates")
            }}</span>
          </label>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import CustomDropdown from "@/components/ui/CustomDropdown.vue";
import { useUniformConfigPanel } from "@/composables/useUniformConfigPanel";

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
  smartRules: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:config", "update:smartRules"]);

const { t, te } = useI18n();

const {
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
} = useUniformConfigPanel(props, emit, t, te);
</script>

<style scoped>
.uniform-config-panel {
  flex: 1;
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--divider-light);
  margin-bottom: var(--space-3);
  flex-shrink: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.config-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: var(--space-2);
  /* 防止内容变化时滚动位置跳动 */
  overflow-anchor: none;
}

.config-content::-webkit-scrollbar {
  width: 4px;
}

.config-content::-webkit-scrollbar-track {
  background: transparent;
}

.config-content::-webkit-scrollbar-thumb {
  background: var(--divider-light);
  border-radius: 2px;
}

.config-group {
  margin-bottom: var(--space-4);
  /* 锚定滚动位置 */
  overflow-anchor: auto;
}

.config-group:last-child {
  margin-bottom: 0;
}

.config-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.config-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

/* 自定义单选框样式 */
.custom-radio {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  padding: var(--space-1) 0;
  user-select: none;
}

.radio-mark {
  width: var(--radio-size, 16px);
  height: var(--radio-size, 16px);
  border-radius: 50%;
  border: 2px solid var(--checkbox-border, var(--divider-medium));
  background: var(--checkbox-bg, var(--bg-tertiary));
  transition: all 0.2s var(--ease-default);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.radio-mark::after {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-color);
  transform: scale(0);
  transition: transform 0.2s var(--ease-default);
}

.custom-radio:hover .radio-mark {
  border-color: var(--checkbox-border-hover, var(--accent-color));
}

.radio-mark.checked {
  border-color: var(--accent-color);
}

.radio-mark.checked::after {
  transform: scale(1);
}

.radio-text {
  font-size: 12px;
  color: var(--text-secondary);
  transition: color 0.2s var(--ease-default);
}

.custom-radio:hover .radio-text {
  color: var(--text-primary);
}

.radio-mark.checked~.radio-text {
  color: var(--text-primary);
}

/* 自定义复选框样式 */
.custom-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  padding: var(--space-1) 0;
  user-select: none;
}

.checkbox-mark {
  width: var(--checkbox-size, 16px);
  height: var(--checkbox-size, 16px);
  border-radius: var(--radius-xs, 3px);
  border: 2px solid var(--checkbox-border, var(--divider-medium));
  background: var(--checkbox-bg, var(--bg-tertiary));
  transition: all 0.2s var(--ease-default);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.checkbox-mark .check-icon {
  font-size: 10px;
  color: var(--checkbox-checkmark-color, white);
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.2s var(--ease-default);
}

.custom-checkbox:hover .checkbox-mark {
  border-color: var(--checkbox-border-hover, var(--accent-color));
}

.checkbox-mark.checked {
  background: var(--checkbox-checked-bg, var(--accent-color));
  border-color: var(--checkbox-checked-border, var(--accent-color));
}

.checkbox-mark.checked .check-icon {
  opacity: 1;
  transform: scale(1);
}

.checkbox-text {
  font-size: 12px;
  color: var(--text-secondary);
  transition: color 0.2s var(--ease-default);
}

.custom-checkbox:hover .checkbox-text {
  color: var(--text-primary);
}

.checkbox-mark.checked~.checkbox-text {
  color: var(--text-primary);
}

.inventory-config {
  margin-top: var(--space-2);
}

.smart-rules {
  padding-top: var(--space-3);
  border-top: 1px solid var(--divider-light);
}

.checkbox-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

/* CustomDropdown 样式调整 */
.config-group :deep(.custom-dropdown) {
  margin-top: var(--space-2);
}

.config-group :deep(.dropdown-display) {
  min-height: 32px;
  padding: 6px 10px;
  font-size: 12px;
}

.config-group :deep(.dropdown-text) {
  font-size: 12px;
}

.config-group :deep(.dropdown-option) {
  padding: 6px 10px;
  font-size: 12px;
}

/* 响应式 */
@media (max-width: 768px) {
  .uniform-config-panel {
    padding: var(--space-3);
  }

  .config-group {
    margin-bottom: var(--space-3);
  }
}
</style>
