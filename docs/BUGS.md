# Bug inventory

A living list of known bugs and missing behavior. Each entry below maps to a TDD cycle: write a failing test that reproduces the bug, fix it, the test stays as regression coverage.

**Workflow**:
1. Add a bug to the relevant section
2. Pick one → start a `fix/<topic>` branch
3. Write a failing test (E2E if user-visible flow; integration if cross-component; unit if pure logic)
4. Implement the fix
5. PR → stage
6. Move bug to "Fixed in main" with commit/PR link

**Severity legend**:
- 🔴 **Critical** — blocks a core flow (open, edit, send, save)
- 🟠 **Major** — degrades a flow but workaround exists
- 🟡 **Minor** — cosmetic, polish, edge case
- 🔵 **Missing** — feature gap, not strictly a bug

---

## Open

### 🔴 Critical

#### `Send` button → `ERR 5ms 0B` instead of response (Tauri build)
- **Where**: Any request, observed on `Ovi/invoker/information-service/competition/get-all-standings.ivk`
- **Action**: Click Send (with valid POST request and resolved `{{hostUrl}}`) in the Tauri desktop build
- **Expected**: HTTP response in Response panel
- **Actual**: `ERR` indicator, `5ms`, `0B`. Response body shows `1` (empty/placeholder). Browser-mode Send works correctly with the same sample collection — bug is Tauri-specific.
- **Suspect**:
  - `TauriTransport` itself errors (CORS-bypassed `@tauri-apps/plugin-http` path)
  - Variable resolution differs between transports
  - Active env mismatch (request expects `dev` env but something else loaded)
- **Test**: E2E `e2e/send-request.spec.ts` (browser-mode covers the happy path; Tauri-mode needs a mocked-tauri integration test)

#### `⌘S` → request not persisted to disk (Tauri build)
- **Where**: Any request edit
- **Action**: Edit a request, ⌘S
- **Expected**: File on disk has new content; reopen reflects edit
- **Actual**: UI dispatches `invoker:save` event; `collection-store.saveRequest` exists but `Tauri writeTextFile` not wired → file unchanged on disk
- **Suspect**: Missing `writeTextFile` call in saveRequest path — known feature gap
- **Test**: Integration test mocking `@tauri-apps/plugin-fs.writeTextFile`, asserting it's called with the expected path + content

### 🟠 Major

*(none open — see Recently fixed)*

### 🟡 Minor

*(none open — see Recently fixed)*

### 🔵 Missing features

#### `⌘S` → save .md doc to disk (Tauri build)
- Same gap as Save Request, but for markdown docs in Live mode
- UI dispatches `invoker:save-doc` → `docs-store.saveDoc` returns `Promise<boolean>` but does not call writeTextFile

#### Sidebar tree right-click does nothing (no context menu)
- **Where**: `src/components/collection/UnifiedTree.tsx`
- **Action**: Right-click any request or folder in the sidebar
- **Expected**: A context menu with `Rename / Delete / Duplicate / Open in External / Reveal in Finder` (Tauri) — the standard file-tree affordances.
- **Actual**: The contextmenu event falls through to the row's onClick, so the file just opens. There's no menu, no rename flow, no delete confirm.
- **Notes**: At minimum: Rename + Delete + Duplicate. Reveal-in-Finder is Tauri-only.

#### General settings rows (timeout/redirects/SSL/save history/...) still cosmetic
- **Where**: `src/components/modals/SettingsModal.tsx` → `GeneralPage`
- The `Default request method` row was wired in PR #35 — it actually drives `createInlineTab()`. The remaining rows still render `<Toggle on />` / static `<Select>` with no state binding:
  - Request timeout — should drive a default `@timeout` for sent requests (ivkjs already supports per-request `@timeout` directive)
  - Follow redirects — needs a transport pass-through
  - Verify SSL certificates — needs a transport pass-through
  - Save history — depends on the (not-yet-existent) history feature
  - Open last collection on launch — Tauri-only
  - Check for updates — Tauri-only (updater plugin)
- Wire one row per follow-up PR.

