/**
 * 一级导航项 — 按类型分发到叶子 / 分组实现
 */
import type { NavEntry } from "../../constants";
import SidebarGroupItem from "./SidebarGroupItem";
import SidebarLeafItem from "./SidebarLeafItem";

/** 浮出面板（flyout）相关的共享状态与回调，由 Sidebar 持有 */
export interface SidebarFlyoutProps {
  activeFlyout: string | null;
  openFlyout: (key: string, trigger: HTMLElement) => void;
  closeFlyout: () => void;
  onPanelMount: (el: HTMLElement | null) => void;
}

export interface SidebarItemProps extends SidebarFlyoutProps {
  entry: NavEntry;
}

export default function SidebarItem(props: SidebarItemProps) {
  const { entry, ...flyout } = props;

  return entry.kind === "group" ? (
    <SidebarGroupItem entry={entry} {...flyout} />
  ) : (
    <SidebarLeafItem entry={entry} />
  );
}
