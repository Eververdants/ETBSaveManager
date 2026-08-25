/**
 * 应用外壳布局：标题栏 + 侧边栏合二为一
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  Copy,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Square,
  X,
} from "lucide-react";

import {
  NAV_ENTRIES,
  UI_CONFIG,
  findNavEntryByPath,
  type NavChild,
  type NavEntry,
  type NavGroup,
} from "../constants";
import { useAppStore } from "../stores";
import { cn } from "../utils";

const BOTTOM_LABEL_KEYS = new Set(["login", "settings"]);
const IS_TAURI = "__TAURI_INTERNALS__" in window;

// ============================================
// 窗口控制
// ============================================
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

function WindowControls() {
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

// ============================================
// 标题栏（与侧边栏一体化，共用外壳变量）
// ============================================
function TitleBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { t } = useTranslation();
  const location = useLocation();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);

  const entry = findNavEntryByPath(location.pathname);
  let locationText = "";
  if (entry) {
    if (entry.kind === "leaf") {
      locationText = t(`nav.${entry.labelKey}`);
    } else {
      const child = entry.children.find((c) => c.path === location.pathname);
      locationText = `${t(`nav.${entry.labelKey}`)} · ${child ? t(`nav.${child.labelKey}`) : ""}`;
    }
  }

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

      <div className="ml-auto flex h-full items-stretch">
        <WindowControls />
      </div>
    </header>
  );
}

// ============================================
// 二级菜单项
// ============================================
function SubmenuLink({ child, variant }: { child: NavChild; variant: "accordion" | "flyout" }) {
  const { t } = useTranslation();
  const Icon = child.icon;

  return (
    <NavLink
      to={child.path}
      title={t(`nav.${child.labelKey}`)}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-lg py-1.5 text-[12px] transition-all duration-150",
          variant === "accordion" ? "pl-[34px] pr-2.5" : "px-2.5",
          isActive
            ? "bg-[var(--color-shell-item-active)] font-medium text-[var(--color-shell-text-active)] shadow-sm"
            : "text-[var(--color-shell-text)] hover:bg-[var(--color-shell-item-hover)] hover:text-[var(--color-shell-text-active)]"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={13}
            className={cn(
              "shrink-0 transition-colors duration-150",
              isActive ? "text-[var(--color-shell-icon-active)]" : "text-[var(--color-shell-icon)]"
            )}
          />
          <span className="whitespace-nowrap overflow-hidden">{t(`nav.${child.labelKey}`)}</span>
        </>
      )}
    </NavLink>
  );
}

function GroupChildren({ group, flyout }: { group: NavGroup; flyout?: boolean }) {
  return (
    <ul className={cn("space-y-0.5", flyout && "p-1.5")}>
      {group.children.map((child) => (
        <li key={child.path}>
          <SubmenuLink child={child} variant={flyout ? "flyout" : "accordion"} />
        </li>
      ))}
    </ul>
  );
}

// ============================================
// 安全区 SVG 覆盖层
// 四边形：trigger 右边缘 ↔ panel 左边缘
// ============================================
function SafeAreaOverlay({
  sidebarEl,
  triggerEl,
  panelEl,
  onEnter,
  onLeave,
}: {
  sidebarEl: HTMLElement | null;
  triggerEl: HTMLElement | null;
  panelEl: HTMLElement | null;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const [points, setPoints] = useState("");

  useEffect(() => {
    if (!sidebarEl || !triggerEl || !panelEl) {
      setPoints("");
      return;
    }

    const calc = () => {
      const sb = sidebarEl.getBoundingClientRect();
      const t = triggerEl.getBoundingClientRect();
      const p = panelEl.getBoundingClientRect();
      const pts = [
        [t.right - sb.left - 6, t.top - sb.top],
        [t.right - sb.left - 12, t.bottom - sb.top],
        [p.left - sb.left, p.bottom - sb.top],
        [p.left - sb.left, p.top - sb.top],
      ];
      setPoints(pts.map(([x, y]) => `${x},${y}`).join(" "));
    };

    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [sidebarEl, triggerEl, panelEl]);

  if (!points) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[60]"
      style={{ width: "100%", height: "100%" }}
      aria-hidden="true"
    >
      <polygon
        points={points}
        style={{ fill: "transparent" }}
        className="pointer-events-auto"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      />
    </svg>
  );
}

// ============================================
// 一级导航项
// ============================================
function SidebarItem({
  entry,
  activeFlyout,
  openFlyout,
  closeFlyout,
  onPanelMount,
}: {
  entry: NavEntry;
  activeFlyout: string | null;
  openFlyout: (key: string, trigger: HTMLElement) => void;
  closeFlyout: () => void;
  onPanelMount: (el: HTMLElement | null) => void;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const [open, setOpen] = useState(false);

  const containsActive =
    entry.kind === "group" && entry.children.some((c) => c.path === location.pathname);

  const prevCollapsed = useRef(collapsed);
  const savedOpen = useRef(false);

  useLayoutEffect(() => {
    const wasCollapsed = prevCollapsed.current;
    prevCollapsed.current = collapsed;

    // 侧边栏收起：记住当前状态，关闭手风琴
    if (collapsed) {
      savedOpen.current = open;
      setOpen(false);
      return;
    }
    // 侧边栏展开：恢复收起前的状态
    if (wasCollapsed) {
      const shouldOpen = savedOpen.current || containsActive;
      setOpen(false);
      if (shouldOpen) {
        const id = requestAnimationFrame(() => setOpen(true));
        return () => cancelAnimationFrame(id);
      }
      return;
    }
    // 正常导航：有活跃子路由就展开
    if (containsActive) setOpen(true);
  }, [containsActive, collapsed]);

  const Icon = entry.icon;
  const label = t(`nav.${entry.labelKey}`);
  const isFlyoutActive = activeFlyout === entry.labelKey;
  const isGroup = entry.kind === "group";
  const group = isGroup ? (entry as NavGroup) : null;

  const panelCallbackRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (isFlyoutActive) onPanelMount(el);
    },
    [isFlyoutActive, onPanelMount]
  );

  // ---- 分组项：单一 DOM 结构 ----
  if (isGroup) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={collapsed ? undefined : () => setOpen((v) => !v)}
          onMouseEnter={collapsed ? (e) => openFlyout(entry.labelKey, e.currentTarget) : undefined}
          onMouseLeave={collapsed ? closeFlyout : undefined}
          aria-expanded={open}
          title={label}
          className={cn(
            "flex w-full items-center rounded-lg pl-2.5 py-2.5 text-[13px] transition-all duration-150 ease-out",
            containsActive || (collapsed && isFlyoutActive)
              ? "bg-[var(--color-shell-item-active)] font-medium text-[var(--color-shell-text-active)] shadow-sm"
              : "text-[var(--color-shell-text)] hover:bg-[var(--color-shell-item-hover)] hover:text-[var(--color-shell-text-active)]",
            "active:scale-[0.97]"
          )}
        >
          <Icon
            size={17}
            className={cn(
              "shrink-0 transition-colors duration-150",
              containsActive ? "text-[var(--color-shell-icon-active)]" : "text-[var(--color-shell-icon)]"
            )}
          />
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
            transition={{ duration: 0.12, ease: [0.2, 0, 0, 1] }}
            className="ml-2.5 whitespace-nowrap overflow-hidden"
          >
            {label}
          </motion.span>
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
            transition={{ duration: 0.12, ease: [0.2, 0, 0, 1] }}
            className="ml-auto mr-2.5 shrink-0 overflow-hidden"
          >
            <ChevronDown
              size={13}
              className={cn(
                "text-[var(--color-shell-text-muted)] transition-transform duration-200 ease-out",
                open && "rotate-180"
              )}
            />
          </motion.span>
        </button>

        <motion.div
          animate={{ gridTemplateRows: open ? "1fr" : "0fr" }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          style={{ display: "grid", gridTemplateRows: "0fr", overflow: "hidden" }}
        >
          <div style={{ minHeight: 0 }}>
            <div className="mt-0.5 space-y-0.5">
              <GroupChildren group={group!} />
            </div>
          </div>
        </motion.div>

        {collapsed && (
          <div
            ref={panelCallbackRef}
            onMouseEnter={() => openFlyout(entry.labelKey, document.activeElement as HTMLElement)}
            onMouseLeave={closeFlyout}
            className={cn(
              "absolute left-full ml-3 top-0 z-50 min-w-[150px]",
              "rounded-xl backdrop-blur-md",
              "shadow-strong",
              "transition-all duration-200 ease-out",
              isFlyoutActive
                ? "visible opacity-100 pointer-events-auto"
                : "invisible opacity-0 pointer-events-none"
            )}
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border-light)",
            }}
          >
            <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-[var(--color-shell-text-muted)]">{label}</p>
            <GroupChildren group={group!} flyout />
          </div>
        )}
      </div>
    );
  }

  // ---- 叶子节点 ----
  return (
    <NavLink
      to={entry.path}
      end={entry.path === "/"}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center rounded-lg pl-2.5 py-2.5 text-[13px] transition-all duration-150 ease-out",
          isActive
            ? "bg-[var(--color-shell-item-active)] font-medium text-[var(--color-shell-text-active)] shadow-sm"
            : "text-[var(--color-shell-text)] hover:bg-[var(--color-shell-item-hover)] hover:text-[var(--color-shell-text-active)]",
          "active:scale-[0.97]"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={17}
            className={cn(
              "shrink-0 transition-colors duration-150",
              isActive ? "text-[var(--color-shell-icon-active)]" : "text-[var(--color-shell-icon)]"
            )}
          />
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="ml-2.5 whitespace-nowrap overflow-hidden"
          >
            {label}
          </motion.span>
        </>
      )}
    </NavLink>
  );
}

// ============================================
// 侧边栏
// ============================================
function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const sidebarRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const [triggerEl, setTriggerEl] = useState<HTMLElement | null>(null);
  const [panelEl, setPanelEl] = useState<HTMLElement | null>(null);

  const openFlyout = useCallback((key: string, trigger: HTMLElement) => {
    clearTimeout(closeTimer.current);
    setActiveFlyout(key);
    setTriggerEl(trigger);
  }, []);

  const closeFlyout = useCallback(() => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setActiveFlyout(null);
      setTriggerEl(null);
      setPanelEl(null);
    }, 150);
  }, []);

  const cancelClose = useCallback(() => {
    clearTimeout(closeTimer.current);
  }, []);

  const safeAreaTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const safeAreaEnter = useCallback(() => {
    clearTimeout(closeTimer.current);
    clearTimeout(safeAreaTimer.current);
    safeAreaTimer.current = setTimeout(() => {
      setActiveFlyout(null);
      setTriggerEl(null);
      setPanelEl(null);
    }, 150);
  }, []);

  const safeAreaLeave = useCallback(() => {
    clearTimeout(safeAreaTimer.current);
  }, []);

  const onPanelMount = useCallback((el: HTMLElement | null) => {
    setPanelEl(el);
  }, []);

  useEffect(() => {
    setActiveFlyout(null);
    setTriggerEl(null);
    setPanelEl(null);
    clearTimeout(closeTimer.current);
  }, [collapsed]);

  const topEntries = NAV_ENTRIES.filter((e) => !BOTTOM_LABEL_KEYS.has(e.labelKey));
  const bottomEntries = NAV_ENTRIES.filter((e) => BOTTOM_LABEL_KEYS.has(e.labelKey));

  return (
    <motion.aside
      ref={sidebarRef}
      animate={{ width: collapsed ? UI_CONFIG.SIDEBAR_COLLAPSED_WIDTH : UI_CONFIG.SIDEBAR_WIDTH }}
      transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
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
          {topEntries.map((entry) => (
            <li key={entry.labelKey}>
              <SidebarItem
                entry={entry}
                activeFlyout={activeFlyout}
                openFlyout={openFlyout}
                closeFlyout={closeFlyout}
                onPanelMount={onPanelMount}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 px-2.5 pb-1 pt-2">
        <ul className="space-y-1">
          {bottomEntries.map((entry) => (
            <li key={entry.labelKey}>
              <SidebarItem
                entry={entry}
                activeFlyout={activeFlyout}
                openFlyout={openFlyout}
                closeFlyout={closeFlyout}
                onPanelMount={onPanelMount}
              />
            </li>
          ))}
        </ul>
      </div>
    </motion.aside>
  );
}

// ============================================
// 应用外壳
// ============================================
export default function AppShell() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden"
      style={{ backgroundColor: "var(--color-shell-bg)" }}
    >
      <TitleBar onToggleSidebar={toggleSidebar} />

      <div className="flex min-h-0 flex-1">
        <Sidebar />

        <main
          className="min-w-0 flex-1 overflow-y-auto rounded-t-lg rounded-l-lg"
          style={{
            backgroundColor: "var(--color-bg-primary)",
            color: "var(--color-text-primary)",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
