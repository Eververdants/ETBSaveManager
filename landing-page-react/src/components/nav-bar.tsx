import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { site } from "@/content/site-content";

/**
 * 导航条：档案柜标签 + 文件路径面包屑 + 语言/主题切换
 */
export function NavBar(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-30 w-full border-b-[1.5px] border-[var(--color-ink)]/90 bg-[var(--color-paper)]/90 backdrop-blur-md dark:border-[var(--color-paper-3)]/60 dark:bg-[#0a0907]/90">
      <div className="border-b border-[var(--color-ink)]/15 dark:border-[var(--color-paper-3)]/15">
        <nav aria-label="Main" className="mx-auto flex h-14 max-w-[1400px] items-stretch justify-between px-4">
          {/* 左：品牌 + 面包屑 */}
          <div className="flex items-stretch gap-0">
            <a
              href="#top"
              className="group relative flex items-center px-3 pr-5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink)] dark:text-[var(--color-paper)]"
            >
              {/* 黄色 tab 角标 */}
              <span aria-hidden="true" className="absolute left-0 top-0 h-full w-1.5 bg-[var(--color-accent)]" />
              <span className="font-display text-[15px] font-semibold tracking-tight">{site.name}</span>
            </a>
            <nav
              aria-label="Breadcrumb"
              className="hidden items-center gap-2 border-l border-[var(--color-ink)]/15 pl-4 text-[11px] font-mono uppercase tracking-[0.14em] text-[var(--color-ink-2)] md:flex dark:text-[var(--color-paper-3)] dark:border-[var(--color-paper-3)]/15"
            >
              <a href="#top" className="hover:text-[var(--color-ink)] dark:hover:text-[var(--color-paper)]">
                {t("common.root")}
              </a>
              <span aria-hidden="true">/</span>
              <a href="#features" className="hover:text-[var(--color-ink)] dark:hover:text-[var(--color-paper)]">
                {t("common.archive")}
              </a>
              <span aria-hidden="true">/</span>
              <a href="#download" className="hover:text-[var(--color-ink)] dark:hover:text-[var(--color-paper)]">
                {t("common.obtain")}
              </a>
            </nav>
          </div>

          {/* 右：操作 */}
          <div className="flex items-center gap-1.5">
            <a
              href={site.githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={t("common.sourceAriaLabel")}
              className="inline-flex h-9 items-center gap-1.5 border border-transparent px-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] dark:text-[var(--color-paper-3)] dark:hover:border-[var(--color-paper-3)] dark:hover:text-[var(--color-paper)]"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.73.5.67 5.56.67 11.83c0 5.02 3.25 9.27 7.76 10.77.57.1.78-.25.78-.55v-2.13c-3.16.69-3.83-1.35-3.83-1.35-.52-1.31-1.27-1.66-1.27-1.66-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.52-.29-5.17-1.26-5.17-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.16.91-.25 1.89-.38 2.86-.39.97 0 1.95.13 2.86.39 2.18-1.47 3.14-1.16 3.14-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.8 1.17 3.04 0 4.35-2.65 5.31-5.18 5.59.41.36.77 1.05.77 2.13v3.16c0 .31.21.66.79.55 4.5-1.5 7.75-5.75 7.75-10.77C23.33 5.56 18.27.5 12 .5z" />
              </svg>
              <span>{t("common.source")}</span>
            </a>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </nav>
      </div>
      {/* 副栏：分类信息 */}
      <div className="mx-auto hidden h-7 max-w-[1400px] items-center justify-between gap-4 px-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-2)] md:flex dark:text-[var(--color-paper-3)]">
        <span className="flex items-center gap-2">
          <span className="classification-stamp" style={{ color: "var(--color-alert)" }}>
            Class II
          </span>
          <span>{t("common.declassifiedSubline")}</span>
        </span>
        <span className="flex items-center gap-3">
          <span>{t("common.cat")}</span>
          <span aria-hidden="true">|</span>
          <span>win / x86_64 / arm64</span>
        </span>
      </div>
    </header>
  );
}
