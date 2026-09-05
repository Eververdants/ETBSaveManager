/**
 * 标题栏（与侧边栏一体化，共用外壳变量）
 */
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { UI_CONFIG, findNavChildByPath, findNavEntryByPath } from "../../constants";
import { useAppStore } from "../../stores";
import WindowControls from "./WindowControls";

export default function TitleBar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);

  const entry = useMemo(() => findNavEntryByPath(location.pathname), [location.pathname]);
  const child = useMemo(() => findNavChildByPath(location.pathname), [location.pathname]);
  const locationText = useMemo(() => {
    if (!entry) return "";
    if (entry.kind === "leaf") {
      return t(`nav.${entry.labelKey}`);
    }
    const groupLabel = t(`nav.${entry.labelKey}`);
    return child ? `${groupLabel} · ${t(`nav.${child.labelKey}`)}` : groupLabel;
  }, [entry, child, location.pathname, t]);

  return (
    <header
      data-tauri-drag-region
      style={{
        height: UI_CONFIG.TITLEBAR_HEIGHT,
        backgroundColor: "var(--color-shell-bg)",
        color: "var(--color-shell-text)",
      }}
      className="flex w-full shrink-0 select-none items-center pl-2 pr-0"
    >
      <button
        type="button"
        aria-label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
        title={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
        onClick={onToggleSidebar}
        className="flex h-7 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-winctrl-text)] transition-all duration-150 ease-out hover:bg-[var(--color-winctrl-hover-bg)] hover:text-[var(--color-winctrl-hover-text)] active:scale-90"
      >
        {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
      </button>

      <span data-tauri-drag-region className="ml-1.5 flex shrink-0 items-center gap-1.5">
        <img src="/icon.png" alt="" className="h-[18px] w-[18px] rounded" draggable={false} />
        <span className="text-[12px] font-semibold tracking-tight text-[var(--color-shell-text-active)]">{t("common.appName")}</span>
      </span>

      {locationText && (
        <>
          <span data-tauri-drag-region className="mx-2 select-none text-[var(--color-shell-divider)]">/</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={locationText}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              data-tauri-drag-region
              className="truncate text-xs text-[var(--color-shell-text-muted)]"
            >
              {locationText}
            </motion.span>
          </AnimatePresence>
        </>
      )}

      <div data-tauri-drag-region className="flex min-w-0 flex-1 items-center justify-center">
        {/* 通用插槽：页面可通过 portal 注入标题栏中部内容（如存档页搜索框） */}
        <div id="titlebar-center-slot" className="pointer-events-auto flex min-w-0 items-center" />
      </div>

      <div className="ml-auto flex h-full items-stretch">
        <WindowControls />
      </div>
    </header>
  );
}
