<template>
  <div
    class="custom-select"
    :class="{ 'light-mode': lightMode, open: isOpen }"
    ref="selectRef"
  >
    <div class="select-header" @click="toggleDropdown">
      <span class="selected-value">{{ selectedLabel }}</span>
      <i class="fas fa-chevron-down" :class="{ rotate: isOpen }"></i>
    </div>

    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <div
          v-for="option in options"
          :key="option.value"
          class="dropdown-item"
          :class="{ selected: option.value === modelValue }"
          @click="selectOption(option)"
        >
          {{ option.label }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from "vue";
import gsap from "gsap";

export default {
  props: {
    modelValue: [String, Number, Boolean],
    options: Array,
    lightMode: Boolean,
  },
  emits: ["update:modelValue", "change"],
  setup(props, { emit }) {
    const isOpen = ref(false);
    const selectRef = ref(null);

    const selectedLabel = computed(() => {
      const selectedOption = props.options.find(
        (opt) => opt.value === props.modelValue
      );
      return selectedOption ? selectedOption.label : "请选择";
    });

    const toggleDropdown = () => {
      isOpen.value = !isOpen.value;
    };

    const selectOption = (option) => {
      emit("update:modelValue", option.value);
      emit("change", option.value);
      isOpen.value = false;

      // 添加点击反馈动画
      const selectedElement = event?.target;
      if (selectedElement) {
        gsap.fromTo(
          selectedElement,
          { scale: 0.95 },
          { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.8)" }
        );
      }
    };

    // 点击外部关闭下拉框
    const handleClickOutside = (event) => {
      if (selectRef.value && !selectRef.value.contains(event.target)) {
        isOpen.value = false;
      }
    };

    onMounted(() => {
      document.addEventListener("click", handleClickOutside);
    });

    onUnmounted(() => {
      document.removeEventListener("click", handleClickOutside);
    });

    return {
      isOpen,
      selectedLabel,
      selectRef,
      toggleDropdown,
      selectOption,
    };
  },
};
</script>

<style scoped>
.custom-select {
  position: relative;
  width: 100%;
  cursor: pointer;
}

.select-header {
  padding: 12px 15px;
  background: rgba(30, 32, 45, 0.7);
  border: 1px solid rgba(100, 110, 180, 0.3);
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.custom-select.light-mode .select-header {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(120, 140, 220, 0.3);
}

.select-header:hover {
  border-color: rgba(140, 150, 220, 0.5);
}

.custom-select.light-mode .select-header:hover {
  border-color: rgba(100, 120, 200, 0.5);
}

.custom-select.open .select-header {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-color: rgba(140, 150, 220, 0.5);
}

.custom-select.light-mode.open .select-header {
  border-color: rgba(100, 120, 200, 0.5);
}

.selected-value {
  font-size: 14px;
  color: #e0e0ff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-select.light-mode .selected-value {
  color: #2c3e50;
}

.fa-chevron-down {
  font-size: 12px;
  color: #7a89c9;
  transition: transform 0.3s ease;
}

.rotate {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(30, 32, 45, 0.95);
  border: 1px solid rgba(100, 110, 180, 0.3);
  border-top: none;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
  animation: dropdownAppear 0.3s ease;
}

.custom-select.light-mode .dropdown-menu {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(120, 140, 220, 0.3);
  border-top: none;
}

@keyframes dropdownAppear {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  padding: 12px 15px;
  font-size: 14px;
  color: #d0d0ff;
  transition: all 0.2s ease;
}

.custom-select.light-mode .dropdown-item {
  color: #34495e;
}

.dropdown-item:hover {
  background: rgba(100, 110, 180, 0.3);
  color: #fff;
}

.custom-select.light-mode .dropdown-item:hover {
  background: rgba(120, 140, 220, 0.2);
  color: #2c3e50;
}

.dropdown-item.selected {
  background: rgba(100, 110, 180, 0.4);
  color: white;
  font-weight: 500;
}

.custom-select.light-mode .dropdown-item.selected {
  background: rgba(120, 140, 220, 0.3);
  color: #2c3e50;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
