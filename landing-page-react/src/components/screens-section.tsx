import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useIntersection } from "@/hooks/use-intersection";
import { site } from "@/content/site-content";

type ScreenMock = {
  id: string;
  title: string;
  description: string;
  fig: string;
};

/**
 * 三个真实应用界面截图：Home 存档列表、Create 创建向导 Step1、Edit 编辑面板
 * 截图来自 docs/ 目录的真实应用渲染，根据当前语言自动切换 en/zh 版本。
 *
 * 动效：
 * - 滚动触发 reveal
 * - 自动轮播 spotlight（每 4s 切换高亮卡片）
 * - 左右箭头手动切换
 * - 非活跃卡片微淡出，活跃卡片亮边框呼吸
 */
export function ScreensSection(): React.JSX.Element {
  const { t } = useTranslation();
  const { ref: sectionRef, isVisible } = useIntersection({ threshold: 0.05 });

  const screens: ReadonlyArray<ScreenMock> = [
    {
      id: "home",
      title: t("screens.home.title"),
      description: t("screens.home.description"),
      fig: "fig. 01",
    },
    {
      id: "create",
      title: t("screens.create.title"),
      description: t("screens.create.description", {
        levels: site.meta.levelCount,
        endings: site.meta.endingCount,
      }),
      fig: "fig. 02",
    },
    {
      id: "edit",
      title: t("screens.edit.title"),
      description: t("screens.edit.description", { slots: site.meta.inventorySlotCount }),
      fig: "fig. 03",
    },
  ];

  const [activeScreen, setActiveScreen] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef(isAutoPlaying);
  autoPlayRef.current = isAutoPlaying;

  // 自动轮播
  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => {
      if (autoPlayRef.current) {
        setActiveScreen((prev) => (prev + 1) % screens.length);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [screens.length, isVisible]);

  const goToScreen = useCallback((idx: number) => {
    setIsAutoPlaying(false);
    setActiveScreen(idx);
  }, []);

  const goToPrev = useCallback(() => {
    setIsAutoPlaying(false);
    setActiveScreen((prev) => (prev - 1 + screens.length) % screens.length);
  }, [screens.length]);

  const goToNext = useCallback(() => {
    setIsAutoPlaying(false);
    setActiveScreen((prev) => (prev + 1) % screens.length);
  }, [screens.length]);

  return (
    <section
      id="screens"
      ref={sectionRef}
      data-visible={isVisible ? "true" : undefined}
      className="relative border-y-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper-2)] px-4 py-20 sm:py-28 dark:border-[var(--color-paper-3)] dark:bg-[#0a0907]"
    >
      {/* 顶部：标记条 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-7 items-center gap-2 border-b border-[var(--color-ink)]/15 px-4 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--color-ink-2)] dark:border-[var(--color-paper-3)]/15 dark:text-[var(--color-paper-3)]/70">
        <span>{t("screens.section.plate")}</span>
        <span aria-hidden="true">|</span>
        <span>{t("screens.section.plateSubline")}</span>
        <span aria-hidden="true" className="ml-auto">
          {t("screens.section.plateTech")}
        </span>
      </div>

      <div className="mx-auto max-w-[1400px] pt-6">
        {/* 标题区 */}
        <header className="reveal-on-scroll mb-12 grid grid-cols-1 gap-6 border-b-[1.5px] border-[var(--color-ink)] pb-6 sm:mb-16 sm:pb-8 dark:border-[var(--color-paper-3)] lg:grid-cols-12">
          <div className="lg:col-span-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
              {t("screens.section.index")}
            </span>
            <h2 className="mt-1 archive-headline text-4xl text-[var(--color-ink)] sm:text-5xl dark:text-[var(--color-paper)]">
              <span className="block">{t("screens.section.titleA")}</span>
              <span className="block italic text-[var(--color-ink-2)] dark:text-[var(--color-paper-3)]">
                {t("screens.section.titleB")}
              </span>
            </h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-4">
            <p
              className="max-w-xl font-display text-lg italic text-[var(--color-ink-2)] sm:text-xl dark:text-[var(--color-paper-3)]"
              style={{ fontVariationSettings: '"opsz" 36, "SOFT" 60' }}
            >
              {t("screens.section.intro")}
              <span className="text-[var(--color-ink-3)] dark:text-[var(--color-ink-3)]">
                {" "}
                {t("screens.section.introSuffix")}
              </span>
            </p>
          </div>
        </header>

        {/* 轮播控制按钮 */}
        <div className="stagger-children mb-4 flex items-center justify-end gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
            {String(activeScreen + 1).padStart(2, "0")} / {String(screens.length).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={goToPrev}
            aria-label="Previous screen"
            className="inline-flex h-7 w-7 items-center justify-center border border-[var(--color-ink)]/30 text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] dark:border-[var(--color-paper-3)]/30 dark:text-[var(--color-paper-3)]/70 dark:hover:border-[var(--color-paper-3)] dark:hover:text-[var(--color-paper)]"
          >
            <svg
              viewBox="0 0 16 16"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M10 3l-5 5 5 5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goToNext}
            aria-label="Next screen"
            className="inline-flex h-7 w-7 items-center justify-center border border-[var(--color-ink)]/30 text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] dark:border-[var(--color-paper-3)]/30 dark:text-[var(--color-paper-3)]/70 dark:hover:border-[var(--color-paper-3)] dark:hover:text-[var(--color-paper)]"
          >
            <svg
              viewBox="0 0 16 16"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
        </div>

        {/* 卡片网格 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {screens.map((screen, idx) => (
            <article
              key={screen.id}
              data-testid="screen-card"
              aria-label={screen.title}
              className={`reveal-on-scroll group cursor-pointer transition-all duration-500 ${
                idx === activeScreen ? "opacity-100" : "opacity-60 hover:opacity-90"
              }`}
              style={{ transitionDelay: `${idx * 80}ms` }}
              onClick={() => goToScreen(idx)}
              role="tab"
              aria-selected={idx === activeScreen}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") goToScreen(idx);
              }}
            >
              {/* 顶部编号条 */}
              <div className="mb-2 flex items-baseline justify-between border-b border-dashed border-[var(--color-ink)]/30 pb-1.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--color-ink-3)] dark:border-[var(--color-paper-3)]/30 dark:text-[var(--color-paper-3)]/60">
                <span>{screen.fig}</span>
                <span className="tabular-nums">pl. {String(idx + 1).padStart(2, "0")} / 03</span>
              </div>
              <div className={idx === activeScreen ? "glow-border" : ""}>
                <ScreenMock id={screen.id} />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--color-ink)] sm:text-xl dark:text-[var(--color-paper)]">
                  {screen.title}
                </h3>
                <span
                  aria-hidden="true"
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-3)] group-hover:text-[var(--color-accent-deep)] dark:text-[var(--color-paper-3)]/60 dark:group-hover:text-[var(--color-accent)]"
                >
                  view ↗
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-ink-2)] dark:text-[var(--color-paper-3)]/80">
                {screen.description}
              </p>
            </article>
          ))}
        </div>

        {/* 指示点 */}
        <div className="mt-6 flex items-center justify-center gap-2" role="tablist" aria-label="Screen navigation">
          {screens.map((_, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={idx === activeScreen}
              aria-label={`Screen ${idx + 1}`}
              onClick={() => goToScreen(idx)}
              className={`h-1.5 transition-all duration-300 ${
                idx === activeScreen
                  ? "w-6 bg-[var(--color-accent-deep)] dark:bg-[var(--color-accent)]"
                  : "w-3 bg-[var(--color-ink-3)]/30 hover:bg-[var(--color-ink-3)]/60 dark:bg-[var(--color-paper-3)]/30 dark:hover:bg-[var(--color-paper-3)]/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ScreenMock({ id }: { id: string }): React.JSX.Element {
  const { t, i18n } = useTranslation();

  const lang = i18n.language.startsWith("zh") ? "zh" : "en";

  // public/ 目录下的资源发布到 base 根路径，需用 BASE_URL 拼接以兼容子目录部署
  const base = import.meta.env.BASE_URL;
  const imageMap: Record<string, string> = {
    home: `${base}screens/存档列表-${lang === "zh" ? "zh" : "en"}.jpg`,
    create: `${base}screens/创建存档页面第一步-${lang === "zh" ? "zh" : "en"}.jpg`,
    edit: `${base}screens/编辑页面-${lang === "zh" ? "zh" : "en"}.jpg`,
  };

  return (
    <div className="relative overflow-hidden border-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper)] shadow-[6px_6px_0_0_var(--color-ink)] transition-all duration-300 group-hover:scale-[1.01] group-hover:shadow-[8px_8px_0_0_var(--color-ink)] dark:border-[var(--color-paper-3)] dark:bg-[#15110d] dark:shadow-[6px_6px_0_0_var(--color-paper-3)] dark:group-hover:shadow-[8px_8px_0_0_var(--color-paper-3)]">
      <img src={imageMap[id]} alt={t(`screens.${id}.title`)} className="block h-auto w-full" loading="lazy" />
    </div>
  );
}
