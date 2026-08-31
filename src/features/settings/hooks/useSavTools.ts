/**
 * .sav 工具 Hook — 解析（sav→json）/ 打包（json→sav）
 * 支持拖放（Tauri File.path）与文件选择对话框（对应 master useSavTools）
 */
import { useCallback, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useTranslation } from "react-i18next";

import { saveApi } from "../../../api";
import { toast } from "../../../stores";

export function useSavTools() {
  const { t } = useTranslation();
  const [parseDragOver, setParseDragOver] = useState(false);
  const [packDragOver, setPackDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isPacking, setIsPacking] = useState(false);

  const parseSavFile = useCallback(
    async (filePath: string) => {
      setIsParsing(true);
      try {
        const result = await saveApi.convertSavToJson(filePath);
        if (!result.success) throw new Error("parse failed");
        const outputPath = filePath.replace(/\.sav$/i, ".json");
        await writeTextFile(outputPath, result.json);
        toast.success(t("settings.parseSuccess", { filename: outputPath }));
      } catch (error) {
        console.error("Parse sav failed:", error);
        toast.error(String(error));
      } finally {
        setIsParsing(false);
      }
    },
    [t]
  );

  const packJsonFile = useCallback(
    async (filePath: string) => {
      setIsPacking(true);
      try {
        const jsonContent = await readTextFile(filePath);
        const outputPath = filePath.replace(/\.json$/i, "-edited.sav").replace(/\//g, "\\");
        await saveApi.convertJsonToSav(jsonContent, outputPath);
        toast.success(t("settings.packSuccess", { filename: outputPath }));
      } catch (error) {
        console.error("Pack json failed:", error);
        toast.error(String(error));
      } finally {
        setIsPacking(false);
      }
    },
    [t]
  );

  const triggerParse = useCallback(async () => {
    if (isParsing) return;
    const file = await open({
      filters: [{ name: "Save Files", extensions: ["sav"] }],
    });
    if (typeof file === "string") await parseSavFile(file.replace(/\//g, "\\"));
  }, [isParsing, parseSavFile]);

  const triggerPack = useCallback(async () => {
    if (isPacking) return;
    const file = await open({
      filters: [{ name: "JSON Files", extensions: ["json"] }],
    });
    if (typeof file === "string") await packJsonFile(file.replace(/\//g, "\\"));
  }, [isPacking, packJsonFile]);

  const handleParseDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setParseDragOver(false);
      const file = event.dataTransfer.files[0] as (File & { path?: string }) | undefined;
      const path = file?.path;
      if (path && path.toLowerCase().endsWith(".sav")) {
        void parseSavFile(path.replace(/\//g, "\\"));
      }
    },
    [parseSavFile]
  );

  const handlePackDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setPackDragOver(false);
      const file = event.dataTransfer.files[0] as (File & { path?: string }) | undefined;
      const path = file?.path;
      if (path && path.toLowerCase().endsWith(".json")) {
        void packJsonFile(path.replace(/\//g, "\\"));
      }
    },
    [packJsonFile]
  );

  return {
    parseDragOver,
    setParseDragOver,
    packDragOver,
    setPackDragOver,
    isParsing,
    isPacking,
    triggerParse,
    triggerPack,
    handleParseDrop,
    handlePackDrop,
  };
}
