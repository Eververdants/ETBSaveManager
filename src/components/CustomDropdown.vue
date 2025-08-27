<template>
  <div class="custom-dropdown" ref="dropdownRef">
    <div class="dropdown-display" @click="toggleDropdown">
      <transition name="text-swift" mode="out-in">
        <span :key="(selectedLabel || placeholder) + '-' + $i18n.locale" class="dropdown-text">{{ selectedLabel ||
          placeholder }}</span>
      </transition>
      <span class="dropdown-icon">▼</span>
    </div>

    <Teleport to="body">
      <transition name="dropdown" @enter="handleMenuEnter" @leave="handleMenuLeave">
        <div v-if="isOpen" class="dropdown-menu" :style="menuStyle" ref="menuRef">
          <div v-for="option in options" :key="option.value + '-' + $i18n.locale" class="dropdown-option"
            :class="{ selected: option.value === modelValue }" @click="selectOption(option)">
            <transition name="text-swift" mode="out-in">
              <span :key="option.label + '-' + $i18n.locale">{{ option.label }}</span>
            </transition>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { gsap } from 'gsap';

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: null
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: '请选择'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const dropdownRef = ref(null);
const menuRef = ref(null);
const isAnimating = ref(false);
const menuStyle = ref({});
const isOpen = ref(false);

const selectedLabel = computed(() => {
  const selected = props.options.find(option => option.value === props.modelValue);
  return selected ? selected.label : '';
});

const toggleDropdown = () => {
  if (isAnimating.value) return;
  isOpen.value = !isOpen.value;
};

const selectOption = (option) => {
  if (isAnimating.value) return;

  emit('update:modelValue', option.value);
  emit('change', option);
  isOpen.value = false;
};

const handleMenuEnter = (el, done) => {
  isAnimating.value = true;

  nextTick(() => {
    updateMenuPosition();

    gsap.fromTo(el,
      {
        opacity: 0,
        y: -10,
        scale: 0.95
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.25,
        ease: 'power2.out',
        onComplete: () => {
          isAnimating.value = false;
          done();
        }
      }
    );
  });
};

const handleMenuLeave = (el, done) => {
  isAnimating.value = true;

  gsap.to(el,
    {
      opacity: 0,
      y: -10,
      scale: 0.95,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        isAnimating.value = false;
        done();
      }
    }
  );
};

const updateMenuPosition = () => {
  if (!dropdownRef.value || !menuRef.value) return;

  const dropdownRect = dropdownRef.value.getBoundingClientRect();
  const menuHeight = menuRef.value.offsetHeight;
  const viewportHeight = window.innerHeight;

  // 检查下方空间是否足够
  const spaceBelow = viewportHeight - dropdownRect.bottom;
  const shouldOpenUp = spaceBelow < menuHeight && dropdownRect.top > menuHeight;

  menuStyle.value = {
    position: 'fixed',
    top: shouldOpenUp ? `${dropdownRect.top - menuHeight - 4}px` : `${dropdownRect.bottom + 4}px`,
    left: `${dropdownRect.left}px`,
    width: `${dropdownRect.width}px`,
    zIndex: 1000
  };
};

const handleMouseDown = (event) => {
  event.preventDefault();
};

const handleMouseUp = (event) => {
  event.preventDefault();
};

// 监听窗口大小变化，更新菜单位置
const handleResize = () => {
  if (isOpen.value) {
    updateMenuPosition();
  }
};

// 监听滚动，更新菜单位置
const handleScroll = () => {
  if (isOpen.value) {
    updateMenuPosition();
  }
};

// 点击外部区域关闭下拉框
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScroll);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.custom-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--dropdown-bg);
  border: 1px solid var(--dropdown-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 36px;
  user-select: none;
}

.dropdown-display:hover {
  background: var(--dropdown-hover-bg);
  border-color: var(--dropdown-border-hover);
}

.dropdown-display.open {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.dropdown-text {
  color: var(--dropdown-text);
  font-size: 14px;
  font-weight: 500;
}

.dropdown-icon {
  font-size: 10px;
  color: var(--dropdown-text);
  transition: transform 0.2s ease;
  margin-left: 8px;
}

.dropdown-icon.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  background: var(--dropdown-bg);
  border: 1px solid var(--dropdown-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--dropdown-shadow);
  overflow: hidden;
  backdrop-filter: blur(20px);
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-option {
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: var(--dropdown-text);
  user-select: none;
}

.dropdown-option:hover {
  background: var(--dropdown-hover-bg);
}

.dropdown-option.selected {
  background: var(--dropdown-selected-bg);
  color: var(--dropdown-selected-text);
  font-weight: 600;
}

.dropdown-option:not(:last-child) {
  border-bottom: 1px solid var(--dropdown-border);
}

/* 暗色主题适配 */
[data-theme="dark"] {
  .dropdown-display {
    border-color: rgba(255, 255, 255, 0.1);
  }

  .dropdown-option:not(:last-child) {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
}
</style>