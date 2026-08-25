/**
 * 窗口控制按钮（最小化 / 最大化 / 关闭）
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Copy, Minus, Square, X } from "lucide-react";

import { cn } from "../../utils";

const IS_TAURI = "__TAURI_INTERNALS__" in window;

function WindowControlButton({
  onClick,
  label,
  danger,
  children,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-full w-[46px] items-center justify-center",
        "transition-all duration-150 ease-out",
        danger
          ? "text-[var(--color-winctrl-text)] hover:bg-[var(--color-winctrl-close-hover-bg)] hover:text-[var(--color-winctrl-close-hover-text)]"
          : "text-[var(--color-winctrl-text)] hover:bg-[var(--color-winctrl-hover-bg)] hover:text-[var(--color-winctrl-hover-text)]"
      )}
    >
      {children}
    </button>
  );
}

export default function WindowControls() {
  const { t } = useTranslation();
  const [isMaximized, setIsMaximized] = useState(false);
  const appWindow = useMemo(() => (IS_TAURI ? getCurrentWindow() : null), []);

  useEffect(() => {
    if (!appWindow) return;
    let unlisten: (() => void) | undefined;
    let disposed = false;
    const sync = async () => setIsMaximized(await appWindow.isMaximized());
    void sync();
    appWindow.onResized(() => void sync()).then((fn) => {
      if (disposed) fn();
      else unlisten = fn;
    });
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [appWindow]);

  if (!appWindow) return null;

  return (
    <div className="flex h-full items-stretch">
      <WindowControlButton label={t("common.minimize")} onClick={() => void appWindow.minimize()}>
        <Minus size={14} />
      </WindowControlButton>
      <WindowControlButton
        label={isMaximized ? t("common.restore") : t("common.maximize")}
        onClick={() => void appWindow.toggleMaximize()}
      >
        {isMaximized ? <Copy size={12} /> : <Square size={11} />}
      </WindowControlButton>
      <WindowControlButton label={t("common.close")} danger onClick={() => void appWindow.close()}>
        <X size={14} />
      </WindowControlButton>
    </div>
  );
}
