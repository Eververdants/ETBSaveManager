/**
 * Player Transformers
 * Business logic for player data transformation
 */

import type { PlayerData, PlayerTransformOptions } from "./models";

/**
 * Transform player data with new options
 */
export function transformPlayerData(playerData: PlayerData, options: PlayerTransformOptions): PlayerData {
  const result: PlayerData = {
    ids: [...playerData.ids],
    sanities: { ...playerData.sanities },
    inventories: { ...playerData.inventories },
  };

  // Apply inventory template if provided
  if (options.inventoryTemplate) {
    for (const playerId of result.ids) {
      result.inventories[playerId] = [...options.inventoryTemplate];
    }
  }

  // Apply sanity if provided
  if (options.sanity !== undefined) {
    for (const playerId of result.ids) {
      result.sanities[playerId] = options.sanity;
    }
  }

  return result;
}

/**
 * Extract player ID from full player key
 * Full key format: <steam_id>_+_|<EOS_PUID> or <steam_id>-<offline_suffix>
 */
export function extractPlayerId(fullKey: string): string {
  const eosIndex = fullKey.indexOf("_+_|");
  if (eosIndex !== -1) {
    return fullKey.substring(0, eosIndex);
  }

  const offlineIndex = fullKey.indexOf("-");
  if (offlineIndex !== -1) {
    return fullKey.substring(0, offlineIndex);
  }

  return fullKey;
}

/**
 * Check if player key has real EOS suffix
 */
export function hasRealEosSuffix(key: string): boolean {
  const eosIndex = key.indexOf("_+_|");
  if (eosIndex === -1) return false;

  const suffix = key.substring(eosIndex + 4);
  return suffix.length === 32 && suffix !== "00000000000000000000000000000000";
}

/**
 * Validate inventory size
 */
export function validateInventorySize(inventory: unknown[]): boolean {
  if (!Array.isArray(inventory)) return false;
  return inventory.length <= 12;
}

/**
 * Validate sanity value
 */
export function validateSanity(sanity: number): boolean {
  return sanity >= 0 && sanity <= 100;
}
