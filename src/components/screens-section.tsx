import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useIntersection } from "@/hooks/use-intersection";
import { site } from "@/content/site-content";

type ScreenMock = {
  id: string;
  title: string;
  description: string;
  fig: string;
};

/** Simple SVG icons for ending tab labels */
function renderEndingIcon(type: string): ReactNode {
  const cls = "h-3 w-3";
  switch (type) {
    case "trophy":
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M4 2h8v1.5a4 4 0 01-8 0V2z" />
          <path d="M7 6v1h2V6H7z" />
          <path d="M5.5 12l1 2h3l1-2H5.5z" />
        </svg>
      );
    case "search":
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" />
          <line x1="10.5" y1="10.5" x2="14" y2="14" />
        </svg>
      );
    case "microscope":
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <rect x="6.5" y="2" width="1" height="7" rx="0.5" />
          <circle cx="7" cy="2" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 10h4l-1 2.5H6L5 10z" />
        </svg>
      );
    case "star":
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <polygon points="8,1.5 10,6 15,6 11,9.5 12.5,14 8,11 3.5,14 5,9.5 1,6 6,6" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * 三个真实界面 mock：Home 列表、Create 3 步向导 Step1、Edit 玩家面板
 * 标题/描述由 i18n 提供；fig 编号和编号格式保持档案风不变。
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
  const { t } = useTranslation();
  return (
    <div className="relative overflow-hidden border-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper)] shadow-[6px_6px_0_0_var(--color-ink)] transition-all duration-300 group-hover:scale-[1.01] group-hover:shadow-[8px_8px_0_0_var(--color-ink)] dark:border-[var(--color-paper-3)] dark:bg-[#15110d] dark:shadow-[6px_6px_0_0_var(--color-paper-3)] dark:group-hover:shadow-[8px_8px_0_0_var(--color-paper-3)]">
      {/* 标题栏：macOS 风格交通灯 + 路径 + 元数据 */}
      <div className="flex items-center gap-1.5 border-b-[1.5px] border-[var(--color-ink)] bg-[var(--color-ink)] px-2.5 py-1.5 dark:border-[var(--color-paper-3)] dark:bg-[var(--color-paper-3)]">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-[8.5px] uppercase tracking-[0.18em] text-[var(--color-paper)] dark:text-[var(--color-ink)]">
          {id === "home" && t("screens.home.windowTitle")}
          {id === "create" && t("screens.create.windowTitle")}
          {id === "edit" && t("screens.edit.windowTitle")}
        </span>
        <span
          aria-hidden="true"
          className="ml-auto font-mono text-[8.5px] uppercase tracking-[0.16em] text-[var(--color-paper)]/70 dark:text-[var(--color-ink)]/70"
        >
          {id === "home" && t("screens.home.archives", { count: 8 })}
          {id === "create" && t("screens.create.levelsCount", { count: site.meta.levelCount })}
          {id === "edit" && t("screens.edit.playersCount")}
        </span>
      </div>
      <div className="p-2.5">
        {id === "home" && <HomeMock />}
        {id === "create" && <CreateMock />}
        {id === "edit" && <EditMock />}
      </div>
    </div>
  );
}

/* ==================== fig. 01 — Home (Archive List) ==================== */

