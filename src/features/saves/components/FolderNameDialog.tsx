/**
 * 文件夹命名对话框 — 新建 / 重命名共用
 *
 * mode "create" 可携带 movePaths：提交后先建文件夹再把这批存档移入
 * （右键「移动到文件夹 › 新建文件夹」的直达路径）。
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Dialog, Button, Input } from "../../../components/ui";

export interface FolderNameDialogProps {
  open: boolean;
  mode: "create" | "rename";
  /** 已占用名称（重命名时排除自身，比较不区分大小写） */
  existingNames: string[];
  /** 重命名时自身的旧名 */
  selfName?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export default function FolderNameDialog({
  open,
  mode,
  existingNames,
  selfName,
  onClose,
  onSubmit,
}: FolderNameDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(mode === "rename" ? (selfName ?? "") : "");
      setError(null);
    }
  }, [open, mode, selfName]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("organizer.folderNameRequired"));
      return;
    }
    const occupied = existingNames.some(
      (n) => n.toLowerCase() === trimmed.toLowerCase() && n !== selfName
    );
    if (occupied) {
      setError(t("organizer.folderNameExists"));
      return;
    }
    onSubmit(trimmed);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "create" ? t("organizer.newFolder") : t("organizer.renameFolder")}
      maxWidth="380px"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="md" onClick={submit}>
            {mode === "create" ? t("organizer.create") : t("common.save")}
          </Button>
        </>
      }
    >
      <div className="pb-1">
        <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
          {t("organizer.folderNameLabel")}
        </label>
        <Input
          autoFocus
          value={name}
          invalid={!!error}
          placeholder={t("organizer.folderNamePlaceholder")}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        {error && <p className="mt-1.5 text-xs text-[var(--color-danger)]">{error}</p>}
      </div>
    </Dialog>
  );
}
