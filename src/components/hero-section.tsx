import { useTranslation } from "react-i18next";

import { useCounter } from "@/hooks/use-counter";
import { useIntersection } from "@/hooks/use-intersection";
import { useTypewriter } from "@/hooks/use-typewriter";
import { site } from "@/content/site-content";

/**
 * 首屏：不对称布局，左侧巨型 Fraunces 标题，右侧 FILE_001.SAV 索引卡。
 * 视觉锚点：黄色荧光光晕 + 倾斜的档案卡 + 打字机风格的元数据行。
 *
 * 动效：
 * - 面包屑分类文字打字机效果
 * - version / build 数字滚动动画
 * - ARCHIVED 戳呼吸脉冲
 */
export function HeroSection(): React.JSX.Element {
  const { t } = useTranslation();

  // 用于触发数字动画的 IntersectionObserver
  const { ref: metaRef, isVisible: metaVisible } = useIntersection<HTMLDListElement>({ threshold: 0.3 });
  const countVersion = useCounter(parseInt(site.meta.version.replace(/\./g, ""), 10), 1000, metaVisible);
  const countBuild = useCounter(parseInt(site.meta.build, 10), 800, metaVisible);

  // 打字机：面包屑整行
  const typewriterText = `${t("hero.breadcrumb")}  ·  ${t("common.cat")}  ·  doc // ${site.meta.releaseDate.replace(/-/g, ".")}`;
  const { displayed: typedBreadcrumb, isDone: typewriterDone } = useTypewriter(
    typewriterText,
    28,
    true, // 始终在首屏触发
  );

  return (
    <section id="top" className="relative overflow-hidden px-4 pt-10 pb-24 sm:pt-16 sm:pb-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
        {/* 左：标题与 CTA（占 7 列） */}
        <div className="file-rise lg:col-span-7">
          {/* 顶部：分类戳 + 文件路径（打字机效果） */}
          <div className="mb-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-2)] sm:text-[11px] dark:text-[var(--color-paper-3)]">
            <span className="classification-stamp" style={{ color: "var(--color-alert)" }}>
              {typewriterDone ? (
                t("hero.breadcrumb")
              ) : (
                <span aria-label={t("hero.breadcrumb")}>
                  {typedBreadcrumb || <span className="opacity-30">█</span>}
                </span>
              )}
            </span>
            {typewriterDone && (
              <>
                <span
                  aria-hidden="true"
                  className="hidden h-px w-8 bg-[var(--color-ink-2)] sm:inline-block dark:bg-[var(--color-paper-3)]"
                />
                <span className="hidden sm:inline">{t("common.cat")}</span>
                <span
                  aria-hidden="true"
                  className="hidden h-px w-8 bg-[var(--color-ink-2)] sm:inline-block dark:bg-[var(--color-paper-3)]"
                />
                <span className="tabular-nums hidden sm:inline">doc // {site.meta.releaseDate.replace(/-/g, ".")}</span>
              </>
            )}
            {/* 打字中闪烁光标 */}
            {!typewriterDone && (
              <span
                aria-hidden="true"
                className="inline-block h-3 w-[2px] bg-[var(--color-accent-deep)] dark:bg-[var(--color-accent)]"
              />
            )}
          </div>

          <h1 className="archive-headline text-[clamp(3rem,8.2vw,6.25rem)] text-[var(--color-ink)] dark:text-[var(--color-paper)]">
            <span className="block">
              <span className="dot-monogram" data-text={t("hero.headingPrefix")}>
                {t("hero.headingPrefix")}
              </span>{" "}
            </span>
            <span className="block italic" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0' }}>
              <span className="text-[var(--color-accent-deep)] dark:text-[var(--color-accent)]">
                {t("hero.headingHighlight")}
              </span>
              {t("hero.headingRest")}
              <span
                className="caret text-[var(--color-accent-deep)] dark:text-[var(--color-accent)]"
                aria-hidden="true"
              />
            </span>
          </h1>

          <p
            className="mt-6 max-w-xl font-display text-lg italic text-[var(--color-ink-2)] sm:text-xl dark:text-[var(--color-paper-3)]"
            style={{ fontVariationSettings: '"opsz" 36, "SOFT" 60' }}
          >
            {t("common.tagline")}
            <span className="text-[var(--color-ink-3)] dark:text-[var(--color-ink-3)]"> {t("hero.taglineSuffix")}</span>
          </p>

          {/* 元数据小行（数字动画） */}
          <dl
            ref={metaRef}
            className="mt-6 grid max-w-xl grid-cols-2 gap-x-6 gap-y-2 border-y border-[var(--color-ink)]/15 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-2)] sm:grid-cols-4 dark:border-[var(--color-paper-3)]/15 dark:text-[var(--color-paper-3)]"
          >
            <div>
              <dt className="text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
                {t("hero.meta.version")}
              </dt>
              <dd className="tabular-nums text-[var(--color-ink)] dark:text-[var(--color-paper)]">
                {metaVisible ? <span aria-label={`v${site.meta.version}`}>v{countVersion}</span> : <span>v0</span>}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">{t("hero.meta.build")}</dt>
              <dd className="tabular-nums text-[var(--color-ink)] dark:text-[var(--color-paper)]">
                {metaVisible ? <span aria-label={`# ${site.meta.build}`}># {countBuild}</span> : <span># 0</span>}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
                {t("hero.meta.released")}
              </dt>
              <dd className="tabular-nums text-[var(--color-ink)] dark:text-[var(--color-paper)]">
                {site.meta.releaseDate}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
                {t("hero.meta.platform")}
              </dt>
              <dd className="text-[var(--color-ink)] dark:text-[var(--color-paper)]">{t("hero.meta.platformValue")}</dd>
            </div>
          </dl>

          {/* CTA 组 */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={site.releasesUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="group relative inline-flex h-12 items-center gap-2 bg-[var(--color-ink)] px-5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-paper)] transition-all hover:bg-[var(--color-accent)] hover:text-[var(--color-ink)] dark:bg-[var(--color-accent)] dark:text-[var(--color-ink)] dark:hover:bg-[var(--color-accent-soft)]"
            >
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 bg-[var(--color-accent)] group-hover:bg-[var(--color-ink)] dark:bg-[var(--color-ink)]"
              />
              <span>{t("hero.ctaDownload")}</span>
              <span aria-hidden="true" className="ml-1">
                →
              </span>
            </a>
            <a
              href={site.githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={t("hero.ctaGithubAria")}
              className="inline-flex h-12 items-center gap-2 border-[1.5px] border-[var(--color-ink)] px-5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] dark:border-[var(--color-paper-3)] dark:text-[var(--color-paper-3)] dark:hover:bg-[var(--color-paper-3)] dark:hover:text-[var(--color-ink)]"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.73.5.67 5.56.67 11.83c0 5.02 3.25 9.27 7.76 10.77.57.1.78-.25.78-.55v-2.13c-3.16.69-3.83-1.35-3.83-1.35-.52-1.31-1.27-1.66-1.27-1.66-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.52-.29-5.17-1.26-5.17-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.16.91-.25 1.89-.38 2.86-.39.97 0 1.95.13 2.86.39 2.18-1.47 3.14-1.16 3.14-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.8 1.17 3.04 0 4.35-2.65 5.31-5.18 5.59.41.36.77 1.05.77 2.13v3.16c0 .31.21.66.79.55 4.5-1.5 7.75-5.75 7.75-10.77C23.33 5.56 18.27.5 12 .5z" />
              </svg>
              <span>{t("hero.ctaGithub")}</span>
            </a>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-3)] sm:inline dark:text-[var(--color-paper-3)]/60">
              {t("hero.latestStable")}
            </span>
          </div>
        </div>

        {/* 右：FILE_001.SAV 索引卡（占 5 列） */}
        <div className="file-rise lg:col-span-5" style={{ animationDelay: "120ms" }}>
          <div className="mx-auto max-w-md lg:ml-auto">
            <SaveIndexCard />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 倾斜的档案索引卡：黄色胶带 + 黑色机打 + 红色分类戳
 */
function SaveIndexCard(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="relative [transform:rotate(-1.6deg)]">
      {/* 黄色胶带 */}
      <div
        aria-hidden="true"
        className="fluoro absolute -top-3 left-12 z-20 h-5 w-32 -rotate-6 bg-[var(--color-accent)] shadow-[0_2px_0_0_rgba(0,0,0,0.18)]"
      />
      <div
        aria-hidden="true"
        className="fluoro absolute -top-2 right-10 z-20 h-5 w-24 rotate-3 bg-[var(--color-accent)] shadow-[0_2px_0_0_rgba(0,0,0,0.18)]"
        style={{ animationDelay: "1.4s" }}
      />

      {/* 卡片主体 */}
      <article
        className="relative z-10 border-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper)] shadow-[8px_8px_0_0_var(--color-ink)] transition-shadow hover:shadow-[10px_10px_0_0_var(--color-accent-deep)] dark:border-[var(--color-paper-3)] dark:bg-[#15110d] dark:shadow-[8px_8px_0_0_var(--color-paper-3)] dark:hover:shadow-[10px_10px_0_0_var(--color-accent)]"
        aria-label={t("hero.card.aria")}
      >
        {/* 顶部：档案编号 + 状态 */}
        <header className="flex items-center justify-between border-b-[1.5px] border-[var(--color-ink)] px-4 py-2.5 dark:border-[var(--color-paper-3)]">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink)] dark:text-[var(--color-paper)]">
            {t("hero.card.file")}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-term-soft)]">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-term-soft)]" />
            {t("hero.card.archivedBadge")}
          </span>
        </header>

        {/* 中部：标题 + 元数据 */}
        <div className="px-5 py-5">
          <p
            className="font-display text-[28px] font-medium leading-[1.05] tracking-tight text-[var(--color-ink)] dark:text-[var(--color-paper)]"
            style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30, "WONK" 1' }}
          >
            {t("hero.card.title")}
            <span className="ml-2 inline-block align-middle font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
              {t("hero.card.levelSuffix")}
            </span>
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[10.5px] uppercase tracking-[0.14em]">
            <div>
              <dt className="text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">{t("hero.card.id")}</dt>
              <dd className="tabular-nums text-[var(--color-ink)] dark:text-[var(--color-paper)]">
                {t("hero.card.idValue")}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">{t("hero.card.player")}</dt>
              <dd className="text-[var(--color-ink)] dark:text-[var(--color-paper)]">{t("hero.card.playerValue")}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">{t("hero.card.sanity")}</dt>
              <dd className="flex items-center gap-2 text-[var(--color-ink)] dark:text-[var(--color-paper)]">
                <span
                  aria-hidden="true"
                  className="relative inline-block h-1.5 w-16 overflow-hidden bg-[var(--color-ink-3)]/40"
                >
                  <span className="absolute inset-y-0 left-0 w-[73%] bg-[var(--color-accent-deep)] dark:bg-[var(--color-accent)]" />
                </span>
                <span className="tabular-nums">73%</span>
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">{t("hero.card.size")}</dt>
              <dd className="tabular-nums text-[var(--color-ink)] dark:text-[var(--color-paper)]">
                {t("hero.card.sizeValue")}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
                {t("hero.card.created")}
              </dt>
              <dd className="tabular-nums text-[var(--color-ink)] dark:text-[var(--color-paper)]">
                {site.meta.releaseDate.replace(/-/g, ".")} · 09:13
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">{t("hero.card.items")}</dt>
              <dd className="tabular-nums text-[var(--color-ink)] dark:text-[var(--color-paper)]">
                {t("hero.card.itemsValue")}
              </dd>
            </div>
          </dl>

          {/* 标签行 */}
          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            <span className="classification-stamp" style={{ color: "var(--color-ink)" }}>
              {t("hero.card.tagStandard")}
            </span>
            <span className="classification-stamp" style={{ color: "var(--color-term-soft)" }}>
              {t("hero.card.tagHidden")}
            </span>
            <span className="classification-stamp" style={{ color: "var(--color-alert)" }}>
              {t("hero.card.tagClassII")}
            </span>
          </div>
        </div>

        {/* 底部：库存缩略 + 状态条 */}
        <div className="border-t-[1.5px] border-[var(--color-ink)] px-4 py-3 dark:border-[var(--color-paper-3)]">
          <div className="mb-2 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
            <span>{t("hero.card.inventory")}</span>
            <span className="tabular-nums">[ ▰▰▰▰▰▰▰▰▰▰▰▰ ▱▱▱▱▱▱▱▱▱▱▱▱ ]</span>
          </div>
          <div className="grid grid-cols-12 gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                aria-hidden="true"
                className="aspect-square border border-[var(--color-ink)]/30 bg-[var(--color-accent)]/40 transition-colors hover:border-[var(--color-accent)] dark:border-[var(--color-paper-3)]/30 dark:bg-[var(--color-accent)]/30 dark:hover:border-[var(--color-accent-soft)]"
                style={{ background: i === 4 ? "var(--color-accent)" : undefined }}
              />
            ))}
          </div>
        </div>
      </article>

      {/* 红色 ARCHIVED 戳（旋转、虚线边、呼吸脉冲） */}
      <div
        aria-hidden="true"
        className="stamp-pulse pointer-events-none absolute -bottom-4 -right-2 z-30 select-none border-[2px] border-dashed border-[var(--color-alert)] px-2.5 py-1 font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--color-alert)]"
      >
        {t("hero.card.stamp")}
      </div>
    </div>
  );
}
