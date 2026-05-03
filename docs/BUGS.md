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

#### `KeyValueTable` Add button drops rows under rapid/batched clicks
- **Where**: `src/components/shared/KeyValueTable.tsx` → `addRow`
- **Action**: Click Add 3 times rapidly (or programmatically dispatch 3 click events in the same task tick — what happens during keyboard mash, double-click misfire, automation, or React batched updates)
- **Expected**: 3 new empty rows appear
- **Actual**: Only 1 row appears (sometimes 2 depending on React's batching threshold)
- **Suspect**: `addRow` reads `pairs` from the closure (`setPairs([...pairs, ...])`) instead of using the functional setter (`setPairs(prev => [...prev, ...])`). When React batches consecutive clicks before re-rendering, every queued update sees the stale captured `pairs` and the last write wins.
- **Test**: Unit `KeyValueTable.test.tsx` — `fireEvent.click` 3× in sync, assert 3 rows in DOM. The existing `multiple Add clicks` test passes because it uses `await userEvent.click` which yields between clicks; this regression catches the synchronous-batched case.

### 🟡 Minor

*(populated by user / inspection)*

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
