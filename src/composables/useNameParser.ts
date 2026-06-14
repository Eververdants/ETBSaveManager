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
import type { ParsedNameInfo, ParseResult } from "@/types";

/**
 * Name parser composable
 */
export function useNameParser() {
  const parsedNames = ref<ParsedNameInfo[]>([]);
  const rawInput = ref("");
  const parseResult = ref<ParseResult | null>(null);

  /**
   * Parse input text
   */
  const parseInput = (input: string): void => {
    rawInput.value = input;
    const result = parseMultiple(input);
    parseResult.value = result;
    parsedNames.value = result.records.map((r) => r.parsed);
  };

  /**
   * Add a single name
   */
  const addName = (name: string): void => {
    if (name && name.trim()) {
      const parsed = parseName(name.trim());
      parsedNames.value.push(parsed);
    }
  };

  /**
   * Remove a name at the specified index
   */
  const removeName = (index: number): void => {
    if (index >= 0 && index < parsedNames.value.length) {
      parsedNames.value.splice(index, 1);
    }
  };

  /**
   * Clear all names
   */
  const clearNames = (): void => {
    parsedNames.value = [];
    rawInput.value = "";
    parseResult.value = null;
  };

  const nameCount = computed((): number => parsedNames.value.length);

  const levelDetectedCount = computed((): number => parsedNames.value.filter((p) => p.levelKeyword !== null).length);

  const difficultyDetectedCount = computed(
    (): number => parsedNames.value.filter((p) => p.difficultyKeyword !== null).length,
  );

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
