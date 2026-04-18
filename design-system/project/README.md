# Invoker Design System

A design system for **Invoker**, a Bruno-like API client for the web and desktop.
Invoker lets developers create, run, and document HTTP requests using the `.ivk` file format — with inline runnable widgets inside Markdown, environment variables, pre/post/test scripts, and a publishable static docs site.

---

## Products in this system

| Surface | What it is | Status |
|---|---|---|
| **invoker-app** | React + Vite desktop/web client — sidebar + request editor + response panel + docs viewer | Active, v0.1.0 |
| **obsidian-invoker** | Obsidian plugin wrapping the same runtime | Published |
| **invoker-mcp** | MCP server exposing 9 tools to AI agents | Published |
| **Static docs site** | `npm run invoker:build` — publishes any `.ivk + .md` collection as a hostable site | Active |

Only **invoker-app** has a visual surface; everything else consumes the `ivkjs` runtime. The UI kit in this system therefore targets invoker-app.

## Sources consulted

- **Code:** `github.com/doossee/invoker-app` @ `main` — imported into `src_ref/`
  - `src/themes/` — 4 theme tokens (Invoker Dark, Catppuccin Mocha, Tokyo Night, GitHub Dark)
  - `src/styles/globals.css` — ghost-border utilities, CodeMirror decorations, prose styles
  - `tailwind.config.ts` — MD3 surface / text / accent / method color bindings
  - `src/components/**` — Sidebar, UnifiedTree, RequestEditor, ResponsePanel, WelcomePage, IvkBlock, etc.
- **Brief:** the `# Invoker App — Development Progress` notes the user provided (feature list, design evolution, "What's Next")
- **Runtime:** `github.com/doossee/ivkjs` (parser, types — referenced from package.json)
- **Related:** `github.com/doossee/invoker-mcp`, `github.com/doossee/obsidian-invoker`

## Index

| Path | What |
|---|---|
| `README.md` | This file — product context, content fundamentals, visual foundations, iconography |
| `colors_and_type.css` | CSS custom properties (`--ivk-*`) + semantic element styles (h1, p, code, kbd, `.label-caps`, ghost borders) |
| `assets/` | Logos, favicon, brand marks |
| `preview/` | Individual design-system cards (colors, type, spacing, components) shown in the Design System tab |
| `ui_kits/invoker-app/` | Pixel-level recreation of the app — JSX components + interactive `index.html` |
| `src_ref/` | Read-only reference copy of the invoker-app source code |
| `SKILL.md` | Agent skill manifest for using this system |

---

## CONTENT FUNDAMENTALS

**Voice.** Developer-to-developer; dry, confident, zero hype. No marketing adjectives ("blazing-fast", "beautiful", "modern") anywhere in UI or docs. Copy describes what a thing *is* or *does* and stops. Example from `WelcomePage.tsx`: *"Select a request from the sidebar to get started."* — not *"Welcome! Ready to supercharge your workflow?"*

**Person.** Second person is rare. The app addresses the user through labels, not narration: "Open Collection", "New Request", "Send", "Format JSON". The README of the repo itself uses a single-sentence tagline ("A Bruno-like API client for the web.") and moves straight to install instructions.

**Casing.**
- **Title Case** for buttons, tabs, and nav: `New Request`, `Open Collection`, `Manage environments`, `Getting Started`.
- **Sentence case** for secondary helper text and descriptions: *"API Documentation"*, *"Paginated list of all users"*.
- **ALL CAPS** reserved for method badges (`GET`, `POST`, `DEL`) and a few micro-labels (`MD` on markdown files).
- **lower-kebab** for file paths / ids (`auth/login.ivk`, `invoker-dark`).
- **camelCase** for env variables (`baseUrl`, `userName`, `userEmail`, `token`).

**Tone markers.**
- Abbreviates when space matters: `DELETE → DEL`, `DELETE`-method badge is always 3 chars.
- Uses a period in short sentences. Helper sub-copy ends with periods; button labels do not.
- Error copy is blunt, starts with the problem: `"File not found: <path>"`, `"Could not parse: <path>"`, `"Invalid ivk embed: no path: directive found."`
- Status language is numeric where possible: `"2/3 passed"`, `"287ms"`, `"1.4 KB"`, `"status is 200"`. Reads like a log, not a dashboard.

**Emoji.** Essentially none in the UI. The repo README opens with a single `⚡` lightning bolt as the logo glyph; no emoji in product chrome, menus, tooltips, or error states. Icons carry all decorative weight — see Iconography.

**Vibe.** Terminal-adjacent. The app feels like a cousin of Bruno, Postman-without-the-cloud, or a dev-focused Raycast. Low-chroma dark UI, monospaced where data lives, clean sans elsewhere. Copy stays out of the way. If a label is ambiguous (e.g. `Vars` vs `Environment Variables`), Invoker picks the shorter one.

