import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { useI18n } from "vue-i18n";
import { notify } from "@/services/notificationService";

/**
 * Developer sav <-> JSON conversion tools (drag-and-drop or file dialog).
 */
export function useSavTools() {
  const { t } = useI18n({ useScope: "global" });

  const parseDragOver = ref(false);
  const packDragOver = ref(false);
  const isParsing = ref(false);
  const isPacking = ref(false);

  const triggerParseFileInput = () => {
    if (!isParsing.value) {
      parseSavFile();
    }
  };

  const triggerPackFileInput = () => {
    if (!isPacking.value) {
      packJsonFile();
    }
  };

  const handleParseDrop = (event: DragEvent) => {
    parseDragOver.value = false;
    const file = event.dataTransfer?.files?.[0] as (File & { path?: string }) | undefined;
    if (file?.path) {
      isParsing.value = true;
      processSavFile(file.path);
    } else {
      // Fallback: open file dialog if no valid file path from drop
      parseSavFile();
    }
  };

  const handlePackDrop = (event: DragEvent) => {
    packDragOver.value = false;
    const file = event.dataTransfer?.files?.[0] as (File & { path?: string }) | undefined;
    if (file?.path) {
      isPacking.value = true;
      processJsonFile(file.path);
    } else {
      // Fallback: open file dialog if no valid file path from drop
      packJsonFile();
    }
  };

  async function parseSavFile() {
    isParsing.value = true;

    try {
      // Use Tauri dialog to select file for full path
      const filePath = await open({
        multiple: false,
        filters: [{ name: "Save Files", extensions: ["sav"] }],
      });

      if (!filePath) {
        isParsing.value = false;
        return;
      }

      await processSavFile(filePath);
    } catch (error) {
      console.error("Failed to open file dialog:", error);
      notify.error(t("settings.parseError", { error: String(error) }));
      isParsing.value = false;
    }
  }

  async function processSavFile(filePath: string) {
    try {
      // Call backend to parse save file
      const result = (await invoke("convert_sav_to_json", {
        filePath: filePath,
      })) as { success: boolean; json: string };

      if (result?.success && result?.json) {
        // Generate output filename (same name .json)
        const fileName = filePath.split("\\").pop()?.split("/").pop() ?? "";
        const outputFileName = fileName.replace(/\.sav$/i, ".json");
        const outputDir = filePath.substring(0, Math.max(filePath.lastIndexOf("\\"), filePath.lastIndexOf("/")));
        const outputPath = `${outputDir}/${outputFileName}`.replace(/\//g, "\\");

        // Write file using Tauri fs plugin
        await writeTextFile(outputPath, result.json);

        notify.success(t("settings.parseSuccess", { filename: outputFileName }));
      } else {
        throw new Error("Parse result is invalid");
      }
    } catch (error) {
      console.error("Failed to parse save file:", error);
      notify.error(t("settings.parseError", { error: String(error) }));
    } finally {
      isParsing.value = false;
    }
  }

  async function packJsonFile() {
    isPacking.value = true;

    try {
      // Use Tauri dialog to select file for full path
      const filePath = await open({
        multiple: false,
        filters: [{ name: "JSON Files", extensions: ["json"] }],
      });

      if (!filePath) {
        isPacking.value = false;
        return;
      }

      await processJsonFile(filePath);
    } catch (error) {
      console.error("Failed to open file dialog:", error);
      notify.error(t("settings.packError", { error: String(error) }));
      isPacking.value = false;
    }
  }

  async function processJsonFile(filePath: string) {
    try {
      // Read JSON file content
      const jsonContent = await readTextFile(filePath);

      // Generate output filename (same name -edited.sav)
      const fileName = filePath.split("\\").pop()?.split("/").pop() ?? "";
      const baseName = fileName.replace(/\.json$/i, "");
      const outputFileName = `${baseName}-edited.sav`;
      const outputDir = filePath.substring(0, Math.max(filePath.lastIndexOf("\\"), filePath.lastIndexOf("/")));
      const outputPath = `${outputDir}/${outputFileName}`.replace(/\//g, "\\");

      // Call backend to pack save file
      const result = (await invoke("convert_json_to_sav", {
        jsonContent: jsonContent,
        outputPath: outputPath,
      })) as { success: boolean; message?: string };

      if (result?.success) {
        notify.success(t("settings.packSuccess", { filename: outputFileName }));
      } else {
        throw new Error(result?.message || "Packaging failed");
      }
    } catch (error) {
      console.error("Failed to pack save file:", error);
      notify.error(t("settings.packError", { error: String(error) }));
    } finally {
      isPacking.value = false;
    }
  }

  return {
    parseDragOver,
    packDragOver,
    isParsing,
    isPacking,
    triggerParseFileInput,
    triggerPackFileInput,
    handleParseDrop,
    handlePackDrop,
  };
}
