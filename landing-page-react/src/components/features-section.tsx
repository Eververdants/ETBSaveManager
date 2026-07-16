import { useTranslation } from "react-i18next";

import { site } from "@/content/site-content";

/**
 * 功能特性 section：3x2 档案柜 tab 风卡片 + 编号 + 分类戳
 */
export function FeaturesSection(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <section id="features" className="relative px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px]">
        {/* 标题区 */}
        <header className="mb-12 grid grid-cols-1 gap-6 border-b-[1.5px] border-[var(--color-ink)] pb-6 sm:mb-16 sm:pb-8 dark:border-[var(--color-paper-3)] lg:grid-cols-12">
          <div className="lg:col-span-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
              § 01
            </span>
            <h2 className="mt-1 archive-headline text-4xl text-[var(--color-ink)] sm:text-5xl dark:text-[var(--color-paper)]">
              <span className="block">{t("features.section.index")}</span>
              <span className="block italic text-[var(--color-ink-2)] dark:text-[var(--color-paper-3)]">
                {t("features.section.indexSubline")}
              </span>
            </h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-4">
            <p
              className="max-w-xl font-display text-lg italic text-[var(--color-ink-2)] sm:text-xl dark:text-[var(--color-paper-3)]"
              style={{ fontVariationSettings: '"opsz" 36, "SOFT" 60' }}
            >
              {t("features.section.intro")}
              <span className="text-[var(--color-ink-3)] dark:text-[var(--color-ink-3)]">
                {" "}
                {t("features.section.introSuffix")}
              </span>
            </p>
            <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
              {t("features.section.lastRevised", { date: site.meta.releaseDate })}
            </p>
          </div>
        </header>

        {/* 卡片网格 */}
        <ul className="grid grid-cols-1 gap-px bg-[var(--color-ink)]/15 sm:grid-cols-2 lg:grid-cols-3 dark:bg-[var(--color-paper-3)]/15">
          {site.features.map((feature, idx) => (
            <li
              key={feature.id}
              className="file-rise bg-[var(--color-paper)] transition-colors hover:bg-[#f6f0de] dark:bg-[#15110d] dark:hover:bg-[#1d1813]"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <article className="group relative h-full border border-transparent p-6 transition-colors hover:border-[var(--color-ink)]/40 dark:hover:border-[var(--color-paper-3)]/40">
                {/* 顶部：编号 + 分类戳 */}
                <div className="mb-5 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
                    {feature.ref}
                  </span>
                  <span
                    className="classification-stamp"
                    style={{
                      color: feature.classification === "Technical" ? "var(--color-term-soft)" : "var(--color-ink-2)",
                    }}
                  >
                    {feature.classification === "Technical"
                      ? t("common.classificationTechnical")
                      : t("common.classificationStandard")}
                  </span>
                </div>

                {/* 图标 + 标题 */}
                <div className="mb-4 flex items-start gap-3">
                  <div
                    aria-hidden="true"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center border-[1.5px] border-[var(--color-ink)] bg-[var(--color-accent)] text-[var(--color-ink)] transition-transform group-hover:-translate-y-0.5 group-hover:rotate-[-2deg] dark:border-[var(--color-paper-3)]"
                  >
                    <FeatureIcon iconKey={feature.iconKey} />
                  </div>
                  <h3 className="font-display text-xl font-semibold leading-[1.15] tracking-tight text-[var(--color-ink)] sm:text-2xl dark:text-[var(--color-paper)]">
                    {t(`features.${feature.id}.title`)}
                  </h3>
                </div>

                <p
                  className="font-display text-[15px] leading-[1.55] text-[var(--color-ink-2)] dark:text-[var(--color-paper-3)]"
                  style={{ fontVariationSettings: '"opsz" 24, "SOFT" 40' }}
                >
                  {t(`features.${feature.id}.description`)}
                </p>

                {/* 底部：file path + 编号 */}
                <div className="mt-6 flex items-center justify-between border-t border-dashed border-[var(--color-ink)]/20 pt-3 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--color-ink-3)] dark:border-[var(--color-paper-3)]/20 dark:text-[var(--color-paper-3)]/60">
                  <span>root / features / {feature.id}</span>
                  <span className="tabular-nums">↳ {String(idx + 1).padStart(2, "0")}/07</span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FeatureIcon({ iconKey }: { iconKey: string }): React.JSX.Element {
  // 6 个内联单色 SVG，统一 24x24 viewBox，currentColor 跟随父级
  const common = {
    viewBox: "0 0 24 24",
    width: 18,
    height: 18,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (iconKey) {
    case "icon-crud":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="4" />
          <rect x="3" y="10" width="18" height="4" />
          <rect x="3" y="16" width="12" height="4" />
          <path d="M5 6h.01M5 12h.01M5 18h.01" strokeWidth={2.5} />
        </svg>
      );
    case "icon-themes":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "icon-virtual":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="1" />
          <path d="M3 10h18" />
          <path d="M7 15h3M13 15h4" />
        </svg>
      );
    case "icon-i18n":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M4 12h16M12 4c2 2.5 3 5 3 8s-1 5.5-3 8M12 4c-2 2.5-3 5-3 8s1 5.5 3 8" />
        </svg>
      );
    case "icon-wizard":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="5" height="3" />
          <rect x="10" y="5" width="5" height="3" />
          <rect x="17" y="5" width="4" height="3" />
          <rect x="3" y="10" width="5" height="3" />
          <rect x="10" y="10" width="5" height="3" />
          <rect x="17" y="10" width="4" height="3" />
          <rect x="3" y="15" width="5" height="3" />
          <rect x="10" y="15" width="5" height="3" />
          <rect x="17" y="15" width="4" height="3" />
          <path d="M6 6.5h.01M13 6.5h.01M19 11.5h.01" strokeWidth={2.5} />
        </svg>
      );
    case "icon-tutorial":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7" />
          <path d="M12 16.5h.01" strokeWidth={2.5} />
        </svg>
      );
    case "icon-performance":
      return (
        <svg {...common}>
          <path d="M3 17l5-5 4 3 8-9" />
          <path d="M14 6h6v6" />
        </svg>
      );
    case "icon-scheduler":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v4M12 16v4M4 12h4M16 12h4" strokeWidth={2} />
          <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