#### System-preference theme (auto-follow `prefers-color-scheme`)
- A daylight palette ships now (Invoker Light, PR #30) but the app doesn't auto-follow `prefers-color-scheme`. Add a third "Auto" choice in Appearance that picks a sensible dark/light preset based on the OS preference and re-evaluates on `change`.

---

## Recently fixed (regression coverage in tests)

| # | Bug | Fix |
|---|---|---|
| ✅ | `Open folder` no reaction in Tauri 2 build | PR #4 — `isTauri()` checks all v1+v2 globals |
| ✅ | `⌘K`/`⌘N`/`⌘W`/`⌘E`/`⌘⇧F` dead on Cyrillic layout | PR #5 — `matchShortcut(e.code)` |
| ✅ | `KeyValueTable` Add button stuck after first click | PR #6 — generate unique `keyN` |
| ✅ | Folder README inline ivk renders as `GET / no body` for `path:` blocks | PR #7 — `resolveInlineIvk` distinguishes path vs source |
| ✅ | Folder README inline ivk Open button → "Could not parse request file" | PR #11 — Open uses `sourcePath`, hidden for direct content |
| ✅ | parseIvk drops multi-line `@description` content into headers/body | ivkjs PR #1 — multi-line directive parsing |
| ✅ | `KeyValueTable` Add button drops rows under rapid/batched clicks | PR #14 — `setPairs(prev => [...prev, …])` functional update |
| ✅ | Body format pill (json / raw / form-data / binary / graphql) is decorative | PR #16 — pill removed; e2e regression locks the absence in |
| ✅ | Variable popover overlaps tab bar; ignores Escape | PR #17 — flip-below positioning + window keydown Escape close |
| ✅ | `Params` tab actually showed `@directives` | PR #18 — renamed to `Meta`; e2e asserts new label is present and old one is gone |
| ✅ | Editor-store close+reopen left dirty marker stale (regression coverage) | PR #18 — `editor-store.test.ts` pins the contract |
| ✅ | ivkjs `> pre` script `ivk.env.set` didn't apply to current request | ivkjs PR #2 (released 0.1.2) + invoker-app PR #20 (dep bump). Now `{{nowIso}}` set by pre resolves in body. |
| ✅ | InlineIvkBlock Run button was a no-op (no HTTP request fired, response placeholder forever) | PR #19 — wired `useRequest` with stable cache key, response renders status + body |
| ✅ | URL bar placeholder advertised "paste cURL…" but no parser existed | PR #22 (placeholder dropped) → PR #24 (real parser ships, placeholder restored honestly) |
| ✅ | Settings → Account section was decorative (fake user, dead Sign-out / Manage / Create) | PR #23 — entire pane removed |
| ✅ | `⌘W` closed a dirty tab without confirmation (silent data loss) | PR #25 — native `window.confirm` prompt; cancel keeps tab open |
| ✅ | Real cURL → request import (Missing → Done) | PR #24 — `parseCurl()` + paste-detect on URL bar; supports `-X` / `-H` / `-d`/`--data*` / `-u`; auto-promotes to POST when `-d` is present |
| ✅ | Editor-tabs row shipped a decorative History clock button (no onClick) | PR #26 — button removed; e2e locks the absence in until a real history surface ships |
| ✅ | Inline ivk codeblock in standalone .md docs (not folder READMEs) rendered as plain text | PR #28 — extracted `InlineIvkBlock` to `@/components/shared`; `MarkdownPreview` + `MarkdownLivePreview` default to `ivkCodeBlockRenderer` so every consumer gets runnable cards |
| ✅ | Sidebar collapse / expand had no UI surface (only the ⌘\ shortcut) | PR #29 — `PanelLeftClose` button in collection-header; pairs with the existing restore button when collapsed |
| ✅ | Light theme: only dark variants shipped | PR #30 — Invoker Light preset + a11y on theme cards (`aria-label`, `aria-pressed`, `data-theme-id`) |
| ✅ | Settings → Keyboard listed `⌘P "Jump to request"` and `⌘⇧T "Run test suite"` but neither was wired | PR #31 — ⌘P aliases to command palette (VSCode/Cursor convention); ⌘⇧T row removed until a collection-wide test runner ships |
| ✅ | Response → Table view: object cells dumped full JSON.stringify; "1 rows" grammar | PR #33 — collapse object cells to `{N keys}` / `[N items]` chips with full JSON on hover; pluralise the row counter |
| ✅ | Settings → AI / Data & sync panes were entirely decorative (no state, no handlers) | PR #34 — both panes removed; surviving panes (General/Appearance/Keyboard) cover the actual local-first surface |
| ✅ | General → Default request method had no backing — it was a hardcoded `Select value="GET"` | PR #35 — `defaultRequestMethod` added to editor-store with localStorage persistence; `createInlineTab` reads it as the fallback. Knock-on fix: inline content now seeds `https://` so a method-only request line doesn't fall back to GET on parse |
| ✅ | Theme picker duplicated between Settings → Appearance and the env-switcher modal | PR #37 — dropped from EnvSettings; Settings → Appearance is the canonical home. Bonus a11y: env-switcher button now has `title` + `aria-label` |
| ✅ | "Export to clipboard" feedback claim was incorrect — `setCopyDone(true)` already toggles the button text to "Copied!" for 2s; the bug was a false read of the screenshot timing during dogfooding. Removed from Open. | n/a — retracted |
| ✅ | Command palette searched docs by path-basename ("README") not user-facing title ("Welcome") | PR #38 — prefer `d.title` over the basename so users can search by what they see in the dashboard / sidebar |

---

## How to add a bug

Copy this template:

```markdown
#### <one-line title>
- **Where**: <route / component / file path>
- **Action**: <exact steps>
- **Expected**: <what should happen>
- **Actual**: <what does happen, with screenshot path if visual>
- **Suspect**: <educated guess at root cause; optional>
- **Test**: <which test will reproduce: e2e/integration/unit + filename>
```

Try to be **reproducible** — no "sometimes broken" entries. If a bug only repros in specific state (e.g. specific env, specific file), say so.
