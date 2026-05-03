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

*(none open — see Recently fixed)*

### 🟠 Major

*(none open — see Recently fixed)*

### 🟡 Minor

*(none open — see Recently fixed)*

### 🔵 Missing features

#### Sidebar tree context menu — folder + .md doc support
- File-level (.ivk) Rename + Delete now work in both browser-mode
  in-memory (PR #48) and Tauri on disk (PR #51).
- Folder + .md doc context menus still pending — folder rename has to
  move N child files; doc rename has to decide whether `title` follows
  or stays.

#### General settings rows (redirects/SSL) still cosmetic
- **Where**: `src/components/modals/SettingsModal.tsx` → `GeneralPage`
- Already wired through to behaviour:
  - Default request method (PR #35) — drives `createInlineTab()`
  - Request timeout (PR #40) — injected as `@timeout` directive when the request didn't declare one
  - Open last collection on launch (PR #41) — auto-opens sample/Tauri folder on next launch
- Still cosmetic — render `<Toggle on />` with no state:
  - Follow redirects — needs a transport pass-through (fetch's `redirect: 'manual'` opt-out)
  - Verify SSL certificates — Tauri-only (browser fetch can't disable)
- (Save history / Check for updates were dropped in PR #55 — no feature
  to wire to.)

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
| ✅ | General → Request timeout had no backing | PR #40 — `defaultTimeoutSec` in editor-store with localStorage + clamp; useRequest injects `@timeout` directive when the request didn't set one. Per-request directive still wins. |
| ✅ | General → Open last collection on launch had no backing | PR #41 — auto-open effect on App mount: re-loads `(sample)` (browser-demo) or re-`loadCollection()` (Tauri) of the most-recent path, with stale-path defensive clear |
| ✅ | Response Body pill: hardcoded "application/json" label + decorative Copy/Search buttons | PR #42 — content-type label reads from response.headers; Copy now wired to `clipboard.writeText`; Search dropped (would need real find-in-body editor surface) |
| ✅ | System-preference theme (auto-follow `prefers-color-scheme`) | PR #44 — `Follow system theme` toggle in Appearance subscribes to `matchMedia('(prefers-color-scheme: light)')` and re-picks `invoker-light` / `invoker-dark` on `change`. Picking an explicit theme via swatch turns it off (VSCode/GitHub/Linear convention). |
| ✅ | `Send → ERR 5ms 0B` showed nothing about WHY (was reported as Tauri-only Critical, but reproduces in browser-mode too) | PR #46 — when `response.status === 0`, render the transport's `error` in a red tile in the Body view with a short explanation listing common causes (DNS / CORS / malformed URL / offline / Tauri plugin perms). Whatever Tauri-side issue caused the original report is now diagnosable from the UI instead of mysterious. |
| ✅ | Sidebar tree right-click did nothing (no context menu) | PR #48 — right-click on a request opens a small Rename / Delete menu near the cursor. Browser-mode in-memory only; Tauri disk integration tracked as a follow-up Missing entry. |
| ✅ | `⌘S` → request not persisted to disk (Tauri build) **AND** `⌘S` → save .md doc to disk (Tauri build) | PR #49 — root cause was Tauri 1-only detection (`'__TAURI__' in window`) in both `saveRequest` and `saveDoc`; Tauri 2 sets `window.isTauri` + `window.__TAURI_INTERNALS__` instead. Replaced both inline checks with the shared `isTauri()` helper (same fix pattern as PR #4 / "Open folder"). 10 tests mock `@tauri-apps/plugin-fs.writeTextFile` and toggle each window flag in turn. |
| ✅ | Sidebar Rename / Delete didn't move/remove the underlying `.ivk` on disk in Tauri builds (PR #48 was browser-only) | PR #51 — `renameFile` / `deleteFile` are now async and `await` `@tauri-apps/plugin-fs.rename` / `.remove` BEFORE the in-memory mutation, so a fs error aborts before the store diverges from disk. 16 tests pin the Tauri 1+2 detection, virtual-path opt-out, trailing-slash path joining, fs-throws-aborts, and inline files staying off disk. |
| ✅ | Welcome page "Recent" tile was hardcoded fake content (`OVI Internal / Stripe Playbook / Acme Webhooks`) — title attribute admitted "wiring pending" | PR #53 — tile dropped; bottom-row Palette tile widened to span 3 cols so the bento grid stays balanced (3+3 / 6). |
| ✅ | Settings → Appearance → "Reduce motion" was a decorative `<Toggle />` (no state, no handler) sitting next to the working "Follow system theme" toggle | PR #54 — row dropped; would need to gate every CSS transition on `prefers-reduced-motion` to do real. |
| ✅ | Settings → General → "Save history" + "Check for updates" were both decorative (no history feature, no Tauri updater) | PR #55 — both rows dropped. "Follow redirects" / "Verify SSL certificates" still tracked separately as cosmetic-but-wireable in BUGS.md. |
| ✅ | Response → Cookies tab was always rendered as a static empty state (`<CookiesView />` had no props), ignoring any Set-Cookie headers from Tauri responses | PR #56 — new `lib/parse-cookies.parseSetCookie` (12 unit tests covering RFC 6265 §4.1.1 attributes + multi-cookie blobs + comma-in-Expires-date edge case); `CookiesView` accepts headers + `isBrowserMode`, renders a name/value/path/domain/expires/flags table, and the empty-state explains in browser-mode why Set-Cookie isn't visible (forbidden response header per Fetch spec). |
| ✅ | AuthTab Basic Auth password field rendered as plaintext (`<input type="text">`) | PR #57 — switched to `type="password"`. Bearer token field stays as `text` so users can verify `{{token}}` placeholders (matches Postman / Insomnia / Bruno convention). |
| ✅ | Env-switcher's "Manage environments" button opened a modal titled "Settings" — misleading since the surface is env-only (theme picker moved to Settings → Appearance in PR #37) | PR #58 — modal title renamed to "Environments" matching the trigger label; redundant inner section header dropped. |
| ✅ | EditorTabs "+" new-tab button had `title="New tab"` + Plus icon but no `onClick` — clicking it did nothing | PR #59 — wired to `createInlineTab()` (same store action used by welcome's "+ New request" / dashboard's "Create" / ⌘N shortcut); added `aria-label` for screen readers. |

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
