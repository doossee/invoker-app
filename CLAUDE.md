# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this subproject. Workspace-level rules live in [`../CLAUDE.md`](../CLAUDE.md) — read that too.

## Role in the workspace

Standalone API client built on `ivkjs`, with **three deployment modes from one codebase**:

1. **Tauri desktop app** — real filesystem access, cross-platform native build
2. **Static docs site** — baked from a `.ivk` collection, deployable as plain HTML
3. **Browser demo** — fallback with the sample collection in `src/data/`

All three use the same React UI; the mode differences are gated on runtime checks, not build flags.

## Three-mode runtime

[`src/lib/platform.ts`](src/lib/platform.ts) exposes two flags:

- `isTauri()` — `__TAURI__` on `window`
- `isPublished()` — `__INVOKER_PUBLISHED__` on `window` (injected by the static-site build)

**Code that touches the filesystem or network must branch on these:**

- `isTauri()` → dynamic-import `@tauri-apps/plugin-fs` for real file access; `TauriTransport` for HTTP
- `isPublished()` → load baked `manifest.json` (read-only, no filesystem, no writes)
- fallback → sample collection in `src/data/`, `FetchTransport`

See [`src/lib/file-system.ts`](src/lib/file-system.ts) and [`src/lib/transport.ts`](src/lib/transport.ts) for the canonical patterns — mirror them when adding new surface-area.

## Module layout

```
src/
├── main.tsx                    ← React entry
├── App.tsx                     ← top-level layout, keyboard shortcuts, mode detection
├── components/
│   ├── layout/                 ← Sidebar, TopBar, ResizablePanel, StatusBar
│   ├── editor/                 ← RequestEditor, UrlBar, HeadersTab, BodyTab, ScriptsTab, AuthTab, ResponsePanel, ...
│   ├── collection/             ← UnifiedTree (file browser)
│   ├── docs/                   ← markdown rendering
│   ├── env/                    ← environment UI
│   ├── modals/                 ← CommandPalette, SettingsModal
│   ├── sidebar/
│   ├── welcome/
│   └── shared/primitives.tsx   ← TOKENS, MethodBadge, InvokerMark
├── stores/                     ← Zustand (editor, collection, docs, env)
├── hooks/                      ← useRequest, useEnv, useKeyboardShortcuts, useOpenCollection
├── lib/                        ← platform, file-system, transport, tauri-transport, cm-ivk, manifest-loader
├── themes/                     ← provider + presets (invoker-dark, catppuccin-mocha, github-dark, tokyo-night)
├── data/                       ← sample collection + docs for browser-demo mode
├── styles/
└── types/

src-tauri/                      ← Rust side (Tauri 2.x; plugins: fs, http, dialog, opener, log, updater)
scripts/                        ← build-site.ts (static-site generator), generate-manifest.ts, site-template.html, release.mjs (version bumper), release.test.mjs (node:test)
docs/                           ← RELEASING.md (maintainer runbook), superpowers/{specs,plans} (design + plan docs)
.github/workflows/              ← ci.yml (typecheck + build + tauri-smoke + tests), release.yml (tag-triggered cross-platform release)
```

## Key invariants

**State is Zustand, one store per concern** (`editor-store`, `collection-store`, `docs-store`, `env-store`). Cross-store coordination happens in `App.tsx` effects — keep stores themselves independent; don't import one store from another.

**Path alias `@/` → `src/`** — configured in both `vite.config.ts` and `tsconfig.json`. Use it in imports; don't write `../../../lib/...`.

**Design tokens are CSS variables** (`--ivk-*`) consumed through the `TOKENS` object in [`components/shared/primitives.tsx`](src/components/shared/primitives.tsx). Theme switching swaps CSS variables — never hardcode colors in component styles. Method colors come from `METHOD_PALETTE` in the same file.

**CodeMirror 6** powers the editor (see `src/lib/cm-ivk.ts` for the language definition — adds `{{variable}}` highlighting on top of JSON/JavaScript bases).

**Keyboard shortcuts are global**, wired in `App.tsx`: ⌘K command palette, ⌘↵ send, ⌘W close tab, ⌘E cycle env, ⌘⇧F format JSON. Add new shortcuts there via `CustomEvent` dispatch if a component needs to react, not scattered `keydown` listeners in components.

**Transport is dynamically imported** in Tauri mode so the Tauri API isn't bundled into the browser build — see `src/lib/transport.ts`.

## Commands

