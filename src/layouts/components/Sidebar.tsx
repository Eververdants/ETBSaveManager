/**
 * 侧边栏组件
 * 包含：一级导航项、二级菜单、安全区覆盖层
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";

import {
  NAV_ENTRIES,
  UI_CONFIG,
  type NavChild,
  type NavEntry,
  type NavGroup,
} from "../../constants";
import { useAppStore } from "../../stores";
import { cn } from "../../utils";

const BOTTOM_LABEL_KEYS = new Set(["login", "settings"]);

// 预先计算 top/bottom 分组，避免每次渲染重新 filter
const TOP_ENTRIES = NAV_ENTRIES.filter((e) => !BOTTOM_LABEL_KEYS.has(e.labelKey));
const BOTTOM_ENTRIES = NAV_ENTRIES.filter((e) => BOTTOM_LABEL_KEYS.has(e.labelKey));

// ============================================
// 二级菜单项
// ============================================
function SubmenuLink({
  child,
  variant,
}: {
  child: NavChild;
  variant: "accordion" | "flyout";
}) {
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
              isActive
                ? "text-[var(--color-shell-icon-active)]"
                : "text-[var(--color-shell-icon)]"
            )}
          />
          <span className="whitespace-nowrap overflow-hidden">
            {t(`nav.${child.labelKey}`)}
          </span>
        </>
      )}
    </NavLink>
  );
}

function GroupChildren({
  group,
  flyout,
}: {
  group: NavGroup;
  flyout?: boolean;
}) {
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

    let rafId: number | null = null;
    const calc = () => {
      if (rafId !== null) return; // 节流：同一帧内只执行一次
      rafId = requestAnimationFrame(() => {
        rafId = null;
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
      });
    };

    calc();
    window.addEventListener("resize", calc);
    return () => {
      window.removeEventListener("resize", calc);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
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
    entry.kind === "group" &&
    entry.children.some((c) => c.path === location.pathname);

  const prevCollapsed = useRef(collapsed);
  const savedOpen = useRef(false);

  useLayoutEffect(() => {
    const wasCollapsed = prevCollapsed.current;
    prevCollapsed.current = collapsed;

    if (collapsed) {
      savedOpen.current = open;
      setOpen(false);
      return;
    }
    if (wasCollapsed) {
      const shouldOpen = savedOpen.current || containsActive;
      setOpen(false);
      if (shouldOpen) {
        const id = requestAnimationFrame(() => setOpen(true));
        return () => cancelAnimationFrame(id);
      }
      return;
    }
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

  // ---- 分组项 ----
  if (isGroup) {
    return (
      <div className="relative w-full">
        {collapsed && (
          <div
            className="absolute inset-0 z-10"
            onMouseEnter={(e) =>
              openFlyout(entry.labelKey, e.currentTarget)
            }
            onMouseLeave={closeFlyout}
          />
        )}
        <button
          type="button"
          onClick={collapsed ? undefined : () => setOpen((v) => !v)}
          aria-expanded={open}
          title={label}
          className={cn(
            "relative flex w-full items-center rounded-lg pl-2.5 py-2.5 text-[13px] transition-all duration-150 ease-out",
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
              containsActive
                ? "text-[var(--color-shell-icon-active)]"
                : "text-[var(--color-shell-icon)]"
            )}
          />
          <motion.span
            animate={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : "auto",
            }}
            transition={{ duration: 0.12, ease: [0.2, 0, 0, 1] }}
            className="ml-2.5 whitespace-nowrap overflow-hidden"
          >
            {label}
          </motion.span>
          <motion.span
            animate={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : "auto",
            }}
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
            onMouseEnter={() =>
              openFlyout(
                entry.labelKey,
                document.activeElement as HTMLElement
              )
            }
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
            <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-[var(--color-shell-text-muted)]">
              {label}
            </p>
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
              isActive
                ? "text-[var(--color-shell-icon-active)]"
                : "text-[var(--color-shell-icon)]"
            )}
          />
          <motion.span
            animate={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : "auto",
            }}
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
export default function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const sidebarRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

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

  const safeAreaTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

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

  return (
    <motion.aside
      ref={sidebarRef}
      animate={{
        width: collapsed
          ? UI_CONFIG.SIDEBAR_COLLAPSED_WIDTH
          : UI_CONFIG.SIDEBAR_WIDTH,
      }}
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
          collapsed
            ? "overflow-visible"
            : "overflow-y-auto overflow-x-hidden"
        )}
      >
        <ul className="space-y-1 pt-1.5">
          {TOP_ENTRIES.map((entry) => (
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
          {BOTTOM_ENTRIES.map((entry) => (
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
