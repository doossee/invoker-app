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

#### ivkjs: `> pre` script `ivk.env.set()` doesn't apply to current-request body resolution
- **Where**: `ivkjs/src/runner/request-runner.ts` → `RequestRunner.run`
- **Action**: Open `playground/04-post-json.ivk`, click Send. The pre-script sets `ivk.env.set("nowIso", new Date().toISOString())`; the body template contains `"joined": "{{nowIso}}"`.
- **Expected**: httpbin echoes `data: { "joined": "2026-05-03T..." }` (real ISO string)
- **Actual**: httpbin echoes `data: { "joined": "{{nowIso}}" }` (literal placeholder)
- **Suspect**: The lifecycle in `request-runner.ts` runs `resolveVariables` (line 29-33) **before** `runPreScript` (line 36). Anything pre sets via `ivk.env.set` only applies to FUTURE requests, never the current one. This contradicts the `EnvManager.get` priority docs which say "runtime (set by `> pre` scripts in the current request) > active environment > collection defaults."
- **Fix**: Swap the order — run pre first, then resolve. Tests must cover: (a) pre `ivk.env.set("X","Y")` then body `{{X}}` sends `Y`; (b) pre direct mutation `ivk.request.headers["X-Added"]="yes"` still works (existing test).
- **Test**: New ivkjs test in `request-runner.test.ts` — pre sets `nowIso`, transport stub asserts body contains the resolved value, not `{{nowIso}}`.

#### `Send` button → `ERR 5ms 0B` instead of response
- **Where**: Any request, observed on `Ovi/invoker/information-service/competition/get-all-standings.ivk`
- **Action**: Click Send (with valid POST request and resolved `{{hostUrl}}`)
- **Expected**: HTTP response in Response panel
- **Actual**: `ERR` indicator, `5ms`, `0B`. Response body shows `1` (empty/placeholder)
- **Suspect**:
  - `getTransport()` returning wrong transport (now `isTauri()` correctly detects Tauri 2 — but maybe `TauriTransport` itself errors)
  - Variable resolution failing — `{{hostUrl}}` resolved to literal/empty
  - Active env mismatch (request expects `dev` env but something else loaded)
  - CORS / network / host resolution
- **Test**: E2E `e2e/send-request.spec.ts` — load sample, click first request, click Send, expect non-zero status OR a real network error message (not silent ERR)

#### `⌘S` → request not persisted to disk (Tauri build)
- **Where**: Any request edit
- **Action**: Edit a request, ⌘S
- **Expected**: File on disk has new content; reopen reflects edit
- **Actual**: UI dispatches `invoker:save` event; `collection-store.saveRequest` exists but `Tauri writeTextFile` not wired → file unchanged on disk
- **Suspect**: Missing `writeTextFile` call in saveRequest path — known feature gap
- **Test**: Integration test mocking `@tauri-apps/plugin-fs.writeTextFile`, asserting it's called with the expected path + content

### 🟠 Major

