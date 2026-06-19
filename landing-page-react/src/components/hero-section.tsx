import { site } from "@/content/site-content";

export function HeroSection(): React.JSX.Element {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-50 px-4 py-24 dark:from-slate-950 dark:via-slate-900 dark:to-brand-700/30 sm:py-32"
    >
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-brand-600 dark:text-brand-100">
          For Windows · Tauri 2.0
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-6xl">
          {site.name}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          {site.tagline}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={site.releasesUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-11 items-center justify-center rounded-md bg-brand-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Download for Windows
          </a>
          <a
            href={site.githubUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
