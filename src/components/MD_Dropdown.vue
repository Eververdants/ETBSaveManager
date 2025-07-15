<template>
  <div class="md-dropdown-wrapper" ref="dropdownRef">
    <label v-if="label" class="md-dropdown-label">{{ label }}</label>
    <div
      class="md-dropdown"
      :class="{ 'is-open': isOpen }"
      @click="toggleDropdown"
      ref="triggerRef"
    >
      <span class="header-text">{{ selectedLabel }}</span>
      <i class="fas fa-chevron-down dropdown-caret"></i>
    </div>
    <Teleport to="body">
      <transition
        @enter="onDropdownEnter"
        @leave="onDropdownLeave"
        :css="false"
      >
        <div
          v-if="isOpen"
          class="options-container"
          ref="optionsContainerRef"
        >
          <div
            v-for="option in options"
            :key="option.value"
            class="option-item"
            :class="{ selected: option.value === modelValue }"
            @click="selectOption(option, $event)"
          >
            {{ option.label }}
            <span class="ripple"></span>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import gsap from "gsap";

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: "",
  },
  options: {
    type: Array,
    required: true,
    default: () => [],
  },
  defaultText: {
    type: String,
    default: "Select an option",
  },
  label: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

const isOpen = ref(false);
const dropdownRef = ref(null);
const triggerRef = ref(null);
const optionsContainerRef = ref(null);

const selectedLabel = computed(() => {
  const selected = props.options.find(
    (option) => option.value === props.modelValue
  );
  return selected ? selected.label : props.defaultText;
});

const positionDropdown = () => {
  if (!isOpen.value || !triggerRef.value || !optionsContainerRef.value) return;
  const trigger = triggerRef.value;
  const container = optionsContainerRef.value;
  const rect = trigger.getBoundingClientRect();

  container.style.top = `${rect.bottom + 4}px`;
  container.style.left = `${rect.left}px`;
  container.style.width = `${rect.width}px`;
};

watch(isOpen, (newValue) => {
  if (newValue) {
    nextTick(positionDropdown);
  }
});

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const selectOption = (option, event) => {
  emit("update:modelValue", option.value);
  isOpen.value = false;

  const item = event.currentTarget;
  const ripple = item.querySelector(".ripple");
  if (!ripple) return;
  gsap.killTweensOf(ripple);
  const rect = item.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  gsap.fromTo(
    ripple,
    {
      width: size,
      height: size,
      top: y,
      left: x,
      scale: 0,
      opacity: 0.5,
    },
    { scale: 1.5, opacity: 0, duration: 0.6, ease: "power2.out" }
  );
};

const handleClickOutside = (event) => {
  const triggerClicked = dropdownRef.value?.contains(event.target);
  const optionsClicked = optionsContainerRef.value?.contains(event.target);
  if (!triggerClicked && !optionsClicked) {
    isOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener("click", handleClickOutside);
  window.addEventListener("scroll", positionDropdown, true);
  window.addEventListener("resize", positionDropdown);
});

onUnmounted(() => {
  window.removeEventListener("click", handleClickOutside);
  window.removeEventListener("scroll", positionDropdown, true);
  window.removeEventListener("resize", positionDropdown);
});

const onDropdownEnter = (el, done) => {
  const options = el.querySelectorAll(".option-item");
  gsap
    .timeline({ onComplete: done })
    .fromTo(
      el,
      { transformOrigin: "top", scaleY: 0.8, opacity: 0 },
      { scaleY: 1, opacity: 1, duration: 0.2, ease: "power2.out" }
    )
    .from(
      options,
      {
        y: -10,
        opacity: 0,
        duration: 0.2,
        stagger: 0.03,
        ease: "power2.out",
      },
      "-=0.1"
    );
};

const onDropdownLeave = (el, done) => {
  gsap.to(el, {
    scaleY: 0.8,
    opacity: 0,
    duration: 0.2,
    ease: "power2.in",
    onComplete: done,
    transformOrigin: "top",
  });
};
</script>

<style scoped>
.md-dropdown-wrapper {
  position: relative;
  width: 100%;
}

.md-dropdown-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--search-text-secondary);
  margin-bottom: 8px;
  padding-left: 4px;
}

.md-dropdown {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--search-input-border);
  background-color: var(--search-input-bg);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  user-select: none;
}

.md-dropdown:hover {
  border-color: var(--search-text-primary);
}

.md-dropdown.is-open {
  border-color: var(--search-input-border-focus);
  box-shadow: 0 0 0 1px var(--search-input-border-focus);
}

.header-text {
  color: var(--search-text-primary);
  font-size: 1rem;
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-caret {
  color: var(--search-text-secondary);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 8px;
}

.md-dropdown.is-open .dropdown-caret {
  transform: rotate(180deg);
}

.options-container {
  position: fixed; /* Teleported, so we use fixed */
  z-index: 2000;
  max-height: 220px;
  overflow-y: auto;
  border-radius: 12px;
  background-color: var(--search-input-bg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--search-input-border);
  transform-origin: top;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: var(--search-text-primary);
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;
  overflow: hidden;
}

.option-item:hover {
  background-color: var(--search-close-icon-hover-bg);
}

.option-item.selected {
  font-weight: 500;
  color: var(--search-accent-primary);
  background-color: var(--search-hover);
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background-color: var(--search-accent-primary);
  pointer-events: none;
  transform: scale(0);
  opacity: 0.3;
}

/* Custom Scrollbar for Options Container */
.options-container::-webkit-scrollbar {
  width: 8px;
}

.options-container::-webkit-scrollbar-track {
  background: transparent;
  margin: 4px 0;
}

.options-container::-webkit-scrollbar-thumb {
  background-color: var(--search-input-border);
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.options-container::-webkit-scrollbar-thumb:hover {
  background-color: var(--search-text-secondary);
}
</style> 