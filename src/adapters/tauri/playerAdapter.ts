/**
 * Tauri Player Adapter
 * Adapts Tauri IPC calls to domain service interface
 */

import { invoke } from "@tauri-apps/api/core";
import type { PlayerData, PlayerIdMapping } from "@/domain/player/models";
import type { ArchiveServiceResult } from "@/domain/archive/service";

/**
 * Player adapter for Tauri backend
 */
export class TauriPlayerAdapter {
  /**
   * Get player data from a save file
   */
  async getPlayerData(filePath: string): Promise<ArchiveServiceResult<PlayerData>> {
    try {
      const result = await invoke<{
        ids: string[];
        sanities: Record<string, number>;
        inventories: Record<string, string[]>;
      }>("get_player_data", { filePath });
      return {
        success: true,
        data: {
          ids: result.ids,
          sanities: result.sanities,
          inventories: result.inventories,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get player unique IDs mapping
   */
  async getPlayerUniqueIds(steamIds: string[]): Promise<ArchiveServiceResult<PlayerIdMapping>> {
    try {
      const result = await invoke<{ success: boolean; map: PlayerIdMapping }>("get_player_unique_ids", {
        steamIds,
      });
      return { success: true, data: result.map };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Unlock all hub doors
   */
  async unlockAllHubDoors(filePath: string): Promise<ArchiveServiceResult<string>> {
    try {
      const result = await invoke<string>("unlock_all_hub_doors", { filePath });
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Edit save file
   */
  async editSaveFile(jsonData: Record<string, unknown>, outputDir: string): Promise<ArchiveServiceResult<string>> {
    try {
      const result = await invoke<string>("handle_edit_save", {
        jsonInput: { saveData: { jsonData, outputDir } },
      });
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// Singleton instance
export const tauriPlayerAdapter = new TauriPlayerAdapter();
