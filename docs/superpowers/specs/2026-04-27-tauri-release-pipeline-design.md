# Tauri Release Pipeline — Design

- **Date**: 2026-04-27
- **Status**: Approved (design phase) — implementation pending
- **Owner**: Doston Kamilov (`doossee`)
- **Subproject**: `invoker-app/`
- **Repository**: <https://github.com/doossee/invoker-app>

## Context

`invoker-app` is the Tauri desktop build of Invoker — a git-native API workspace where requests live as plain `.ivk` files alongside code. The codebase already produces a working desktop build via `npm run tauri:build`, but there is no release pipeline: every artifact must be built and uploaded by hand from a single developer's machine, on a single platform, without versioning discipline. There are no native installers published to GitHub Releases, no auto-update mechanism, and `Cargo.toml` metadata is the Tauri scaffold default (`authors = ["you"]`, `description = "A Tauri App"`).

This design specifies a tag-triggered GitHub Actions release pipeline that produces signed-for-update installers for macOS Intel, macOS Apple Silicon, Windows x64, and Linux x64, attached to a draft GitHub Release for the maintainer to review and publish.

## Goals

1. **Single-command release.** Maintainer runs `npm run release <version>` locally, pushes the tag, and GitHub does the rest.
2. **Cross-platform from one workflow.** macOS Intel + macOS Apple Silicon + Windows + Linux build in parallel from a tag push.
3. **Auto-update foundation.** Each release ships a `latest.json` manifest signed with a Tauri updater key, so the v1 release can ship the updater plugin and v0.2+ users get update prompts automatically.
4. **Human-in-the-loop publishing.** Workflow creates a *draft* release; maintainer writes notes and clicks Publish.
5. **Catch Tauri-side regressions in PRs.** Existing `ci.yml` typechecks + builds the web bundle on every PR; we extend it with a fast `cargo check` so Rust-side breakage is caught before someone tags a release.
6. **Zero recurring cost.** No Apple Developer membership, no Windows EV certificate, no third-party CDN.

## Non-goals (explicit)

- **Code signing & notarization.** macOS Gatekeeper and Windows SmartScreen warnings are accepted for v1. Users right-click → Open / "Run anyway". The audience is technical (programmers using an API client) and tolerates this; investing in certificates is deferred until usage justifies the cost and complexity.
- **Mobile builds (iOS/Android).** Out of scope for this pipeline.
- **Snap, Flatpak, or RPM packaging.** `.deb` and `.AppImage` cover ~95% of Linux desktop usage.
- **Pre-release / beta channels.** One stable channel; can be added later without breaking changes.
- **Auto-publish.** Every release is reviewed by hand. Auto-generated release notes can be triggered later if review fatigue justifies it.
- **In-app "Check for updates" button.** Updater will run on app launch only for v1; explicit Settings UI for manual checks is deferred.
- **Cross-subproject coordination.** This pipeline only releases `invoker-app`. The `ivkjs`, `obsidian-invoker`, and `invoker-mcp` repositories are independent and out of scope.

## Architecture

### Release flow

```
Maintainer machine                       GitHub
─────────────────                       ──────
$ npm run release 0.2.0
  ├─ writes 0.2.0 to:
  │    - package.json
  │    - src-tauri/tauri.conf.json
  │    - src-tauri/Cargo.toml
  │    + cargo update -p app  → Cargo.lock
  ├─ git commit "chore: release v0.2.0"
  └─ git tag -a v0.2.0

$ git push --follow-tags  ─────────────► tag v0.2.0 received
                                                │
                                                ▼
                                          release.yml triggered
                                                │
       ┌────────────┬──────────────┬────────────┴─────────────┐
       ▼            ▼              ▼                          ▼
   macos-13     macos-14      windows-latest             ubuntu-22.04
   Intel        Apple Silicon Windows x64                Linux x64
       │            │              │                          │
       └─ tauri-action@v0 ─────────┴──────────────────────────┘
                  │
                  │  - first job: creates DRAFT release if none exists
                  │  - each job: builds Tauri bundles
                  │  - each job: signs updater manifest with TAURI_SIGNING_PRIVATE_KEY
                  │  - each job: uploads its bundles + signatures to draft
                  ▼
        Draft GitHub Release v0.2.0
        ├── Invoker_0.2.0_x64.dmg              (mac Intel)
        ├── Invoker_0.2.0_aarch64.dmg          (mac Apple Silicon)
        ├── Invoker_0.2.0_x64-setup.exe        (Windows NSIS)
        ├── invoker_0.2.0_amd64.deb            (Linux Debian/Ubuntu)
        ├── invoker_0.2.0_amd64.AppImage       (Linux universal)
        └── latest.json                         (updater manifest, signed)
                                                │
                Maintainer reviews / writes notes / clicks Publish
                                                │
                                                ▼
                Published: visible at /releases/latest
                                                │
                                                ▼
        Running v0.1.x app on launch:
          - reads latest.json from /releases/latest/download/latest.json
          - GitHub redirects /latest/ to v0.2.0 (drafts ignored)
          - app sees newer version → prompts user to download
          - downloaded installer is verified against pubkey before running
```