function HomeMock(): React.JSX.Element {
  const { t } = useTranslation();
  // 4 列 × 2 行 卡片网格 = 8 个存档，1 个高亮，1 个多选态
  const cards: ReadonlyArray<{
    name: string;
    level: keyof typeof LEVEL_TONE;
    diff: keyof typeof DIFF_TONE;
    size: string;
    date: string;
    selected?: boolean;
    hidden?: boolean;
  }> = [
    { name: "yellow-hallway", level: "Level0", diff: "NORMAL", size: "2.4mb", date: "06.16", selected: true },
    { name: "top-floor-office", level: "TopFloor", diff: "HARD", size: "3.1mb", date: "06.14" },
    { name: "the-hub-stair", level: "TheHub", diff: "NORMAL", size: "1.8mb", date: "06.12" },
    { name: "poolrooms-2am", level: "Poolrooms", diff: "NIGHTMARE", size: "3.6mb", date: "06.09" },
    { name: "hotel-room-217", level: "Hotel", diff: "EASY", size: "1.6mb", date: "06.04", hidden: true },
    { name: "cave-1am", level: "CaveLevel", diff: "HARD", size: "2.7mb", date: "05.29" },
    { name: "the-end-pt2", level: "TheEnd", diff: "NIGHTMARE", size: "3.4mb", date: "05.21" },
    { name: "lights-out", level: "LightsOut", diff: "NIGHTMARE", size: "2.9mb", date: "05.14" },
  ];
  return (
    <div className="space-y-2">
      {/* 多选工具条（hidden by default, shown when item selected） */}
      <div className="flex items-center gap-1.5 rounded-sm border border-[var(--color-ink)]/20 bg-[var(--color-ink)] px-2 py-1 font-mono text-[8.5px] uppercase tracking-[0.18em] text-[var(--color-paper)] dark:border-[var(--color-paper-3)]/30 dark:bg-[var(--color-accent-deep)] dark:text-[var(--color-ink)]">
        <span>{t("screens.homeTool.back")}</span>
        <span aria-hidden="true">|</span>
        <span>{t("screens.homeTool.selectAll")}</span>
        <span aria-hidden="true">|</span>
        <span>{t("screens.homeTool.invert")}</span>
        <span className="ml-auto tabular-nums">{t("screens.homeTool.counter", { selected: 1, total: 8 })}</span>
        <span
          aria-hidden="true"
          className="rounded-full bg-[var(--color-alert)] px-1 text-[7.5px] text-[var(--color-paper)]"
        >
          {t("screens.homeTool.delete")}
        </span>
      </div>

      {/* 工具栏：搜索 + filter chips */}
      <div className="flex items-center gap-1">
        <div className="flex h-5 flex-1 items-center gap-1 border border-[var(--color-ink)]/25 px-1.5 font-mono text-[8.5px] text-[var(--color-ink-2)] dark:border-[var(--color-paper-3)]/25 dark:text-[var(--color-paper-3)]/70">
          <span aria-hidden="true">⌕</span>
          <span>{t("screens.homeTool.search")}</span>
        </div>
        <MockChip>{t("screens.homeTool.chipLevel")}</MockChip>
        <MockChip>{t("screens.homeTool.chipDiff")}</MockChip>
        <MockChip>{t("screens.homeTool.chipFav")}</MockChip>
      </div>

      {/* 4 列卡片网格 */}
      <div className="grid grid-cols-4 gap-1.5">
        {cards.map((card) => (
          <div
            key={card.name}
            className={`relative overflow-hidden border ${
              card.selected
                ? "border-[1.5px] border-[var(--color-ink)] ring-1 ring-[var(--color-accent)] dark:border-[var(--color-paper-3)]"
                : "border-[var(--color-ink)]/20 dark:border-[var(--color-paper-3)]/20"
            } bg-[var(--color-paper)] dark:bg-[#1a1714]`}
          >
            {/* 关卡色块（替代缩略图） */}
            <div
              className="relative h-8 w-full"
              style={{ background: LEVEL_TONE[card.level]?.tone ?? "#999" }}
              aria-hidden="true"
            >
              {/* 等级标签 */}
              <span className="absolute left-1 top-0.5 bg-[var(--color-ink)]/80 px-1 font-mono text-[7px] uppercase tracking-[0.16em] text-[var(--color-paper)] dark:bg-[var(--color-paper)]/90 dark:text-[var(--color-ink)]">
                {card.level}
              </span>
              {/* 多选 checkbox */}
              {card.selected && (
                <span className="absolute right-1 top-0.5 flex h-2.5 w-2.5 items-center justify-center bg-[var(--color-accent)] text-[7px] font-bold text-[var(--color-ink)]">
                  ✓
                </span>
              )}
              {/* 隐藏标记 */}
              {card.hidden && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0.5 left-1 h-1.5 w-3 border border-[var(--color-paper)]/60 bg-[var(--color-ink)]/40"
                />
              )}
              {/* 难度小色点 */}
              <span
                aria-hidden="true"
                className="absolute bottom-0.5 right-1 h-1.5 w-1.5 rounded-full"
                style={{ background: DIFF_TONE[card.diff] }}
              />
            </div>
            {/* 文字信息 */}
            <div className="px-1.5 py-1">
              <div className="truncate font-mono text-[8.5px] text-[var(--color-ink)] dark:text-[var(--color-paper)]">
                {card.name}
              </div>
              <div className="mt-0.5 flex items-center justify-between font-mono text-[7.5px] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
                <span className="uppercase tracking-[0.14em]">{card.diff}</span>
                <span className="tabular-nums">{card.size}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAB（浮动操作按钮） */}
      <div className="pointer-events-none absolute bottom-3 right-3 flex flex-col items-end gap-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-ink)]/30 bg-[var(--color-paper)] font-mono text-[10px] text-[var(--color-ink-2)] shadow dark:border-[var(--color-paper-3)]/30 dark:bg-[#1a1714] dark:text-[var(--color-paper-3)]/70">
          ⌕
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-[var(--color-ink)] bg-[var(--color-accent)] font-mono text-[14px] font-bold leading-none text-[var(--color-ink)] shadow-[2px_2px_0_0_var(--color-ink)] dark:border-[var(--color-paper-3)] dark:shadow-[2px_2px_0_0_var(--color-paper-3)]">
          +
        </div>
      </div>
    </div>
  );
}

/* ==================== fig. 02 — Create Archive · Step 1 ==================== */

function CreateMock(): React.JSX.Element {
  const { t } = useTranslation();
  // 5 列 × 2 行 关卡网格（10 个），1 个高亮
  // 严格按主项目 main ending 顺序排列
  const levels: ReadonlyArray<{ key: keyof typeof LEVEL_TONE; selected?: boolean }> = [
    { key: "Level0", selected: true },
    { key: "TopFloor" },
    { key: "MiddleFloor" },
    { key: "GarageLevel2" },
    { key: "BottomFloor" },
    { key: "TheHub" },
    { key: "Pipes1" },
    { key: "ElectricalStation" },
    { key: "Office" },
    { key: "Hotel" },
  ];
  return (
    <div className="space-y-2">
      {/* 步骤指示器：3 个 pill */}
      <div className="flex items-center justify-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.2em]">
        {[
          { n: 1, label: t("screens.create.step1"), active: true, done: false },
          { n: 2, label: t("screens.create.step2"), active: false, done: false },
          { n: 3, label: t("screens.create.step3"), active: false, done: false },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-1.5">
            <span
              className={`flex items-center gap-1 border-[1.5px] px-1.5 py-0.5 ${
                s.active
                  ? "border-[var(--color-ink)] bg-[var(--color-accent)] text-[var(--color-ink)] dark:border-[var(--color-paper-3)]"
                  : "border-[var(--color-ink)]/25 text-[var(--color-ink-3)] dark:border-[var(--color-paper-3)]/25 dark:text-[var(--color-paper-3)]/60"
              }`}
            >
              <span className="font-bold">{s.n}</span>
              <span>{s.label}</span>
            </span>
            {i < 2 && (
              <span
                aria-hidden="true"
                className="h-px w-3 bg-[var(--color-ink)]/30 dark:bg-[var(--color-paper-3)]/30"
              />
            )}
          </div>
        ))}
      </div>

      {/* Ending tabs（与主项目 createArchive.endings 对齐） */}
      <div className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.18em]">
        {[
          { icon: "trophy", label: t("screens.create.ending1"), active: true },
          { icon: "search", label: t("screens.create.ending2") },
          { icon: "microscope", label: t("screens.create.ending3") },
          { icon: "star", label: t("screens.create.ending4") },
        ].map((tab) => (
          <span
            key={tab.label}
            className={`inline-flex h-5 items-center gap-1 border px-1.5 ${
              tab.active
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)] dark:border-[var(--color-paper-3)] dark:bg-[var(--color-paper-3)] dark:text-[var(--color-ink)]"
                : "border-[var(--color-ink)]/25 text-[var(--color-ink-2)] dark:border-[var(--color-paper-3)]/25 dark:text-[var(--color-paper-3)]/70"
            }`}
          >
            <span aria-hidden="true">{renderEndingIcon(tab.icon)}</span>
            <span>{tab.label}</span>
          </span>
        ))}
      </div>

      {/* 关卡网格 5x2 */}
      <div className="grid grid-cols-5 gap-1">
        {levels.map((lvl) => {
          const tone = LEVEL_TONE[lvl.key];
          return (
            <div
              key={lvl.key}
              className={`relative overflow-hidden border ${
                lvl.selected
                  ? "border-[1.5px] border-[var(--color-ink)] ring-1 ring-[var(--color-accent)] dark:border-[var(--color-paper-3)]"
                  : "border-[var(--color-ink)]/20 dark:border-[var(--color-paper-3)]/20"
              }`}
            >
              <div
                className="relative aspect-[16/10] w-full"
                style={{ background: tone?.tone ?? "#999", color: tone?.accent ?? "#1a1714" }}
                aria-hidden="true"
              >
                {lvl.selected && (
                  <span className="absolute right-0.5 top-0.5 flex h-2.5 w-2.5 items-center justify-center bg-[var(--color-accent)] text-[7px] font-bold text-[var(--color-ink)]">
                    ✓
                  </span>
                )}
              </div>
              <div className="bg-[var(--color-paper)] px-1 py-0.5 text-center font-mono text-[7.5px] text-[var(--color-ink)] dark:bg-[#1a1714] dark:text-[var(--color-paper)]">
                {lvl.key}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部操作栏 */}
      <div className="flex items-center justify-between border-t border-dashed border-[var(--color-ink)]/25 pt-1.5 font-mono text-[8px] uppercase tracking-[0.18em] dark:border-[var(--color-paper-3)]/25">
        <span className="inline-flex h-4 items-center border border-[var(--color-ink)]/30 px-1.5 text-[var(--color-ink-3)] dark:border-[var(--color-paper-3)]/30 dark:text-[var(--color-paper-3)]/60">
          {t("screens.create.previous")}
        </span>
        <span className="tabular-nums text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
          {t("screens.create.stepCounter")}
        </span>
        <span className="inline-flex h-4 items-center border-[1.5px] border-[var(--color-ink)] bg-[var(--color-ink)] px-2 text-[var(--color-paper)] dark:border-[var(--color-paper-3)] dark:bg-[var(--color-accent)] dark:text-[var(--color-ink)]">
          {t("screens.create.next")}
        </span>
      </div>
    </div>
  );
}

/* ==================== fig. 03 — Edit Archive · Players ==================== */

function EditMock(): React.JSX.Element {
  const { t } = useTranslation();
  // 真实 Steam ID 格式：纯 17 位 Steam64 ID
  const players: ReadonlyArray<{ name: string; id: string; sanity: number; active?: boolean }> = [
    {
      name: "operative_07",
      id: "76561198000000007",
      sanity: 73,
      active: true,
    },
    {
      name: "agent_blake",
      id: "76561198000000042",
      sanity: 100,
    },
  ];
  // 12 个库存槽：3 手部 + 9 背包
  const slots: ReadonlyArray<{ item?: keyof typeof ITEM; label: string; placeholder: string }> = [
    { item: "Flashlight", label: "1", placeholder: "hand" },
    { item: "Knife", label: "2", placeholder: "hand" },
    { item: "GlowstickBlue", label: "3", placeholder: "hand" },
    { item: "WalkieTalkie", label: "1", placeholder: "back" },
    { item: "MothJelly", label: "2", placeholder: "back" },
    { item: "AlmondWater", label: "3", placeholder: "back" },
    { item: "Battery", label: "4", placeholder: "back" },
    { item: "Crowbar", label: "5", placeholder: "back" },
    { item: "Rope", label: "6", placeholder: "back" },
  ];
  return (
    <div className="space-y-2">
      {/* 标题栏 + tabs（与主项目 EditArchive tab 结构对齐：basic / level / players） */}
      <div className="flex items-center justify-between border-b border-[var(--color-ink)]/20 pb-1.5 font-mono text-[8.5px] uppercase tracking-[0.18em] dark:border-[var(--color-paper-3)]/20">
        <div className="flex gap-0.5">
          {[
            { label: t("screens.edit.tabBasic"), active: false },
            { label: t("screens.edit.tabLevel"), active: false },
            { label: t("screens.edit.tabPlayers"), active: true },
          ].map((tab) => (
            <span
              key={tab.label}
              className={`inline-flex h-4 items-center px-1.5 ${
                tab.active
                  ? "bg-[var(--color-ink)] text-[var(--color-paper)] dark:bg-[var(--color-accent)] dark:text-[var(--color-ink)]"
                  : "text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60"
              }`}
            >
              {tab.label}
            </span>
          ))}
        </div>
        <div className="flex gap-0.5">
          <span className="inline-flex h-4 items-center border border-[var(--color-ink)]/30 px-1.5 text-[var(--color-ink-3)] dark:border-[var(--color-paper-3)]/30 dark:text-[var(--color-paper-3)]/60">
            {t("screens.edit.cancel")}
          </span>
          <span className="inline-flex h-4 items-center bg-[var(--color-ink)] px-1.5 text-[var(--color-paper)] dark:bg-[var(--color-accent)] dark:text-[var(--color-ink)]">
            {t("screens.edit.save")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {/* 左：玩家列表 */}
        <div className="col-span-2 space-y-1">
          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
            {t("screens.edit.playersHeading")}
          </div>
          {players.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-1 border px-1.5 py-1 font-mono text-[8.5px] ${
                p.active
                  ? "border-[1.5px] border-[var(--color-ink)] bg-[var(--color-accent)]/30 dark:border-[var(--color-paper-3)]"
                  : "border-[var(--color-ink)]/20 dark:border-[var(--color-paper-3)]/20"
              }`}
            >
              <span
                aria-hidden="true"
                className="flex h-4 w-4 items-center justify-center border border-[var(--color-ink)]/40 bg-[var(--color-paper)] text-[8px] font-bold text-[var(--color-ink)] dark:border-[var(--color-paper-3)]/40 dark:bg-[#1a1714] dark:text-[var(--color-paper)]"
              >
                {p.name[0].toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[var(--color-ink)] dark:text-[var(--color-paper)]">{p.name}</div>
                <div className="truncate text-[7.5px] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/50">
                  {p.id.slice(0, 10)}…
                </div>
              </div>
              <span
                className="rounded-sm px-1 text-[7.5px] font-bold uppercase tracking-[0.14em] tabular-nums text-[var(--color-paper)]"
                style={{ background: sanityTone(p.sanity) }}
              >
                {p.sanity}%
              </span>
            </div>
          ))}
          {/* 添加玩家行 */}
          <div className="flex gap-0.5">
            <div className="flex h-4 flex-1 items-center border border-[var(--color-ink)]/30 px-1.5 font-mono text-[8px] text-[var(--color-ink-3)] dark:border-[var(--color-paper-3)]/30 dark:text-[var(--color-paper-3)]/60">
              {t("screens.edit.steamIdPlaceholder")}
            </div>
            <span className="inline-flex h-4 items-center bg-[var(--color-ink)] px-1.5 text-[8px] text-[var(--color-paper)] dark:bg-[var(--color-accent)] dark:text-[var(--color-ink)]">
              {t("screens.edit.addPlayer")}
            </span>
          </div>
        </div>

        {/* 右：玩家详情 */}
        <div className="col-span-3 space-y-1.5">
          {/* Sanity 区块 */}
          <div className="border border-[var(--color-ink)]/20 px-1.5 py-1 dark:border-[var(--color-paper-3)]/20">
            <div className="mb-0.5 flex items-baseline justify-between font-mono text-[7.5px] uppercase tracking-[0.2em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
              <span>{t("screens.edit.sanity")}</span>
              <span className="text-[7.5px]">
                <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
                  <path d="M8 1C5.5 1 4 2.5 4 4.5c0 .7.2 1.3.5 1.8C3.5 7 3 8 3 9c0 1.5.8 2.5 2 3-.3.5-.5 1-.5 1.5C4.5 15 6 16 8 16s3.5-1 3.5-2.5c0-.5-.2-1-.5-1.5 1.2-.5 2-1.5 2-3 0-1-.5-2-1.5-2.7.3-.5.5-1.1.5-1.8C12 2.5 10.5 1 8 1z" />
                  <path d="M8 14c-1 0-1.5-.5-1.5-1h3c0 .5-.5 1-1.5 1z" opacity="0.6" />
                </svg>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[16px] font-bold tabular-nums leading-none" style={{ color: sanityTone(73) }}>
                {t("screens.edit.sanityPercent", { value: 73 })}
              </span>
              <div className="relative h-1.5 flex-1 border border-[var(--color-ink)]/30 bg-[var(--color-ink)]/5 dark:border-[var(--color-paper-3)]/30 dark:bg-[var(--color-paper)]/5">
                <div className="absolute inset-y-0 left-0" style={{ width: "73%", background: sanityTone(73) }} />
                <div
                  className="absolute top-1/2 h-2.5 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-[var(--color-ink)] dark:bg-[var(--color-paper)]"
                  style={{ left: "73%" }}
                  aria-hidden="true"
                />
              </div>
              <span
                aria-hidden="true"
                className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-[var(--color-alert)]/15 text-[7.5px]"
              >
                ☠
              </span>
              <span
                aria-hidden="true"
                className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-[#10b981]/15 text-[7.5px]"
              >
                ♥
              </span>
            </div>
          </div>

          {/* Inventory 区块 */}
          <div className="border border-[var(--color-ink)]/20 px-1.5 py-1 dark:border-[var(--color-paper-3)]/20">
            <div className="mb-1 flex items-baseline justify-between font-mono text-[7.5px] uppercase tracking-[0.2em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
              <span>{t("screens.edit.inventory")}</span>
              <span>
                <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
                  <rect x="1.5" y="5.5" width="13" height="9" rx="1" />
                  <path d="M5.5 5.5V4a1 1 0 011-1h3a1 1 0 011 1v1.5" />
                  <path d="M1.5 8.5h13" stroke="currentColor" strokeWidth="0.5" fill="none" />
                </svg>
              </span>
            </div>
            <div className="flex gap-1">
              {/* 3 手部 slot（垂直） */}
              <div className="flex flex-col gap-0.5">
                {slots.slice(0, 3).map((s, i) => (
                  <ItemSlot key={`h-${i}`} item={s.item} label={s.label} variant="hand" />
                ))}
              </div>
              {/* 9 背包 slot（3x3） */}
              <div className="grid flex-1 grid-cols-3 gap-0.5">
                {slots.slice(3).map((s, i) => (
                  <ItemSlot key={`b-${i}`} item={s.item} label={s.label} variant="back" />
                ))}
                {/* 3 个空槽 */}
                {[0, 1, 2].map((i) => (
                  <ItemSlot key={`e-${i}`} item={undefined} label={`${i + 7}`} variant="back" empty />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemSlot({
  item,
  label,
  variant,
  empty,
}: {
  item?: keyof typeof ITEM;
  label: string;
  variant: "hand" | "back";
  empty?: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const size = variant === "hand" ? "h-5 w-5" : "h-4 w-4";
  if (empty) {
    return (
      <div
        className={`relative ${size} border border-dashed border-[var(--color-ink)]/20 dark:border-[var(--color-paper-3)]/20`}
        aria-hidden="true"
      >
        <span className="absolute right-0.5 top-0 font-mono text-[6px] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/40">
          {label}
        </span>
      </div>
    );
  }
  const data = item ? ITEM[item] : undefined;
  const localizedLabel = item ? t(`screens.items.${item}`) : label;
  return (
    <div
      className={`relative ${size} border border-[var(--color-ink)]/40 dark:border-[var(--color-paper-3)]/40`}
      style={{ background: data?.tone ?? "var(--color-paper-2)" }}
      aria-label={localizedLabel}
    >
      <span className="absolute left-0.5 top-0 font-mono text-[6px] font-bold text-[var(--color-ink)]">
        {data?.letter ?? "?"}
      </span>
      <span className="absolute bottom-0 right-0.5 font-mono text-[5.5px] uppercase tracking-[0.1em] text-[var(--color-ink)]/70">
        {label}
      </span>
    </div>
  );
}

function MockChip({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <span className="inline-flex h-5 items-center border border-[var(--color-ink)]/25 px-1.5 font-mono text-[8.5px] uppercase tracking-[0.18em] text-[var(--color-ink-2)] dark:border-[var(--color-paper-3)]/25 dark:text-[var(--color-paper-3)]/70">
      {children}
      <span aria-hidden="true" className="ml-0.5">
        ▾
      </span>
    </span>
  );
}

/**
 * 真实关卡（与主项目 src/views/CreateArchive/index.vue loadLevels() 对齐）
 * 选用 main ending 的前 10 个关卡作为 5x2 网格展示。
 */
type LevelTone = { tone: string; accent: string };
const LEVEL_TONE: Record<string, LevelTone> = {
  Level0: { tone: "#f4d738", accent: "#1a1714" }, // Backrooms yellow
  TopFloor: { tone: "#c97a4a", accent: "#1a1714" }, // warm brown
  MiddleFloor: { tone: "#6b7280", accent: "#f1ead8" }, // gray
  GarageLevel2: { tone: "#404040", accent: "#fbbf24" }, // dark with sodium light
  BottomFloor: { tone: "#3a2a22", accent: "#fbbf24" }, // dark brown
  TheHub: { tone: "#d4a574", accent: "#1a1714" }, // tan
  Pipes1: { tone: "#52525b", accent: "#a3e635" }, // industrial gray
  ElectricalStation: { tone: "#1c1917", accent: "#fde047" }, // electric
  Office: { tone: "#b08d57", accent: "#1a1714" }, // wood office
  Hotel: { tone: "#8b6f47", accent: "#1a1714" }, // hotel brown
  Poolrooms: { tone: "#3b82c4", accent: "#f1ead8" },
  LightsOut: { tone: "#1a1a1a", accent: "#f4d738" },
  TheEnd: { tone: "#4a1a1a", accent: "#f87171" },
  CaveLevel: { tone: "#7a4a2a", accent: "#fbbf24" },
};

/**
 * 真实物品（与主项目 useInventoryItemSelector AVAILABLE_ITEMS 对齐）
 * 选用 12 种常出现在游戏中的物品填充库存格。
 */
const ITEM: Record<string, { letter: string; tone: string; label: string }> = {
  Flashlight: { letter: "F", tone: "#f4d738", label: "Flashlight" },
  GlowstickBlue: { letter: "B", tone: "#60a5fa", label: "Blue Glow Stick" },
  Knife: { letter: "K", tone: "#94a3b8", label: "Knife" },
  WalkieTalkie: { letter: "W", tone: "#34d399", label: "Walkie Talkie" },
  MothJelly: { letter: "M", tone: "#c084fc", label: "Moth Jelly" },
  AlmondWater: { letter: "A", tone: "#fb923c", label: "Almond Water" },
  Battery: { letter: "P", tone: "#84cc16", label: "Battery" },
  Crowbar: { letter: "C", tone: "#71717a", label: "Crowbar" },
  DivingHelmet: { letter: "D", tone: "#22d3ee", label: "Diving Helmet" },
  Flaregun: { letter: "L", tone: "#f87171", label: "Flare Gun" },
  LiquidPain: { letter: "Q", tone: "#a855f7", label: "Liquid Sorrow" },
  Rope: { letter: "R", tone: "#f59e0b", label: "Rope" },
};

const DIFF_TONE: Record<string, string> = {
  EASY: "#10b981",
  NORMAL: "#3b82c4",
  HARD: "#f59e0b",
  NIGHTMARE: "#dc2626",
};

function sanityTone(percent: number): string {
  if (percent >= 80) return "#10b981";
  if (percent >= 50) return "#f59e0b";
  if (percent >= 20) return "#ef4444";
  return "#b91c1c";
}
