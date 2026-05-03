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

#### Settings → Account section is decorative; contradicts "no sign-in" promise
- **Where**: `src/components/modals/SettingsModal.tsx` (Account pane)
- **Action**: Open Settings (cog) → Account
- **Expected**: Either nothing (Invoker is local-first, "no sign-in") or real account flow if cloud sync ever lands.
- **Actual**: Shows a fake user (`doossee` / `ovidevtool@outlook.com` / `Personal plan`), with `Manage`, `Sign out`, and `Create…` (Team workspace) buttons that do nothing on click. Welcome screen tagline is `no sign-in, no sync, no cloud` — directly contradicted by this pane.
- **Suspect**: Stub UI from a design exploration left in.
- **Test**: Unit `SettingsModal.test.tsx` — assert the Account category is not rendered (or, if kept, that buttons have explicit handlers and the rendered email matches a real source, not `import.meta.env` placeholder).

#### URL bar placeholder advertises "paste cURL…" but no cURL parser exists
- **Where**: `src/components/editor/UrlBar.tsx` line 87 — `placeholder="Enter URL or paste cURL..."`
- **Action**: Paste a curl command (e.g. `curl -X POST https://httpbin.org/post -H "X-Test: yes" -d '{"hello":"world"}'`) into the URL field
- **Expected**: Method switches to POST, URL becomes `https://httpbin.org/post`, header `X-Test: yes` lands on the Headers tab, body lands on Body tab
- **Actual**: The literal curl string sits in the URL field. Method stays GET. Headers + body untouched. No parser is wired anywhere — `grep -r curl src/` only finds the placeholder string.
- **Fix**: Either (a) implement a cURL parser (handles `-X`, `-H`, `-d`/`--data`, `--data-raw`, `-u`, escaping) and dispatch to method/url/headers/body on paste, or (b) drop the misleading text from the placeholder until the parser lands.
- **Test**: Unit on the parser function (option a) or assert placeholder doesn't mention cURL (option b).

### 🟡 Minor

#### `⌘W` closes a dirty tab without confirmation (silent data loss)
- **Where**: `src/App.tsx` keyboard shortcut wiring → `closeTab`
- **Action**: Edit a request (e.g. switch Auth from None → Bearer Token), then ⌘W
- **Expected**: Either save-prompt dialog OR keep the tab open until explicit close-anyway
- **Actual**: Tab closes, edit is gone with no warning
- **Test**: E2E `e2e/close-dirty-tab.spec.ts` — open a request, edit it, ⌘W, expect a confirm dialog OR the tab to remain.

### 🔵 Missing features

#### `⌘S` → save .md doc to disk (Tauri build)
- Same gap as Save Request, but for markdown docs in Live mode
- UI dispatches `invoker:save-doc` → `docs-store.saveDoc` returns `Promise<boolean>` but does not call writeTextFile

#### Real cURL → request import
- See "URL bar placeholder advertises paste cURL…" above for the full surface.
- A first cut should cover the 80% case: method via `-X`, headers via `-H`, body via `-d`/`--data`/`--data-raw`, basic auth via `-u`. File uploads (`--form` / `-F`) and binary streams can be follow-up.

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
