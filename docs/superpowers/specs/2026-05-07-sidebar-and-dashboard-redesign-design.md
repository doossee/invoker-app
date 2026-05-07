# Sidebar + Dashboard Redesign — Design

- **Date**: 2026-05-07
- **Status**: Approved (design phase) — implementation pending
- **Owner**: Doston Kamilov (`doossee`)
- **Subproject**: `invoker-app/`
- **Repository**: <https://github.com/doossee/invoker-app>

## Context

`invoker-app` is the Tauri/React build of Invoker. PR #88 ("create files/folders + VSCode-style toolbar") landed an icon toolbar `[+] [↻] [×]` directly under the sidebar's search row. While reviewing the build against a real 463-request collection, the user surfaced three independent critiques:

1. **The toolbar icons are not informative and placed wrong.** Three unlabeled glyphs floating below the search read as a settings cluster but act as three independent commands. Hover tooltips are the only hint of meaning.
2. **The chrome has too many surface layers.** The sidebar stacks panel → search-bar surface → search-bar inset → toolbar inset → tree, plus the divider above the toolbar. Claude Desktop achieves the same goals with two surfaces (panel + hover-row tint).
3. **The CollectionDashboard is decorative, not functional.** With 463 requests + 85 docs the bento shows 5 POSTs (rest hidden behind "458 more in sidebar") and three duplicate `README` entries. The right column is mostly empty space. The dashboard tells the user information they already know (count) and hides what they actually want (which file to open next).

Investigation of the design system source (`design-system/project/redesign/MainShellPrimary.jsx`) revealed that the original prototype **never had the icon toolbar** — it specified a single full-width `+ New Request ▾` split-button. PR #88 invented the icon cluster. The implementation drifted from the spec.

This design specifies a coordinated rebuild of the sidebar and the no-active-tab homepage surfaces (`CollectionDashboard` + `WelcomePage`) that brings the implementation back in line with the design system's intent, adopts Claude Desktop's chrome restraint, and turns the dashboard into a functional jumping board for daily use.

## Goals

1. **Restore design system fidelity for the sidebar.** Replace the icon toolbar with the prototype-specified labeled `+ New…` row + popup. Move refresh / collapse-all / change-folder into a kebab on the collection header.
2. **Reduce chrome density.** Sidebar surface count drops from 4 layers (panel + search-surface + toolbar-surface + tree-row-hover) to 2 (panel + hover-row).
3. **Make the dashboard useful.** `CollectionDashboard` becomes a two-column **Pinned + Recent** jumping board, replacing the bento.
4. **Trim the welcome page's redundancy.** `WelcomePage` keeps the bento + learn cards, drops the duplicate top-right CTAs and tones down the hero. The empty-state sidebar collapses to header + footer + a one-line hint.
5. **Single typography accent system.** Drop JetBrains Mono caps from tile section labels (keep mono for code/inline literals only). Manrope for the welcome headline; Inter everywhere else.
6. **Two new persistent stores: pinned + recent.** Both keyed per-collection-path in `localStorage`. Pinned is user-curated (right-click → Pin); recent is auto-tracked on tab open.

## Non-goals (explicit)

- **Run history.** Tracking last-run timestamp / status / latency per request is a separate feature with its own data-model concerns (response cache overlap, eviction, persistence). Will be specced separately.
- **Per-collection git-syncable pin file.** Pins live in `localStorage` keyed by collection path. Migrating to a `.invoker/pinned.json` file (so pins sync via git when teammates clone) is a future option, not part of this redesign.
- **Most-used / frequency-based ranking.** Recent is strict LRU by access time; no usage scoring.
- **Visual redesign of the request editor, response panel, modals, or env settings.** Out of scope; this targets sidebar + the two no-active-tab surfaces only.
- **Theme/token color overhaul.** The existing CSS variables in `themes/` stay. We're changing how many TOKEN levels each surface uses, not the values.
- **Drag-to-reorder pins.** Pins are a flat list in pin-time order. Reordering can be added later if asked.

