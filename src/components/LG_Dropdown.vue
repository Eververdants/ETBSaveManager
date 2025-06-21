<template>
  <div
    class="glass-dropdown"
    ref="dropdown"
    :class="{ 'light-mode': !darkMode }"
  >
    <div
      class="dropdown-trigger"
      @click="toggleDropdown"
      @keydown.enter="toggleDropdown"
      @keydown.down="openDropdown"
      tabindex="0"
      :class="{ disabled }"
    >
      <span>{{ displayText }}</span>
      <svg
        class="dropdown-icon"
        :class="{ rotated: isOpen }"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 9L12 15L18 9"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <div class="dropdown-list" :class="{ visible: isOpen }" ref="dropdownList">
      <div
        v-for="(option, index) in options"
        :key="index"
        class="dropdown-item"
        :class="{ selected: modelValue === option.value }"
        @click="selectOption(option)"
        @keydown.enter="selectOption(option)"
        tabindex="0"
      >
        {{ option.label }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onUnmounted } from "vue";
import gsap from "gsap";

export default {
  name: "GlassDropdown",
  props: {
    modelValue: {
      type: [String, Number],
      default: null,
    },
    options: {
      type: Array,
      required: true,
      default: () => [],
    },
    darkMode: {
      type: Boolean,
      default: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    defaultText: {
      type: String,
      default: "请选择",
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const isOpen = ref(false);
    const dropdown = ref(null);
    const dropdownList = ref(null);
    const displayText = ref(props.defaultText);

    watch(
      () => props.modelValue,
      (newVal) => {
        const selectedOption = props.options.find(
          (opt) => opt.value === newVal
        );
        displayText.value = selectedOption
          ? selectedOption.label
          : props.defaultText;
      },
      { immediate: true }
    );

    const openDropdown = () => {
      if (props.disabled) return;

      isOpen.value = true;
      document.addEventListener("click", handleClickOutside);

      gsap.to(dropdownList.value, {
        duration: 0.3,
        opacity: 1,
        y: 0,
        ease: "power2.out",
      });
    };

    const closeDropdown = () => {
      isOpen.value = false;
      document.removeEventListener("click", handleClickOutside);

      gsap.to(dropdownList.value, {
        duration: 0.2,
        opacity: 0,
        y: -10,
        ease: "power2.in",
      });
    };

    const toggleDropdown = () => {
      if (props.disabled) return;

      if (isOpen.value) {
        closeDropdown();
      } else {
        openDropdown();
      }
    };

    const handleClickOutside = (event) => {
      if (dropdown.value && !dropdown.value.contains(event.target)) {
        closeDropdown();
      }
    };

    const selectOption = (option) => {
      emit("update:modelValue", option.value);
      closeDropdown();
    };

    const handleKeydown = (event) => {
      if (!isOpen.value) return;

      const items = dropdownList.value.querySelectorAll(".dropdown-item");
      if (!items.length) return;

      const currentIndex = Array.from(items).findIndex(
        (item) => document.activeElement === item
      );

      let nextIndex = -1;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          break;
        case "ArrowUp":
          event.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          break;
        case "Escape":
          closeDropdown();
          break;
        case "Enter":
        case " ":
          if (currentIndex >= 0) {
            selectOption(props.options[currentIndex]);
          }
          break;
      }

      if (nextIndex >= 0) {
        items[nextIndex].focus();
      }
    };

    onMounted(() => {
      document.addEventListener("keydown", handleKeydown);
    });

    onUnmounted(() => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeydown);
    });

    return {
      isOpen,
      dropdown,
      dropdownList,
      displayText,
      toggleDropdown,
      openDropdown,
      closeDropdown,
      selectOption,
    };
  },
};
</script>

<style scoped>
.glass-dropdown {
  position: relative;
  width: 85%;
  max-width: 320px;
  margin: 0 auto;
  z-index: auto;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

/* 深色模式样式（默认） */
.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 20px;
  border-radius: 14px;
  background: rgba(30, 30, 45, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 0 2px rgba(255, 255, 255, 0.3),
    0 4px 20px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.92);
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.2px;
}

.dropdown-trigger:hover:not(.disabled) {
  background: rgba(40, 40, 60, 0.8);
  box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.4),
    0 6px 24px rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

.dropdown-trigger:focus:not(.disabled) {
  outline: none;
  box-shadow: 0 0 0 3px rgba(100, 150, 255, 0.4),
    inset 0 0 4px rgba(255, 255, 255, 0.4);
}

.dropdown-trigger.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-icon {
  width: 20px;
  height: 20px;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.dropdown-list {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  background: rgba(30, 30, 45, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: inset 0 0 2px rgba(255, 255, 255, 0.4),
    0 8px 32px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  opacity: 0;
  transform: translateY(-10px);
  visibility: hidden;
  max-height: 220px;
  overflow-y: auto;
  z-index: 9999;
}

.dropdown-list::-webkit-scrollbar {
  width: 6px;
}

.dropdown-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  margin: 8px 0;
}

.dropdown-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.dropdown-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dropdown-list.visible {
  visibility: visible;
}

.dropdown-item {
  padding: 14px 20px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  z-index: 21;
}

/* 悬停动画效果 */
.dropdown-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.15),
    transparent
  );
  transition: transform 0.6s ease;
  transform: translateX(-100%);
}

.dropdown-item:hover::before {
  transform: translateX(200%);
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

.dropdown-item.selected {
  background: rgba(100, 150, 255, 0.2);
}

.dropdown-item.selected::after {
  content: "";
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: linear-gradient(to bottom, #5e9fff, #8a6cff);
  border-radius: 0 3px 3px 0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.7;
  }
}

/* 浅色模式样式 */
.glass-dropdown.light-mode .dropdown-trigger {
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: inset 0 0 2px rgba(255, 255, 255, 0.8),
    0 4px 20px rgba(0, 0, 0, 0.08);
  color: rgba(60, 60, 80, 0.95);
}

.glass-dropdown.light-mode .dropdown-trigger:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.9),
    0 6px 24px rgba(0, 0, 0, 0.1);
}

.glass-dropdown.light-mode .dropdown-trigger:focus:not(.disabled) {
  box-shadow: 0 0 0 3px rgba(80, 130, 250, 0.3),
    inset 0 0 4px rgba(255, 255, 255, 0.9);
}

.glass-dropdown.light-mode .dropdown-list {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: inset 0 0 2px rgba(255, 255, 255, 0.9),
    0 8px 32px rgba(0, 0, 0, 0.1);
}

.glass-dropdown.light-mode .dropdown-item {
  color: rgba(60, 60, 80, 0.95);
}

.glass-dropdown.light-mode .dropdown-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.glass-dropdown.light-mode .dropdown-item.selected {
  background: rgba(100, 150, 255, 0.15);
}

.glass-dropdown.light-mode .dropdown-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
}

.glass-dropdown.light-mode .dropdown-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
}

.glass-dropdown.light-mode .dropdown-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

.glass-dropdown.light-mode .dropdown-item::before {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 0, 0, 0.05),
    transparent
  );
}
</style>
