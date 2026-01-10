<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="handleClose">
        <div class="modal-container">
          <!-- 模态框头部 -->
          <div class="modal-header">
            <h3 class="modal-title">
              <font-awesome-icon :icon="['fas', 'edit']" />
              {{ $t("quickCreate.editModal.title") }}
            </h3>
            <button class="close-btn" @click="handleClose">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>

          <!-- 模态框内容 -->
          <div class="modal-content">
            <!-- 存档名称 -->
            <div class="form-group">
              <label class="form-label">{{
                $t("quickCreate.editModal.archiveName")
              }}</label>
              <input type="text" class="form-input" v-model="localArchive.name" :placeholder="$t('quickCreate.editModal.archiveNamePlaceholder')
                " />
            </div>

            <!-- 层级选择 -->
            <div class="form-group">
              <label class="form-label">{{
                $t("quickCreate.editModal.level")
              }}</label>
              <CustomDropdown :model-value="localArchive.level" :options="levelDropdownOptions"
                :placeholder="$t('quickCreate.editModal.inheritFromUniform')"
                @update:model-value="localArchive.level = $event" />
            </div>

            <!-- 存档难度 -->
            <div class="form-group">
              <label class="form-label">{{
                $t("quickCreate.editModal.difficulty")
              }}</label>
              <CustomDropdown :model-value="localArchive.difficulty" :options="difficultyDropdownOptions"
                :placeholder="$t('quickCreate.editModal.inheritFromUniform')"
                @update:model-value="localArchive.difficulty = $event" />
            </div>

            <!-- 实际难度 -->
            <div class="form-group">
              <label class="form-label">{{
                $t("quickCreate.editModal.actualDifficulty")
              }}</label>
              <CustomDropdown :model-value="localArchive.actualDifficulty" :options="difficultyDropdownOptions"
                :placeholder="$t('quickCreate.editModal.inheritFromUniform')"
                @update:model-value="localArchive.actualDifficulty = $event" />
            </div>

            <!-- 背包模板 -->
            <div class="form-group">
              <label class="form-label">{{
                $t("quickCreate.editModal.inventory")
              }}</label>
              <CustomDropdown :model-value="localArchive.inventoryTemplate" :options="inventoryDropdownOptions"
                :placeholder="$t('quickCreate.editModal.inheritFromUniform')"
                @update:model-value="localArchive.inventoryTemplate = $event" />
            </div>
          </div>

          <!-- 模态框底部 -->
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="handleClose">
              {{ $t("common.cancel") }}
            </button>
            <button class="btn btn-primary" @click="handleSave">
              {{ $t("common.save") }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import CustomDropdown from "@/components/CustomDropdown.vue";

const { t } = useI18n({ useScope: "global" });

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  archive: {
    type: Object,
    default: null,
  },
  availableLevels: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "save"]);

// 本地编辑副本
const localArchive = ref({
  name: "",
  level: null,
  difficulty: null,
  actualDifficulty: null,
  inventoryTemplate: null,
});

// 难度选项
const difficultyOptions = computed(() => [
  { value: "easy", label: t("createArchive.difficultyLevels.easy") },
  { value: "normal", label: t("createArchive.difficultyLevels.normal") },
  { value: "hard", label: t("createArchive.difficultyLevels.hard") },
  { value: "nightmare", label: t("createArchive.difficultyLevels.nightmare") },
]);

// 层级下拉选项（包含继承选项）
const levelDropdownOptions = computed(() => {
  return props.availableLevels.map((level) => ({
    value: level.value,
    label: level.label,
  }));
});

// 难度下拉选项（包含继承选项）
const difficultyDropdownOptions = computed(() => {
  return difficultyOptions.value;
});

// 背包模板下拉选项
const inventoryDropdownOptions = computed(() => [
  { value: "empty", label: t("quickCreate.card.emptyInventory") },
]);

// 监听 archive 变化，更新本地副本
watch(
  () => props.archive,
  (newArchive) => {
    if (newArchive) {
      localArchive.value = {
        name: newArchive.name || "",
        level: newArchive.level,
        difficulty: newArchive.difficulty,
        actualDifficulty: newArchive.actualDifficulty,
        inventoryTemplate: newArchive.inventoryTemplate,
      };
    }
  },
  { immediate: true }
);

// 关闭模态框
const handleClose = () => {
  emit("close");
};

// 保存更改
const handleSave = () => {
  emit("save", {
    id: props.archive?.id,
    ...localArchive.value,
  });
  handleClose();
};
</script>

<style scoped>
/* 模态框遮罩 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

/* 模态框容器 */
.modal-container {
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

/* 模态框头部 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--divider-light);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* 模态框内容 */
.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* 表单组 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-input {
  padding: var(--space-2) var(--space-3);
  background: var(--bg-tertiary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s var(--ease-default);
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.2);
}

/* 模态框底部 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4);
  border-top: 1px solid var(--divider-light);
}

.btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
}

.btn-secondary {
  background: var(--bg-tertiary);
  border: 1px solid var(--divider-light);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-primary {
  background: var(--accent-color);
  border: none;
  color: white;
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s var(--ease-default);
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: all 0.3s var(--ease-default);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(20px);
  opacity: 0;
}

/* 响应式 */
@media (max-width: 480px) {
  .modal-container {
    width: 95%;
    max-height: 95vh;
  }

  .modal-header,
  .modal-content,
  .modal-footer {
    padding: var(--space-3);
  }
}
</style>
