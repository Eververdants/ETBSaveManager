import { useTranslation } from "react-i18next";

import { site } from "@/content/site-content";

/**
 * 页脚：打字机戳 + 字母表式链接列 + 版权登记式署名
 */
export function FooterSection(): React.JSX.Element {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer
      id="footer"
      className="relative border-t-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper-2)] px-4 pt-12 pb-8 dark:border-[var(--color-paper-3)] dark:bg-[#08070a]"
    >
      <div className="mx-auto max-w-[1400px]">
        {/* 主行 */}
        <div className="grid grid-cols-1 gap-10 border-b border-[var(--color-ink)]/15 pb-10 sm:grid-cols-12 dark:border-[var(--color-paper-3)]/15">
          {/* 左：巨型品牌署名 */}
          <div className="sm:col-span-7">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
              {t("footer.section")}
            </div>
            <p
              className="archive-headline text-[clamp(2.5rem,5vw,4.25rem)] leading-[0.92] text-[var(--color-ink)] dark:text-[var(--color-paper)]"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 0, "WONK" 0' }}
              aria-hidden="true"
            >
              E<span className="text-[var(--color-accent-deep)] dark:text-[var(--color-accent)]">·</span>T
              <span className="text-[var(--color-accent-deep)] dark:text-[var(--color-accent)]">·</span>B
              <span className="ml-3 inline-block font-mono text-[12px] uppercase tracking-[0.3em] text-[var(--color-ink-3)] align-middle sm:text-[14px] dark:text-[var(--color-paper-3)]/60">
                {t("footer.edition")}
              </span>
            </p>
            <p
              className="mt-4 max-w-md font-display text-base italic text-[var(--color-ink-2)] dark:text-[var(--color-paper-3)]"
              style={{ fontVariationSettings: '"opsz" 24, "SOFT" 60' }}
            >
              {t("footer.taglineA")}
              <span className="text-[var(--color-ink-3)] dark:text-[var(--color-ink-3)]"> {t("footer.taglineB")}</span>
            </p>
          </div>

          {/* 右：链接列 */}
          <nav aria-label="Footer" className="sm:col-span-5">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
              {t("footer.index")}
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em]">
              <li>
                <a
                  href={site.releasesUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-baseline gap-2 text-[var(--color-ink)] hover:text-[var(--color-accent-deep)] dark:text-[var(--color-paper)] dark:hover:text-[var(--color-accent)]"
                >
                  <span className="tabular-nums text-[10px] text-[var(--color-ink-3)] group-hover:text-[var(--color-accent-deep)] dark:text-[var(--color-paper-3)]/60 dark:group-hover:text-[var(--color-accent)]">
                    01
                  </span>
                  <span>{t("footer.releases")}</span>
                </a>
              </li>
              <li>
                <a
                  href={`${site.githubUrl}/blob/main/LICENSE`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-baseline gap-2 text-[var(--color-ink)] hover:text-[var(--color-accent-deep)] dark:text-[var(--color-paper)] dark:hover:text-[var(--color-accent)]"
                >
                  <span className="tabular-nums text-[10px] text-[var(--color-ink-3)] group-hover:text-[var(--color-accent-deep)] dark:text-[var(--color-paper-3)]/60 dark:group-hover:text-[var(--color-accent)]">
                    02
                  </span>
                  <span>{t("footer.license")}</span>
                </a>
              </li>
              <li>
                <a
                  href={site.githubUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-baseline gap-2 text-[var(--color-ink)] hover:text-[var(--color-accent-deep)] dark:text-[var(--color-paper)] dark:hover:text-[var(--color-accent)]"
                >
                  <span className="tabular-nums text-[10px] text-[var(--color-ink-3)] group-hover:text-[var(--color-accent-deep)] dark:text-[var(--color-paper-3)]/60 dark:group-hover:text-[var(--color-accent)]">
                    03
                  </span>
                  <span>{t("footer.source")}</span>
                </a>
              </li>
              <li>
                <a
                  href={`${site.githubUrl}/issues`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-baseline gap-2 text-[var(--color-ink)] hover:text-[var(--color-accent-deep)] dark:text-[var(--color-paper)] dark:hover:text-[var(--color-accent)]"
                >
                  <span className="tabular-nums text-[10px] text-[var(--color-ink-3)] group-hover:text-[var(--color-accent-deep)] dark:text-[var(--color-paper-3)]/60 dark:group-hover:text-[var(--color-accent)]">
                    04
                  </span>
                  <span>{t("footer.issues")}</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* 元数据行：版权 + 戳 */}
        <div className="flex flex-col items-start gap-3 pt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-3)] sm:flex-row sm:items-center sm:justify-between sm:gap-6 dark:text-[var(--color-paper-3)]/70">
          <p className="tabular-nums">{t("footer.copyright", { year, name: site.name })}</p>
          <p className="tabular-nums">
            {t("footer.buildLine", {
              version: site.meta.version,
              build: site.meta.build,
              date: site.meta.releaseDate,
            })}
          </p>
          <p className="tabular-nums">
            {t("footer.madeWith")} <span className="text-[var(--color-alert)]">♥</span> · {t("footer.heart")}
          </p>
        </div>
      </div>

      {/* 底部装饰：长 ASCII 边线 */}
      <div
        aria-hidden="true"
        className="mt-8 overflow-hidden font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/40"
      >
        <div className="mx-auto max-w-[1400px] whitespace-nowrap">
          ──────────────────── · · · · · · ──────────────────── · · · · · · ──────────────────── · · · · · ·
          ────────────────────
        </div>
      </div>
    </footer>
  );
}
