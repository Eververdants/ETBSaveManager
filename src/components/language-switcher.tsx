import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { LANGUAGE_META, SUPPORTED_LANGUAGES } from "@/i18n";
import { useLocale } from "@/hooks/use-locale";

/**
 * 语言切换器：3 段档案柜 tab 风按钮。
 * - 桌面端：并排 3 段短码（EN / 中 / 繁）
 * - 移动端：折叠为下拉（同一组件中通过 popover 实现）
 */
export function LanguageSwitcher(): React.JSX.Element {
  const { t } = useTranslation();
  const { current, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // 外部点击关闭 popover
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent): void => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={popoverRef} className="relative">
      {/* 桌面端：3 段 tab 按钮（与档案系统视觉一致） */}
      <div
        role="group"
        aria-label={t("lang.label")}
        className="hidden h-9 items-stretch border-[1.5px] border-[var(--color-ink)] font-mono text-[10.5px] uppercase tracking-[0.16em] dark:border-[var(--color-paper-3)] sm:flex"
      >
        {SUPPORTED_LANGUAGES.map((lng) => {
          const active = lng === current;
          return (
            <button
              key={lng}
              type="button"
              onClick={() => setLocale(lng)}
              aria-pressed={active}
              aria-label={`${t("lang.label")} · ${LANGUAGE_META[lng].label}`}
              title={LANGUAGE_META[lng].label}
              className={`inline-flex h-full items-center px-2 transition-colors ${
                active
                  ? "bg-[var(--color-ink)] text-[var(--color-paper)] dark:bg-[var(--color-accent)] dark:text-[var(--color-ink)]"
                  : "text-[var(--color-ink-2)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] dark:text-[var(--color-paper-3)] dark:hover:bg-[var(--color-paper-3)] dark:hover:text-[var(--color-ink)]"
              }`}
            >
              {LANGUAGE_META[lng].shortLabel}
            </button>
          );
        })}
      </div>

      {/* 移动端：下拉式 */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t("lang.label")}
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center border-[1.5px] border-[var(--color-ink)] text-[var(--color-ink-2)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] dark:border-[var(--color-paper-3)] dark:text-[var(--color-paper-3)] dark:hover:bg-[var(--color-paper-3)] dark:hover:text-[var(--color-ink)] sm:hidden"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.16em]">{LANGUAGE_META[current].shortLabel}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[120px] border-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper)] font-mono text-[11px] uppercase tracking-[0.16em] dark:border-[var(--color-paper-3)] dark:bg-[#0a0907]"
        >
          {SUPPORTED_LANGUAGES.map((lng) => {
            const active = lng === current;
            return (
              <button
                key={lng}
                role="menuitem"
                type="button"
                onClick={() => {
                  setLocale(lng);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-1.5 text-left transition-colors ${
                  active
                    ? "bg-[var(--color-ink)] text-[var(--color-paper)] dark:bg-[var(--color-accent)] dark:text-[var(--color-ink)]"
                    : "text-[var(--color-ink-2)] hover:bg-[var(--color-ink)]/10 dark:text-[var(--color-paper-3)] dark:hover:bg-[var(--color-paper-3)]/10"
                }`}
              >
                {LANGUAGE_META[lng].label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
