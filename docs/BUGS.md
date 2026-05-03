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

#### Inline ivk codeblock in standalone .md docs (not folder READMEs) renders as plain text
- **Where**: Welcome.md, tutorial.md, etc. — any standalone markdown doc that uses ` ```ivk ` fenced blocks
- **Action**: Open the Welcome doc → Live mode
- **Expected**: ivk-fenced codeblocks render as runnable cards (the same way they do in folder READMEs)
- **Actual**: Plain monospace `pre` block with no Run button or interaction
- **Suspect**: `MarkdownLivePreview` (or whichever renderer the standalone doc path uses) doesn't have the same `ivk` codeblock substitution that `FolderTabBody` applies. Easy unification target — extract the ivk-rendering branch into a shared component used by both surfaces.

#### Sidebar collapse / expand
- The store already exposes `toggleSidebar` and `sidebarCollapsed` (with localStorage persistence), but no UI surface — no button, no shortcut wiring. Add a chevron to the sidebar header + an Editor → ⌘\ shortcut.

#### Light theme (or system-preference theme)
- All four themes that ship are dark variants (Invoker Dark / Catppuccin Mocha / Tokyo Night / GitHub Dark). Some users want to follow `prefers-color-scheme: light` or pick a daylight palette explicitly. The theme-provider plumbing supports any token set; just need a light preset + Appearance UI to choose it.

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