## Architecture

### Surface inventory

| Surface | Today | Target |
|---|---|---|
| Sidebar | Header / Search / `[+ ↻ ×]` toolbar / Tree / Footer | Header (with kebab) / Search (flat) / `+ New…` row / Tree / Footer |
| Sidebar (empty state) | Same as above + "No collection loaded" hero block + Open folder + Try sample buttons | Header / one-line hint / Footer |
| `CollectionDashboard` | Hero + 4-tile bento + recent entries + learn cards | Compact hero + two-column Pinned \| Recent |
| `WelcomePage` | Hero + 4-tile bento + learn cards + top-right CTAs | Compact hero + 4-tile bento + learn cards (no top-right CTAs) |

### Sidebar — final structure

```
┌──────────────────────────────────────────┐
│  ⌖  invoker            463·85·77    ⋯    │  ← CollectionHeader (kebab right)
│     /Users/.../invoker                    │
├──────────────────────────────────────────┤
│  ⌕  Search requests…              ⌘ K   │  ← flat (no inset, no s3 bg)
│  ──────────────────────────────────────  │
│  ＋ New…                            ⌘N  │  ← labeled row + popup
│  ──────────────────────────────────────  │
│  📁 _samples                         11  │
│  📁 billing-service                  20  │
│  📁 clinic-service                  233  │
│   …                                       │
├──────────────────────────────────────────┤
│  ● dev ▾                             ⚙   │  ← Footer (unchanged)
└──────────────────────────────────────────┘
```

The collection-header kebab opens a menu with: **Refresh from disk**, **Collapse all folders**, **Change folder…**. (Three items only — "Refresh" and a hypothetical "Reload" would be redundant; pick one verb.)

The `+ New…` row click opens the existing Postman-style popup (Request / Doc / Folder). Existing `useEditorStore.createInlineTab()` and the create-files actions in `collection-store` / `docs-store` are unchanged.

### Sidebar — empty state structure

When `collectionPath === null` (no collection loaded):

```
┌──────────────────────────────────────────┐
│  No collection                            │
│  Open a folder to start                   │
├──────────────────────────────────────────┤
│                                            │
│   Open a folder from the welcome screen.  │  ← single fg2 line, vertically centered
│                                            │   in the space normally taken by the tree
├──────────────────────────────────────────┤
│  ● dev ▾                             ⚙   │
└──────────────────────────────────────────┘
```

The "Open folder" / "Try sample" actions live exclusively in the welcome page's bento, removing the parallel-paths bug.

### CollectionDashboard — final structure

```
┌────────────────────────────────────────────────────────────────────┐
│  ⌖  invoker     463 reqs · 85 docs · 77 folders                    │  ← compact hero (32px)
│                                                                     │
│  ★ PINNED  3                       │  ↻ RECENT  12                  │
│  POST  login           auth/       │  GET  list           5m        │
│  GET   users           users/      │  POST create         12m       │
│  📁    patient-service 39 files    │  PUT  update         1h        │
│                                    │  DEL  remove         3h        │
│                                    │  GET  retrieve       1d        │
│                                    │  …                              │
└────────────────────────────────────────────────────────────────────┘
```

Two columns, equal width, 24px gap. Stacks under 700px viewport width.

Section labels (`★ PINNED 3` / `↻ RECENT 12`) use Inter small-caps bold (`font-variant: small-caps; font-weight: 600`) — matching the typography goal of dropping JetBrains Mono caps from non-code labels.

**Empty-state copy:**
- Pinned (0 items) → `"Pin a request from the sidebar (right-click → Pin)"` — single fg2 line, no card chrome.
- Recent (0 items) → `"Open a request to start building history."`

### WelcomePage — adjustments

Keeps the existing bento + learn-card structure. Changes:

