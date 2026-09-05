/**
 * Archive Validators
 * Business validation logic for archive operations
 */

import type { ParsedArchiveConfig } from "./models";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate archive name format
 * Expected format: SINGLEPLAYER/MULTIPLAYER_archiveName_difficulty.sav
 */
export function validateArchiveName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push("Archive name cannot be empty");
  }

  const regex = /^(SINGLEPLAYER|MULTIPLAYER)_(.+)_(Easy|Normal|Hard|Nightmare|\d+)\.sav$/i;
  if (!regex.test(name)) {
    errors.push("Archive name must match format: MODE_archiveName_difficulty.sav");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate archive configuration
 */
export function validateArchiveConfig(config: ParsedArchiveConfig): ValidationResult {
  const errors: string[] = [];

  if (!config.name || config.name.trim().length === 0) {
    errors.push("Archive name is required");
  }

  if (!config.level && !config.parsedInfo.level) {
    errors.push("Level must be specified");
  }

  if (!config.difficulty && !config.parsedInfo.difficulty) {
    errors.push("Difficulty must be specified");
  }

  const validDifficulties = ["Easy", "Normal", "Hard", "Nightmare"];
  const difficulty = config.difficulty || config.parsedInfo.difficulty;
  if (difficulty && !validDifficulties.includes(difficulty)) {
    errors.push(`Invalid difficulty: ${difficulty}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate inventory template
 */
export function validateInventoryTemplate(inventory: unknown[]): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(inventory)) {
    errors.push("Inventory must be an array");
    return { valid: false, errors };
  }

  if (inventory.length > 12) {
    errors.push("Inventory cannot exceed 12 slots");
  }

  for (let i = 0; i < inventory.length; i++) {
    const item = inventory[i];
    if (typeof item !== "string" && typeof item !== "object") {
      errors.push(`Invalid item at slot ${i}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