### Component boundaries

The pipeline is composed of small, independent units that communicate through well-defined contracts. Each can be reasoned about and tested in isolation:

| Unit | Purpose | Input | Output |
|---|---|---|---|
| `scripts/release.mjs` | Sync version across 3 manifests, commit, tag | semver string | git tag pushed (or staged) |
| `.github/workflows/release.yml` | Orchestrate cross-platform builds on tag | tag `v*` event | Draft GitHub Release |
| `tauri-action@v0` | Build + sign + upload (per-platform) | platform target, signing key | Bundle artifacts + sig files |
| `tauri-plugin-updater` (runtime) | Check for updates, verify signatures | `latest.json` URL, pubkey | Update prompt to user |
| `.github/workflows/ci.yml` `tauri-smoke` job | Catch Rust errors in PRs | PR diff | Pass/fail signal |

### Key decisions (from brainstorm 2026-04-27)

| Question | Choice | Rationale |
|---|---|---|
| Code signing | None | Audience technical; cost (~$400/yr) not justified yet |
| Auto-update | Yes, GitHub Releases | Free, native to Tauri, foundational for v1+ UX |
| macOS arch | Separate Intel + ARM `.dmg` | Faster builds, technical audience can pick correct arch |
| Linux formats | `.deb` + `.AppImage` | Covers ~95% of Linux desktop; rpm/snap deferred |
| Tag scheme | `v*` (e.g. `v0.2.0`) | Standard, matches `package.json` version |
| Release type | Draft (manual publish) | Keeps maintainer in the loop on every release |
| Version sync | `scripts/release.mjs` (3 manifests) | Single source of truth; eliminates "forgot one file" bug |
| PR safety net | `ci.yml` + `tauri-smoke` (cargo check) | Catches Rust breakage in ~30s without slowing PRs by 5min |
| License | MIT | Permissive, simple |
| Authors | `Doston Kamilov <doossee.me@gmail.com>` | Single maintainer |

## Detailed design

### `scripts/release.mjs`

A Node script (ESM) executed via `node scripts/release.mjs <version>`. Stays in `invoker-app/`.

**Behaviour:**

1. Parse and validate `<version>` against semver (`/^\d+\.\d+\.\d+(-[\w.]+)?$/`). Reject malformed input.
2. Refuse to run if working tree is dirty (`git status --porcelain` non-empty), to avoid bundling stray changes into the release commit. `--force` flag overrides for emergencies.
3. Verify the current branch is `main` (configurable via `RELEASE_BRANCH` env var). Refuse otherwise to prevent tagging from feature branches.
4. Read and rewrite three manifests:
   - `package.json` — JSON; replace `"version"` field, preserve formatting via 2-space indent.
   - `src-tauri/tauri.conf.json` — JSON; replace top-level `"version"`.
   - `src-tauri/Cargo.toml` — TOML; replace `version = "..."` in `[package]`. Use line-based regex anchored to `^\s*version\s*=\s*"` to avoid touching dependency versions.
5. Run `cargo update -p app --manifest-path src-tauri/Cargo.toml` so `Cargo.lock` reflects the new package version. This is a targeted lockfile refresh — does not bump unrelated dependencies. Skipped (with a warning, not an error) if `cargo` is not on `PATH`; the workflow's `tauri-smoke` job will catch any resulting `--locked` mismatch on the next push.
6. Stage the four files, create commit `chore: release v<version>` with a multi-line body summarising what changed.
7. Create annotated tag `v<version>` with the commit SHA.
8. **Do not push.** Print the exact `git push --follow-tags` command for the maintainer to run.
9. Exit non-zero on any failure; print actionable error.

