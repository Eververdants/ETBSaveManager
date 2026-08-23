/**
 * Domain Models - Player
 * Core business entities for player data management
 */

export interface PlayerData {
  ids: string[];
  sanities: Record<string, number>;
  inventories: Record<string, string[]>;
}

export interface PlayerIdMapping {
  [steamId: string]: string; // steamId -> fullPlayerKey
}

export interface PlayerTransformOptions {
  inventoryTemplate?: string[];
  sanity?: number;
}