| Element | Today | Target |
|---|---|---|
| Logo tile | 56px | 40px |
| Headline | `34px / 700` Manrope | `26px / 600` Manrope |
| Tagline body | `15px` | `13px` |
| Top-right CTAs | `[Docs]` + `[+ New request]` | *removed* (bento has equivalents) |
| Tile section labels | JetBrains Mono caps | Inter small-caps bold |
| `LEARN · 3 MIN` divider | JetBrains Mono | Inter small-caps |
| Code literals (`.ivk`, `README.md`) | JetBrains Mono | unchanged (still mono) |

### Pinned + Recent stores

Both follow the existing Zustand-per-concern pattern.

**`pinned-store.ts`:**

```ts
interface PinnedState {
  pinnedPaths: string[];                // order-preserving; pin-time order
  pin: (path: string) => void;
  unpin: (path: string) => void;
  togglePin: (path: string) => void;
  isPinned: (path: string) => boolean;
  setCollectionPath: (path: string | null) => void;  // swap localStorage key
}
```

**`recent-store.ts`:**

```ts
interface RecentEntry { path: string; openedAt: number; }

interface RecentState {
  recent: RecentEntry[];                // LRU; head is most recent
  markOpened: (path: string) => void;   // moves to head, trims to capacity
  setCollectionPath: (path: string | null) => void;
}
const RECENT_CAPACITY = 15;
```

A `clear()` action is intentionally omitted — there's no UI surface for it in this redesign and YAGNI applies. Add it when a "Clear recent" menu item is specced.

