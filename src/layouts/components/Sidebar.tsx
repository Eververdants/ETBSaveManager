/**
 * 侧边栏容器
 * 持有浮出面板（flyout）与安全区的共享状态，导航项渲染交给 SidebarItem
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import { NAV_ENTRIES, UI_CONFIG } from "../../constants";
import { useAppStore } from "../../stores";
import { cn } from "../../utils";
import SafeAreaOverlay from "./SafeAreaOverlay";
import SidebarItem from "./SidebarItem";

const BOTTOM_LABEL_KEYS = new Set(["login", "settings"]);

// 预先计算 top/bottom 分组，避免每次渲染重新 filter
const TOP_ENTRIES = NAV_ENTRIES.filter((e) => !BOTTOM_LABEL_KEYS.has(e.labelKey));
const BOTTOM_ENTRIES = NAV_ENTRIES.filter((e) => BOTTOM_LABEL_KEYS.has(e.labelKey));

/** 浮出面板收起延迟：给鼠标从一级项移动到面板留出余量 */
const FLYOUT_CLOSE_DELAY = 150;

export default function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const sidebarRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const safeAreaTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const [triggerEl, setTriggerEl] = useState<HTMLElement | null>(null);
  const [panelEl, setPanelEl] = useState<HTMLElement | null>(null);

  const resetFlyout = useCallback(() => {
    setActiveFlyout(null);
    setTriggerEl(null);
    setPanelEl(null);
  }, []);

  const openFlyout = useCallback((key: string, trigger: HTMLElement) => {
    clearTimeout(closeTimer.current);
    setActiveFlyout(key);
    setTriggerEl(trigger);
  }, []);

  const closeFlyout = useCallback(() => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(resetFlyout, FLYOUT_CLOSE_DELAY);
  }, [resetFlyout]);

  // 鼠标进入安全区：视为已离开触发区，同样延迟收起；离开则取消收起
  const safeAreaEnter = useCallback(() => {
    clearTimeout(closeTimer.current);
    clearTimeout(safeAreaTimer.current);
    safeAreaTimer.current = setTimeout(resetFlyout, FLYOUT_CLOSE_DELAY);
  }, [resetFlyout]);

  const safeAreaLeave = useCallback(() => {
    clearTimeout(safeAreaTimer.current);
  }, []);

  const onPanelMount = useCallback((el: HTMLElement | null) => {
    setPanelEl(el);
  }, []);

  useEffect(() => {
    resetFlyout();
    clearTimeout(closeTimer.current);
  }, [collapsed, resetFlyout]);

  const flyoutProps = {
    activeFlyout,
    openFlyout,
    closeFlyout,
    onPanelMount,
  };

  return (
    <motion.aside
      ref={sidebarRef}
      animate={{
        width: collapsed
          ? UI_CONFIG.SIDEBAR_COLLAPSED_WIDTH
          : UI_CONFIG.SIDEBAR_WIDTH,
      }}
      transition={{ duration: UI_CONFIG.SIDEBAR_ANIMATION_MS / 1000, ease: [0.2, 0, 0, 1] }}
      style={{ backgroundColor: "var(--color-shell-bg)" }}
      className="relative flex shrink-0 flex-col pb-2"
    >
      {collapsed && (
        <SafeAreaOverlay
          sidebarEl={sidebarRef.current}
          triggerEl={triggerEl}
          panelEl={panelEl}
          onEnter={safeAreaEnter}
          onLeave={safeAreaLeave}
        />
      )}

      <nav
        className={cn(
          "flex-1 px-2.5",
          collapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"
        )}
      >
        <ul className="space-y-1 pt-1.5">
          {TOP_ENTRIES.map((entry) => (
            <li key={entry.labelKey}>
              <SidebarItem entry={entry} {...flyoutProps} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 px-2.5 pb-1 pt-2">
        <ul className="space-y-1">
          {BOTTOM_ENTRIES.map((entry) => (
            <li key={entry.labelKey}>
              <SidebarItem entry={entry} {...flyoutProps} />
            </li>
          ))}
        </ul>
      </div>
    </motion.aside>
  );
}
