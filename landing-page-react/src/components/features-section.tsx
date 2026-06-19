import { site } from "@/content/site-content";

export function FeaturesSection(): React.JSX.Element {
  return (
    <section id="features" className="px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          Features
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600 dark:text-slate-400">
          Everything you need to keep your Escape The Backrooms saves organized, fast, and portable.
        </p>
        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {site.features.map((feature) => (
            <li
              key={feature.id}
              className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-700/20 dark:text-brand-100">
                <FeatureIcon iconKey={feature.iconKey} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FeatureIcon({ iconKey }: { iconKey: string }): React.JSX.Element {
  // 6 个内联单色 SVG，< 1KB/个。统一 24x24 viewBox，currentColor 跟随父级。
  const common = {
    viewBox: "0 0 24 24",
    width: 20,
    height: 20,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (iconKey) {
    case "icon-crud":
      return (
        <svg {...common}>
          <path d="M3 7h18M3 12h18M3 17h12" />
        </svg>
      );
    case "icon-themes":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" />
        </svg>
      );
    case "icon-virtual":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M3 10h18M7 14h6" />
        </svg>
      );
    case "icon-i18n":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      );
    case "icon-tutorial":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" />
        </svg>
      );
    case "icon-performance":
      return (
        <svg {...common}>
          <path d="M3 17l5-5 4 4 8-8" />
          <path d="M14 8h6v6" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
