# AGENTS.md

## Project Overview

Vue 3 + Vite + Tauri 2.0 (Rust) desktop application. Save manager for "Escape The Backrooms" (UE4 game). Windows-only.

- **Frontend**: Vue 3 Composition API + TypeScript + Pinia + Vue Router + Tailwind CSS 4
- **Backend**: Tauri 2.0 (Rust) with `uesave` crate for UE4 save parsing
- **i18n**: `vue-i18n` with 3 bundled locales (zh-CN, en-US, zh-TW)
- **Build**: Vite 8, pnpm package manager

## Quick Commands

| Action | Command |
|--------|---------|
| Install | `pnpm install` |
| Dev (frontend only) | `pnpm dev` |
| Dev (full Tauri) | `pnpm tauri dev` |
| Lint | `pnpm lint` |
| Lint + fix | `pnpm lint:fix` |
| Format check | `pnpm format` |
| Format fix | `pnpm format:fix` |
| Type check | `pnpm typecheck` |
| Test (single run) | `pnpm test:unit` |
| Test (watch) | `pnpm test:watch` |
| Build | `pnpm build` |
| Build (full Tauri) | `pnpm tauri build` |

## Directory Structure

```
ETBSaveManager-master/
├── src/                        # Frontend source
│   ├── adapters/               # Platform adapters (Tauri IPC layer)
│   │   └── tauri/              #   Tauri-specific adapters
│   │       ├── archiveAdapter.ts
│   │       └── playerAdapter.ts
│   ├── components/             # Reusable UI components
│   │   ├── archive/            #   Archive-related cards/inputs
│   │   ├── feature/            #   Feature-specific (FAB, search, inventory)
│   │   ├── layout/             #   Layout (Sidebar, TitleBar)
│   │   ├── modal/              #   Modals (ConfirmModal, PromptPopup)
│   │   ├── player/             #   Player-related panels
│   │   ├── quickCreate/        #   Quick-create flow components
│   │   ├── system/             #   System (performance monitor, player manager)
│   │   ├── theme/              #   Theme selector
│   │   └── ui/                 #   Generic UI primitives (BaseModal, LazyImage, etc.)
│   ├── composables/            # Vue composables (stateful logic reuse)
│   │   ├── __tests__/          #   Composable unit tests
│   │   ├── index.ts            #   Barrel export for all composables
│   │   └── use*.ts             #   One composable per file
│   ├── config/                 # Static configuration
│   │   ├── features.ts         #   Feature flags
│   │   ├── sidebarMenu.ts      #   Sidebar menu items
│   │   ├── updateConfig.ts     #   Update source config
│   │   └── version.ts          #   App version (reads from package.json)
│   ├── data/                   # Static game data
│   │   └── endingsData.ts      #   Game ending level definitions
│   ├── domain/                 # Domain layer (business logic, framework-agnostic)
│   │   ├── archive/            #   Archive domain
│   │   │   ├── models.ts        #     Domain entities (Archive, ArchiveConfig, etc.)
│   │   │   ├── service.ts      #     Business logic service
│   │   │   └── validators.ts   #     Domain validation rules
│   │   └── player/             #   Player domain
│   │       ├── models.ts        #     Player entities
│   │       └── transformers.ts #     Data transformers
│   ├── i18n/                   # Internationalization
│   │   ├── __tests__/          #   i18n tests
│   │   ├── index.ts            #   i18n instance + locale messages
│   │   ├── loader.ts           #   Locale loader utility
│   │   └── locales/            #   Locale message files
│   │       ├── zh-CN/          #     Simplified Chinese
│   │       ├── en-US/          #     English
│   │       └── zh-TW/          #     Traditional Chinese
│   ├── router/                 # Vue Router configuration
│   │   └── index.ts            #   Route definitions + smart preloading
│   ├── services/               # Application services (singletons, cross-cutting)
│   │   ├── __tests__/          #   Service unit tests
│   │   ├── logService.ts       #   Logging service
│   │   ├── modService.ts       #   Mod management service
│   │   ├── notificationService.ts # Toast/notification service
│   │   ├── popupService.ts     #   Popup dialog service
│   │   ├── resourceScheduler.ts #  Intelligent resource scheduler
│   │   ├── storageService.ts   #   Persistent storage (file-backed)
│   │   ├── themeStorage.ts     #   Theme persistence
│   │   └── updateService.ts    #   App update service
│   ├── stores/                 # Pinia stores (global shared state)
│   │   └── appStore.ts         #   App-level state (language, dev mode, sidebar)
│   ├── styles/                 # Global styles
│   │   ├── animations.css      #   Animation keyframes
│   │   ├── tailwind.css        #   Tailwind entry
│   │   ├── theme-config.ts     #   Theme config (TS)
│   │   ├── themes/             #   Theme CSS files (light, dark, ocean, etc.)
│   │   └── variables.css       #   CSS custom properties
│   ├── types/                  # Shared TypeScript types (by domain)
│   │   ├── archive.ts          #   Archive-related types
│   │   ├── player.ts           #   Player-related types
│   │   ├── scheduler.ts        #   Resource scheduler types
│   │   └── ui.ts               #   UI/popup/toast types
│   ├── utils/                  # Pure utility functions
│   │   ├── __tests__/          #   Utility unit tests
│   │   └── *.ts                #   One utility per file
│   ├── views/                  # Page-level components (routed)
│   │   ├── About.vue
│   │   ├── Home.vue
│   │   ├── Mods.vue
│   │   ├── QuickCreateArchive.vue
│   │   ├── SelectCreateMode.vue
│   │   ├── CreateArchive/      #   Multi-step create flow
│   │   ├── EditArchive/        #   Edit flow with tabs
│   │   └── Settings/           #   Settings with sections
│   ├── App.vue                 # Root component
│   ├── appContext.ts           # Global app context (i18n, router, storage refs)
│   ├── main.ts                 # Application entry point
│   └── types.ts                # [DEPRECATED] Legacy barrel — do not add here
├── src-tauri/                  # Rust backend
│   ├── src/                    #   Rust source modules
│   │   ├── lib.rs              #     Tauri builder + command registration
│   │   ├── main.rs             #     Binary entry
│   │   ├── save_loader.rs      #     Save file loading commands
│   │   ├── save_editor.rs      #     Save editing commands
│   │   ├── save_deleter.rs     #     File deletion commands
│   │   ├── save_converter.rs   #     .sav ↔ JSON conversion
│   │   ├── save_batch.rs       #     Batch operations
│   │   ├── player_data.rs      #     Player data commands
│   │   ├── mods.rs             #     Mod management commands
│   │   ├── system_commands.rs  #     System-level commands
│   │   ├── theme_commands.rs   #     Theme commands
│   │   ├── gpu_settings.rs     #     GPU acceleration settings
│   │   └── ...
│   ├── capabilities/           #   Tauri capability permissions
│   ├── tauri.conf.json         #   Tauri config (version synced from package.json)
│   └── Cargo.toml              #   Rust dependencies (version synced from package.json)
├── scripts/                    # Build/utility scripts
│   ├── build.mjs               # Production build script
│   ├── optimize-images.mjs     # Image optimization
│   └── sync-version.js         # Sync version across package.json/tauri.conf.json/Cargo.toml
├── docs/                       # Documentation images
├── public/                     # Static assets (copied as-is)
├── package.json                # Node.js config (single source of truth for version)
├── vite.config.ts              # Vite + Vitest config
├── tsconfig.json               # TypeScript config
└── eslint.config.js            # ESLint flat config
```