**Persistence:**
- localStorage keys: `invoker.pins.<collectionPath>` and `invoker.recent.<collectionPath>`.
- Both stores subscribe to `collection-store.collectionPath` changes via `setCollectionPath`. On change, the store reloads from `localStorage[<new key>]` (or empty if no entry).
- For sample / published collections (`(sample)` / `(published)`), pins and recent still persist — the path string is stable for those modes.
- localStorage shape: JSON-serialized array (pinned) / array of `{path, openedAt}` (recent). Bad/missing data → start empty (no throw, follows the corruption-defense pattern from PR #78/#79).

**Wiring into existing flows:**
- `editor-store.openTab(path)` → calls `useRecentStore.getState().markOpened(path)` after the tab is opened (one new line).
- `UnifiedTree` right-click context menu (existing in `kind: 'ivk'` and `kind: 'folder'` discriminated cases) gains a "Pin" / "Unpin" item. Visibility decided by `pinnedStore.isPinned(node.path)`.

### Component boundaries

```
src/components/layout/Sidebar.tsx
├── Sidebar (top-level shell; branches on collectionLoaded)
├── CollectionHeader (extends with kebab menu)
├── SidebarSearch (flattened — no inset, no s3 bg)
├── NewItemRow (NEW — replaces SidebarToolbar)
└── EmptySidebar (NEW — empty-state branch)

src/components/welcome/CollectionDashboard.tsx
└── Full rewrite — hero + PinnedColumn + RecentColumn

src/components/welcome/WelcomePage.tsx
└── Trim hero, drop top-right CTAs

src/components/welcome/PinnedColumn.tsx (NEW)
src/components/welcome/RecentColumn.tsx (NEW)

src/stores/pinned-store.ts (NEW)
src/stores/recent-store.ts (NEW)

src/components/shared/primitives.tsx
└── TileHeader: swap JetBrains Mono caps → Inter small-caps bold
```

## Data flow

1. **App boots** → `App.tsx` reads last-collection-path from localStorage → `collection-store.loadCollection()` fires → `pinned-store` and `recent-store` subscribe to `collectionPath` change and rehydrate from their per-collection localStorage keys.
2. **User opens a tab** (sidebar click, palette, recent click, pinned click) → `editor-store.openTab(path)` → tab opens AND `recent-store.markOpened(path)` runs.
3. **User pins from right-click** → `UnifiedTree` context menu fires `pinned-store.togglePin(path)` → store updates + persists → `CollectionDashboard`'s `PinnedColumn` re-renders via Zustand subscription.
4. **User changes collection** → `collection-store.setCollectionPath(newPath)` → both new stores see the change via subscription, switch their localStorage key, rehydrate.

## Error handling

- **localStorage unavailable / quota exceeded.** Both stores wrap reads in try/catch returning empty initial state. Writes in try/catch logging to console; UI still works in-memory for the session.
- **Stale path in pins or recent (file deleted on disk or not in the loaded collection).** Stale = `path` not present in `collection-store.files` and not in `docs-store.docs` and not a known folder prefix. Render row in muted fg3 with a faint `(missing)` suffix; clicking still attempts open and falls through to the editor's existing "file not found" tab body. Right-click → Remove pin (manually clean up) or Remove from recent. No automatic eviction — explicit user action only, so a later `git pull` that re-adds the file restores the entry without the user losing the pin.
- **JSON parse failure on rehydrate.** Treat as empty state, log once to console. Matches PR #78/#79 corruption-defense pattern.

## Testing

Per `invoker-app/CLAUDE.md` — TDD required. All new logic gets `vitest` coverage; UI gets `@testing-library/react` render-and-interact tests; one new e2e spec for the create-flow selectors that change.

| Module | Test file | Coverage |
|---|---|---|
| `pinned-store.ts` | `pinned-store.test.ts` | pin / unpin / toggle / isPinned; persistence round-trip; collection swap; corrupt-localStorage → empty start |
| `recent-store.ts` | `recent-store.test.ts` | markOpened ordering; LRU trim at 15; persistence round-trip; collection swap; corrupt-localStorage → empty start |
| `Sidebar.tsx` (kebab + new row) | `Sidebar.test.tsx` (extend) | Kebab menu opens / items dispatch; `NewItemRow` ⌘N shortcut wiring; empty-state branch renders only when no collection |
| `CollectionDashboard.tsx` | `CollectionDashboard.test.tsx` (rewrite) | Renders both columns; empty pins shows hint; empty recent shows hint; row click opens tab; pinned-stale row shows muted style |
| `WelcomePage.tsx` | `WelcomePage.test.tsx` (extend) | Top-right CTAs absent; smaller hero dimensions present |
| `UnifiedTree.tsx` (Pin / Unpin item) | `UnifiedTree.test.tsx` (extend) | Pin item appears for ivk / md / folder; toggles pinned-store state; label flips Pin → Unpin based on state |

E2E (`@playwright/test`):
- `e2e/sidebar-create-menu.spec.ts` — adapt selectors (icon `+` button → labeled `+ New…` row).
- `e2e/dashboard-pinned-recent.spec.ts` (NEW) — load sample collection, open a request from sidebar (verifies recent updates), right-click → Pin (verifies pinned column updates), reload page (verifies persistence).

## Migration / rollout

Feature-flag-free. PR count is a plan-level decision (one large PR or split into "stores", "sidebar", "dashboard"). Existing users:
- Lose the icon toolbar and the bento dashboard. Both have direct replacements that do the same jobs more clearly.
- Gain Pinned + Recent stored under new localStorage keys (`invoker.pins.*` / `invoker.recent.*`). No conflict with any existing keys.
- The popup for `+ New…` is functionally identical to PR #88's create popup — only the trigger changes shape (icon button → labeled row).

No data migration needed.

## Open questions

None at design time — all decisions surfaced during brainstorming were closed by the user. Implementation may surface secondary questions (e.g. exact px values for Inter small-caps replacement); those are plan-level concerns.

## References

- Design system source (sidebar prototype): `design-system/project/redesign/MainShellPrimary.jsx` lines 365–453 (`ShellSidebar`, `CollectionSwitcher`, `SidebarSearch`, `NewItemSplit`)
- Design system source (welcome prototype): `design-system/project/redesign/WelcomePrimary.jsx`
- Design system bundle README: `design-system/README.md`
- Design system iteration transcript: `design-system/chats/chat1.md`
- Implementation drift PR: <https://github.com/doossee/invoker-app/pull/88>
- Earlier corruption-defense pattern: PR #78 / PR #79 (localStorage shape validation)
