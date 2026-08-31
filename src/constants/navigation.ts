/**
 * 侧边栏导航配置
 *
 * 结构：一级菜单（叶子或分组）+ 二级菜单
 * 文案通过 i18n key（nav 命名空间）解析，图标使用 lucide-react
 */
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Compass,
  Database,
  Gamepad2,
  Home,
  LayoutDashboard,
  User,
  MoreHorizontal,
  Package,
  PenLine,
  Plus,
  Puzzle,
  RefreshCw,
  Settings,
  Star,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react";

/** 二级菜单项 */
export interface NavChild {
  /** 路由路径 */
  path: string;
  /** i18n key，位于 nav 命名空间下，如 "saves-all" */
  labelKey: string;
  icon: LucideIcon;
}

/** 一级导航项：无二级菜单的叶子节点 */
export interface NavLeaf {
  kind: "leaf";
  path: string;
  labelKey: string;
  icon: LucideIcon;
}

/** 一级导航项：带二级菜单的分组 */
export interface NavGroup {
  kind: "group";
  /** 分组默认跳转路径（点击分组图标时的目标路由） */
  path: string;
  labelKey: string;
  icon: LucideIcon;
  children: NavChild[];
}

export type NavEntry = NavLeaf | NavGroup;

/** 主导航配置（顺序即展示顺序） */
export const NAV_ENTRIES: NavEntry[] = [
  { kind: "leaf", path: "/", labelKey: "home", icon: Home },
  {
    kind: "group",
    path: "/saves/all",
    labelKey: "saves",
    icon: Archive,
    children: [
      { path: "/saves/all", labelKey: "saves-all", icon: LayoutDashboard },
      { path: "/saves/favorites", labelKey: "saves-favorites", icon: Star },
      { path: "/saves/trash", labelKey: "saves-trash", icon: Trash2 },
      { path: "/saves/create", labelKey: "saves-create", icon: Plus },
    ],
  },
  {
    kind: "group",
    path: "/games/overview",
    labelKey: "games",
    icon: Gamepad2,
    children: [
      { path: "/games/overview", labelKey: "games-overview", icon: LayoutDashboard },
      { path: "/games/edit", labelKey: "games-edit", icon: PenLine },
    ],
  },
  {
    kind: "group",
    path: "/mods/installed",
    labelKey: "mods",
    icon: Puzzle,
    children: [
      { path: "/mods/installed", labelKey: "mods-installed", icon: Package },
      { path: "/mods/browse", labelKey: "mods-browse", icon: Compass },
      { path: "/mods/updates", labelKey: "mods-updates", icon: RefreshCw },
    ],
  },
  {
    kind: "group",
    path: "/tools/game-data",
    labelKey: "tools",
    icon: Wrench,
    children: [
      { path: "/tools/game-data", labelKey: "tools-game-data", icon: Database },
      { path: "/tools/realtime", labelKey: "tools-realtime", icon: Zap },
      { path: "/tools/more", labelKey: "tools-more", icon: MoreHorizontal },
    ],
  },
  { kind: "leaf", path: "/login", labelKey: "login", icon: User },
  { kind: "leaf", path: "/settings", labelKey: "settings", icon: Settings },
];

/** 根据当前路径查找所属的一级菜单（用于标题栏面包屑与分组高亮；支持子路由前缀匹配） */
export function findNavEntryByPath(pathname: string): NavEntry | undefined {
  return NAV_ENTRIES.find((entry) => {
    if (entry.kind === "leaf") return entry.path === pathname;
    return entry.children.some((c) => pathname === c.path || pathname.startsWith(c.path + "/"));
  });
}

/** 根据当前路径查找所属的二级菜单项（子路由按前缀匹配其所属项） */
export function findNavChildByPath(pathname: string): NavChild | undefined {
  const entry = findNavEntryByPath(pathname);
  if (!entry || entry.kind === "leaf") return undefined;
  return (
    entry.children.find((c) => c.path === pathname) ??
    entry.children.find((c) => pathname.startsWith(c.path + "/"))
  );
}
