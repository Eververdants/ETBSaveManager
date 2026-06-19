import { useTranslation } from "react-i18next";

import { site } from "@/content/site-content";

/**
 * 顶部细窄元数据条：版本号、构建号、状态、发布日 — 立刻奠定「档案系统」氛围。
 */
export function MetadataStrip(): React.JSX.Element {
  const { t } = useTranslation();
  const status = site.meta.status === "online" ? t("meta.statusOnline") : site.meta.status;
  return (
    <div
      className="relative z-20 border-b border-[var(--color-ink)]/20 bg-[var(--color-ink)] text-[var(--color-paper)] dark:border-[var(--color-paper-3)]/30 dark:bg-[var(--color-paper)] dark:text-[var(--color-ink)]"
      role="presentation"
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] sm:text-[11px]">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="flex items-center gap-1.5">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span
                aria-hidden="true"
                className="absolute inset-0 animate-ping rounded-full bg-[var(--color-accent)] opacity-70"
              />
              <span
                aria-hidden="true"
                className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
              />
            </span>
            <span>
              {t("meta.archive")} {status}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="hidden h-3 w-px bg-[var(--color-paper)]/40 sm:inline-block dark:bg-[var(--color-ink)]/30"
          />
          <span className="hidden tabular-nums sm:inline">v{site.meta.version}</span>
          <span className="hidden tabular-nums sm:inline">
            {t("meta.buildLabel")} {site.meta.build}
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden tabular-nums md:inline">{site.meta.releaseDate}</span>
          <span
            aria-hidden="true"
            className="hidden h-3 w-px bg-[var(--color-paper)]/40 md:inline-block dark:bg-[var(--color-ink)]/30"
          />
          <span className="tabular-nums">{t("meta.localCn")}</span>
        </div>
      </div>
    </div>
  );
}
