/**
 * 右键菜单 — portal 渲染 + 视口内钳制 + 一级子菜单 + 危险项 / 快捷键 / 勾选
 *
 * 配套 useContextMenu()：调用方持有唯一实例，页面 / 卡片 / 按钮弹出
 * 共用同一个菜单状态，避免多个菜单同时叠开。
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "../../utils";

export interface ContextMenuItem {
  /** 分隔线（其余字段忽略） */
  separator?: boolean;
  label?: string;
  icon?: LucideIcon;
  /** 右侧快捷键标注，如 "Ctrl+Z" */
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  /** 左侧勾选标记（替代 icon 位置显示） */
  checked?: boolean;
  /** 一级子菜单（悬停展开，不支持嵌套） */
  children?: ContextMenuItem[];
  onSelect?: () => void;
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuState extends ContextMenuPosition {
  items: ContextMenuItem[];
}

interface SubmenuState {
  items: ContextMenuItem[];
  x: number;
  y: number;
}

/** 页面级右键菜单状态管理：open 接受鼠标事件或坐标 */
export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const open = useCallback(
    (source: ContextMenuPosition | React.MouseEvent, items: ContextMenuItem[]) => {
      const mouse = source as React.MouseEvent;
      if (typeof mouse.clientX === "number" && typeof mouse.clientY === "number") {
        mouse.preventDefault();
        setMenu({ x: mouse.clientX, y: mouse.clientY, items });
        return;
      }
      setMenu({ ...(source as ContextMenuPosition), items });
    },
    []
  );

  const close = useCallback(() => setMenu(null), []);

  return { menu, open, close };
}

const PANEL_CLASS = cn(
  "pointer-events-auto overflow-visible rounded-lg border border-[var(--color-border-light)]",
  "bg-[var(--color-bg-elevated)] p-1 shadow-[0_8px_24px_var(--color-shadow-lg)]"
);

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export default function ContextMenu({
  menu,
  onClose,
}: {
  menu: ContextMenuState | null;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const submenuCloseTimer = useRef<number | null>(null);
  const [pos, setPos] = useState<ContextMenuPosition | null>(null);
  const [submenu, setSubmenu] = useState<SubmenuState | null>(null);

  // 每次打开重置位置与子菜单
  useEffect(() => {
    setPos(menu ? { x: menu.x, y: menu.y } : null);
    setSubmenu(null);
  }, [menu]);

  // 主面板视口内钳制（右溢出左移、下溢出上移）
  useLayoutEffect(() => {
    if (!menu || !pos || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const x = pos.x + rect.width > window.innerWidth - 8
      ? clamp(window.innerWidth - rect.width - 8, 8, pos.x)
      : pos.x;
    const y = pos.y + rect.height > window.innerHeight - 8
      ? clamp(window.innerHeight - rect.height - 8, 8, pos.y)
      : pos.y;
    if (x !== pos.x || y !== pos.y) setPos({ x, y });
  }, [menu, pos]);

  // 子菜单视口内钳制：默认展开在父项右侧，放不下换左侧
  useLayoutEffect(() => {
    if (!submenu || !submenuRef.current || !rootRef.current) return;
    const rect = submenuRef.current.getBoundingClientRect();
    const mainRect = rootRef.current.getBoundingClientRect();
    let { x, y } = submenu;
    if (x + rect.width > window.innerWidth - 8) {
      x = Math.max(8, mainRect.left - rect.width + 4);
    }
    if (y + rect.height > window.innerHeight - 8) {
      y = window.innerHeight - rect.height - 8;
    }
    if (x !== submenu.x || y !== submenu.y) setSubmenu((s) => (s ? { ...s, x, y } : s));
  }, [submenu]);

  // 打开期间：Esc 关闭、点击外部关闭、滚动 / 窗口缩放关闭
  useEffect(() => {
    if (!menu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!rootRef.current?.contains(target) && !submenuRef.current?.contains(target)) {
        onClose();
      }
    };
    const onScrollOrResize = () => onClose();
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [menu, onClose]);

  useEffect(
    () => () => {
      if (submenuCloseTimer.current !== null) window.clearTimeout(submenuCloseTimer.current);
    },
    []
  );

  const openSubmenuFor = (item: ContextMenuItem, anchor: HTMLElement) => {
    if (submenuCloseTimer.current !== null) {
      window.clearTimeout(submenuCloseTimer.current);
      submenuCloseTimer.current = null;
    }
    const rect = anchor.getBoundingClientRect();
    setSubmenu({ items: item.children ?? [], x: rect.right - 4, y: rect.top - 4 });
  };

  // 悬停普通项后延迟收起子菜单，给斜向移动到子菜单留出路径
  const scheduleSubmenuClose = () => {
    if (submenuCloseTimer.current !== null) window.clearTimeout(submenuCloseTimer.current);
    submenuCloseTimer.current = window.setTimeout(() => setSubmenu(null), 150);
  };

  const renderItem = (item: ContextMenuItem, inSubmenu: boolean, index: number) => {
    if (item.separator) {
      return <div key={`sep-${index}`} className="mx-2 my-1 h-px bg-[var(--color-border-light)]" />;
    }
    const Icon = item.icon;
    return (
      <button
        key={`${index}-${item.label}`}
        type="button"
        role="menuitem"
        disabled={item.disabled}
        onClick={() => {
          if (item.disabled || item.children) return;
          item.onSelect?.();
          onClose();
        }}
        onMouseEnter={(e) => {
          if (inSubmenu) return;
          if (item.children && !item.disabled) openSubmenuFor(item, e.currentTarget);
          else scheduleSubmenuClose();
        }}
        className={cn(
          "flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] transition-colors duration-100",
          item.disabled
            ? "cursor-not-allowed opacity-40"
            : "hover:bg-[var(--color-bg-muted)]",
          item.danger
            ? "text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]"
            : "text-[var(--color-text-primary)]"
        )}
      >
        {item.checked ? (
          <Check size={14} className="shrink-0 text-[var(--color-primary)]" />
        ) : (
          Icon && <Icon size={14} className="shrink-0 opacity-75" />
        )}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.shortcut && (
          <span className="shrink-0 text-[11px] tabular-nums text-[var(--color-text-muted)]">
            {item.shortcut}
          </span>
        )}
        {item.children && (
          <ChevronRight size={13} className="shrink-0 text-[var(--color-text-muted)]" />
        )}
      </button>
    );
  };

  return createPortal(
    <>
      <AnimatePresence>
        {menu && pos && (
          <motion.div
            key="ctx-menu"
            ref={rootRef}
            role="menu"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.12, ease: [0.2, 0, 0, 1] }}
            className={cn(PANEL_CLASS, "fixed z-[110] min-w-[200px] max-w-[300px]")}
            style={{ left: pos.x, top: pos.y, transformOrigin: "top left" }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {menu.items.map((item, i) => renderItem(item, false, i))}
          </motion.div>
        )}
      </AnimatePresence>

      {submenu && (
        <div
          ref={submenuRef}
          role="menu"
          className={cn(PANEL_CLASS, "fixed z-[111] min-w-[180px] max-w-[280px]")}
          style={{ left: submenu.x, top: submenu.y }}
          onContextMenu={(e) => e.preventDefault()}
          onMouseEnter={() => {
            if (submenuCloseTimer.current !== null) {
              window.clearTimeout(submenuCloseTimer.current);
              submenuCloseTimer.current = null;
            }
          }}
          onMouseLeave={() => setSubmenu(null)}
        >
          {submenu.items.map((item, i) => renderItem(item, true, i))}
        </div>
      )}
    </>,
    document.body
  );
}
