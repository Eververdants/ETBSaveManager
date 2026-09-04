/**
 * 窗口控制按钮（最小化 / 最大化 / 关闭）
 *
 * 窗口能力统一来自 `api/system` 的 `windowControls` 封装，
 * 组件本身不直接依赖 Tauri window API（模块边界要求）。
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Minus, Square, X } from "lucide-react";

import { cn } from "../../utils";
import { windowControls } from "../../api";

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
  const available = windowControls.isAvailable();

  useEffect(() => {
    if (!available) return;
    let unlisten: (() => void) | undefined;
    let disposed = false;
    const sync = async () => setIsMaximized(await windowControls.isMaximized());
    void sync();
    void windowControls.onResized(() => void sync()).then((fn) => {
      if (disposed) fn();
      else unlisten = fn;
    });
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [available]);

  if (!available) return null;

  return (
    <div className="flex h-full items-stretch">
      <WindowControlButton label={t("common.minimize")} onClick={() => void windowControls.minimize()}>
        <Minus size={14} />
      </WindowControlButton>
      <WindowControlButton
        label={isMaximized ? t("common.restore") : t("common.maximize")}
        onClick={() => void windowControls.toggleMaximize()}
      >
        {isMaximized ? <Copy size={12} /> : <Square size={11} />}
      </WindowControlButton>
      <WindowControlButton label={t("common.close")} danger onClick={() => void windowControls.close()}>
        <X size={14} />
      </WindowControlButton>
    </div>
  );
}
