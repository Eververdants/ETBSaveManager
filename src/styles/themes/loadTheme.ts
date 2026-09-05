/**
 * Lazy theme loader.
 *
 * Only light/dark themes are bundled in index.css. The extra themes
 * (ocean, forest, sunset, lavender, rose, mint, peach, sky) are
 * loaded on demand via <link> injection the first time they are activated.
 */

const EXTRA_THEMES = ["ocean", "forest", "sunset", "lavender", "rose", "mint", "peach", "sky"] as const;

type ExtraTheme = (typeof EXTRA_THEMES)[number];

const loaded = new Set<string>();

/** Load an extra theme CSS by injecting a <link> element. Idempotent. */
export function loadTheme(theme: ExtraTheme): void {
  if (loaded.has(theme)) return;
  loaded.add(theme);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `./styles/themes/${theme}.css`;
  link.dataset.themeLazy = theme;
  document.head.appendChild(link);
}

/** Preload a set of themes (called during idle time after startup). */
export function preloadThemes(themes: ExtraTheme[]): void {
  for (const theme of themes) {
    loadTheme(theme);
  }
}

/** Check if a theme name is an extra (lazy-loaded) theme. */
export function isExtraTheme(theme: string): theme is ExtraTheme {
  return (EXTRA_THEMES as readonly string[]).includes(theme);
}
