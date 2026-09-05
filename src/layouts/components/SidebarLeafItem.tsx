/**
 * 叶子导航项（无二级菜单）
 */
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";

import type { NavLeaf } from "../../constants";
import { EASE } from "../../constants";
import { useAppStore } from "../../stores";
import { cn } from "../../utils";

export default function SidebarLeafItem({ entry }: { entry: NavLeaf }) {
  const { t } = useTranslation();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const Icon = entry.icon;
  const label = t(`nav.${entry.labelKey}`);

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
            transition={{ duration: 0.2, ease: EASE.OUT }}
            className="ml-2.5 whitespace-nowrap overflow-hidden"
          >
            {label}
          </motion.span>
        </>
      )}
    </NavLink>
  );
}