#### Body format pill (json / raw / form-data / binary / graphql) is decorative
- **Where**: `src/components/editor/RequestEditor.tsx` → `BodyTypePill` + `bodyType` state
- **Action**: Open any request, click `form-data` (or `binary` / `graphql` / `raw`)
- **Expected**: Editor switches surface — e.g. `form-data` shows a `KeyValueTable`, `binary` shows a file picker, `graphql` shows a query/variables split. At minimum the body type should round-trip into the saved `.ivk` (probably as a `@body-type` directive) so the choice survives reload.
- **Actual**: The button visually highlights, but the underlying `<BodyTab>` is unchanged — the same JSON CodeMirror editor stays mounted. `bodyType` is declared in local state and read only by `BodyTypePill`; nothing else in the tree consumes it.
- **Suspect**: Half-built UI from earlier iteration. Either (a) wire `bodyType` through to `<BodyTab>` and switch surface/lang, or (b) remove the pill until the formats are actually supported. Don't ship dead controls.
- **Test**: Unit `RequestEditor.test.tsx` — render with `body: ""` and bodyType="form-data", assert a key/value table is in the DOM (or, if option b, assert the pill isn't rendered for unsupported formats).

#### Settings → Account section is decorative; contradicts "no sign-in" promise
- **Where**: `src/components/modals/SettingsModal.tsx` (Account pane)
- **Action**: Open Settings (cog) → Account
- **Expected**: Either nothing (Invoker is local-first, "no sign-in") or real account flow if cloud sync ever lands.
- **Actual**: Shows a fake user (`doossee` / `ovidevtool@outlook.com` / `Personal plan`), with `Manage`, `Sign out`, and `Create…` (Team workspace) buttons that do nothing on click. Welcome screen tagline is `no sign-in, no sync, no cloud` — directly contradicted by this pane.
- **Suspect**: Stub UI from a design exploration left in.
- **Test**: Unit `SettingsModal.test.tsx` — assert the Account category is not rendered (or, if kept, that buttons have explicit handlers and the rendered email matches a real source, not `import.meta.env` placeholder).

### 🟡 Minor

#### Variable popover overlaps tab bar when token lives at top of the editor (no flip-below fallback)
- **Where**: `src/components/shared/VariableTokens.tsx` → `VariablePopover`
- **Action**: Hover `{{baseUrl}}` in the URL bar of any open request
- **Expected**: Popover appears in a clear region (above OR below the token, whichever has room)
- **Actual**: Popover always positions at `top: rect.top - 8; transform: translateY(-100%)`. When the token is at the top of the viewport (URL bar is the topmost editor element), the popover lands on the tab strip / breadcrumb row.
- **Suspect**: `VariablePopover` style is hard-coded to "above". No measurement-then-flip like `VarTooltip.tsx` does (it falls back to below when below the viewport).
- **Test**: Unit `VariableTokens.test.tsx` — render with the anchor near `clientY=0`, assert the portaled popover ends up below the anchor (or at least not at negative `top`).

#### Variable popover doesn't dismiss on Escape
- **Where**: Same — `VariablePopover` (the hover one used by URL bar / inline blocks)
- **Action**: Hover `{{baseUrl}}`, then press Escape
- **Expected**: Popover closes
- **Actual**: Stays open until you mouseleave both the token and the popover
- **Note**: There's an unused `VarTooltip.tsx` that DOES bind Escape — the wrong component became the live one.
- **Test**: Unit `VariableTokens.test.tsx` — open the popover, dispatch Escape, assert the portal is gone.

#### `⌘W` closes a dirty tab without confirmation (silent data loss)
- **Where**: `src/App.tsx` keyboard shortcut wiring → `closeTab`
- **Action**: Edit a request (e.g. switch Auth from None → Bearer Token), then ⌘W
- **Expected**: Either save-prompt dialog OR keep the tab open until explicit close-anyway
- **Actual**: Tab closes, edit is gone with no warning
- **Test**: E2E `e2e/close-dirty-tab.spec.ts` — open a request, edit it, ⌘W, expect a confirm dialog OR the tab to remain.

#### Dirty marker (•) sticks on tab name after close+reopen with no actual unsaved changes
- **Where**: `src/stores/editor-store.ts` `tabs[].dirty` flag lifecycle
- **Action**: Open `04-post-json`, edit, ⌘W (loses edit), reopen from sidebar
- **Expected**: Tab name `04-post-json` (no dot), SAVE button neutral
- **Actual**: `04-post-json •` with SAVE button highlighted yellow, even though the file content and the tab content are identical
- **Suspect**: `dirty` flag isn't reset when the tab is freshly opened — likely the tab record from the previous session is reused, or the open path doesn't go through a `markClean` step.
- **Test**: Unit `editor-store.test.ts` — open tab, mark dirty, close tab, reopen, expect `dirty === false`.

#### `Params` tab actually shows `@directives`, not URL query parameters
- **Where**: `src/components/editor/RequestEditor.tsx` → `REQUEST_TABS` array
- **Action**: Open any request, click "Params"
- **Expected** (Postman/Insomnia mental model): URL query parameters editor (rows that compose into `?key=value&...`)
- **Actual**: Editor for `@name` / `@description` / `@tag` / `@auth` directives — i.e. file metadata, not URL params
- **Suspect**: The tab is functionally correct but mislabeled. Rename to `Meta` / `Directives` / `Properties`. (Or: add a real Params tab and move directives to a Meta tab.)
- **Test**: Manual / docs PR — this is a naming-and-discoverability change, not a behavioral fix.

### 🔵 Missing features

#### `⌘S` → save .md doc to disk (Tauri build)
- Same gap as Save Request, but for markdown docs in Live mode
- UI dispatches `invoker:save-doc` → `docs-store.saveDoc` returns `Promise<boolean>` but does not call writeTextFile

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
