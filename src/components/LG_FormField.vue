<template>
  <div class="form-field" :class="{ 'light-mode': lightMode }">
    <label :for="field.id">{{ field.label }}</label>

    <!-- 数字输入框 -->
    <div v-if="field.type === 'number'" class="input-number">
      <input
        type="number"
        :id="field.id"
        v-model="localValue"
        :min="field.min"
        :max="field.max"
      />
      <div class="number-controls">
        <button type="button" @click="increment">▲</button>
        <button type="button" @click="decrement">▼</button>
      </div>
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

    // 数字输入框的增减方法
    const increment = () => {
      const step = props.field.step || 1;
      const max = props.field.max || Infinity;
      localValue.value = Math.min(max, Number(localValue.value) + step);
    };

    const decrement = () => {
      const step = props.field.step || 1;
      const min = props.field.min || -Infinity;
      localValue.value = Math.max(min, Number(localValue.value) - step);
    };

    return { localValue, increment, decrement };
  },
};
</script>

<style scoped>
.form-field {
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

label {
  display: block;
  margin-bottom: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.light-mode label {
  color: #5a6da8;
}

.input-wrapper input {
  width: 85%;
  padding: 12px 16px;
  background: rgba(40, 45, 60, 0.5);
  border: 1px solid rgba(122, 137, 201, 0.3);
  border-radius: 10px;
  color: #ffffff;
  font-size: 15px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.input-wrapper input:focus {
  outline: none;
  border-color: rgba(122, 137, 201, 0.6);
  box-shadow: 0 0 0 2px rgba(122, 137, 201, 0.2);
}

.light-mode .input-wrapper input {
  background: rgba(255, 255, 255, 0.7);
  color: #2c3e50;
  border: 1px solid rgba(90, 109, 168, 0.3);
}

.light-mode .input-wrapper input:focus {
  border-color: rgba(90, 109, 168, 0.6);
  box-shadow: 0 0 0 2px rgba(90, 109, 168, 0.2);
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding-top: 4px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  padding-left: 24px;
}

.radio-option input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.radio-option span {
  position: relative;
  color: #ffffff;
  transition: color 0.3s ease;
}

.radio-option span::before {
  content: "";
  position: absolute;
  left: -24px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(122, 137, 201, 0.5);
  background: rgba(40, 45, 60, 0.3);
  transition: all 0.3s ease;
}

.radio-option input:checked + span::after {
  content: "";
  position: absolute;
  left: -18px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  /* background: linear-gradient(90deg, #7a89c9, #5a6da8); */
}

.radio-option input:checked + span::before {
  border-color: #7a89c9;
}

.radio-option:hover span {
  color: #ffffff;
}

.light-mode .radio-option span {
  color: #5a6da8;
}

.light-mode .radio-option span::before {
  border-color: rgba(90, 109, 168, 0.5);
  background: rgba(220, 225, 240, 0.5);
}

.light-mode .radio-option input:checked + span::before {
  border-color: #5a6da8;
}

.light-mode .radio-option:hover span {
  color: #34495e;
}

.range-slider {
  display: flex;
  align-items: center;
  gap: 15px;
  padding-top: 6px;
}

.range-slider input {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(40, 45, 60, 0.5);
  outline: none;
  appearance: none;
  -webkit-appearance: none;
}

.range-slider input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(90deg, #7a89c9, #5a6da8);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.range-slider input::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.light-mode .range-slider input {
  background: rgba(220, 225, 240, 0.7);
}

.light-mode .range-slider input::-webkit-slider-thumb {
  background: linear-gradient(90deg, #7a89c9, #5a6da8);
}

.slider-value {
  min-width: 36px;
  text-align: center;
  padding: 4px 8px;
  background: rgba(40, 45, 60, 0.3);
  border-radius: 8px;
  color: #e0e0ff;
  font-weight: 600;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.light-mode .slider-value {
  background: rgba(220, 225, 240, 0.5);
  color: #2c3e50;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  height: 36px;
  padding-top: 6px;
}

.checkbox-wrapper input {
  position: relative;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: rgba(40, 45, 60, 0.5);
  border: 1px solid rgba(122, 137, 201, 0.3);
  appearance: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.checkbox-wrapper input:checked {
  background: linear-gradient(135deg, #7a89c9, #5a6da8);
  border-color: #7a89c9;
}

.checkbox-wrapper input:checked::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 6px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.light-mode .checkbox-wrapper input {
  background: rgba(220, 225, 240, 0.7);
  border: 1px solid rgba(90, 109, 168, 0.3);
}

.light-mode .checkbox-wrapper input:checked {
  background: linear-gradient(135deg, #7a89c9, #5a6da8);
  border-color: #5a6da8;
}

.input-number {
  position: relative;
  display: flex;
  width: 100%;
}

.input-number input {
  width: 100%;
  padding: 12px 42px 12px 16px;
  background: rgba(40, 45, 60, 0.5);
  border: 1px solid rgba(122, 137, 201, 0.3);
  border-radius: 10px;
  color: #ffffff;
  font-size: 15px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  appearance: textfield;
  -moz-appearance: textfield;
}

/* 隐藏原生spinner */
.input-number input::-webkit-outer-spin-button,
.input-number input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input-number input:focus {
  outline: none;
  border-color: rgba(122, 137, 201, 0.6);
  box-shadow: 0 0 0 2px rgba(122, 137, 201, 0.2);
}

.light-mode .input-number input {
  background: rgba(255, 255, 255, 0.7);
  color: #2c3e50;
  border: 1px solid rgba(90, 109, 168, 0.3);
}

.light-mode .input-number input:focus {
  border-color: rgba(90, 109, 168, 0.6);
  box-shadow: 0 0 0 2px rgba(90, 109, 168, 0.2);
}

.number-controls {
  position: absolute;
  right: 1px;
  top: 1px;
  bottom: 1px;
  width: 32px;
  display: flex;
  flex-direction: column;
  border-radius: 0 10px 10px 0;
  overflow: hidden;
}

.number-controls button {
  flex: 1;
  background: rgba(60, 65, 80, 0.7);
  border: none;
  padding: 0;
  color: #a0b0e0;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.number-controls button:first-child {
  border-bottom: 1px solid rgba(122, 137, 201, 0.2);
}

.number-controls button:hover {
  background: rgba(90, 100, 150, 0.6);
  color: white;
}

.number-controls button:active {
  background: linear-gradient(135deg, #7a89c9, #5a6da8);
}

.light-mode .number-controls button {
  background: rgba(200, 205, 220, 0.7);
  color: #5a6da8;
}

.light-mode .number-controls button:first-child {
  border-bottom: 1px solid rgba(90, 109, 168, 0.2);
}

.light-mode .number-controls button:hover {
  background: rgba(180, 190, 220, 0.8);
  color: #34495e;
}

.light-mode .number-controls button:active {
  background: linear-gradient(135deg, #7a89c9, #5a6da8);
  color: white;
}
</style>
