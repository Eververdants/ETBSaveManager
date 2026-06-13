/**
 * Name parser composable - Reactive state management layer
 *
 * Pure parsing logic has been extracted to src/utils/nameParser.js
 * This composable only handles Vue reactive state.
 *
 * @see docs/SMART_INPUT_STANDARD.md
 */

import { ref, computed } from "vue";
import { parseName, parseMultiple, parseNames, parseCSV } from "@/utils/nameParser";

/**
 * Name parser composable
 * @returns {Object}
 */
export function useNameParser() {
  const parsedNames = ref([]);
  const rawInput = ref("");
  const parseResult = ref(null);

  /**
   * Parse input text
   * @param {string} input
   */
  const parseInput = (input) => {
    rawInput.value = input;
    const result = parseMultiple(input);
    parseResult.value = result;
    parsedNames.value = result.records.map((r) => r.parsed);
  };

  /**
   * Add a single name
   * @param {string} name
   */
  const addName = (name) => {
    if (name && name.trim()) {
      const parsed = parseName(name.trim());
      parsedNames.value.push(parsed);
    }
  };

  /**
   * Remove a name at the specified index
   * @param {number} index
   */
  const removeName = (index) => {
    if (index >= 0 && index < parsedNames.value.length) {
      parsedNames.value.splice(index, 1);
    }
  };

  /**
   * Clear all names
   */
  const clearNames = () => {
    parsedNames.value = [];
    rawInput.value = "";
    parseResult.value = null;
  };

  const nameCount = computed(() => parsedNames.value.length);

  const levelDetectedCount = computed(() => parsedNames.value.filter((p) => p.levelKeyword !== null).length);

  const difficultyDetectedCount = computed(() => parsedNames.value.filter((p) => p.difficultyKeyword !== null).length);

  return {
    // State
    parsedNames,
    rawInput,
    parseResult,
    nameCount,
    levelDetectedCount,
    difficultyDetectedCount,

    // Methods
    parseInput,
    addName,
    removeName,
    clearNames,

    // Export pure functions for convenience
    parseName,
    parseMultiple,
    parseNames,
    parseCSV,
  };
}
