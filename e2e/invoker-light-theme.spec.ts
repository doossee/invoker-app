import { test, expect } from '@playwright/test';

/**
 * Adds a daylight palette to the existing 4 dark themes. Verifies:
 *  - The "Invoker Light" card shows up in Settings → Appearance.
 *  - Picking it sets `data-theme="light"` on <html> (the theme provider's
 *    contract for conditional CSS) and updates the `--ivk-bg` token.
 *
 * Other themes are unchanged.
 */
test('Invoker Light theme is selectable from Settings → Appearance', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /try sample/i }).first().click();
  await expect(page.getByText(/Sample collection/i).first()).toBeVisible();

  // Open Settings.
  await page.getByRole('button', { name: /settings/i }).first().click();

  // Switch to Appearance pane.
  await page.getByRole('button', { name: /^Appearance$/ }).first().click();

  // Card with the new theme name should be visible.
  await expect(page.getByText(/^Invoker Light$/)).toBeVisible();

  // Click the Invoker Light card by its data-theme-id (added in this PR
  // for both a11y and testability — the gradient card has no inner text
  // so getByRole(name) wouldn't match without the new aria-label).
  await page.locator('[data-theme-id="invoker-light"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  // Switch back to Invoker Dark — html should flip back to dark.
  await page.locator('[data-theme-id="invoker-dark"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
