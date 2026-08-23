<template>
  <div class="level-search">
    <font-awesome-icon :icon="['fas', 'search']" class="level-search-icon" />
    <input
      :value="query"
      type="text"
      class="level-search-input"
      :placeholder="placeholder"
      @input="handleInput"
    />
    <button v-if="query" class="level-search-clear" @click="handleClear">
      <font-awesome-icon :icon="['fas', 'times']" />
    </button>
  </div>
</template>

<script setup>
defineProps({
  query: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:query"]);

const handleInput = (event) => {
  emit("update:query", event.target.value);
};

const handleClear = () => {
  emit("update:query", "");
};
</script>

<style scoped>
.level-search {
  position: relative;
  margin-bottom: 18px;
}

.level-search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  font-size: 14px;
  transition: color 0.2s ease;
}

.level-search-input {
  width: 100%;
  padding: 12px 42px 12px 44px;
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.level-search-input::placeholder {
  color: var(--text-tertiary);
}

.level-search-input:hover {
  border-color: var(--accent-color);
}

.level-search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.15);
}

.level-search:focus-within .level-search-icon {
  color: var(--accent-color);
}

.level-search-clear {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-circle);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.level-search-clear:hover {
  background: var(--accent-color);
  color: #fff;
}
</style>
