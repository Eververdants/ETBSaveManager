import { site } from "@/content/site-content";

export function FooterSection(): React.JSX.Element {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-10 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © {year} {site.name}. Released under MIT.
        </p>
        <ul className="flex items-center gap-4 text-sm">
          <li>
            <a
              href={`${site.githubUrl}/blob/main/LICENSE`}
              target="_blank"
              rel="noreferrer noopener"
              className="text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-100"
            >
              License
            </a>
          </li>
          <li>
            <a
              href={site.releasesUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-100"
            >
              Releases
            </a>
          </li>
          <li>
            <a
              href={site.githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-100"
            >
              Source
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
