import { test, expect } from '@playwright/test';

/**
 * Regression: Settings → AI and Settings → Data & sync were entirely
 * decorative panes — every Toggle was `<Toggle on />` (no state, no
 * onChange), every Select had a hardcoded value, the "Reveal..." button
 * had no onClick. Same pattern as the previously-removed Account pane
 * (PR #23). Following the precedent: remove until the underlying
 * features actually exist (AI integration; cloud-sync / git-sync /
 * Tauri reveal-in-Finder).
 *
 * General stays — its rows are also unwired today, but several of them
 * (default request method, default timeout) are realistic near-term
 * follow-ups so the page is worth keeping as a placeholder. A separate
 * PR will wire those one at a time.
 */
test('Settings modal no longer renders the decorative AI and Data & sync tabs', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open Settings.
  await page.getByRole('button', { name: /settings/i }).first().click();

  // Surviving panes:
  await expect(page.getByRole('button', { name: /^General$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Appearance$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Keyboard$/ })).toBeVisible();

  // Removed:
  await expect(page.getByRole('button', { name: /^AI$/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Data & sync$/ })).toHaveCount(0);
});
