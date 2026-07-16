import { useTranslation } from "react-i18next";

import { site } from "@/content/site-content";

/**
 * 下载 section：文件调拨单风格 — 三个 Windows 平台档案盒。
 * 链接 textContent 等于 `t(\`download.labels.${download.id}\`)`（en-US 默认下等于 site.downloads[i].label）
 */
export function DownloadSection(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <section id="download" className="relative px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px]">
        {/* 标题区 */}
        <header className="mb-12 grid grid-cols-1 gap-6 border-b-[1.5px] border-[var(--color-ink)] pb-6 sm:mb-16 sm:pb-8 dark:border-[var(--color-paper-3)] lg:grid-cols-12">
          <div className="lg:col-span-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
              {t("download.section.index")}
            </span>
            <h2 className="mt-1 archive-headline text-4xl text-[var(--color-ink)] sm:text-5xl dark:text-[var(--color-paper)]">
              <span className="block">{t("download.section.titleA")}</span>
              <span className="block italic text-[var(--color-ink-2)] dark:text-[var(--color-paper-3)]">
                {t("download.section.titleB")}
              </span>
            </h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-4">
            <p
              className="max-w-xl font-display text-lg italic text-[var(--color-ink-2)] sm:text-xl dark:text-[var(--color-paper-3)]"
              style={{ fontVariationSettings: '"opsz" 36, "SOFT" 60' }}
            >
              {t("download.section.intro")}
              <span className="text-[var(--color-ink-3)] dark:text-[var(--color-ink-3)]">
                {" "}
                {t("download.section.introSuffix")}
              </span>
            </p>
            <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
              {t("download.section.buildLine", {
                version: site.meta.version,
                build: site.meta.build,
                date: site.meta.releaseDate,
              })}
            </p>
          </div>
        </header>

        {/* 下载卡片网格 */}
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {site.downloads.map((download, idx) => {
            const label = t(`download.labels.${download.id}`);
            return (
              <li key={download.id} className="file-rise" style={{ animationDelay: `${idx * 70}ms` }}>
                <article className="group relative h-full border-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper)] p-5 shadow-[4px_4px_0_0_var(--color-ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-accent-deep)] dark:border-[var(--color-paper-3)] dark:bg-[#15110d] dark:shadow-[4px_4px_0_0_var(--color-paper-3)] dark:hover:shadow-[6px_6px_0_0_var(--color-accent)]">
                  {/* 顶部：标签 + 编号 */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
                        {t("download.section.filePrefix")} {String(idx + 1).padStart(2, "0")}
                      </div>
                      <h3 className="mt-1 font-display text-2xl font-semibold leading-none tracking-tight text-[var(--color-ink)] dark:text-[var(--color-paper)]">
                        {label}
                      </h3>
                    </div>
                    <span
                      aria-hidden="true"
                      className="classification-stamp"
                      style={{ color: "var(--color-term-soft)" }}
                    >
                      v{site.meta.version}
                    </span>
                  </div>

                  {/* 平台图标 + 元数据 */}
                  <div className="mb-5 flex items-end gap-3 border-b border-dashed border-[var(--color-ink)]/25 pb-4 dark:border-[var(--color-paper-3)]/25">
                    <WindowsMark />
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em]">
                      <div>
                        <dt className="text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
                          {t("download.section.arch")}
                        </dt>
                        <dd className="tabular-nums text-[var(--color-ink)] dark:text-[var(--color-paper)]">
                          {download.arch}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
                          {t("download.section.size")}
                        </dt>
                        <dd className="tabular-nums text-[var(--color-ink)] dark:text-[var(--color-paper)]">
                          {download.size}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
                          {t("download.section.build")}
                        </dt>
                        <dd className="tabular-nums text-[var(--color-ink)] dark:text-[var(--color-paper)]">
                          #{site.meta.build}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
                          {t("download.section.type")}
                        </dt>
                        <dd className="text-[var(--color-ink)] dark:text-[var(--color-paper)]">{download.format}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* 下载按钮 — 链接 textContent 等于 label（用于测试） */}
                  <a
                    href={download.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group/btn flex h-10 items-center justify-between gap-2 bg-[var(--color-ink)] px-3 text-[var(--color-paper)] transition-colors group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-ink)] dark:bg-[var(--color-paper-3)] dark:text-[var(--color-ink)] dark:group-hover:bg-[var(--color-accent)]"
                  >
                    <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em]">
                      <DownloadIcon />
                      <span>{label}</span>
                    </span>
                    <ArrowRight />
                  </a>

                  {/* 红色 STAMP 角标 */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-2 -top-2 select-none border-[1.5px] border-dashed border-[var(--color-alert)] bg-[var(--color-paper)] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-alert)] [transform:rotate(4deg)] dark:bg-[#15110d]"
                  >
                    {t("download.section.ready")}
                  </span>
                </article>
              </li>
            );
          })}
        </ul>

        {/* 底部说明 */}
        <div className="mt-10 grid grid-cols-1 gap-3 border-t border-dashed border-[var(--color-ink)]/20 pt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-2)] sm:grid-cols-3 dark:border-[var(--color-paper-3)]/20 dark:text-[var(--color-paper-3)]/70">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-term-soft)]" />
            {t("download.section.sha")}
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-term-soft)]" />
            {t("download.section.noTelemetry")}
          </span>
          <span className="flex items-center gap-2 sm:justify-end">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-term-soft)]" />
            {t("download.section.mit")}
          </span>
        </div>
      </div>
    </section>
  );
}

function WindowsMark(): React.JSX.Element {
  // 内联 Windows 风格 mark（4 块旗形），1.5px 描边版本
  return (
    <svg
      viewBox="0 0 24 24"
      width="36"
      height="36"
      fill="currentColor"
      className="flex-shrink-0 text-[var(--color-ink)] dark:text-[var(--color-paper)]"
      aria-hidden="true"
    >
      <path d="M3 5.5 11 4v8H3zM12 4l9-1.5V12h-9zM3 13h8v7L3 18.5zM12 13h9v8.5L12 20z" />
    </svg>
  );
}

function DownloadIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

function ArrowRight(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