**Why a script and not a GitHub Action `workflow_dispatch`:**

- Keeps version-bumping local; the maintainer can review the diff before tagging.
- Handles the three-file synchronisation atomically — if any rewrite fails, nothing is committed.
- No GitHub permissions needed; just `git`.

**Note on the "never commit directly to `main`" workspace rule:**

The workspace `CLAUDE.md` mandates that all changes go through a feature branch and PR. Release commits are a documented exception to that rule because:

1. The commit is mechanical — three version-string rewrites and a `Cargo.lock` refresh, no code changes.
2. The contents are mechanically verified by the `tauri-smoke` job that runs on every push to `main`.
3. The tag is annotated and visible in `git log`, so accidental tags can be reverted by deleting the tag.
4. Single-maintainer project — a self-approved PR adds no review value.

If a maintainer prefers the strict flow, they can manually create `release/v<version>` branch before running the script; the script's `RELEASE_BRANCH` env var allows overriding the branch check (`RELEASE_BRANCH=release/v0.2.0 npm run release 0.2.0`), then merge via PR, then tag main from the merged commit by hand.

**Edge cases handled:**

- Re-running with the same version → script detects existing tag, refuses with "tag v0.2.0 already exists".
- Running with version *lower* than current → warning, prompts confirmation (downgrade is unusual but legal for hotfix branches).
- `Cargo.lock` not updating because `cargo` isn't installed → script exits with clear "install Rust toolchain" message; doesn't proceed with stale lockfile.

### `.github/workflows/release.yml`

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - { runner: macos-13,      target: x86_64-apple-darwin,        args: '--target x86_64-apple-darwin' }
          - { runner: macos-14,      target: aarch64-apple-darwin,       args: '--target aarch64-apple-darwin' }
          - { runner: windows-latest, target: x86_64-pc-windows-msvc,    args: '' }
          - { runner: ubuntu-22.04,  target: x86_64-unknown-linux-gnu,   args: '' }
    runs-on: ${{ matrix.runner }}
    steps:
      - uses: actions/checkout@v4

      - name: Linux deps
        if: matrix.runner == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            libwebkit2gtk-4.1-dev \
            libssl-dev \
            libgtk-3-dev \
            libayatana-appindicator3-dev \
            librsvg2-dev \
            patchelf

      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }

      - uses: dtolnay/rust-toolchain@stable
        with: { targets: ${{ matrix.target }} }

      - uses: Swatinem/rust-cache@v2
        with: { workspaces: src-tauri -> target }

      - run: npm ci

      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'Invoker ${{ github.ref_name }}'
          releaseBody: |
            See the assets to download this version and install.

            *Auto-generated draft — edit before publishing.*
          releaseDraft: true
          prerelease: false
          args: ${{ matrix.args }}
```

**Notes:**

- `fail-fast: false` keeps platforms independent — if the Linux build fails, you still get the macOS bundles to investigate.
- `tauri-action` handles the "create draft on first job, append to it on subsequent jobs" coordination via the `tagName`.
- No `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` secret — key was generated without password.
- The `args` field is empty on Windows/Linux because Tauri picks the host target by default; explicit on macOS to disambiguate Intel vs ARM since the runner choice alone isn't enough (macos-14 can cross-compile to x86_64).
- `working-directory` is set on `npm ci` because the project root is the workspace, not `invoker-app/`. `tauri-action` uses `projectPath` for the same reason.

### `.github/workflows/ci.yml` — `tauri-smoke` job (added)

Existing job (`build`) is unchanged. New job runs in parallel:

```yaml
  tauri-smoke:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
      - run: |
          sudo apt-get update
          sudo apt-get install -y \
            libwebkit2gtk-4.1-dev libssl-dev libgtk-3-dev \
            libayatana-appindicator3-dev librsvg2-dev
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
        with: { workspaces: src-tauri -> target }
      - run: cargo check --manifest-path src-tauri/Cargo.toml --locked
