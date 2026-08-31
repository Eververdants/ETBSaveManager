/**
 * 创建模式选择页（master SelectCreateMode → /saves/create）
 * 两张卡片：经典模式（三步向导） / 快速模式（批量创建）
 */
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft, Layers, Zap } from "lucide-react";

export default function CreateModePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const modes = [
    {
      key: "classic",
      icon: Layers,
      path: "/saves/create/custom",
      accent: "var(--color-primary)",
    },
    {
      key: "quick",
      icon: Zap,
      path: "/saves/create/quick",
      accent: "var(--color-success)",
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-5 py-2.5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
        >
          <ChevronLeft size={14} />
          {t("common.back")}
        </button>
        <h1 className="text-sm font-semibold text-[var(--color-text-primary)]">{t("createMode.title")}</h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-10">
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">{t("createMode.title")}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{t("createMode.subtitle")}</p>
        </div>

        <div className="grid w-full max-w-2xl grid-cols-2 gap-4">
          {modes.map((mode, index) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.key}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.08 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(mode.path)}
                className="group flex flex-col items-center gap-4 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-bg-elevated)] p-8 text-center shadow-[0_2px_8px_var(--color-shadow)] transition-colors hover:border-[var(--color-border-strong)]"
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: "var(--color-primary-subtle)", color: mode.accent }}
                >
                  <Icon size={26} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                    {t(`createMode.${mode.key}.title`)}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
                    {t(`createMode.${mode.key}.desc`)}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
