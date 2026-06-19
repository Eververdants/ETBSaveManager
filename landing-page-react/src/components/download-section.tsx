import { site } from "@/content/site-content";

export function DownloadSection(): React.JSX.Element {
  return (
    <section id="download" className="px-4 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          Download
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
          Choose your platform — the latest release is fetched directly from GitHub Releases.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {site.downloads.map((download) => (
            <a
              key={download.id}
              href={download.href}
              target="_blank"
              rel="noreferrer noopener"
              className="group inline-flex h-28 flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500 dark:hover:bg-slate-800"
            >
              <WindowsMark />
              <span className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 dark:text-slate-50 dark:group-hover:text-brand-100">
                {download.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function WindowsMark(): React.JSX.Element {
  // 内联单色 Windows 风格 mark（4 块旗形），与图标库无关
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="currentColor"
      className="text-slate-500 group-hover:text-brand-600 dark:text-slate-400 dark:group-hover:text-brand-100"
      aria-hidden="true"
    >
      <path d="M3 5.5 11 4v8H3zM12 4l9-1.5V12h-9zM3 13h8v7L3 18.5zM12 13h9v8.5L12 20z" />
    </svg>
  );
}
