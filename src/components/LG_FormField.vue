<!-- src/components/LG_FormField.vue -->
<template>
  <div class="form-field" :class="{ 'light-mode': lightMode }">
    <label :for="field.id">{{ field.label }}</label>

    <!-- 数字输入框 -->
    <div v-if="field.type === 'number'" class="input-wrapper">
      <input
        type="number"
        :id="field.id"
        v-model="localValue"
        :min="field.min"
        :max="field.max"
      />
    </div>

    <!-- 单选框组 -->
    <div v-else-if="field.type === 'radio'" class="radio-group">
      <label
        v-for="option in field.options"
        :key="option.value"
        class="radio-option"
      >
        <input
          type="radio"
          :name="field.id"
          :value="option.value"
          v-model="localValue"
        />
        <span>{{ option.label }}</span>
      </label>
    </div>

    <!-- 滑动条 -->
    <div v-else-if="field.type === 'range'" class="range-slider">
      <input
        type="range"
        :id="field.id"
        v-model.number="localValue"
        :min="field.min"
        :max="field.max"
        :step="field.step || 1"
      />
      <div class="slider-value">{{ localValue }}</div>
    </div>

    <!-- 复选框 -->
    <div v-else-if="field.type === 'checkbox'" class="checkbox-wrapper">
      <input type="checkbox" :id="field.id" v-model="localValue" />
    </div>
  </div>
</template>

<script>
import { ref, watch } from "vue";

export default {
  props: {
    field: Object,
    modelValue: [String, Number, Boolean],
    lightMode: Boolean,
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const localValue = ref(props.modelValue);

    watch(localValue, (newVal) => {
      emit("update:modelValue", newVal);
    });

    return { localValue };
  },
};
</script>

<style scoped>
.form-field {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #a0a0d0;
  font-size: 14px;
  font-weight: 500;
}

.light-mode label {
  color: #5a6da8;
}

.input-wrapper input {
  width: 100%;
  padding: 10px 12px;
  background: rgba(40, 45, 60, 0.5);
  border: 1px solid rgba(100, 110, 180, 0.3);
  border-radius: 8px;
  color: #e0e0ff;
}

.light-mode .input-wrapper input {
  background: rgba(240, 242, 245, 0.8);
  color: #2c3e50;
  border: 1px solid rgba(120, 140, 220, 0.3);
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.radio-option span {
  color: #d0d0ff;
}

.light-mode .radio-option span {
  color: #34495e;
}

.range-slider {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range-slider input {
  flex: 1;
}

.slider-value {
  min-width: 40px;
  text-align: center;
  color: #e0e0ff;
}

.light-mode .slider-value {
  color: #2c3e50;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  height: 36px;
}
</style>