## Architecture Layers

The app follows a layered architecture. Dependencies flow top-to-bottom:

```
Views → Composables → Services / Stores
              ↕
         Adapters → Tauri IPC
              ↕
         Domain (pure business logic, no framework deps)
```

- **Domain** (`src/domain/`): Pure TypeScript business logic. No Vue, no Tauri imports. Contains entities, validators, and business services.
- **Adapters** (`src/adapters/`): Bridge between domain and platform (Tauri). Each adapter wraps `invoke()` calls and normalizes errors into `ServiceResult<T>`.
- **Services** (`src/services/`): Application-wide singletons (storage, scheduling, notifications). Framework-agnostic where possible.
- **Composables** (`src/composables/`): Vue Composition API functions. Primary reuse mechanism for stateful logic. Each exports a single `use*` function.
- **Stores** (`src/stores/`): Pinia stores for truly global shared state (app settings, UI state).
- **Components** (`src/components/`): Presentational + smart components, organized by feature domain.
- **Views** (`src/views/`): Route-level page components.

## Code Style

### Prettier
- Semicolons, double quotes, trailing commas
- 120 print width, 2-space indent, LF line endings

### ESLint
- Vue flat config with TypeScript parser
- `no-console: warn` (allows `warn`, `error`, `info`)
- `eqeqeq: warn`, `no-var: error`
- `vue/multi-word-component-names: off`
- `@typescript-eslint/no-unused-vars: warn` (ignores `^_` prefixed)

