/**
 * Tauri Archive Adapter
 * Adapts Tauri IPC calls to domain service interface
 */

import { invoke } from "@tauri-apps/api/core";
import type { Archive, ArchiveMetadata, ArchiveDetail, CreateArchiveOptions } from "@/domain/archive/models";
import type { ArchiveServiceResult } from "@/domain/archive/service";

/**
 * Archive adapter for Tauri backend
 */
export class TauriArchiveAdapter {
  /**
   * Load all archives with full details
   */
  async loadAllArchives(): Promise<ArchiveServiceResult<Archive[]>> {
    try {
      const archives = await invoke<Archive[]>("load_all_saves");
      return { success: true, data: archives };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Load archive metadata only (no .sav parsing)
   */
  async loadArchiveMetadata(): Promise<ArchiveServiceResult<ArchiveMetadata[]>> {
    try {
      const metadata = await invoke<ArchiveMetadata[]>("load_save_metadata");
      return { success: true, data: metadata };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Load archive metadata page for pagination
   */
  async loadArchiveMetadataPage(
    offset: number,
    limit: number,
  ): Promise<ArchiveServiceResult<{ items: ArchiveMetadata[]; total: number; hasMore: boolean }>> {
    try {
      const page = await invoke<{ items: ArchiveMetadata[]; total: number; hasMore: boolean }>(
        "load_save_metadata_page",
        { offset, limit },
      );
      return { success: true, data: page };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Load archive details in batch
   */
  async loadArchiveDetailsBatch(paths: string[]): Promise<ArchiveServiceResult<ArchiveDetail[]>> {
    try {
      const details = await invoke<ArchiveDetail[]>("load_save_details_batch", { paths });
      return { success: true, data: details };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete archive permanently
   */
  async deleteArchive(filePath: string): Promise<ArchiveServiceResult<void>> {
    try {
      await invoke("delete_file", { filePath });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Soft delete archive (move to trash)
   */
  async softDeleteArchive(filePath: string): Promise<ArchiveServiceResult<void>> {
    try {
      await invoke("soft_delete_file", { filePath });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Restore soft-deleted archive
   */
  async restoreArchive(filePath: string): Promise<ArchiveServiceResult<void>> {
    try {
      await invoke("restore_file", { filePath });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Permanently delete trashed archive
   */
  async permanentDeleteArchive(filePath: string): Promise<ArchiveServiceResult<void>> {
    try {
      await invoke("permanent_delete_file", { filePath });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Toggle archive visibility
   */
  async toggleArchiveVisibility(filePath: string, archiveName: string): Promise<ArchiveServiceResult<void>> {
    try {
      await invoke("handle_file", {
        filePath,
        action: "toggle_visibility",
        archiveName,
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create new archive
   */
  async createArchive(options: CreateArchiveOptions): Promise<ArchiveServiceResult<void>> {
    try {
      await invoke("handle_new_save", { saveData: options });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Convert .sav to JSON
   */
  async convertSavToJson(filePath: string): Promise<ArchiveServiceResult<{ json: string }>> {
    try {
      const result = await invoke<{ success: boolean; json: string }>("convert_sav_to_json", {
        filePath,
      });
      return { success: true, data: { json: result.json } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Convert JSON to .sav
   */
  async convertJsonToSav(jsonContent: string, outputPath: string): Promise<ArchiveServiceResult<void>> {
    try {
      await invoke("convert_json_to_sav", { jsonContent, outputPath });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Open save games folder
   */
  async openSaveGamesFolder(): Promise<ArchiveServiceResult<void>> {
    try {
      await invoke("open_save_games_folder");
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// Singleton instance
export const tauriArchiveAdapter = new TauriArchiveAdapter();