**Concrete examples.**
- Button: `+ New Request` (not "Create a new request" or "➕ Add request")
- Tab: `Scripts` (not "Pre/Post/Test Scripts")
- Toggle: `Run` / `Open` on inline ivk widgets — verbs only
- Empty state: *"Click Send to execute the request"*
- Footer pill: `● production` (colored dot + env name, no label)
- Error toast: *"Could not parse request file."* (12 chars after the period — that's the whole message)

---

## VISUAL FOUNDATIONS

**Overall read.** Desaturated, warm-tinted dark UI with almost no chrome. Near-black backgrounds, warm amber (`#e6c188`) as the single accent, text in neutral warm greys. A **Material Design 3 surface-container hierarchy** (6 levels of elevation, no drop shadows) does all the layering — Invoker pairs this with **ghost borders** (inset 1px semi-transparent box-shadow) instead of hard strokes. Cards and panels float on darker ground; the sidebar is a rounded island.

**Color.**
- One accent, warm amber `#e6c188`. No gradients, no purple-blue. Secondary (`#dbc3a1`) and tertiary (`#ffcdb3`) are near neighbours of the primary — the palette is monochromatic-warm.
- Error is a warm coral (`#f97758`), never a pure red; success a muted green (`#4ae176`).
- HTTP methods each get a dedicated hue (GET green, POST amber, PUT warm-tan, PATCH peach, DELETE coral). Method chips are always `color-mix(primary, 15%)` background + full-strength text — never a flat saturated fill.
- 4 built-in themes (Invoker Dark, Catppuccin Mocha, Tokyo Night, GitHub Dark) all follow the same 6-surface + accent + method structure; only the hex values change.

**Type.**
- **Manrope** 600–800 for display / headlines.
- **Inter** 400–600 for UI and body.
- **JetBrains Mono** 400–500 for code, URLs, headers, body editor, env variable names, response pre.
- Tight tracking on display (`-0.02em` at h1, `-0.01em` at h2); normal on body; slight positive tracking (`+0.1em` uppercase) on micro-labels like `MD`, method badges.
- Common sizes: `10px` micro-labels, `11px` inline meta (ms, KB), `12px` tabs/badges, `13px` most UI text, `14px` body, larger only on welcome/title screens.

**Backgrounds.** Flat. Six surface levels stacked by elevation — never gradients, never images in chrome. Full-bleed imagery isn't part of the product surface at all; the only "hero" graphic is a 64×64 rounded-square tile at `bg-primary/10` holding the lightning-bolt icon on the Welcome screen.

**Animation.**
- Transitions are on colors only (`transition-colors`), ~150ms, no default timing function specified (browser ease).
- Icon spin (`animate-spin`) on loading states is the **only** custom animation.
- No entrance animations, no bounces, no parallax, no reveal-on-scroll. Chevrons rotate on open; that's it.

**Hover / press.**
- Default hover = swap to one surface level up (`surface` → `surface-container` → `surface-high`).
- Text hover = variant → on-surface (lift from muted to primary).
- Accent buttons on hover = `bg-primary/80` (fade, not shift).
- Disabled = `opacity-50` or `/50` suffix on the bg class. No separate disabled color.
- Focus = `border-primary/50` on inputs (`focus:border-primary/50 focus:outline-none`). Never a default browser outline.
- Active file / tab = background jumps to `surface-highest` + a 2px rounded accent bar flush left (`absolute left-0 top-0.5 bottom-0.5 w-[2px] rounded-full bg-primary`). That left-accent pattern repeats for active folder README, active sidebar row, and current tab (bottom edge instead of left).

**Borders.** The system's signature: **ghost borders** — an inset `0 0 0 1px rgba(66,71,84,0.15)` box-shadow, not a CSS border. Softer than hard 1px lines against a near-black background. Four direction variants (`.ghost-border`, `.ghost-border-b/t/r`) let dividers be declared as shadows too. Hard borders exist only around form inputs (`border-outline-variant`) and menus.

**Shadows.** **None.** No drop-shadows on cards, modals, or the sidebar. Elevation is expressed as a lighter surface + a ghost border. The menu popover uses a `shadow-lg` — that is the single concession.

**Radii.**
- `0.375rem` (6px) for tiny chips and badges (`rounded-sm`).
- `0.5rem` (8px) default — buttons, inputs, menu items, code blocks.
- `0.75rem` (12px) for response panels, sub-panels.
- `1rem` (16px) for the floating sidebar island, the welcome hero tile.
- `9999px` (full) for env dots, the active accent bar.

**Cards.** Cards are `bg-surface-container` or `bg-surface-low` + `ghost-border` + `rounded-lg` (or `rounded-xl` for the sidebar). No border color, no shadow. If a card has a header row, it's separated with a `ghost-border-b` internal divider — not a border-bottom.

**Transparency / blur.** Very limited.
- Method-chip backgrounds use `color-mix(in srgb, <color> 15%, transparent)` — so the chip tints pick up whatever surface is behind them.
- Accent backgrounds for active states: `bg-primary/10` or `bg-primary/20`.
- Editor selection: `rgba(230, 193, 136, 0.15)`.
- **No `backdrop-blur` anywhere in the product.**

**Layout rules.**
- No TopBar, no StatusBar. Chrome is minimal by design.
- Sidebar is fixed-width (resizable, stored in `editor-store`), pinned left, rounded-xl island with 12px outer padding from the viewport edge (`p-3`).
- Main content is `flex-1`, full viewport height, no max width. Docs inside the doc renderer cap at `max-w-3xl` / `mx-auto` but the chrome around it is full-bleed.
- The response panel is bottom-docked inside the editor pane, resizable with a 1px `cursor-row-resize` handle (`h-1 hover:bg-primary/30`).
- Tabs are underlined on the active state with a 2px `rounded-full` accent stripe flush to the tab's bottom edge, not the container's.

**Imagery mood.** No photography. No illustration. No gradients. The brand "image" is the product itself — dark chrome + warm amber + monospaced numbers. If imagery is ever needed (e.g. marketing), keep it warm-tinted, low-contrast, film-grainy if anything — but the system assumes zero imagery by default.

**Density.** High. Sidebar rows are `py-2 px-3`. Badges are `16px` tall. Response panel shows status + time + size + tests pass-count on a single row in `text-xs`. This is an IDE, not a consumer app.

---

## ICONOGRAPHY

**System.** Invoker uses **Lucide React** icons exclusively — see `package.json`: `"lucide-react": "^0.468.0"`. The repo's progress notes mention a planned transition to Material Symbols Outlined, but today the entire product is Lucide.

**Distribution.** Icons are imported per-component from the package; no sprite, no icon font. Every icon used in the UI is known:

| Icon | Where |
|---|---|
| `Zap` | Logo + primary brand mark + .ivk file fallback |
| `Plus` | Add buttons (New Request, sidebar +) |
| `Settings` / `Settings2` | Env manager, sidebar footer |
| `ChevronRight` / `ChevronDown` | Folder expand/collapse, dropdown state |
| `Folder` / `FolderOpen` | Tree folder states |
| `FileText` | .md docs in tree |
| `BookOpen` | "folder has README" indicator |
| `Send` | URL bar submit |
| `Loader2` (w/ `animate-spin`) | Loading state for Send, Run |
| `Play` | Run button on inline ivk widgets |
| `ExternalLink` | Open in editor (from doc widget) |
| `CheckCircle` / `XCircle` | Test pass/fail |
| `Terminal` | Console log lines |
| `Globe` | Environment |
| `Code2` | JSON / scripts |
| `FolderOpen` | Welcome: "Open Collection" |
| `Check` | Selected env in dropdown |
| `X` | Close row / dismiss |

**Default sizes.** `14` for most inline uses, `12` for tiny status rows, `16` for welcome-screen feature cards, `32` for the welcome hero. Stroke width is Lucide default (1.5 → rendered as `2` in JSX because the lib passes it through); no custom stroke-width overrides in the codebase.

**Color.** Icons inherit `text-*` colors — `text-outline` for passive, `text-on-surface` on hover, `text-primary` when active. Colored icons are only used for semantic roles (`text-green-400` check, `text-red-400` X, `text-amber-400` folders in the tree).

**Unicode / emoji.** None in the UI. The only non-icon glyphs: `✓` / `✗` (U+2713 / U+2717) used once as escape-sequence strings inside a ternary in `IvkBlock.tsx`, and the `⚡` in the repo README — treat both as incidental, not part of the system.

**Flag — icon CDN.** Lucide is available on CDN at `https://unpkg.com/lucide-static/` (static SVGs) or via the `lucide` npm package; all preview cards in this design system use inline SVG copies sourced from Lucide to stay offline-safe. If you need a Lucide icon not yet included in `assets/icons/`, grab it from https://lucide.dev — names match 1:1.

**Logos.** `assets/logo-bolt.svg` (bolt only, primary amber) and `assets/logo-wordmark.svg` (bolt + "Invoker" in Manrope 800) are the two provided marks. The favicon (`assets/favicon.svg`) is the bolt in the repo's original blue — **flagged**: the live repo favicon uses `#3b82f6` (blue) while the in-product logo is `#e6c188` (amber). The amber is correct; the blue favicon predates the amber rebrand.

---

## Font substitution note

Inter, Manrope, and JetBrains Mono are all on Google Fonts and are loaded via `@import` at the top of `colors_and_type.css`. No local `.ttf` files are committed — if offline/licensed font files are needed for production, ask the user to drop them into `fonts/` and swap the `@import` for a `@font-face` block.

---

## Caveats

- **Favicon color mismatch** (blue in repo vs amber in product) — we've kept both; decide which is canonical.
- **No illustrations or hand-drawn motifs** exist in the repo. The system assumes imagery-free chrome. If marketing needs visuals, they'll have to be designed from scratch consistent with the warm-dark vibe.
- **Light themes are planned but not shipped** (Catppuccin Latte, Tokyo Night Storm, VS Code Light, GitHub Light). The UI kit only covers dark today.
- **Tauri-only features** (Open Collection picker, file watcher) are in the codebase but not demonstrated in the interactive kit — the kit runs in-browser with the sample collection.
