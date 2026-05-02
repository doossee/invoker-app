# Releasing invoker-app

A walk-through for cutting a release. ~10 minutes end-to-end.

## Pre-flight

Before starting:

- [ ] Working tree is clean (`git status` shows nothing).
- [ ] On `main`, up to date with `origin/main`.
- [ ] Latest CI run on `main` is green (https://github.com/doossee/invoker-app/actions).
- [ ] Released the previous tag if one was sitting unpublished.

## Cut the release

```bash
npm run release -- <version>
git push --follow-tags
```

Where `<version>` is bare semver, e.g. `0.2.0` (no leading `v`).

The script:

1. Validates the version, checks the tree is clean and you're on `main`.
2. Refreshes `Cargo.lock` for the `app` package.
3. Bumps the version in `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`.
4. Commits with `chore: release v<version>`.
5. Tags the commit `v<version>`.

It does NOT push. Review `git log -2` and `git show v<version>` before pushing.

## Watch the build

After `git push --follow-tags`, GitHub Actions kicks off four parallel jobs:

- macOS Intel (`macos-13`)
- macOS Apple Silicon (`macos-14`)
- Windows x64 (`windows-latest`)
- Linux x64 (`ubuntu-22.04`)

Watch progress at: https://github.com/doossee/invoker-app/actions

Total runtime is roughly 10 minutes (macOS slowest).

## Review the draft release

When all four jobs finish, a draft release appears at https://github.com/doossee/invoker-app/releases.

The draft should have:

- `Invoker_<version>_x64.dmg` (mac Intel)
- `Invoker_<version>_aarch64.dmg` (mac Apple Silicon)
- `Invoker_<version>_x64-setup.exe` (Windows NSIS)
- `invoker_<version>_amd64.deb` (Linux Debian/Ubuntu)
- `invoker_<version>_amd64.AppImage` (Linux universal)
- `latest.json` (updater manifest, signed)

If any are missing, check the failing job's log. `fail-fast: false` is set, so partial output is normal — fix the broken platform and re-tag.

## Sanity check at least one installer

Download the artifact matching your dev machine and install it. Open the app, confirm the version in the title bar matches.

For platforms you can't test yourself (e.g., Windows if you're on a Mac), recruit a tester before publishing.

## Publish

In the GitHub UI:

1. Click "Edit draft" on the release.
2. Write release notes — typically a bulleted summary of new features / fixes / breaks. The auto-draft body says *"Auto-generated draft — edit before publishing."*
3. Click "Publish release."

Once published, GitHub auto-redirects `/releases/latest/` to this version. The Tauri updater plugin reads the `latest.json` URL via that redirect, so existing installs see the new version on their next launch.

## If the build fails after the tag is pushed

1. Delete the tag locally and remotely:
   ```bash
   git tag -d v<version>
   git push --delete origin v<version>
   ```
2. Delete the draft release in the GitHub UI (Releases → ⋯ → Delete).
3. Roll back the bump commit:
   ```bash
   git reset --hard HEAD~1
   ```
4. Fix the underlying issue, re-PR, merge, re-run `npm run release`.

## Rotating the updater key

Only do this if you suspect the private key has leaked.

1. Generate a new key:
   ```bash
   npx @tauri-apps/cli signer generate -w ~/secure/invoker-updater-rotated.key
   ```
2. Replace the public key in `src-tauri/tauri.conf.json` (`plugins.updater.pubkey`).
3. Replace the GitHub Secret `TAURI_SIGNING_PRIVATE_KEY` with the new private key.
4. Commit, PR, merge, release.

**Side effect:** existing installs on the old key cannot auto-update. Users have to download and install the new version once manually; from there, future updates work normally.

## Smoke-testing changes to `release.mjs`

The bumper has unit tests:

```bash
npm run release:test
```

For end-to-end testing without polluting `main`, use `--dry-run`:

```bash
RELEASE_BRANCH=$(git rev-parse --abbrev-ref HEAD) npm run release -- 0.0.0 --dry-run
```
