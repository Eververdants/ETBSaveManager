import { useTranslation } from "react-i18next";

import { useIntersection } from "@/hooks/use-intersection";

/**
 * FAQ section：档案问答卡 — 原生 details/summary 折叠（零延迟，无 JS 动画）。
 * 问题与 index.html 内的 FAQPage JSON-LD 保持一致。
 */
export function FaqSection(): React.JSX.Element {
  const { t } = useTranslation();
  const { ref: sectionRef, isVisible } = useIntersection({ threshold: 0.08 });

  const items = [1, 2, 3, 4, 5, 6].map((i) => ({
    q: t(`faq.items.q${i}`),
    a: t(`faq.items.a${i}`),
  }));

  return (
    <section
      id="faq"
      ref={sectionRef}
      data-visible={isVisible ? "true" : undefined}
      className="relative px-4 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-[1400px]">
        {/* 标题区 */}
        <header className="reveal-on-scroll reveal-blur mb-12 grid grid-cols-1 gap-6 border-b-[1.5px] border-[var(--color-ink)] pb-6 sm:mb-16 sm:pb-8 dark:border-[var(--color-paper-3)] lg:grid-cols-12">
          <div className="lg:col-span-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60">
              {t("faq.section.index")}
            </span>
            <h2 className="underline-grow mt-1 archive-headline text-4xl text-[var(--color-ink)] sm:text-5xl dark:text-[var(--color-paper)]">
              <span className="block">{t("faq.section.titleA")}</span>
              <span className="block italic text-[var(--color-ink-2)] dark:text-[var(--color-paper-3)]">
                {t("faq.section.titleB")}
              </span>
            </h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-4">
            <p
              className="max-w-xl font-display text-lg italic text-[var(--color-ink-2)] sm:text-xl dark:text-[var(--color-paper-3)]"
              style={{ fontVariationSettings: '"opsz" 36, "SOFT" 60' }}
            >
              {t("faq.section.intro")}
              <span className="text-[var(--color-ink-3)] dark:text-[var(--color-ink-3)]">
                {" "}
                {t("faq.section.introSuffix")}
              </span>
            </p>
          </div>
        </header>

        {/* 问答列表 */}
        <ul className="stagger-children mx-auto grid max-w-3xl grid-cols-1 gap-3">
          {items.map((item, idx) => (
            <li key={idx} className="reveal-on-scroll">
              <details className="group border-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper)] shadow-[4px_4px_0_0_var(--color-ink)] transition-shadow open:shadow-[6px_6px_0_0_var(--color-accent-deep)] dark:border-[var(--color-paper-3)] dark:bg-[#15110d] dark:shadow-[4px_4px_0_0_var(--color-paper-3)] dark:open:shadow-[6px_6px_0_0_var(--color-accent)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--color-ink)] transition-colors hover:text-[var(--color-accent-deep)] dark:text-[var(--color-paper)] dark:hover:text-[var(--color-accent)] [&::-webkit-details-marker]:hidden">
                  <span className="flex items-baseline gap-3">
                    <span
                      aria-hidden="true"
                      className="tabular-nums text-[10px] text-[var(--color-ink-3)] dark:text-[var(--color-paper-3)]/60"
                    >
                      Q{String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-base font-semibold normal-case tracking-normal sm:text-lg">
                      {item.q}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="inline-block flex-shrink-0 font-mono text-sm transition-transform duration-150 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="border-t border-dashed border-[var(--color-ink)]/25 px-5 py-4 text-sm leading-relaxed text-[var(--color-ink-2)] dark:border-[var(--color-paper-3)]/25 dark:text-[var(--color-paper-3)]">
                  {item.a}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