```

**Trade-off accepted:** `cargo check` doesn't compile `cdylib`/`staticlib` fully or run `tauri-build`'s codegen for resources. It catches Rust syntax errors, missing dependencies, and most type errors in ~60 seconds with cache. A full `tauri build` would take 5+ minutes per PR; not worth it for the marginal extra coverage.

### Tauri config changes

**`src-tauri/Cargo.toml`** — fix scaffold defaults and add updater dependency:

```toml
[package]
name = "app"
version = "0.1.0"
description = "A git-native API workspace. Requests as plain .ivk files next to your code."
authors = ["Doston Kamilov <doossee.me@gmail.com>"]
license = "MIT"
repository = "https://github.com/doossee/invoker-app"
homepage = "https://github.com/doossee/invoker-app"
edition = "2021"
rust-version = "1.77.2"

# ... [lib], [build-dependencies] unchanged ...

[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }
log = "0.4"
tauri = { version = "2.10.3", features = [] }
tauri-plugin-log = "2"
tauri-plugin-fs = "2.5.0"
tauri-plugin-http = "2.5.8"
tauri-plugin-dialog = "2.7.0"
tauri-plugin-opener = "2.5.3"
tauri-plugin-updater = "2"
```

**`src-tauri/src/lib.rs`** — register updater plugin:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**`src-tauri/capabilities/default.json`** — grant updater permission. Add `"updater:default"` to the `permissions` array.

**`src-tauri/tauri.conf.json`** — add `plugins.updater` block:

```json
{
  "plugins": {
    "fs": { "requireLiteralLeadingDot": false },
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/doossee/invoker-app/releases/latest/download/latest.json"
      ],
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEJGNzAwM0NDNDdEN0Q1OTkKUldTWjFkZEh6QU53djNoajA4VTlpMU15TlBFOUVpOG1ONS8wNDRaQzNkZ1pQRCtPYngrYTZ1WHYK"
    }
  }
}
```

The pubkey is the one generated 2026-04-27 (`/tmp/invoker-updater.key.pub`); private key counterpart lives in GitHub Secret `TAURI_SIGNING_PRIVATE_KEY`. Pubkey is committed in plaintext — that's fine, public keys are public by definition.

**`src-tauri/.gitignore`** — append `*.key` and `*.key.pub` to defend against accidental commit if a maintainer regenerates locally.

### Updater behaviour at runtime

The updater plugin reads `endpoints[0]`, fetches `latest.json`, compares the `version` field against the running app's version, and (if newer) prompts the user with the release notes from `latest.json`. On accept, it downloads the matching platform's installer, verifies its detached signature against the pubkey, and applies the update.

For v1, no UI code changes are needed beyond plugin registration — the plugin's default behaviour shows a system dialog. A "Check for updates" Settings entry can be added later (out of scope here).

### `docs/RELEASING.md`

Plain markdown maintainer doc. Sections:

1. **Pre-flight** — checklist before starting (working tree clean, on `main`, CI green on `main`).
2. **Cut release** — `npm run release <version>` then `git push --follow-tags`.
3. **Watch the build** — link to Actions tab, what to expect, ~10 min total.
4. **Review the draft** — how to find it, what to verify (5 installers + `latest.json`), how to write notes following past releases' format.
5. **Publish** — single click; updater clients pick it up automatically on next launch.
6. **If it goes wrong** — `git push --delete origin v<version>` + delete the draft release in GitHub UI; fix; retry.
7. **Rotating updater keys** — one-time procedure if the private key ever leaks: `tauri signer generate`, replace `pubkey` in `tauri.conf.json`, rotate the GitHub Secret, ship a new release. Existing installs lose auto-update until users manually upgrade once.

## Secrets

Stored in GitHub repository secrets (Settings → Secrets and variables → Actions):

| Secret | Required | Source |
|---|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | yes | Generated 2026-04-27 via `tauri signer generate -w /tmp/invoker-updater.key`; entered manually by maintainer |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | no | Key generated without password — secret omitted entirely |
| `GITHUB_TOKEN` | n/a (built-in) | Provided by GitHub, scoped per workflow run |

No additional secrets — that is the entirety of the trust footprint.

## File changes summary

| File | Status | Notes |
|---|---|---|
| `invoker-app/.github/workflows/release.yml` | NEW | Tag-triggered cross-platform release workflow |
| `invoker-app/.github/workflows/ci.yml` | MODIFIED | Add `tauri-smoke` job in parallel |
| `invoker-app/scripts/release.mjs` | NEW | Version sync + tag |
| `invoker-app/docs/RELEASING.md` | NEW | Maintainer runbook |
| `invoker-app/package.json` | MODIFIED | Add `"release"` script |
| `invoker-app/src-tauri/Cargo.toml` | MODIFIED | Fix metadata; add `tauri-plugin-updater` |
| `invoker-app/src-tauri/src/lib.rs` | MODIFIED | Register updater plugin |
| `invoker-app/src-tauri/capabilities/default.json` | MODIFIED | Grant `updater:default` |
| `invoker-app/src-tauri/tauri.conf.json` | MODIFIED | Add `plugins.updater` block with endpoints + pubkey |
| `invoker-app/src-tauri/.gitignore` | MODIFIED | Ignore `*.key`, `*.key.pub` |

Workspace root files (`CLAUDE.md`, `ivkjs/`, etc.) are not touched.

## Testing strategy

The pipeline is mostly declarative and runs in environments we don't control (GitHub Actions runners). Testing is layered:

1. **Local script test (pre-push).** Maintainer runs `npm run release 0.1.1-rc.0` on a throwaway branch, inspects the diff, the commit, and the tag. Resets without pushing. This verifies `release.mjs` end-to-end.
2. **Smoke release (first real run).** The first tag pushed is `v0.1.1` — a deliberately small bump from the current `0.1.0` so it's a near-no-op functionally but exercises the full pipeline. If anything breaks, the impact is small and the tag can be deleted.
3. **Per-platform sanity check.** After `v0.1.1` builds successfully, the maintainer downloads at least one installer per platform (or recruits help for Windows/Linux), installs, and confirms the app launches and shows the correct version in its title bar / About dialog.
4. **Updater simulation.** Once `v0.1.1` is published, cut a `v0.1.2` with a no-op change. A user running `v0.1.1` should be prompted to update on next launch. This is the only end-to-end test of the updater path; no automated harness for it.
5. **PR-level safety net.** The `tauri-smoke` job runs on every PR. If a PR breaks `cargo check`, the release pipeline would also fail — we catch it 5 minutes after pushing the PR instead of 10 minutes after tagging.

No automated tests are added for the workflow YAML itself. Workflows are difficult to unit test; the `v0.1.1` smoke release *is* the integration test.

## Risks

| Risk | Mitigation |
|---|---|
| Tag pushed prematurely (typo, wrong branch) | `release.mjs` enforces clean tree + `main` branch; tag is annotated and visible in `git log` before push |
| Build fails on one platform after tag is pushed | `fail-fast: false`; remaining platforms still produce artifacts. Maintainer fixes the broken platform, deletes tag (`git push --delete origin v<version>`), re-tags, re-pushes. Draft release is overwritten. |
| Private key leak | Documented rotation procedure in `RELEASING.md`. Existing installs cannot be auto-updated to the new key in-place; users get one manual upgrade, then auto-update resumes. |
| Updater endpoint unavailable (GitHub outage) | Tauri updater fails open — app continues running, just doesn't show update prompt. No data loss. |
| Cargo.lock churn from cross-platform runners | `Swatinem/rust-cache` keys on `Cargo.lock`; `release.mjs` commits `Cargo.lock` so the workflow uses the same lockfile every maintainer locked. `cargo check --locked` in `tauri-smoke` job enforces no drift. |
| `tauri-action` major-version breaking change | Pinned to `@v0`; can be moved to a SHA pin if v0 → v1 ever ships breaking changes. |

## Open questions

None at this design stage. (In-app "Check for updates" UI was raised and explicitly deferred; everything else was settled in brainstorm.)

## References

- Tauri updater plugin docs: <https://v2.tauri.app/plugin/updater/>
- `tauri-action` README: <https://github.com/tauri-apps/tauri-action>
- Tauri signer command: `npx @tauri-apps/cli signer generate --help`
- GitHub Releases `latest` redirect behaviour: <https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases>

---

*This design was developed via the `superpowers:brainstorming` workflow on 2026-04-27 and approved by the maintainer through three sequential review gates (architecture, file-level changes, scope). Implementation will be planned via `superpowers:writing-plans` next.*
