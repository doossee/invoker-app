import { test, expect } from '@playwright/test';

/**
 * Regression: Settings → General had two decorative rows whose backing
 * features simply don't exist in the codebase:
 *   - "Save history" — `<Toggle on />` with no state. Depends on a
 *     request-history feature that has never shipped (no store, no
 *     log, no surface to view it).
 *   - "Check for updates" — `<Select value="Weekly" />` with no
 *     onChange. Tauri-only updater that has never been wired (no
 *     `@tauri-apps/plugin-updater` calls anywhere).
 *
 * Same precedent as Account (PR #23), AI / Data & sync (PR #34),
 * Welcome Recent (PR #53), Reduce motion (PR #54). Drop until the
 * underlying features actually exist.
 *
 * "Follow redirects" and "Verify SSL certificates" are also currently
 * decorative but stay — they have plausible near-term wiring (fetch
 * redirect option / TauriTransport SSL flag) and the BUGS.md entry
 * tracks them.
 */
test('Settings → General no longer renders the orphan decorative rows', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  await page.getByRole('button', { name: /^settings$/i }).first().click();
  // General is the default tab.
  await expect(page.getByText(/^General$/).first()).toBeVisible();

  // Surviving wired rows still render:
  await expect(page.getByText(/^Default request method$/)).toBeVisible();
  await expect(page.getByText(/^Request timeout$/)).toBeVisible();
  await expect(page.getByText(/^Open last collection on launch$/)).toBeVisible();

  // Surviving cosmetic rows that still have a plausible wiring path
  // (tracked in BUGS.md):
  await expect(page.getByText(/^Follow redirects$/)).toBeVisible();
  await expect(page.getByText(/^Verify SSL certificates$/)).toBeVisible();

  // Removed orphans (no feature even exists):
  await expect(page.getByText(/^Save history$/)).toHaveCount(0);
  await expect(page.getByText(/^Check for updates$/)).toHaveCount(0);
});
