/**
 * 分组导航项（带二级菜单）
 *
 * 两种形态：
 * - 展开态：点击一级项，二级菜单以手风琴方式内联展开
 * - 折叠态：hover 一级项，二级菜单以浮出面板展示（安全区见 SafeAreaOverlay）
 */
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";

import { EASE, type NavChild, type NavGroup } from "../../constants";
import { useAppStore } from "../../stores";
import { cn } from "../../utils";
import type { SidebarFlyoutProps } from "./SidebarItem";

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

export default function SidebarGroupItem({
  entry,
  activeFlyout,
  openFlyout,
  closeFlyout,
  onPanelMount,
}: SidebarFlyoutProps & { entry: NavGroup }) {
  const { t } = useTranslation();
  const location = useLocation();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const [open, setOpen] = useState(false);

  const containsActive = entry.children.some((c) => c.path === location.pathname);

  const prevCollapsed = useRef(collapsed);
  const savedOpen = useRef(false);

  // 折叠时记住展开态，展开后恢复（含当前路由所在分组）
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

  const panelCallbackRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (isFlyoutActive) onPanelMount(el);
    },
    [isFlyoutActive, onPanelMount]
  );

  return (
    <div className="relative w-full">
      {collapsed && (
        <div
          className="absolute inset-0 z-10"
          onMouseEnter={(e) => openFlyout(entry.labelKey, e.currentTarget)}
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
          transition={{ duration: 0.12, ease: EASE.OUT }}
          className="ml-2.5 whitespace-nowrap overflow-hidden"
        >
          {label}
        </motion.span>
        <motion.span
          animate={{
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : "auto",
          }}
          transition={{ duration: 0.12, ease: EASE.OUT }}
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
        transition={{ duration: 0.18, ease: EASE.OUT }}
        style={{ display: "grid", gridTemplateRows: "0fr", overflow: "hidden" }}
      >
        <div style={{ minHeight: 0 }}>
          <div className="mt-0.5 space-y-0.5">
            <GroupChildren group={entry} />
          </div>
        </div>
      </motion.div>

      {collapsed && (
        <div
          ref={panelCallbackRef}
          onMouseEnter={() =>
            openFlyout(entry.labelKey, document.activeElement as HTMLElement)
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
          <GroupChildren group={entry} flyout />
        </div>
      )}
    </div>
  );
}
