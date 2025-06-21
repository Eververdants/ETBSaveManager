<template>
  <div class="glass-dropdown" ref="dropdown">
    <div
      class="dropdown-trigger"
      @click="toggleDropdown"
      @keydown.enter="toggleDropdown"
      @keydown.down="openDropdown"
      tabindex="0"
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
  name: "Dropdown",
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
      default: false,
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
  width: 100%;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 20px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 0 2px rgba(255, 255, 255, 0.3),
    0 4px 20px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  font-weight: 500;
}

.dropdown-trigger:hover {
  background: rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.4),
    0 4px 20px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}

.dropdown-trigger:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(138, 158, 255, 0.5);
}

.dropdown-trigger.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dropdown-icon {
  width: 20px;
  height: 20px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.dropdown-list {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(20px);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: inset 0 0 2px rgba(255, 255, 255, 0.4),
    0 8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  opacity: 0;
  transform: translateY(-10px);
  z-index: 1000;
  visibility: hidden;
  max-height: 170px;
  overflow-y: auto;
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
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

/* 添加悬停动画效果 */
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
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: transform 0.5s ease;
  transform: translateX(-100%);
}

.dropdown-item:hover::before {
  transform: translateX(200%);
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(5px);
}

.dropdown-item.selected {
  background: rgba(138, 158, 255, 0.25);
}

.dropdown-item.selected::after {
  content: "";
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: rgba(138, 158, 255, 0.9);
  border-radius: 0 3px 3px 0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.6;
  }
}
</style>
