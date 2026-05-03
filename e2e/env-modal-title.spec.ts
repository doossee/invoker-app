import { test, expect } from '@playwright/test';

/**
 * Regression: clicking the env-switcher's "Manage environments" button
 * opened a modal titled "Settings". Misleading — the surface is
 * exclusively for environment management (theme picker was moved to
 * Settings → Appearance in PR #37, AI / Data & sync was removed in
 * PR #34, etc.). The modal also rendered a redundant inner
 * "Environments" section header.
 *
 * The fix: rename the modal title to "Environments" so the trigger
 * label and the destination match. The inner section header drops
 * (the modal title now serves that role).
 */
test('Manage environments → modal title is "Environments", not "Settings"', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open env switcher — find the bottom-left button containing the
  // active env name.
  const envSwitcherBtn = page.locator('button:has-text("dev")').first();
  await envSwitcherBtn.click();

  // Wait for the dropdown to render the "Manage environments" entry.
  await expect(
    page.getByRole('button', { name: /Manage environments/ }),
  ).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: /Manage environments/ }).click();

  // Modal title should match the trigger.
  await expect(page.getByRole('heading', { name: /^Environments$/ })).toBeVisible();

  // The old misleading title should be gone (scoped to the modal —
  // there's still a "Settings" gear button elsewhere).
  await expect(page.getByRole('heading', { name: /^Settings$/ })).toHaveCount(0);
});
