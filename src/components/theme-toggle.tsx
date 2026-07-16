import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useThemeMode } from "@/hooks/use-theme-mode";

/**
 * 主题切换：方形刻度按钮，匹配档案系统美学
 * 切换时临时添加 .theme-transitioning 类使过渡平滑。
 */
export function ThemeToggle(): React.JSX.Element {
  const { t } = useTranslation();
  const { isDark, setPreference } = useThemeMode();

  const handleClick = useCallback((): void => {
    // 临时激活全局 theme transition
    const html = document.documentElement;
    html.classList.add("theme-transitioning");
    setPreference(isDark ? "light" : "dark");
    setTimeout(() => html.classList.remove("theme-transitioning"), 350);
  }, [isDark, setPreference]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("theme.toggleLabel")}
      title={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
      aria-pressed={isDark}
      className="group relative inline-flex h-9 w-9 items-center justify-center border-[1.5px] border-[var(--color-ink)] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] dark:border-[var(--color-paper-3)] dark:text-[var(--color-paper-3)] dark:hover:bg-[var(--color-paper-3)] dark:hover:text-[var(--color-ink)]"
    >
      {/* 角标刻度（4 个小三角） */}
      <span aria-hidden="true" className="absolute left-0.5 top-0.5 text-[6px] leading-none opacity-50">
        ┌
      </span>
      <span aria-hidden="true" className="absolute right-0.5 top-0.5 text-[6px] leading-none opacity-50">
        ┐
      </span>
      <span aria-hidden="true" className="absolute bottom-0.5 left-0.5 text-[6px] leading-none opacity-50">
        └
      </span>
      <span aria-hidden="true" className="absolute bottom-0.5 right-0.5 text-[6px] leading-none opacity-50">
        ┘
      </span>

      {isDark ? (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
