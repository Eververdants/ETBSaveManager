<template>
  <section class="uniform-config-panel">
    <div class="section-header">
      <h2 class="section-title">
        <font-awesome-icon :icon="['fas', 'sliders-h']" />
        {{ $t('quickCreate.configArea.title') }}
      </h2>
    </div>
    
    <div class="config-content">
      <!-- 层级配置 -->
      <div class="config-group">
        <label class="config-label">{{ $t('quickCreate.configArea.level') }}</label>
        <div class="config-options">
          <label class="custom-radio" @click.prevent="handleLevelModeChange(false)">
            <span class="radio-mark" :class="{ checked: !config.level.enabled }"></span>
            <span class="radio-text">{{ $t('quickCreate.configArea.noUnify') }}</span>
          </label>
          <label class="custom-radio" @click.prevent="handleLevelModeChange(true)">
            <span class="radio-mark" :class="{ checked: config.level.enabled }"></span>
            <span class="radio-text">{{ $t('quickCreate.configArea.setAllTo') }}</span>
          </label>
        </div>
        <CustomDropdown
          v-if="config.level.enabled"
          :model-value="config.level.value || ''"
          :options="levelOptions"
          :placeholder="$t('common.select')"
          @update:model-value="handleLevelValueChange"
        />
      </div>

      <!-- 存档难度配置 -->
      <div class="config-group">
        <label class="config-label">{{ $t('quickCreate.configArea.difficulty') }}</label>
        <div class="config-options">
          <label class="custom-radio" @click.prevent="handleDifficultyModeChange(false)">
            <span class="radio-mark" :class="{ checked: !config.difficulty.enabled }"></span>
            <span class="radio-text">{{ $t('quickCreate.configArea.noUnify') }}</span>
          </label>
          <label class="custom-radio" @click.prevent="handleDifficultyModeChange(true)">
            <span class="radio-mark" :class="{ checked: config.difficulty.enabled }"></span>
            <span class="radio-text">{{ $t('quickCreate.configArea.setAllTo') }}</span>
          </label>
        </div>
        <CustomDropdown
          v-if="config.difficulty.enabled"
          :model-value="config.difficulty.value || ''"
          :options="difficultyOptions"
          :placeholder="$t('common.select')"
          @update:model-value="handleDifficultyValueChange"
        />
      </div>

      <!-- 实际难度配置 -->
      <div class="config-group">
        <label class="config-label">{{ $t('quickCreate.configArea.actualDifficulty') }}</label>
        <div class="config-options">
          <label class="custom-radio" @click.prevent="handleActualDifficultyModeChange(false)">
            <span class="radio-mark" :class="{ checked: !config.actualDifficulty.enabled }"></span>
            <span class="radio-text">{{ $t('quickCreate.configArea.noUnify') }}</span>
          </label>
          <label class="custom-radio" @click.prevent="handleActualDifficultyModeChange(true)">
            <span class="radio-mark" :class="{ checked: config.actualDifficulty.enabled }"></span>
            <span class="radio-text">{{ $t('quickCreate.configArea.setAllTo') }}</span>
          </label>
        </div>
        <CustomDropdown
          v-if="config.actualDifficulty.enabled"
          :model-value="config.actualDifficulty.value || ''"
          :options="difficultyOptions"
          :placeholder="$t('common.select')"
          @update:model-value="handleActualDifficultyValueChange"
        />
      </div>

      <!-- 背包模板配置 -->
      <div class="config-group">
        <label class="config-label">{{ $t('quickCreate.configArea.inventory') }}</label>
        <div class="config-options">
          <label class="custom-radio" @click.prevent="handleInventoryModeChange(false)">
            <span class="radio-mark" :class="{ checked: !config.inventory.enabled }"></span>
            <span class="radio-text">{{ $t('quickCreate.configArea.noUnify') }}</span>
          </label>
          <label class="custom-radio" @click.prevent="handleInventoryModeChange(true)">
            <span class="radio-mark" :class="{ checked: config.inventory.enabled }"></span>
            <span class="radio-text">{{ $t('quickCreate.configArea.useTemplate') }}</span>
          </label>
        </div>
        <div v-if="config.inventory.enabled" class="inventory-config">
          <CustomDropdown
            :model-value="config.inventory.templateName || ''"
            :options="inventoryTemplateOptions"
            :placeholder="$t('common.select')"
            @update:model-value="handleInventoryTemplateChange"
          />
        </div>
      </div>

      <!-- 智能规则 -->
      <div class="config-group smart-rules">
        <label class="config-label">{{ $t('quickCreate.configArea.smartRules') }}</label>
        <div class="checkbox-options">
          <label class="custom-checkbox" @click.prevent="handleSmartRuleChange('autoAssignLevel', !smartRules.autoAssignLevel)">
            <span class="checkbox-mark" :class="{ checked: smartRules.autoAssignLevel }">
              <font-awesome-icon :icon="['fas', 'check']" class="check-icon" />
            </span>
            <span class="checkbox-text">{{ $t('quickCreate.configArea.autoAssignLevel') }}</span>
          </label>
          <label class="custom-checkbox" @click.prevent="handleSmartRuleChange('autoDetectDifficulty', !smartRules.autoDetectDifficulty)">
            <span class="checkbox-mark" :class="{ checked: smartRules.autoDetectDifficulty }">
              <font-awesome-icon :icon="['fas', 'check']" class="check-icon" />
            </span>
            <span class="checkbox-text">{{ $t('quickCreate.configArea.autoDetectDifficulty') }}</span>
          </label>
          <label class="custom-checkbox" @click.prevent="handleSmartRuleChange('autoRenameDuplicates', !smartRules.autoRenameDuplicates)">
            <span class="checkbox-mark" :class="{ checked: smartRules.autoRenameDuplicates }">
              <font-awesome-icon :icon="['fas', 'check']" class="check-icon" />
            </span>
            <span class="checkbox-text">{{ $t('quickCreate.configArea.autoRenameDuplicates') }}</span>
          </label>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import CustomDropdown from '@/components/CustomDropdown.vue'

