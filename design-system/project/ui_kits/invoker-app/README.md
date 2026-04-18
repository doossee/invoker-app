# Invoker App · UI Kit

Click-through recreation of the invoker-app: floating sidebar with unified file tree, request editor with tabs, response panel, and an inline ivk-widget demo inside a Markdown view.

## Files

- `index.html` — interactive demo (sidebar + editor/docs switcher)
- `App.jsx` — top-level shell + screen routing
- `Sidebar.jsx` — rounded-island sidebar with project header, new-request button, file tree, env pill footer
- `UnifiedTree.jsx` — file tree with .ivk + .md, method badges, folder counts, active accent
- `RequestEditor.jsx` — URL bar + tab bar + body + response panel
- `DocView.jsx` — Markdown prose with inline `ivk` widget
- `Welcome.jsx` — welcome screen with keyboard shortcut cards
- `icons.jsx` — inline Lucide icon set (copied SVG paths)

## How it's wired

The interactive version uses local React state to swap between welcome / request / doc views. Sending a request shows a canned success response. The ivk widget Run button reveals the same canned response inline.

This is a **cosmetic** recreation — no real HTTP, no CodeMirror, no Tauri. Pixel fidelity against the code is the goal.
