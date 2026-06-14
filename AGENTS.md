# AGENTS.md

## Project

Vue 3 + Vite 6 frontend, Tauri 2.0 (Rust) desktop app. Saves manager for "Escape The Backrooms" (UE4 game). Windows-only.

## Quick commands

| Action | Command |
|--------|---------|
| Install | `pnpm install` |
| Dev (frontend only) | `pnpm dev` |
| Dev (full Tauri) | `pnpm tauri dev` |
| Lint | `pnpm lint` |
| Lint + fix | `pnpm lint:fix` |
| Format check | `pnpm format` |
| Format fix | `pnpm format:fix` |
| Test (single run) | `pnpm test:unit` |
| Test (watch) | `pnpm test:watch` |
| Build | `pnpm build` |
| Build (full Tauri) | `pnpm tauri build` |

## Version sync

Version must be updated in `package.json` only. `pnpm dev` and `pnpm build` auto-run `scripts/sync-version.js` which syncs it to `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml`. Never manually edit version in those two files.

## Code style

Prettier: semicolons, double quotes, trailing commas, 120 print width, 2-space indent, LF endings.
ESLint: Vue flat config, `no-console: warn` (allow warn/error/info), `eqeqeq`, `no-var: error`, `vue/multi-word-component-names: off`.

## Vitest

No separate vitest config — uses `vite.config.js`. Tests in `src/**/__tests__/*.test.js`. Uses `fast-check` for property-based testing in some test files.

## Key quirks

- **Vue runtime compiler**: `vue` is aliased to `vue/dist/vue.esm-bundler.js` in `vite.config.js:19`. This enables runtime template compilation — intentional, do not revert to the default runtime-only build.
- **Vite dev server**: Port 1430 (strict). HMR on port 1431 when using remote host (`TAURI_DEV_HOST`).
- **No source maps**: Disabled in production build. Do not add `sourcemap: true` to vite config.
- **i18n**: Three built-in locales in `src/i18n/locales/{zh-CN,en-US,zh-TW}/index.js`. Additional languages via plugins in `plugins/`.
- **Tauri FS scope**: App is sandboxed to `$LOCALDATA/EscapeTheBackrooms/**` and `$APPDATA/**`. Do not request broader filesystem permissions without user approval.
- **Production console stripping**: `console.log`, `console.info`, `console.debug` are removed by terser in production. Use `console.warn` or `console.error` for persistent diagnostics.
- **Tailwind CSS 4**: Uses `@tailwindcss/vite` plugin, not the PostCSS plugin.
- **GSAP**: Used for animations. Loaded lazily — do not import eagerly at startup.

## Rust backend

Entry: `src-tauri/src/lib.rs` (Tauri commands registered here) and `src-tauri/src/main.rs`.
Key modules: `save_commands.rs`, `save_editor.rs`, `player_data.rs`, `steam_api.rs`, `feedback_commands.rs`.
Uses `uesave` crate (0.6.2) for UE4 save file parsing.

## CI

Release workflow (`.github/workflows/release.yml`): builds for Windows x64/x86/arm64, triggered by version tags `v*.*.*`. Uses pnpm 9, Node 20, stable Rust.
