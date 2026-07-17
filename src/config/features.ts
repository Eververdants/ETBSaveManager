/**
 * Feature flags configuration
 *
 * Toggle features on/off without deleting code.
 * Set a flag to `true` to enable the feature, `false` to disable it.
 */
export const FEATURES = {
  /**
   * Merge "存档难度" (archive difficulty) and "实际难度" (actual difficulty)
   * into a single displayed difficulty.
   *
   * When enabled:
   * - Actual difficulty is hidden from the UI
   * - Actual difficulty always mirrors archive difficulty in the backend
   * - All existing code is preserved behind the flag
   */
  MERGE_DIFFICULTY: true,
};
