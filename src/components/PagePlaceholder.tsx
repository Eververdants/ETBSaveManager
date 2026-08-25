/**
 * 页面占位组件
 * 路由页面尚未实现时展示，避免空白内容区
 */
import { motion } from "motion/react";
import { Construction } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PagePlaceholderProps {
  /** i18n key，位于 nav 命名空间下 */
  labelKey: string;
}

export default function PagePlaceholder({ labelKey }: PagePlaceholderProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex h-full flex-col items-center justify-center gap-4"
      style={{ color: "var(--color-text-muted)" }}
    >
      <motion.div
        animate={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
      >
        <Construction size={36} strokeWidth={1.5} className="opacity-40" />
      </motion.div>
      <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{t(`nav.${labelKey}`)}</p>
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}...</p>
    </motion.div>
  );
}
