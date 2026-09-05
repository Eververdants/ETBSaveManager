/**
 * 整理入口 — 右下角浮动按钮，点击时把按钮位置交给页面菜单实例向上弹出
 */
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";

export default function OrganizeMenuButton({
  onOpen,
}: {
  onOpen: (rect: DOMRect) => void;
}) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={(e) => onOpen(e.currentTarget.getBoundingClientRect())}
      className="absolute bottom-5 right-5 z-20 flex h-9 select-none items-center gap-1.5 rounded-full border border-[var(--color-border-light)] bg-[var(--color-bg-elevated)] px-4 text-[12.5px] font-medium text-[var(--color-text-primary)] shadow-[0_8px_24px_var(--color-shadow-lg)] transition-all duration-150 ease-out hover:border-[var(--color-border-strong)] hover:shadow-[0_12px_32px_-8px_var(--color-shadow-lg)] active:scale-95"
    >
      <Sparkles size={14} className="text-[var(--color-primary)]" />
      {t("organizer.title")}
    </button>
  );
}
