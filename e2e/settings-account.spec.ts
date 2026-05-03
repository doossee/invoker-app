import { test, expect } from '@playwright/test';

/**
 * Regression: Settings → Account contradicted the welcome-screen
 * "no sign-in, no sync, no cloud" promise. The pane showed a fake
 * user (doossee / ovidevtool@outlook.com / Personal plan) and dead
 * Manage / Create / Sign-out buttons that did nothing on click.
 *
 * Decision: drop the Account section entirely until cloud sync ever
 * lands. The remaining Settings categories (General, Appearance,
 * Keyboard, AI, Data & sync) cover the actual local-first concerns.
 */
test('Settings modal does not include a decorative Account category', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open the Settings cog (bottom of the sidebar).
  await page.getByRole('button', { name: /settings/i }).first().click();

  // Sidebar of the modal: General/Appearance/Keyboard/AI/Data & sync should be there.
  await expect(page.getByRole('button', { name: /^General$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Appearance$/ })).toBeVisible();

  // Account category should be gone.
  await expect(page.getByRole('button', { name: /^Account$/ })).toHaveCount(0);

  // And the dead Sign-out / Manage / Create… buttons must not appear anywhere.
  await expect(page.getByRole('button', { name: /^Sign out$/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Manage$/ })).toHaveCount(0);
});