```bash
npm install
npm run dev                                   # Vite dev server on :5173 (browser-demo mode)
npm run build                                 # tsc -b && vite build → dist/
npm run preview                               # serve dist/
npm run tauri:dev                             # native desktop app (Rust toolchain required)
npm run tauri:build
npm run invoker:build -- <collection-path> [--out <dir>] [--base <url>] [--title <text>]
npm test                                      # vitest (one-shot, used by CI)
npm run test:watch                            # vitest --watch (use during development)
npm run test:ui                               # vitest UI (browser-based test browser)
npm run release:test                          # node:test for scripts/release.mjs (runs separately)
npm run release -- <version>                  # bump version + commit + tag (does NOT push); see docs/RELEASING.md
```

`invoker:build` runs `scripts/build-site.ts` which scans a `.ivk` collection, writes a manifest, injects it into `index.html`, runs Vite with `__INVOKER_PUBLISHED__` set, then copies artifacts to `--out`.

**CI gates** on `tsc --noEmit`, `npm run build`, `npm test`, `npm run release:test`, and `cargo check` on `src-tauri/` (the `tauri-smoke` job).

## Testing policy

**TDD is required.** Every feature, fix, and refactor lands with tests. Skipping tests is not a tradeoff this project makes — write the failing test first, watch it fail, then make it pass.

### Test runners

Two coexist by design — pick the right one for the file under test:

- **`vitest`** — for React app code (`src/**`). Vite-native, supports JSX/TSX, `jsdom` environment, `@testing-library/react` for component tests. Run with `npm test` / `npm run test:watch` / `npm run test:ui`.
- **`node:test`** — for build-time and release-time scripts (`scripts/release.mjs`, `scripts/release.test.mjs`). Plain Node, no DOM, no JSX. Run with `npm run release:test`. Don't migrate these to vitest — they're CLI tools that should stay independent of the app's test infrastructure.

### Where tests live

Co-locate tests next to the code they cover:

```
src/lib/file-system.ts
src/lib/file-system.test.ts        ← here, not in a separate tests/ dir

src/components/shared/MethodBadge.tsx
src/components/shared/MethodBadge.test.tsx

src/stores/editor-store.ts
src/stores/editor-store.test.ts
```

Vitest picks up any `*.{test,spec}.{ts,tsx}` file under `src/`.

### Coverage expectations

| Code area | Test style | Why |
|---|---|---|
| `lib/`, `hooks/`, `stores/`, pure utils | Unit tests, ≥1 per public function | Pure logic, easy to cover, regressions are silent without tests |
| Components in `components/` | Render-and-interact tests via `@testing-library/react` | Catches accessibility regressions and prop-handling bugs |
| `parseIvk`/`serializeIvk` callers | Round-trip tests with realistic `.ivk` fixtures | The format is a contract — broken parsing breaks everyone's collections |
| Tauri-only paths (anything behind `isTauri()`) | Mocked `@tauri-apps/*` modules | Tauri APIs can't run in `vitest`'s `jsdom` environment |
| End-to-end user flows | At minimum one integration test per flow (open collection, send request, switch env, save file) | These flows touch ≥3 files; unit tests miss the seams |

### Manual verification still required for

Automated tests do not substitute for clicking through the actual surfaces. Before merging a UI-touching change, exercise:

- `npm run dev` → browser at :5173 (browser-demo mode, sample data)
- `npm run tauri:dev` → desktop app (real filesystem + Tauri HTTP)
- `npm run invoker:build -- <collection>` + `npm run preview` → static site (`isPublished()` path)

Changes touching `lib/platform.ts`, `lib/file-system.ts`, `lib/transport.ts`, or anything Tauri-specific MUST be exercised in all three modes before merge — the automated tests cover the logic, the manual passes catch integration with real platform APIs.

## Design handoff

[`design-system/`](design-system/) contains HTML/CSS/JS design prototypes and the chat transcripts that produced them. **Read [`design-system/README.md`](design-system/README.md) and the chats in `design-system/chats/` before implementing UI changes** — they explain what the user actually wants and where iteration landed. Don't render the prototypes in a browser to "figure out" the visuals; read the HTML/CSS directly.

## Releases

Multi-platform Tauri release pipeline lives in [`.github/workflows/release.yml`](.github/workflows/release.yml). Trigger by pushing a `v*` tag — the workflow builds for macOS Intel/ARM, Windows x64, Linux x64 in parallel, signs the updater manifest with `TAURI_SIGNING_PRIVATE_KEY`, and attaches everything to a draft GitHub Release.

For the maintainer-side procedure (cut → push → review → publish, plus recovery and key-rotation), read [`docs/RELEASING.md`](docs/RELEASING.md). The version-bumper (`scripts/release.mjs`) syncs `package.json` / `tauri.conf.json` / `Cargo.toml` atomically — never edit any of them by hand for a release.
