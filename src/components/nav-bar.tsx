import { ThemeToggle } from "@/components/theme-toggle";
import { site } from "@/content/site-content";

export function NavBar(): React.JSX.Element {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <a
          href="#top"
          className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100"
        >
          {site.name}
        </a>
        <div className="flex items-center gap-3">
          <a
            href={site.githubUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.73.5.67 5.56.67 11.83c0 5.02 3.25 9.27 7.76 10.77.57.1.78-.25.78-.55v-2.13c-3.16.69-3.83-1.35-3.83-1.35-.52-1.31-1.27-1.66-1.27-1.66-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.52-.29-5.17-1.26-5.17-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.16.91-.25 1.89-.38 2.86-.39.97 0 1.95.13 2.86.39 2.18-1.47 3.14-1.16 3.14-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.8 1.17 3.04 0 4.35-2.65 5.31-5.18 5.59.41.36.77 1.05.77 2.13v3.16c0 .31.21.66.79.55 4.5-1.5 7.75-5.75 7.75-10.77C23.33 5.56 18.27.5 12 .5z" />
            </svg>
            <span>GitHub</span>
          </a>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
