/**
 * Tauri Archive Adapter
 * Adapts Tauri IPC calls to domain service interface
 */

import { invoke } from "@tauri-apps/api/core";
import type { Archive, ArchiveMetadata, ArchiveDetail, CreateArchiveOptions } from "@/domain/archive/models";
import type { ArchiveServiceResult } from "@/domain/archive/service";

/**
 * Extract a readable message from a Tauri invoke rejection.
 * Rust `AppError` serializes as a plain `{type, message}` object, so
 * `String(error)` would only yield "[object Object]".
 */
function normalizeInvokeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const e = error as { message?: unknown; msg?: unknown };
    if (typeof e.message === "string") return e.message;
    if (typeof e.msg === "string") return e.msg;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

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
        error: normalizeInvokeError(error),
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
        error: normalizeInvokeError(error),
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
        error: normalizeInvokeError(error),
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
        error: normalizeInvokeError(error),
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
        error: normalizeInvokeError(error),
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
        error: normalizeInvokeError(error),
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
        error: normalizeInvokeError(error),
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
        error: normalizeInvokeError(error),
      };
    }
  }

  /**
   * Toggle archive visibility.
   * Pass `visible` to pin the desired state (idempotent, race-free);
   * omit it to flip relative to the current state.
   * Returns the VERIFIED end state reported by the backend so callers can
   * reconcile their UI against what is actually on disk.
   */
  async toggleArchiveVisibility(
    filePath: string,
    archiveName: string,
    visible?: boolean,
  ): Promise<ArchiveServiceResult<{ isVisible: boolean }>> {
    try {
      const raw = await invoke<string>("handle_file", {
        filePath,
        action: "toggle_visibility",
        archiveName,
        visible: visible ?? null,
      });

      // The backend answers with a JSON string: {success, isVisible}.
      // "Invoke resolved" alone proves nothing — inspect the payload.
      let parsed: { success?: boolean; isVisible?: boolean } = {};
      try {
        parsed = JSON.parse(raw) as { success?: boolean; isVisible?: boolean };
      } catch {
        return { success: false, error: "Malformed response from backend" };
      }
      if (parsed.success === false) {
        return { success: false, error: "Backend reported toggle failure" };
      }
      return { success: true, data: { isVisible: parsed.isVisible === true } };
    } catch (error) {
      return { success: false, error: normalizeInvokeError(error) };
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
        error: normalizeInvokeError(error),
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
        error: normalizeInvokeError(error),
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
        error: normalizeInvokeError(error),
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
        error: normalizeInvokeError(error),
      };
    }
  }
}

// Singleton instance
export const tauriArchiveAdapter = new TauriArchiveAdapter();