export default {
  name: 'UniformConfigPanel',
  components: {
    CustomDropdown
  },
  props: {
    config: {
      type: Object,
      required: true
    },
    smartRules: {
      type: Object,
      required: true
    }
  },
  emits: ['update:config', 'update:smartRules'],
  setup(props, { emit }) {
    const { t } = useI18n()

    // 主线层级列表
    const mainLevelKeys = [
      'Level0', 'TopFloor', 'MiddleFloor', 'GarageLevel2', 'BottomFloor',
      'TheHub', 'Pipes1', 'ElectricalStation', 'Office', 'Hotel',
      'Floor3', 'BoilerRoom', 'Pipes2', 'LevelFun', 'Poolrooms',
      'LevelRun', 'TheEnd', 'Level94', 'AnimatedKingdom',
      'LightsOut', 'OceanMap', 'CaveLevel', 'Level05', 'Level9',
      'AbandonedBase', 'Level10', 'Level3999', 'Level07', 'Snackrooms',
      'LevelDash', 'Level188_Expanded', 'Poolrooms_Expanded', 'WaterPark_Level01_P',
      'WaterPark_Level02_P', 'WaterPark_Level03_P', 'LevelFun_Expanded',
      'Zone1_Modified', 'Zone2_Modified', 'Zone3_Baked', 'Zone4',
      'Level52', 'TunnelLevel'
    ]

    // 支线层级列表
    const branch1LevelKeys = ['Bunker', 'GraffitiLevel', 'Grassrooms_Expanded']

    // 计算主线层级
    const mainLevels = computed(() => {
      return mainLevelKeys.map(key => ({
        levelKey: key,
        name: t(`LevelName_Display.${key}`)
      }))
    })

    // 计算支线层级
    const branch1Levels = computed(() => {
      return branch1LevelKeys.map(key => ({
        levelKey: key,
        name: t(`LevelName_Display.${key}`)
      }))
    })

    // 层级下拉选项（合并主线和支线）
    const levelOptions = computed(() => {
      const options = []
      // 主线层级
      mainLevels.value.forEach(level => {
        options.push({
          value: level.levelKey,
          label: level.name
        })
      })
      // 支线层级
      branch1Levels.value.forEach(level => {
        options.push({
          value: level.levelKey,
          label: level.name
        })
      })
      return options
    })

    // 难度下拉选项
    const difficultyOptions = computed(() => [
      { value: 'easy', label: t('createArchive.difficultyLevels.easy') },
      { value: 'normal', label: t('createArchive.difficultyLevels.normal') },
      { value: 'hard', label: t('createArchive.difficultyLevels.hard') },
      { value: 'nightmare', label: t('createArchive.difficultyLevels.nightmare') }
    ])

    // 背包模板下拉选项
    const inventoryTemplateOptions = computed(() => [
      { value: 'empty', label: '默认空背包' }
    ])

    // 层级配置处理
    const handleLevelModeChange = (enabled) => {
      emit('update:config', {
        ...props.config,
        level: {
          enabled,
          value: enabled ? props.config.level.value : null
        }
      })
    }

    const handleLevelValueChange = (value) => {
      emit('update:config', {
        ...props.config,
        level: {
          enabled: true,
          value: value || null
        }
      })
    }

    // 存档难度配置处理
    const handleDifficultyModeChange = (enabled) => {
      emit('update:config', {
        ...props.config,
        difficulty: {
          enabled,
          value: enabled ? props.config.difficulty.value : null
        }
      })
    }

    const handleDifficultyValueChange = (value) => {
      emit('update:config', {
        ...props.config,
        difficulty: {
          enabled: true,
          value: value || null
        }
      })
    }

    // 实际难度配置处理
    const handleActualDifficultyModeChange = (enabled) => {
      emit('update:config', {
        ...props.config,
        actualDifficulty: {
          enabled,
          value: enabled ? props.config.actualDifficulty.value : null
        }
      })
    }

    const handleActualDifficultyValueChange = (value) => {
      emit('update:config', {
        ...props.config,
        actualDifficulty: {
          enabled: true,
          value: value || null
        }
      })
    }

    // 背包配置处理
    const handleInventoryModeChange = (enabled) => {
      emit('update:config', {
        ...props.config,
        inventory: {
          enabled,
          templateName: enabled ? props.config.inventory.templateName : null
        }
      })
    }

    const handleInventoryTemplateChange = (templateName) => {
      emit('update:config', {
        ...props.config,
        inventory: {
          enabled: true,
          templateName: templateName || null
        }
      })
    }

    // 智能规则处理
    const handleSmartRuleChange = (rule, checked) => {
      emit('update:smartRules', {
        ...props.smartRules,
        [rule]: checked
      })
    }

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
      handleSmartRuleChange
    }
  }
}
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
  content: '';
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

.radio-mark.checked ~ .radio-text {
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

.checkbox-mark.checked ~ .checkbox-text {
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
