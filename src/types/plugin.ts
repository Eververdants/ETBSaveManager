/**
 * Plugin system types
 * Types for the plugin/mod data structures.
 */

/** Plugin data structure */
export interface PluginData {
  id: string;
  name: string;
  version?: string;
  description?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}