### TypeScript
- Strict mode enabled
- `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- Path alias: `@/*` → `src/*`
- Target: ES2020, Module: ESNext, Module resolution: bundler

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files (composables) | `use*.ts` | `useArchiveData.ts` |
| Files (components) | `PascalCase.vue` | `ArchiveCard.vue` |
| Files (utils/types) | `camelCase.ts` | `nameParser.ts`, `levelUtils.ts` |
| Components (in template) | PascalCase | `<ArchiveCard />` |
| Composables | `use*()` returning object | `const { archives } = useArchiveData()` |
| Stores | `use*Store` | `useAppStore` |
| Domain services | `*Service` class | `ArchiveService` |
| Adapters | `*Adapter` class | `TauriArchiveAdapter` |
| Types/Interfaces | PascalCase, no `I` prefix | `ArchiveConfig`, not `IArchiveConfig` |
| Feature flags | `SCREAMING_SNAKE_CASE` | `MERGE_DIFFICULTY` |
| CSS classes | `kebab-case` | `.archive-card`, `.loading-skeleton` |
| CSS themes | `data-theme="kebab-case"` | `data-theme="dark"` |

## Import Conventions

### Path Aliases
- **Always use `@/` alias** for imports from `src/`. Never use relative paths beyond `./`.
  ```ts
  // Good
  import { useAppStore } from "@/stores/appStore";
  import type { Archive } from "@/domain/archive/models";

  // Bad
  import { useAppStore } from "../../stores/appStore";
  ```

### Import Order
1. Node built-ins (`path`, `url`)
2. External packages (`vue`, `pinia`, `@tauri-apps/*`)
3. Internal (`@/...`) — group by layer (domain → services → stores → composables → components → utils)
4. Types (`import type`)
5. Relative (`./styles.css`)

### Type-Only Imports
Use `import type` for type-only imports:
```ts
import type { Archive } from "@/domain/archive/models";
import type { Ref } from "vue";
```

## Type Organization

**Do NOT add new types to `src/types.ts`** — it is a legacy barrel file being phased out.

Place types in domain-specific files:

| Domain | File |
|--------|------|
| Archive | `src/types/archive.ts` |
| Player | `src/types/player.ts` |
| Resource Scheduler | `src/types/scheduler.ts` |
| UI (Toast, Popup, etc.) | `src/types/ui.ts` |

Types shared across domains go in the most relevant domain file or a new domain-specific file. Each domain type file should export its types AND re-export from a central `src/types/index.ts` barrel for backward compatibility during migration.

## Component Patterns

### Composition API
All components use `<script setup lang="ts">`:
```vue
<script setup lang="ts">
import { ref, computed } from "vue";
import type { Archive } from "@/types/archive";

const props = defineProps<{ archive: Archive }>();
const emit = defineEmits<{ save: [value: string] }>();
</script>
```

### Component Naming
- Multi-word names enforced (except root views like `Home.vue`, `About.vue`)
- Use `defineOptions({ name: "ComponentName" })` when needed for devtools/keepalive

### Props & Events
- Use `defineProps`/`defineEvents` with TypeScript generics
- Prefer `type` syntax over `interface` for prop definitions

### Composables vs Stores
- **Composables**: Feature-specific stateful logic (archive data, animations, form state). Accept reactive params, return reactive state.
- **Stores**: Truly global, app-wide state (language, theme, developer mode, sidebar visibility).

## State Management

### Pinia (Stores)
Use the Composition API style (`defineStore` with setup function):
```ts
export const useAppStore = defineStore("app", () => {
  const language = ref<string>("zh-CN");
  function setLanguage(lang: string) { language.value = lang; }
  return { language, setLanguage };
});
```

### Storage Persistence
- Use `storageService` for persistent settings (file-backed, with localStorage cache for fast startup)
- Keys to persist in localStorage for fast startup: `theme`, `language`, `locale`
- All other keys persist to `$APPDATA/data/settings.json`

## Testing

### Location
Tests live in `__tests__/` directories alongside source files:
- `src/composables/__tests__/useArchiveData.test.ts`
- `src/services/__tests__/storageService.test.ts`
- `src/utils/__tests__/levelUtils.test.ts`

### Framework
- Vitest (config in `vite.config.ts`)
- `@vue/test-utils` for component testing
- `fast-check` for property-based testing
- `happy-dom` or `jsdom` environment

### Naming
Test files: `*.test.ts` or `*.spec.ts`

## Performance Guidelines

### Startup Optimization
- Lazy-load non-critical modules (icons, i18n locales, GSAP)
- Use `requestIdleCallback` for background initialization
- Critical path: storage init + critical icons + i18n (parallel)

### Bundle Splitting
Vite `manualChunks` splits by vendor:
- `vue-core` (vue + pinia)
- `vue-router`
- `i18n`, `icons-solid`, `icons-brands`
- `tauri`, `charts`, `animations` (gsap), `virtual-scroll`, `dompurify`, `vue-flow`

### Console Stripping
Production build strips `console.log`, `console.info`, `console.debug` via esbuild `pure`. Use `console.warn`/`console.error` for persistent diagnostics.

### Resource Scheduler
The `resourceScheduler` service dynamically allocates CPU/rendering resources based on operation context. Use `scheduler.beginOperation("loading-archives")` / `scheduler.endOperation(...)` to mark long-running operations.

## i18n

### Adding Translations
1. Add key to all three locale files: `src/i18n/locales/{zh-CN,en-US,zh-TW}/*.json`
2. Use namespaced keys: `archiveCard.loadFailed`, `common.loading`
3. Reference in templates: `$t("archiveCard.loadFailed")`

### Loading Strategy
- Only the active locale is loaded at startup
- Other locales load lazily via `requestIdleCallback`

## Version Management

**Single source of truth**: `package.json` `version` field.

`scripts/sync-version.js` auto-syncs to:
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

**Never manually edit version in `tauri.conf.json` or `Cargo.toml`.**

## Tauri-Specific

### Filesystem Scope
App is sandboxed to `$LOCALDATA/EscapeTheBackrooms/**` and `$APPDATA/**`. Do not request broader permissions without user approval.

### Dev Server
- Port 1430 (strict)
- HMR on port 1431 (when `TAURI_DEV_HOST` is set)

### Vue Runtime Compiler
`vue` is aliased to `vue/dist/vue.esm-bundler.js` for runtime template compilation. Do not revert to runtime-only build.

## Rust Backend

### Module Organization
Each Rust module maps to a domain capability:
- `save_loader.rs` — Loading saves/metadata
- `save_editor.rs` — Editing save data
- `save_deleter.rs` — File deletion/trash
- `save_converter.rs` — .sav ↔ JSON conversion
- `player_data.rs` — Player data operations
- `mods.rs` — Mod management
- `system_commands.rs` — System-level operations

### Error Handling
Rust errors serialize as `{type, message}`. Frontend adapters use `normalizeInvokeError()` to extract readable messages.

## Git

### Branching
- `main` — stable releases
- Feature branches: `feature/<name>`
- Release tags: `v*.*.*` (triggers CI release workflow)

### What's Ignored
- `node_modules/`, `dist/`, `dist-ssr/`
- Editor dirs (`.vscode`, `.idea`)
- `.claude/`, `.workbuddy/`, `.codegraph/`, `.cache/`
- `landing-page-react/` (lives on its own branch)

## CI

Release workflow (`.github/workflows/release.yml`):
- Builds for Windows x64/x86/arm64
- Triggered by version tags `v*.*.*`
- Uses pnpm 9, Node 20, stable Rust
