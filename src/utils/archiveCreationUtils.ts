/**
 * Main storyline level list (first 17 levels)
 * Used to determine if quick mode is a main storyline
 * If the selected level is not in this list, it is considered a side storyline and needs full level data
 */
export const MAIN_STORYLINE_LEVELS: string[] = [
  "Level0",
  "TopFloor",
  "MiddleFloor",
  "GarageLevel2",
  "BottomFloor",
  "TheHub",
  "Pipes1",
  "ElectricalStation",
  "Office",
  "Hotel",
  "Floor3",
  "BoilerRoom",
  "Pipes2",
  "LevelFun",
  "Poolrooms",
  "LevelRun",
  "TheEnd",
];

/**
 * Default difficulty levels where MEG is locked (first 6 levels from Level0 to TheHub)
 */
export const MEG_LOCKED_LEVELS: string[] = [
  "Level0",
  "TopFloor",
  "MiddleFloor",
  "GarageLevel2",
  "BottomFloor",
  "TheHub",
];

/**
 * Capitalize first letter, lowercase the rest
 */
export function formatDifficulty(difficulty: string | null | undefined): string {
  if (!difficulty) return "Normal";
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
}

// Module-level cache for BasicArchive.json — only fetch once per session
let basicArchiveCache: Record<string, unknown> | null | undefined = undefined;

/**
 * Fetch /BasicArchive.json with caching (only fetch once per session)
 */
export async function loadBasicArchive(): Promise<Record<string, unknown> | null> {
  if (basicArchiveCache !== undefined) return basicArchiveCache;
  try {
    const response = await fetch("/BasicArchive.json");
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    basicArchiveCache = (await response.json()) as Record<string, unknown> | null;
    return basicArchiveCache;
  } catch (error) {
    console.error("Failed to load BasicArchive.json:", error);
    basicArchiveCache = null;
    return null;
  }
}

/**
 * Check if a level is a side storyline (not in the main 17 levels)
 */
export function isSideStoryline(level: string): boolean {
  return !MAIN_STORYLINE_LEVELS.includes(level);
}

/**
 * Check if MEG is unlocked for a given level
 */
export function isMEGUnlocked(level: string): boolean {
  return !MEG_LOCKED_LEVELS.includes(level);
}
