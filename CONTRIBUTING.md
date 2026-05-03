# Contributing to Invoker

Thanks for taking an interest. This doc covers the day-to-day workflow.

## Quick start

```bash
git clone https://github.com/doossee/invoker-app.git
cd invoker-app
npm install
npm run dev          # browser-demo mode at http://localhost:5173
npm run tauri:dev    # desktop app (needs Rust toolchain)
npm test             # vitest, runs ~50 tests in <1s
```

## Branch model

Two long-lived branches:

| Branch | Role | Who pushes |
|---|---|---|
| **`stage`** | Default. All feature PRs land here. CI runs on every push. | Everyone (via PR) |
| **`main`** | Production. Updated only when cutting a release: `stage` → PR → `main` → tag `v*`. | Maintainers (via PR) |

Short-lived branches (delete after merge):

- `feat/<topic>` — new functionality
- `fix/<topic>` — bug fix
- `chore/<topic>` — refactors, dep bumps, infra
- `docs/<topic>` — docs-only changes
- `ci/<topic>` — workflow changes

```
feat/X       → PR → stage      (1 PR per change, CI must pass)
              ... accumulate ...
stage        → PR → main        (release candidate)
main         → tag v0.2.0       (release.yml fires automatically)
             → review draft → Publish on GitHub Releases
```

## Conventional Commits

Required. Title under 70 chars. Format:

```
<type>(<optional-scope>): <subject>

<body — wrap at 72 chars, explain WHY not WHAT>
```

Types we use: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `style`, `ci`.

Examples:

```
feat(palette): add fuzzy match across docs and requests
fix(tauri): detect Tauri 2 runtime so Open Folder fires
docs: add CONTRIBUTING.md
chore(deps): bump @codemirror/state to 6.5.1
```

## Test policy — TDD required

Every feature, fix, and refactor lands with tests. Skipping tests is not a tradeoff this project makes — write the failing test first, watch it fail, then make it pass.

- React components, hooks, stores, lib utils → **`vitest`** (`npm test`)
- Build / release CLI scripts (`scripts/release.{mjs,test.mjs}`) → **`node:test`** (`npm run release:test`)

Tests live next to the code they cover: `Foo.tsx` ↔ `Foo.test.tsx`. Vitest finds anything matching `*.{test,spec}.{ts,tsx}` under `src/`.

What we cover:

| Area | Style | Why |
|---|---|---|
| `lib/`, `hooks/`, `stores/`, pure utils | Unit, ≥1 per public function | Pure logic; regressions are silent without tests |
| `components/` | Render-and-interact via `@testing-library/react` | Catches a11y and prop-handling bugs |
| Tauri-only paths (anything behind `isTauri()`) | Mocked `@tauri-apps/*` modules | Tauri APIs can't run in jsdom |

Manual verification still required before merging UI-touching changes:

- `npm run dev` → browser-demo mode
- `npm run tauri:dev` → desktop, exercises real filesystem + Tauri HTTP
- `npm run invoker:build -- <collection>` + `npm run preview` → published static site

## Branch protection (enforced on `stage` and `main`)

- ✅ PR required (no direct push)
- ✅ CI must pass (`build` + `tauri-smoke` jobs green)
- ✅ Linear history (squash merges only — keeps `git log` clean)
- ✅ Required conversation resolution
- ❌ No force push, no deletion

For solo/small-team work no approving review is required — the policy is in place so it can be enabled when more contributors join without re-doing the setup.

## Code style

ESLint and TypeScript strict mode are the source of truth. Don't disable rules to silence a warning:

- If the rule is wrong for a line, add a targeted `// eslint-disable-next-line <rule-name> -- <reason>` with a concrete reason. Blanket `/* eslint-disable */` is not acceptable.
- If the rule is wrong for the project, change it in `eslint.config.mjs` and explain in the PR.
- No new `any`. No `@ts-ignore` without a `-- <reason>` explanation.

Before pushing:

```bash
npm test               # vitest
npx tsc --noEmit       # typecheck
npm run build          # production bundle check
npm run release:test   # release CLI tests
```

CI runs the same set, so a failure locally is a failure on the PR.

## Reporting bugs

Open an issue at https://github.com/doossee/invoker-app/issues with:

1. What you tried (steps)
2. What you expected
3. What you saw (screenshots help)
4. Build mode (`npm run dev` / `tauri:dev` / installed `.dmg`)
5. Platform (macOS Apple Silicon / macOS Intel / Windows / Linux distro)

For Tauri-side issues, the Console output (View → Toggle Developer Tools in `tauri:dev`) is gold.

## Releasing (maintainers only)

See [`docs/RELEASING.md`](docs/RELEASING.md) for the cut → review → publish flow. TL;DR: the release pipeline is tag-triggered (`v*`) on `main`, builds 4 platforms in parallel, and produces a draft GitHub Release for manual publish.

## Out of scope for now

- Code signing (Apple Dev Cert, Windows EV) — accepted Gatekeeper / SmartScreen warnings until usage justifies the cost
- Auto-publish releases — every release is reviewed by hand
- Pre-release / beta channels — single stable channel; can be added later

Open an issue if any of these would change your willingness to use the project. Real signal can re-prioritize.
